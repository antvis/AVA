#!/usr/bin/env python3
"""Export a preset as scoped CSS variables and an integration manifest."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def kebab(value: str) -> str:
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", value)
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("preset", help="Theme preset JSON")
    parser.add_argument("--output", required=True, help="Output directory")
    args = parser.parse_args()
    preset_path = Path(args.preset).expanduser().resolve()
    output = Path(args.output).expanduser().resolve()
    preset = json.loads(preset_path.read_text(encoding="utf-8"))
    theme_id = preset["id"]
    palette = preset["palette"]
    shape = preset["shape"]
    declarations = [f"  --codex-skin-{kebab(name)}: {value};" for name, value in palette.items()]
    declarations.extend((
        f"  --codex-skin-panel-radius: {shape['panelRadius']}px;",
        f"  --codex-skin-control-radius: {shape['controlRadius']}px;",
        f"  --codex-skin-motion-duration: {preset['motion']['durationMs']}ms;",
    ))
    css = (
        f"/* Generated from {preset_path.name}; integrate through the target's normal theme entry point. */\n"
        f"[data-codex-skin=\"{theme_id}\"] {{\n" + "\n".join(declarations) + "\n}\n"
    )
    manifest = {
        "schemaVersion": 1,
        "themeId": theme_id,
        "sourcePreset": str(preset_path),
        "scopeSelector": f"[data-codex-skin=\"{theme_id}\"]",
        "css": "codex-skin.css",
        "integration": "source-checkout-or-supported-theme-hook",
        "modifiesInstalledApp": False,
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "codex-skin.css").write_text(css, encoding="utf-8")
    (output / "codex-skin.manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Exported {theme_id} to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
