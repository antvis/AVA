#!/usr/bin/env python3
"""Create a replaceable Codex identity profile from a user-supplied image."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path


ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True, help="Portrait image")
    parser.add_argument("--output", required=True, help="Identity output directory")
    parser.add_argument("--display-name", default="My IP", help="Display name")
    parser.add_argument("--edition-name", help="Edition label")
    args = parser.parse_args()
    source = Path(args.image).expanduser().resolve()
    if not source.is_file() or source.suffix.lower() not in ALLOWED_SUFFIXES:
        parser.error("image must be an existing JPEG, PNG, or WebP file")
    if source.stat().st_size > 5 * 1024 * 1024:
        parser.error("image must be 5MB or smaller")
    output = Path(args.output).expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    target = output / f"portrait{source.suffix.lower()}"
    shutil.copy2(source, target)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    profile = {
        "schemaVersion": 1,
        "id": "custom-identity",
        "kind": "user-supplied-ip",
        "naming": {
            "displayName": args.display_name,
            "editionName": args.edition_name or f"{args.display_name} Codex Edition",
        },
        "assets": [{
            "id": "heroPortrait",
            "path": target.name,
            "source": "user-supplied",
            "license": "confirm-before-publish",
            "sha256": digest,
        }],
        "replacement": {"allowed": True, "fallback": "opcspace-default-ip"},
    }
    (output / "identity-profile.json").write_text(json.dumps(profile, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Created identity profile in {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
