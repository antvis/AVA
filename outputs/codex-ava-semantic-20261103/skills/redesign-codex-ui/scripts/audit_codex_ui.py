#!/usr/bin/env python3
"""Produce a small, read-only inventory of a frontend repository."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


SKIP_DIRS = {
    ".git",
    ".next",
    ".turbo",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "target",
}

CONFIG_FILES = (
    "package.json",
    "vite.config.ts",
    "vite.config.js",
    "next.config.js",
    "next.config.mjs",
    "tailwind.config.js",
    "tailwind.config.ts",
    "electron-builder.yml",
    "tsconfig.json",
)

SOURCE_SUFFIXES = {".css", ".html", ".js", ".jsx", ".scss", ".ts", ".tsx", ".vue", ".svelte"}
UI_HINTS = ("app", "layout", "theme", "token", "sidebar", "composer", "message", "chat", "diff", "terminal")


def visible_files(root: Path):
    for path in root.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.is_file():
            yield path


def relative(path: Path, root: Path) -> str:
    return str(path.relative_to(root))


def package_details(root: Path) -> dict:
    package_path = root / "package.json"
    if not package_path.exists():
        return {}
    try:
        package = json.loads(package_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return {"error": str(error)}
    dependencies = set(package.get("dependencies", {})) | set(package.get("devDependencies", {}))
    frameworks = [
        name
        for name in ("@tauri-apps/api", "electron", "next", "react", "svelte", "tailwindcss", "vue")
        if name in dependencies
    ]
    return {
        "name": package.get("name"),
        "packageManager": package.get("packageManager"),
        "scripts": package.get("scripts", {}),
        "frameworkHints": frameworks,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of Markdown")
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.is_dir():
        parser.error(f"not a directory: {root}")

    files = list(visible_files(root))
    source_files = [path for path in files if path.suffix.lower() in SOURCE_SUFFIXES]
    likely_ui = sorted(
        relative(path, root)
        for path in source_files
        if any(hint in path.name.lower() or hint in relative(path, root).lower().split("/") for hint in UI_HINTS)
    )
    configs = [name for name in CONFIG_FILES if (root / name).exists()]
    lockfiles = [name for name in ("bun.lockb", "package-lock.json", "pnpm-lock.yaml", "yarn.lock") if (root / name).exists()]
    instructions = sorted(relative(path, root) for path in files if path.name in {"AGENTS.md", "CLAUDE.md"})

    report = {
        "root": str(root),
        "configFiles": configs,
        "lockfiles": lockfiles,
        "instructionFiles": instructions,
        "package": package_details(root),
        "sourceFileCount": len(source_files),
        "likelyUiFiles": likely_ui[:80],
    }

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0

    print(f"# Codex UI repository audit\n\n- Root: `{report['root']}`")
    print(f"- Source files: {report['sourceFileCount']}")
    print(f"- Config: {', '.join(configs) or 'none detected'}")
    print(f"- Lockfiles: {', '.join(lockfiles) or 'none detected'}")
    print(f"- Instructions: {', '.join(instructions) or 'none detected'}")
    package = report["package"]
    if package:
        print(f"- Package: {package.get('name') or 'unnamed'}")
        print(f"- Framework hints: {', '.join(package.get('frameworkHints', [])) or 'none detected'}")
        scripts = package.get("scripts", {})
        if scripts:
            print("\n## Package scripts")
            for name, command in scripts.items():
                print(f"- `{name}`: `{command}`")
    print("\n## Likely UI files")
    for name in report["likelyUiFiles"]:
        print(f"- `{name}`")
    if not report["likelyUiFiles"]:
        print("- none detected")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
