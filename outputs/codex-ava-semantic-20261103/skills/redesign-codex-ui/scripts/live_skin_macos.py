#!/usr/bin/env python3
"""Safely launch, skin, verify, or restore the real macOS Codex renderer."""

from __future__ import annotations

import argparse
import json
import os
import plistlib
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path


OFFICIAL_BUNDLE_ID = "com.openai.codex"
OFFICIAL_TEAM_ID = "2DC432GLL2"
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
DEFAULT_PRESET = SKILL_DIR / "assets/theme-library/presets/keepsake-olive.json"
DEFAULT_IDENTITY = SKILL_DIR / "assets/default-identity/opcspace-ip-avatar.png"
INJECTOR = SCRIPT_DIR / "live_skin_injector.mjs"


def run(*args: str, capture: bool = False, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(args, text=True, capture_output=capture, check=check)


def plist(app: Path) -> dict:
    with (app / "Contents/Info.plist").open("rb") as handle:
        return plistlib.load(handle)


def signing(path: Path) -> dict:
    verify = run("codesign", "--verify", "--deep", "--strict", str(path), capture=True, check=False)
    details = run("codesign", "-dv", "--verbose=2", str(path), capture=True, check=False)
    output = details.stderr + details.stdout
    team = next((line.split("=", 1)[1] for line in output.splitlines() if line.startswith("TeamIdentifier=")), None)
    return {"valid": verify.returncode == 0, "teamIdentifier": team}


def node_major(node: Path) -> int:
    result = run(str(node), "--version", capture=True)
    return int(result.stdout.strip().lstrip("v").split(".", 1)[0])


def listening_pids(port: int) -> list[int]:
    result = run("lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN", "-t", capture=True, check=False)
    return sorted({int(value) for value in result.stdout.split() if value.isdigit()})


def app_pids(executable: Path) -> list[int]:
    result = run("ps", "-axo", "pid=,command=", capture=True)
    prefix = str(executable)
    matches = []
    for line in result.stdout.splitlines():
        fields = line.strip().split(None, 1)
        if len(fields) == 2 and fields[0].isdigit() and (fields[1] == prefix or fields[1].startswith(prefix + " ")):
            matches.append(int(fields[0]))
    return sorted(set(matches))


def parent_pid(pid: int) -> int | None:
    result = run("ps", "-o", "ppid=", "-p", str(pid), capture=True, check=False)
    value = result.stdout.strip()
    return int(value) if value.isdigit() else None


def is_app_process(pid: int, roots: set[int]) -> bool:
    seen: set[int] = set()
    while pid > 1 and pid not in seen:
        if pid in roots:
            return True
        seen.add(pid)
        pid = parent_pid(pid) or 0
    return False


def cdp_targets(port: int) -> list[dict]:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=2.5) as response:
            targets = json.load(response)
    except Exception:
        return []
    return [target for target in targets if target.get("type") == "page" and target.get("title") == "Codex" and str(target.get("url", "")).startswith("app://")]


def inspect(args: argparse.Namespace) -> dict:
    app = Path(args.app).expanduser().resolve()
    if sys.platform != "darwin":
        raise OSError("Live Codex skin control requires macOS")
    if not app.is_dir():
        raise FileNotFoundError(app)
    info = plist(app)
    executable = app / "Contents/MacOS" / info.get("CFBundleExecutable", "ChatGPT")
    node = app / "Contents/Resources/cua_node/bin/node"
    for command in ("codesign", "lsof", "pgrep", "ps", "open"):
        if not shutil.which(command):
            raise FileNotFoundError(f"Missing command: {command}")
    if not executable.is_file() or not node.is_file():
        raise FileNotFoundError(f"Missing executable or bundled Node in {app}")
    app_signing, node_signing = signing(app), signing(node)
    bundle_id = info.get("CFBundleIdentifier")
    if bundle_id != args.expected_bundle_id:
        raise ValueError(f"Bundle ID mismatch: expected {args.expected_bundle_id}, got {bundle_id}")
    if not app_signing["valid"] or not node_signing["valid"]:
        raise ValueError("Codex app or bundled Node signature is invalid")
    if not args.allow_adhoc and (app_signing["teamIdentifier"] != args.expected_team_id or node_signing["teamIdentifier"] != args.expected_team_id):
        raise ValueError(f"Team ID mismatch: expected {args.expected_team_id}")
    major = node_major(node)
    if major < 20:
        raise ValueError(f"Bundled Node {major} is too old; Node 20+ is required")
    roots = set(app_pids(executable))
    listeners = listening_pids(args.port)
    owned = bool(listeners) and all(is_app_process(pid, roots) for pid in listeners)
    targets = cdp_targets(args.port) if owned else []
    return {
        "app": str(app), "bundleIdentifier": bundle_id, "version": info.get("CFBundleShortVersionString"),
        "appSigning": app_signing, "node": str(node), "nodeSigning": node_signing, "nodeMajor": major,
        "appPids": sorted(roots), "port": args.port, "listenerPids": listeners, "listenerOwnedByApp": owned,
        "codexRendererTargets": len(targets), "ready": owned and bool(targets),
    }


def wait_ready(args: argparse.Namespace, seconds: int = 45) -> dict:
    deadline = time.monotonic() + seconds
    report = inspect(args)
    while not report["ready"] and time.monotonic() < deadline:
        time.sleep(0.5)
        report = inspect(args)
    if not report["ready"]:
        raise RuntimeError(f"Codex CDP did not become ready on 127.0.0.1:{args.port}")
    return report


def launch(args: argparse.Namespace) -> dict:
    report = inspect(args)
    if report["ready"]:
        return report
    if report["appPids"]:
        if not args.restart_authorized:
            raise RuntimeError("Codex is already running without the requested verified CDP endpoint; quit it first or explicitly authorize restart")
        bundle_id = report["bundleIdentifier"]
        run("osascript", "-e", f'tell application id "{bundle_id}" to quit')
        deadline = time.monotonic() + 20
        executable = Path(report["app"]) / "Contents/MacOS" / plist(Path(report["app"])).get("CFBundleExecutable", "ChatGPT")
        while app_pids(executable) and time.monotonic() < deadline:
            time.sleep(0.5)
        if app_pids(executable):
            raise RuntimeError("Codex did not quit cleanly; refusing to force-kill it")
    command = ["open", "-n", str(Path(args.app).expanduser().resolve()), "--args", "--remote-debugging-address=127.0.0.1", f"--remote-debugging-port={args.port}"]
    if args.user_data_dir:
        Path(args.user_data_dir).expanduser().mkdir(parents=True, exist_ok=True)
        command.append(f"--user-data-dir={Path(args.user_data_dir).expanduser().resolve()}")
    run(*command)
    return wait_ready(args)


def injector(args: argparse.Namespace) -> None:
    report = inspect(args)
    if not report["ready"]:
        raise RuntimeError(f"Verified Codex renderer is not ready on 127.0.0.1:{args.port}; run launch first")
    command = [report["node"], str(INJECTOR), args.command, "--port", str(args.port)]
    if args.command in ("apply", "watch"):
        command += ["--preset", str(Path(args.preset).expanduser().resolve()), "--identity", str(Path(args.identity).expanduser().resolve())]
    if args.command == "watch":
        command += ["--interval", str(args.interval)]
    os.execv(command[0], command) if args.command == "watch" else run(*command)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("doctor", "launch", "apply", "verify", "remove", "watch"))
    parser.add_argument("--app", default="/Applications/ChatGPT.app")
    parser.add_argument("--port", type=int, default=9341)
    parser.add_argument("--preset", default=str(DEFAULT_PRESET))
    parser.add_argument("--identity", default=str(DEFAULT_IDENTITY))
    parser.add_argument("--interval", type=int, default=1800)
    parser.add_argument("--expected-bundle-id", default=OFFICIAL_BUNDLE_ID)
    parser.add_argument("--expected-team-id", default=OFFICIAL_TEAM_ID)
    parser.add_argument("--allow-adhoc", action="store_true", help="Allow an explicitly selected ad-hoc-signed sidecar")
    parser.add_argument("--restart-authorized", action="store_true", help="Authorize a clean app quit/relaunch; never force-kills")
    parser.add_argument("--user-data-dir", help="Optional isolated Chromium data directory")
    args = parser.parse_args()
    if args.command == "doctor":
        print(json.dumps(inspect(args), ensure_ascii=False, indent=2))
    elif args.command == "launch":
        print(json.dumps(launch(args), ensure_ascii=False, indent=2))
    else:
        injector(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
