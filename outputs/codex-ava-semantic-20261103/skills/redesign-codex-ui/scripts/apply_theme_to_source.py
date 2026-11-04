#!/usr/bin/env python3
"""Apply a Codex skin to an editable source checkout through an explicit adapter."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path


REQUIRED_SELECTORS = ("canvas", "sidebar", "surface", "card", "composer")


def kebab(value: str) -> str:
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value)
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def within(root: Path, relative: str) -> Path:
    target = (root / relative).resolve()
    if target != root and root not in target.parents:
        raise ValueError(f"Adapter path escapes target root: {relative}")
    return target


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_adapter(adapter: dict) -> None:
    if adapter.get("schemaVersion") != 1:
        raise ValueError("Adapter schemaVersion must be 1")
    for key in ("htmlEntry", "stylesheet", "assetDirectory", "portraitMarker", "selectors"):
        if not adapter.get(key):
            raise ValueError(f"Adapter is missing {key}")
    missing = [key for key in REQUIRED_SELECTORS if not adapter["selectors"].get(key)]
    if missing:
        raise ValueError(f"Adapter selectors are missing: {', '.join(missing)}")
    if not re.fullmatch(r"data-[a-z0-9-]+", adapter["portraitMarker"]):
        raise ValueError("portraitMarker must be a data-* attribute")


def scoped(scope: str, selector: str) -> str:
    selector = selector.strip()
    if selector == "body":
        return scope
    return f"{scope} {selector}"


def build_css(preset: dict, selectors: dict, source_name: str) -> str:
    theme_id = preset["id"]
    scope = f'body[data-codex-skin="{theme_id}"]'
    palette = preset["palette"]
    shape = preset["shape"]
    declarations = [f"  --codex-skin-{kebab(name)}: {value};" for name, value in palette.items()]
    declarations += [
        f"  --codex-skin-panel-radius: {shape['panelRadius']}px;",
        f"  --codex-skin-control-radius: {shape['controlRadius']}px;",
        f"  --codex-skin-motion-duration: {preset['motion']['durationMs']}ms;",
    ]
    rules = [
        f"/* Generated from {source_name}. Re-run the installer instead of editing this file. */",
        f"{scope} {{\n" + "\n".join(declarations) + "\n}",
        f"{scoped(scope, selectors['canvas'])} {{ background: var(--codex-skin-canvas); color: var(--codex-skin-ink); }}",
        f"{scoped(scope, selectors['sidebar'])} {{ background: var(--codex-skin-surface); border-color: var(--codex-skin-line); }}",
        f"{scoped(scope, selectors['surface'])} {{ background: var(--codex-skin-surface-raised); color: var(--codex-skin-ink); }}",
        f"{scoped(scope, selectors['card'])} {{ background: var(--codex-skin-surface); border-color: var(--codex-skin-line); border-radius: var(--codex-skin-panel-radius); }}",
        f"{scoped(scope, selectors['composer'])} {{ background: var(--codex-skin-surface-raised); border: 1px solid var(--codex-skin-line); border-radius: var(--codex-skin-control-radius); }}",
        f"{scope} [{preset.get('portraitMarker', 'data-codex-ip-portrait')}] {{ object-fit: contain; object-position: center bottom; }}",
    ]
    return "\n\n".join(rules) + "\n"


def patch_html(html: str, theme_id: str, stylesheet_href: str, portrait_marker: str, portrait_src: str) -> str:
    if "<body" not in html or "</head>" not in html:
        raise ValueError("HTML entry must contain <body> and </head>")
    if "data-codex-skin=" in html:
        html = re.sub(r'data-codex-skin=("[^"]*"|\'[^\']*\')', f'data-codex-skin="{theme_id}"', html, count=1)
    else:
        html = re.sub(r"<body(?=[\s>])", f'<body data-codex-skin="{theme_id}"', html, count=1)

    link = f'<link rel="stylesheet" href="{stylesheet_href}" data-codex-skin-stylesheet />'
    if "data-codex-skin-stylesheet" in html:
        html = re.sub(r'<link\b[^>]*data-codex-skin-stylesheet[^>]*?/?>', link, html, count=1)
    else:
        html = html.replace("</head>", f"  {link}\n</head>", 1)

    marker_pattern = re.compile(rf'<img\b(?=[^>]*\b{re.escape(portrait_marker)}\b)[^>]*>', re.I)
    match = marker_pattern.search(html)
    if not match:
        raise ValueError(f"HTML entry needs an <img {portrait_marker}> integration marker")
    tag = match.group(0)
    if re.search(r'\bsrc\s*=', tag, re.I):
        tag = re.sub(r'\bsrc\s*=\s*("[^"]*"|\'[^\']*\')', f'src="{portrait_src}"', tag, count=1, flags=re.I)
    else:
        tag = tag[:-1] + f' src="{portrait_src}">'
    return html[: match.start()] + tag + html[match.end() :]


def snapshot(root: Path, files: list[Path], backup: Path) -> list[dict]:
    records = []
    for path in files:
        relative = path.relative_to(root).as_posix()
        existed = path.exists()
        records.append({"path": relative, "existed": existed})
        if existed:
            destination = backup / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, destination)
    return records


def restore(root: Path, state_path: Path) -> int:
    if not state_path.exists():
        raise FileNotFoundError(f"No applied skin state found: {state_path}")
    state = load_json(state_path)
    backup = root / state["backup"]
    for record in state["files"]:
        target = within(root, record["path"])
        if record["existed"]:
            source = backup / record["path"]
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        elif target.exists():
            target.unlink()
    state_path.unlink()
    print(f"Restored source UI from {backup}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", required=True, help="Editable Codex source root")
    parser.add_argument("--preset", help="Skin preset JSON")
    parser.add_argument("--identity", help="Portrait PNG/JPEG/WebP")
    parser.add_argument("--adapter", default=".codex-ui-adapter.json", help="Adapter path relative to target")
    parser.add_argument("--dry-run", action="store_true", help="Validate and report without writing")
    parser.add_argument("--restore", action="store_true", help="Restore the most recent applied skin")
    args = parser.parse_args()

    root = Path(args.target).expanduser().resolve()
    state_path = root / ".codex-skin" / "applied.json"
    if args.restore:
        return restore(root, state_path)
    if not args.preset or not args.identity:
        parser.error("--preset and --identity are required unless --restore is used")

    adapter_path = within(root, args.adapter)
    if not adapter_path.exists():
        raise FileNotFoundError(f"Missing source adapter: {adapter_path}")
    adapter = load_json(adapter_path)
    validate_adapter(adapter)
    preset_path = Path(args.preset).expanduser().resolve()
    identity_path = Path(args.identity).expanduser().resolve()
    if not preset_path.exists():
        raise FileNotFoundError(f"Missing preset: {preset_path}")
    if not identity_path.exists():
        raise FileNotFoundError(f"Missing identity asset: {identity_path}")
    preset = load_json(preset_path)
    html_path = within(root, adapter["htmlEntry"])
    stylesheet_path = within(root, adapter["stylesheet"])
    asset_dir = within(root, adapter["assetDirectory"])
    if not html_path.exists():
        raise FileNotFoundError(f"Missing HTML entry: {html_path}")

    portrait_path = asset_dir / f"identity{identity_path.suffix.lower()}"
    stylesheet_href = Path(os.path.relpath(stylesheet_path, html_path.parent)).as_posix()
    portrait_src = Path(os.path.relpath(portrait_path, html_path.parent)).as_posix()
    html = patch_html(html_path.read_text(encoding="utf-8"), preset["id"], stylesheet_href, adapter["portraitMarker"], portrait_src)
    preset_for_css = dict(preset)
    preset_for_css["portraitMarker"] = adapter["portraitMarker"]
    css = build_css(preset_for_css, adapter["selectors"], preset_path.name)
    report = {"target": str(root), "themeId": preset["id"], "html": str(html_path), "stylesheet": str(stylesheet_path), "portrait": str(portrait_path)}
    if args.dry_run:
        print(json.dumps({**report, "dryRun": True}, ensure_ascii=False, indent=2))
        return 0

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = root / ".codex-skin" / "backups" / stamp
    files = snapshot(root, [html_path, stylesheet_path, portrait_path], backup)
    stylesheet_path.parent.mkdir(parents=True, exist_ok=True)
    asset_dir.mkdir(parents=True, exist_ok=True)
    html_path.write_text(html, encoding="utf-8")
    stylesheet_path.write_text(css, encoding="utf-8")
    shutil.copy2(identity_path, portrait_path)
    digest = hashlib.sha256(identity_path.read_bytes()).hexdigest()
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state = {**report, "appliedAt": stamp, "backup": backup.relative_to(root).as_posix(), "files": files, "identitySha256": digest}
    state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(state, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
