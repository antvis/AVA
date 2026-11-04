#!/usr/bin/env python3
"""Inspect local Codex application candidates without modifying them."""

from __future__ import annotations

import argparse
import json
import plistlib
import subprocess
from pathlib import Path


DEFAULT_CANDIDATES = (
    Path("/Applications/ChatGPT.app"),
    Path("/Applications/Codex.app"),
    Path.home() / "Applications" / "ChatGPT.app",
    Path.home() / "Applications" / "Codex.app",
)


def signature_state(app: Path) -> dict:
    result = subprocess.run(
        ["codesign", "-dv", "--verbose=2", str(app)],
        capture_output=True,
        text=True,
        check=False,
    )
    details = result.stderr + result.stdout
    return {
        "signed": result.returncode == 0,
        "sealedResources": "Sealed Resources" in details,
        "teamIdentifier": next((line.split("=", 1)[1] for line in details.splitlines() if line.startswith("TeamIdentifier=")), None),
    }


def inspect_app(app: Path) -> dict:
    info_path = app / "Contents" / "Info.plist"
    info = {}
    if info_path.is_file():
        with info_path.open("rb") as handle:
            info = plistlib.load(handle)
    resources = app / "Contents" / "Resources"
    asar = resources / "app.asar"
    signature = signature_state(app)
    mode = "signed-installed-app" if signature["signed"] or asar.exists() else "installed-app"
    return {
        "path": str(app),
        "bundleIdentifier": info.get("CFBundleIdentifier"),
        "displayName": info.get("CFBundleDisplayName") or info.get("CFBundleName"),
        "version": info.get("CFBundleShortVersionString"),
        "appAsar": str(asar) if asar.exists() else None,
        "signature": signature,
        "mode": mode,
        "safeDefault": "inspect-and-export-theme" if mode == "signed-installed-app" else "inspect-before-edit",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", nargs="?", help="Optional .app path")
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    args = parser.parse_args()
    candidates = (Path(args.target).expanduser(),) if args.target else DEFAULT_CANDIDATES
    apps = [inspect_app(path.resolve()) for path in candidates if path.is_dir()]
    if args.json:
        print(json.dumps({"applications": apps}, ensure_ascii=False, indent=2))
        return 0 if apps else 1
    if not apps:
        print("No local Codex application candidate found.")
        return 1
    for app in apps:
        print(f"# {app['displayName'] or 'Codex'}")
        print(f"- Path: `{app['path']}`")
        print(f"- Bundle ID: `{app['bundleIdentifier']}`")
        print(f"- Version: `{app['version']}`")
        print(f"- Mode: `{app['mode']}`")
        print(f"- app.asar: `{app['appAsar']}`")
        print(f"- Signed: `{app['signature']['signed']}`")
        print(f"- Sealed resources: `{app['signature']['sealedResources']}`")
        print(f"- Safe default: `{app['safeDefault']}`")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
