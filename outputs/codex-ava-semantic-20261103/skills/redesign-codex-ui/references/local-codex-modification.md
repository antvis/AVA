# Local Codex Modification

Classify the target before editing. Do not assume that “local Codex” is a writable source project.

## Mode A: source checkout

Use this mode when the target contains application source, package scripts, and editable UI entry points.

1. Read repository instructions and inspect worktree status.
2. Run `audit_codex_ui.py` from the target root.
3. Export the selected preset with `export_theme_bundle.py`, map it into the existing token system, or create `.codex-ui-adapter.json` from `assets/codex-ui-adapter.template.json` for an HTML-based checkout.
4. Integrate through the existing global stylesheet, theme provider, or component library. For the adapter path, add `data-codex-ip-portrait` to the real portrait image and run `apply_theme_to_source.py`; it patches the HTML entry, writes live CSS, copies the identity asset, and records a reversible backup.
5. Add a theme selector and persistence only when requested.
6. Run the repository's lint, typecheck, tests, build, and rendered screenshot checks.

Prefer this mode. It preserves reviewable diffs, normal builds, and rollback.

### Adapter contract and proof

The adapter is intentionally explicit: it names the HTML entry, generated stylesheet, asset directory, portrait marker, and real selectors for canvas, sidebar, main surface, cards, and composer. Never guess selectors in an unknown checkout. Run `apply_theme_to_source.py --dry-run` first, then apply and open the target in a browser. A successful JSON export alone is not proof; the rendered page must expose `body[data-codex-skin]`, load the generated stylesheet and portrait, and show computed theme colors.

Restore the latest mutation with:

```bash
python3 <skill-dir>/scripts/apply_theme_to_source.py --target <target-project> --restore
```

## Mode B: supported theme or custom-CSS hook

Use this mode when the application exposes a documented theme directory, plugin API, extension API, DevTools override, or custom stylesheet setting.

1. Confirm the hook is designed for persistent customization.
2. Export a scoped theme bundle.
3. Install only into the documented user-writable location.
4. Record the app version and hook version.
5. Test restart, update, disable, and uninstall behavior.

Never treat a temporary DevTools edit as a persistent installation.

## Mode C: verified loopback runtime skin on macOS

Use this mode for the signed official macOS Codex when no supported theme hook exists. It changes the real running `app://` renderer and preserves native controls without rewriting the signed bundle.

1. Run `python3 scripts/live_skin_macos.py doctor` and inspect Bundle ID, team ID, bundled Node, port ownership, and renderer target count.
2. If Codex is already running without CDP, obtain explicit restart authorization. Never force-kill it.
3. Run `launch`, then `apply`, then `verify`. Use only a loopback address.
4. Inspect the real window and native states. Keep any client screenshot local-only by default.
5. Use foreground `watch` when persistence across renderer reloads is needed. Stop it before running `remove`.
6. Run `remove` to restore the unmodified renderer DOM. Restarting Codex also clears a one-shot runtime skin.

The controller rejects a wrong Bundle ID, invalid signature/team, Node older than 20, a listener not owned by the selected Codex process, and non-`Codex` or non-`app://` CDP pages. Do not expose CDP on a LAN address.

## Mode D: isolated modified copy of a signed application

Use this mode when `detect_local_codex.py` finds a signed application bundle, sealed resources, or `app.asar` without an official customization hook.

Default behavior:

- inspect read-only;
- export the theme bundle;
- report the exact sealed resource and signature status;
- ask for explicit authorization before creating a separate modified copy;
- never edit the primary installed application in place;
- never overwrite user data or authentication state.

If the user authorizes a side-loaded copy, use a separate application name, bundle identifier, data directory, and backup. Expect updates, notarization, and code signing to break or replace modifications. Re-run functional and security checks after every app update.

Use only when Mode C is unavailable and the user explicitly accepts an ad-hoc-signed sidecar. `build_macos_sidecar.py` copies the application, injects the selected palette and identity into the real `webview/index.html`, changes the product identity and update feed, refreshes Electron's ASAR integrity hash, and applies an ad-hoc signature. Run `--dry-run` first. Existing copies require `--replace` and are backed up; running copies are never replaced, and failed builds restore the backup. Launch with an explicit isolated `--user-data-dir`, inspect the real window, then run `verify_macos_sidecar.py`. The copy is not notarized and must never replace the primary app.

Do not publish real-client screenshots by default: they may expose project names, task history, account identity, attached files, or repository state. Keep them in a temporary location or a gitignored local-only path. Publishing requires explicit user authorization after visual inspection.

## Safety gates

Stop before mutation when any of these are true:

- only a production signed bundle is available, runtime preflight failed, and no side-loaded copy was authorized;
- the app is running and the requested step requires replacing its resources;
- there is no backup or reproducible patch;
- the integration point would bypass approval, permission, authentication, or update security;
- the user's identity assets lack a confirmed publishing or commercial-use status.

Report the concrete path, signature state, and missing authorization. Do not hide the blocker behind “unsupported.”

## Rollback contract

For every persistent modification, retain:

- original app/source version;
- selected preset and identity profile;
- patch or source diff;
- files added and changed;
- build and test commands;
- uninstall or rollback instructions.
