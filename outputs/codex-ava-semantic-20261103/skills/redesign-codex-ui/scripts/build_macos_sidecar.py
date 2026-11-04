#!/usr/bin/env python3
"""Build an isolated, reversible macOS Codex copy with a real renderer skin."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import plistlib
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


MARKER = "opcspace-codex-skin"
ASAR_PACKAGE = "@electron/asar@4.2.0"
UNPACK_GLOB = "node_modules/{node-pty,@worklouder,objc-js,better-sqlite3,node-mac-permissions}/**/*"
REQUIRED_ASAR_ENTRIES = ("/webview/index.html", "/package.json")
REQUIRED_PALETTE = ("canvas", "surface", "surfaceRaised", "ink", "mutedInk", "accent", "accentSoft", "line", "focus")


def run(*args: str, cwd: Optional[Path] = None, capture: bool = False) -> subprocess.CompletedProcess:
    return subprocess.run(args, cwd=cwd, check=True, text=True, capture_output=capture)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_preset(path: Path) -> dict:
    preset = json.loads(path.read_text(encoding="utf-8"))
    missing = [key for key in REQUIRED_PALETTE if key not in preset.get("palette", {})]
    if not preset.get("id") or missing:
        raise ValueError(f"Invalid preset; missing id or palette keys: {', '.join(missing)}")
    return preset


def identity_asset_name(identity: Path) -> str:
    suffix = identity.suffix.lower()
    if suffix not in (".png", ".jpg", ".jpeg", ".webp"):
        raise ValueError("Identity must be PNG, JPEG, or WebP")
    return f"opcspace-ip-avatar{suffix}"


def css_for(preset: dict, asset_name: str) -> str:
    palette = preset["palette"]
    appearance = "dark" if preset.get("appearance") == "dark" else "light"
    runtime = preset.get("runtime", {})
    avatar_opacity = runtime.get("avatarOpacity", 0.18)
    badge_label = json.dumps(runtime.get("badgeLabel", "OPCspace · Personal Codex"), ensure_ascii=False)
    variant_css = ""
    if runtime.get("variant") == "signal-atelier":
        variant_css = f"""
      body {{
        background-image: linear-gradient(color-mix(in srgb, {palette['line']} 26%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, {palette['line']} 26%, transparent) 1px, transparent 1px) !important;
        background-size: 32px 32px !important;
      }}
      aside {{ box-shadow: inset -3px 0 0 color-mix(in srgb, {palette['focus']} 26%, transparent) !important; }}
      main, [role="main"] {{
        background-image: radial-gradient(circle at 82% 12%, color-mix(in srgb, {palette['focus']} 14%, transparent), transparent 24%), linear-gradient(color-mix(in srgb, {palette['line']} 20%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, {palette['line']} 20%, transparent) 1px, transparent 1px) !important;
        background-size: auto, 32px 32px, 32px 32px !important;
      }}
      .composer-surface-chrome, [contenteditable="true"] {{ border-top: 2px solid {palette['accent']} !important; }}
      body::before {{ border-radius: 4px !important; font-family: ui-monospace, monospace !important; }}
"""
    return f"""
    <style id="{MARKER}" data-theme-id="{preset['id']}">
      :root, :root.electron-light, :root.electron-dark {{
        --color-token-bg-primary: {palette['canvas']} !important;
        --color-token-bg-secondary: {palette['surface']} !important;
        --color-token-bg-tertiary: {palette['accentSoft']} !important;
        --color-token-main-surface-primary: {palette['surfaceRaised']} !important;
        --color-token-side-bar-background: {palette['surface']} !important;
        --color-token-foreground: {palette['ink']} !important;
        --color-token-text-primary: {palette['ink']} !important;
        --color-token-text-secondary: {palette['mutedInk']} !important;
        --color-token-text-tertiary: {palette['mutedInk']} !important;
        --color-token-border: {palette['line']} !important;
        --color-token-border-default: {palette['line']} !important;
        --color-token-border-light: color-mix(in srgb, {palette['line']} 65%, transparent) !important;
        --color-token-focus-border: {palette['focus']} !important;
        --color-token-link: {palette['focus']} !important;
        --color-token-text-link-foreground: {palette['focus']} !important;
        --color-token-button-background: {palette['accent']} !important;
        --color-token-button-foreground: {palette['surfaceRaised']} !important;
        --color-background-accent: {palette['accent']} !important;
        --color-text-accent: {palette['focus']} !important;
        --color-icon-accent: {palette['accent']} !important;
        --codex-corner-radius-scale: 1.18;
        color-scheme: {appearance} !important;
      }}
      html, body, #root {{ background: {palette['canvas']} !important; }}
      body::before {{
        content: {badge_label};
        position: fixed; right: 22px; top: 12px; z-index: 2147483000;
        padding: 6px 11px; border: 1px solid {palette['line']}; border-radius: 999px;
        background: color-mix(in srgb, {palette['surfaceRaised']} 88%, transparent);
        color: {palette['focus']}; font: 600 10px/1.2 -apple-system, BlinkMacSystemFont, sans-serif;
        letter-spacing: .06em; pointer-events: none; backdrop-filter: blur(10px);
      }}
      body::after {{
        content: ""; position: fixed; right: 18px; bottom: 8px; z-index: 2147482999;
        width: min(19vw, 220px); height: min(31vh, 280px);
        background: url("./assets/{asset_name}") center bottom / contain no-repeat;
        opacity: {avatar_opacity}; filter: drop-shadow(0 12px 18px color-mix(in srgb, {palette['ink']} 18%, transparent));
        pointer-events: none;
      }}
      button, [role="button"], textarea, input {{ border-radius: max(8px, calc(10px * var(--codex-corner-radius-scale))) !important; }}
      ::selection {{ background: {palette['accentSoft']}; color: {palette['ink']}; }}
      @media (max-width: 780px) {{ body::after {{ opacity: .09; width: 150px; }} }}
      @media (prefers-reduced-motion: reduce) {{ *, *::before, *::after {{ animation-duration: .01ms !important; }} }}
      {variant_css}
    </style>
"""


def update_info(info: dict, bundle_id: str, display_name: str, asar_hash: str) -> dict:
    info = dict(info)
    info.update({"CFBundleIdentifier": bundle_id, "CFBundleDisplayName": display_name, "CFBundleName": display_name, "CFBundleAlternateNames": [display_name]})
    if info.get("CFBundleURLTypes"):
        info["CFBundleURLTypes"][0]["CFBundleURLName"] = display_name
        info["CFBundleURLTypes"][0]["CFBundleURLSchemes"] = ["opcspace-codex"]
    info["ElectronAsarIntegrity"]["Resources/app.asar"]["hash"] = asar_hash
    return info


def app_is_running(app: Path) -> bool:
    executable = app / "Contents/MacOS/ChatGPT"
    result = subprocess.run(["ps", "-axo", "command="], capture_output=True, text=True, check=True)
    prefix = str(executable)
    return any(command.strip() == prefix or command.strip().startswith(prefix + " ") for command in result.stdout.splitlines())


def preflight(source: Path, output: Path, preset_path: Path, identity: Path) -> dict:
    if sys.platform != "darwin":
        raise OSError("macOS sidecar builds require Darwin")
    if source == output:
        raise ValueError("Refusing to modify the primary installed application")
    required = (source / "Contents/Resources/app.asar", source / "Contents/Info.plist", preset_path, identity)
    for path in required:
        if not path.exists():
            raise FileNotFoundError(path)
    for command in ("ditto", "npx", "codesign", "ps"):
        if not shutil.which(command):
            raise FileNotFoundError(f"Missing command: {command}")
    preset = load_preset(preset_path)
    asset_name = identity_asset_name(identity)
    asar = source / "Contents/Resources/app.asar"
    listing = run("npx", "--yes", ASAR_PACKAGE, "list", str(asar), capture=True).stdout.splitlines()
    missing = [entry for entry in REQUIRED_ASAR_ENTRIES if entry not in listing]
    if missing:
        raise ValueError(f"Unsupported app.asar; missing: {', '.join(missing)}")
    with (source / "Contents/Info.plist").open("rb") as handle:
        info = plistlib.load(handle)
    return {
        "sourceApp": str(source), "sourceVersion": info.get("CFBundleShortVersionString"),
        "sourceBundleId": info.get("CFBundleIdentifier"), "sourceAsarSha256": sha256(asar),
        "outputApp": str(output), "themeId": preset["id"], "identity": str(identity),
        "identitySha256": sha256(identity), "assetName": asset_name,
        "outputExists": output.exists(), "outputRunning": app_is_running(output) if output.exists() else False,
        "asarTool": ASAR_PACKAGE, "supported": True,
    }


def verify_archive(asar: Path, theme_id: Optional[str], asset_name: str, display_name: str) -> None:
    with tempfile.TemporaryDirectory(prefix="opcspace-codex-verify-") as temp:
        target = Path(temp)
        for entry in ("webview/index.html", "package.json", f"webview/assets/{asset_name}"):
            run("npx", "--yes", ASAR_PACKAGE, "extract-file", str(asar), entry, cwd=target)
        html = (target / "index.html").read_text(encoding="utf-8")
        package = json.loads((target / "package.json").read_text(encoding="utf-8"))
        if MARKER not in html or (theme_id and f'data-theme-id="{theme_id}"' not in html):
            raise ValueError("Packed renderer is missing the requested skin")
        if package.get("productName") != display_name or package.get("codexSparkleFeedUrl"):
            raise ValueError("Packed product isolation is incomplete")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-app", default="/Applications/ChatGPT.app")
    parser.add_argument("--output-app", required=True)
    parser.add_argument("--preset", required=True)
    parser.add_argument("--identity", required=True)
    parser.add_argument("--bundle-id", default="space.opc.codexui")
    parser.add_argument("--display-name", default="OPCspace Codex")
    parser.add_argument("--dry-run", action="store_true", help="Validate compatibility without writing")
    parser.add_argument("--replace", action="store_true", help="Back up and replace an existing, stopped sidecar")
    args = parser.parse_args()

    source = Path(args.source_app).expanduser().resolve()
    output = Path(args.output_app).expanduser().resolve()
    preset_path = Path(args.preset).expanduser().resolve()
    identity = Path(args.identity).expanduser().resolve()
    report = preflight(source, output, preset_path, identity)
    if args.dry_run:
        print(json.dumps({**report, "dryRun": True}, ensure_ascii=False, indent=2))
        return 0
    if output.exists() and not args.replace:
        raise FileExistsError(f"Output exists; inspect it and rerun with --replace: {output}")
    if report["outputRunning"]:
        raise RuntimeError(f"Refusing to replace a running sidecar: {output}")

    output.parent.mkdir(parents=True, exist_ok=True)
    backup = None
    if output.exists():
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        backup = output.with_name(f"{output.stem}.backup-{stamp}.app")
        output.rename(backup)
    try:
        run("ditto", str(source), str(output))
        resources = output / "Contents/Resources"
        app_asar = resources / "app.asar"
        preset = load_preset(preset_path)
        asset_name = report["assetName"]
        with tempfile.TemporaryDirectory(prefix="opcspace-codex-asar-") as temp:
            extracted = Path(temp) / "app"
            run("npx", "--yes", ASAR_PACKAGE, "extract", str(app_asar), str(extracted))
            index = extracted / "webview/index.html"
            html = index.read_text(encoding="utf-8")
            if MARKER in html or "</head>" not in html:
                raise ValueError("Renderer entry is already modified or malformed")
            index.write_text(html.replace("</head>", css_for(preset, asset_name) + "\n</head>", 1), encoding="utf-8")
            shutil.copy2(identity, extracted / "webview/assets" / asset_name)
            package_path = extracted / "package.json"
            package = json.loads(package_path.read_text(encoding="utf-8"))
            package.update({"name": "opcspace-codex-electron", "productName": args.display_name, "description": "Isolated OPCspace-skinned Codex sidecar", "codexSparkleFeedUrl": ""})
            package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            replacement = Path(temp) / "app.asar"
            run("npx", "--yes", ASAR_PACKAGE, "pack", str(extracted), str(replacement), "--unpack", UNPACK_GLOB)
            shutil.copy2(replacement, app_asar)
            generated_unpacked = Path(f"{replacement}.unpacked")
            if generated_unpacked.exists():
                side_unpacked = resources / "app.asar.unpacked"
                if side_unpacked.exists():
                    shutil.rmtree(side_unpacked)
                shutil.copytree(generated_unpacked, side_unpacked, symlinks=True)

        verify_archive(app_asar, preset["id"], asset_name, args.display_name)
        asar_hash = sha256(app_asar)
        info_path = output / "Contents/Info.plist"
        with info_path.open("rb") as handle:
            info = update_info(plistlib.load(handle), args.bundle_id, args.display_name, asar_hash)
        with info_path.open("wb") as handle:
            plistlib.dump(info, handle, fmt=plistlib.FMT_BINARY)
        manifest = {
            **report, "schemaVersion": 2, "bundleId": args.bundle_id, "displayName": args.display_name,
            "asarSha256": asar_hash, "backup": str(backup) if backup else None,
            "userDataRecommendation": str(Path.home() / "Library/Application Support" / args.display_name),
            "screenshotPolicy": "local-only-unless-user-explicitly-authorizes-publishing",
            "rollback": f"Quit and remove {output}; restore {backup} if present. The primary app was not changed.",
        }
        (resources / "opcspace-skin-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        run("codesign", "--force", "--deep", "--sign", "-", str(output))
        run("codesign", "--verify", "--deep", "--strict", str(output))
        print(json.dumps(manifest, ensure_ascii=False, indent=2))
        return 0
    except Exception:
        if output.exists():
            shutil.rmtree(output)
        if backup and backup.exists():
            backup.rename(output)
        raise


if __name__ == "__main__":
    raise SystemExit(main())
