#!/usr/bin/env python3
"""Read-only verification for an OPCspace-skinned macOS Codex sidecar."""

from __future__ import annotations

import argparse
import json
import plistlib
import subprocess
from pathlib import Path

from build_macos_sidecar import identity_asset_name, load_preset, sha256, verify_archive


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("app", help="Sidecar .app path")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    app = Path(args.app).expanduser().resolve()
    resources = app / "Contents/Resources"
    info_path = app / "Contents/Info.plist"
    manifest_path = resources / "opcspace-skin-manifest.json"
    asar = resources / "app.asar"
    for path in (info_path, manifest_path, asar):
        if not path.exists():
            raise FileNotFoundError(path)
    with info_path.open("rb") as handle:
        info = plistlib.load(handle)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    actual_hash = sha256(asar)
    plist_hash = info["ElectronAsarIntegrity"]["Resources/app.asar"]["hash"]
    if actual_hash != plist_hash or actual_hash != manifest["asarSha256"]:
        raise ValueError("ASAR hash does not match Info.plist and manifest")
    if info.get("CFBundleIdentifier") != manifest.get("bundleId") or info.get("CFBundleIdentifier") == "com.openai.codex":
        raise ValueError("Sidecar bundle identity is not isolated")
    legacy = manifest.get("schemaVersion", 1) < 2
    preset_path = Path(manifest["preset"]) if manifest.get("preset") else None
    theme_id = manifest.get("themeId") or (load_preset(preset_path)["id"] if preset_path and preset_path.exists() else "unknown")
    identity_path = Path(manifest["identity"]) if manifest.get("identity") else None
    asset_name = manifest.get("assetName") or (identity_asset_name(identity_path) if identity_path else "opcspace-ip-avatar.png")
    identity_hash = manifest.get("identitySha256") or (sha256(identity_path) if identity_path and identity_path.exists() else None)
    verify_archive(asar, None if legacy else theme_id, asset_name, manifest["displayName"])
    signature = subprocess.run(["codesign", "--verify", "--deep", "--strict", str(app)], capture_output=True, text=True)
    if signature.returncode:
        raise ValueError(signature.stderr.strip() or "Code signature verification failed")
    result = {
        "app": str(app), "valid": True, "bundleId": info["CFBundleIdentifier"],
        "displayName": info.get("CFBundleDisplayName"), "themeId": theme_id,
        "asarSha256": actual_hash, "identitySha256": identity_hash,
        "signatureValid": True, "screenshotPolicy": manifest.get("screenshotPolicy", "local-only"),
    }
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Valid sidecar: {result['displayName']} ({result['bundleId']})")
        print(f"Theme: {result['themeId']}")
        print(f"ASAR: {result['asarSha256']}")
        print("Signature: valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
