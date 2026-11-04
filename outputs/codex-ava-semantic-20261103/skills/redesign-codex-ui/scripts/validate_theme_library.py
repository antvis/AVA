#!/usr/bin/env python3
"""Validate the bundled Codex personal skin catalog and presets."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path


ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
HEX_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")
REQUIRED_ACTIONS = {"explore", "build", "review", "fix"}
REQUIRED_PALETTE = {"canvas", "surface", "surfaceRaised", "ink", "mutedInk", "accent", "accentSoft", "line", "focus"}
REQUIRED_TOP = {
    "schemaVersion", "id", "label", "category", "tags", "derivedFrom", "concept",
    "layout", "palette", "typography", "shape", "decoration", "motion", "mediaSlots",
    "quickActions", "responsive", "assetPolicy", "accessibility",
}


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"{path}: invalid JSON: {error}") from error


def validate_preset(path: Path, expected_id: str) -> list[str]:
    errors: list[str] = []
    try:
        preset = load_json(path)
    except ValueError as error:
        return [str(error)]

    missing = sorted(REQUIRED_TOP - set(preset))
    if missing:
        errors.append(f"{path}: missing keys: {', '.join(missing)}")
    preset_id = preset.get("id")
    if preset_id != expected_id:
        errors.append(f"{path}: id {preset_id!r} does not match catalog id {expected_id!r}")
    if not isinstance(preset_id, str) or not ID_PATTERN.fullmatch(preset_id):
        errors.append(f"{path}: invalid id {preset_id!r}")
    if path.stem != preset_id:
        errors.append(f"{path}: filename must match preset id")

    palette = preset.get("palette", {})
    missing_colors = sorted(REQUIRED_PALETTE - set(palette))
    if missing_colors:
        errors.append(f"{path}: missing palette colors: {', '.join(missing_colors)}")
    for name, color in palette.items():
        if not isinstance(color, str) or not HEX_PATTERN.fullmatch(color):
            errors.append(f"{path}: palette.{name} must be a 6-digit hex color")

    action_ids = {action.get("id") for action in preset.get("quickActions", []) if isinstance(action, dict)}
    if action_ids != REQUIRED_ACTIONS:
        errors.append(f"{path}: quick action ids must be {sorted(REQUIRED_ACTIONS)}")
    if preset.get("decoration", {}).get("pointerEvents") != "none":
        errors.append(f"{path}: decorative layers must use pointerEvents=none")
    if preset.get("assetPolicy", {}).get("remoteHotlink") is not False:
        errors.append(f"{path}: remoteHotlink must be false")
    if preset.get("accessibility", {}).get("preserveSemanticStates") is not True:
        errors.append(f"{path}: preserveSemanticStates must be true")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("library", nargs="?", default="assets/theme-library", help="Theme library directory")
    args = parser.parse_args()
    library = Path(args.library).expanduser().resolve()
    catalog_path = library / "catalog.json"

    try:
        catalog = load_json(catalog_path)
    except ValueError as error:
        print(f"ERROR: {error}")
        return 1

    errors: list[str] = []
    seen: set[str] = set()
    entries = catalog.get("presets", [])
    if not entries:
        errors.append(f"{catalog_path}: presets must not be empty")

    supplemental: dict[str, object] = {}
    for supplemental_name in ("identity-profile.template.json", "default-identity.json", "motifs.json", "celebrity-elements.json"):
        supplemental_path = library / supplemental_name
        try:
            supplemental[supplemental_name] = load_json(supplemental_path)
        except ValueError as error:
            errors.append(str(error))

    for entry in entries:
        preset_id = entry.get("id") if isinstance(entry, dict) else None
        relative_path = entry.get("path") if isinstance(entry, dict) else None
        if not isinstance(preset_id, str) or not ID_PATTERN.fullmatch(preset_id):
            errors.append(f"{catalog_path}: invalid preset id {preset_id!r}")
            continue
        if preset_id in seen:
            errors.append(f"{catalog_path}: duplicate preset id {preset_id}")
        seen.add(preset_id)
        if not isinstance(relative_path, str):
            errors.append(f"{catalog_path}: {preset_id} is missing a path")
            continue
        preset_path = (library / relative_path).resolve()
        try:
            preset_path.relative_to(library)
        except ValueError:
            errors.append(f"{catalog_path}: {preset_id} path escapes the library")
            continue
        if not preset_path.is_file():
            errors.append(f"{catalog_path}: missing preset file {relative_path}")
            continue
        errors.extend(validate_preset(preset_path, preset_id))

    preset_files = {path.stem for path in (library / "presets").glob("*.json")}
    orphaned = sorted(preset_files - seen)
    if orphaned:
        errors.append(f"{catalog_path}: uncatalogued preset files: {', '.join(orphaned)}")

    motifs_path = library / "motifs.json"
    motif_data = supplemental.get("motifs.json", {})
    motifs = motif_data.get("motifs", []) if isinstance(motif_data, dict) else []
    motif_ids = [motif.get("id") for motif in motifs if isinstance(motif, dict)]
    if len(motif_ids) != len(set(motif_ids)):
        errors.append(f"{motifs_path}: motif ids must be unique")
    for motif in motifs:
        if not isinstance(motif, dict) or not ID_PATTERN.fullmatch(str(motif.get("id", ""))):
            errors.append(f"{motifs_path}: invalid motif entry {motif!r}")
        elif motif.get("pointerEvents") != "none":
            errors.append(f"{motifs_path}: {motif['id']} must use pointerEvents=none")

    used_motif_ids: set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict) or not isinstance(entry.get("path"), str):
            continue
        preset_path = library / entry["path"]
        if preset_path.is_file():
            preset = load_json(preset_path)
            used_motif_ids.update(preset.get("decoration", {}).get("motifs", []))
    undefined_motifs = sorted(used_motif_ids - set(motif_ids))
    if undefined_motifs:
        errors.append(f"{motifs_path}: undefined motifs used by presets: {', '.join(undefined_motifs)}")

    default_identity = supplemental.get("default-identity.json", {})
    if isinstance(default_identity, dict):
        for asset in default_identity.get("assets", []):
            if not isinstance(asset, dict) or not isinstance(asset.get("path"), str):
                errors.append(f"{library / 'default-identity.json'}: invalid asset entry")
                continue
            asset_path = (library / asset["path"]).resolve()
            if not asset_path.is_file():
                errors.append(f"{library / 'default-identity.json'}: missing asset {asset['path']}")
                continue
            expected_hash = asset.get("sha256")
            actual_hash = hashlib.sha256(asset_path.read_bytes()).hexdigest()
            if expected_hash and expected_hash != actual_hash:
                errors.append(f"{asset_path}: sha256 does not match default identity profile")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print(f"Theme library is valid: {len(entries)} presets, {len(motifs)} motifs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
