---
name: redesign-codex-ui
description: Redesign and locally modify an existing Codex desktop or web interface from reference images, a user persona, a celebrity, idol, actor, musician, fictional character or original IP theme, a visual style, or a combination of these inputs. Use when Codex needs to inspect a local Codex installation or source checkout, reskin, restyle, modernize, personalize, create a fan edition, export a safe theme patch, or substantially revise the UI while preserving task navigation, conversation, composer, code, diff, terminal, approval, settings, and responsive behavior. Supports screenshot-led reconstruction, celebrity element libraries, personal theme packages, source-level implementation, signed-app detection, and visual QA.
---

# Redesign Codex UI

Transform the current Codex interface into a coherent, production-ready design. Treat reference images, personas, and style labels as design evidence—not as permission to replace working product behavior with a static mock.

## Choose the input path

Accept any combination of:

- **Reference image:** inspect composition, density, hierarchy, color, type, radius, elevation, icon treatment, and interaction cues.
- **Role or persona:** translate the role into workflows, information priority, terminology, density, defaults, and accessibility needs.
- **Personal, idol, or character theme:** build a coherent edition around user-supplied portraits, signatures, memorabilia, original characters, or licensed IP assets. Theme navigation, hero, capability cards, composer, profile, and microcopy—not only the palette.
- **Named style:** translate adjectives, products, eras, brands, or designers into explicit visual rules. Recreate principles, not protected logos, illustrations, or pixel-identical branded assets.
- **Open brief:** infer a suitable direction from the existing product and state assumptions before implementation.

Apply this precedence when inputs conflict:

1. Explicit functional and accessibility requirements
2. Explicit user corrections and exclusions
3. Reference image structure and visual evidence
4. Persona workflow needs
5. Named style cues
6. Existing interface conventions

Read [references/input-translation.md](references/input-translation.md) when the request includes a reference image, persona, or named style. Do not ask for information that can be inferred safely from the repository or supplied image.

Read [references/personal-theme-packages.md](references/personal-theme-packages.md) when the request resembles a fan edition, celebrity skin, character theme, collectible interface, scrapbook interface, or deeply personalized Codex. Treat supplied identity assets as content with provenance and permissions, not as generic decoration.

Use `assets/theme-library/default-identity.json` and the transparent `assets/default-identity/opcspace-ip-avatar.png` as the default identity when the user supplies no IP image. Treat it as the OPCspace starter identity, not as a mandatory brand lock. If the user supplies another image, create a separate replacement profile with `scripts/create_identity_profile.py`; never overwrite the bundled default asset.

Read [references/theme-library.md](references/theme-library.md) when the user wants a skin, asks for recommendations, supplies only an identity or mood, or wants to expand the preset library. Select one primary archetype from `assets/theme-library/catalog.json`, then customize it. Borrow from at most one secondary archetype and document the reason; do not average several themes into an incoherent collage.

Read [references/celebrity-elements.md](references/celebrity-elements.md) for celebrity, idol, actor, musician, athlete, creator, fan-club, filmography, discography, tour, award, or collectible requests. Select elements by career context and asset rights; do not fabricate endorsements, quotes, relationships, achievements, or official status.

## Execute the workflow

### 1. Establish scope and constraints

Summarize the requested transformation in one short design brief containing:

- target users and primary task;
- surfaces in scope;
- elements to preserve;
- desired emotional and visual qualities;
- explicit exclusions;
- acceptance checks.

If the user requests only a design proposal, stop after producing the brief and component/token plan. If the user requests a change, continue through implementation and verification.

### 2. Audit the current product

Read repository instructions before editing. Inspect the worktree, package manager, application entry points, component library, theme/tokens, routing, state management, tests, and build scripts.

Run the bundled inventory from the target repository root when useful:

```bash
python3 <skill-dir>/scripts/audit_codex_ui.py .
```

Use its output as a lead, then verify important findings in source. Do not assume that every Codex implementation uses React, Electron, Tailwind, or a specific folder layout.

If the target is a local installed application rather than a source checkout, run:

```bash
python3 <skill-dir>/scripts/detect_local_codex.py
```

Then read [references/local-codex-modification.md](references/local-codex-modification.md) and choose the safe modification mode. Prefer source checkout or an official theme/custom-CSS hook. Treat a signed `app.asar` application as sealed; do not patch the installed bundle or terminate the running client without explicit authorization.

For a signed macOS Codex without a supported theme hook, prefer the verified loopback runtime path in `scripts/live_skin_macos.py`. Run `doctor`, obtain explicit authorization before restarting an existing Codex process, run `launch`, then `apply` and `verify`. The controller accepts only the expected Bundle ID, valid signature/team, bundled Node 20+, a `127.0.0.1` CDP listener owned by that Codex process, and a `Codex` page at an `app://` URL. `remove` restores the renderer without rewriting `app.asar`; `watch` keeps the skin across renderer reloads while it remains running.

When runtime injection is unavailable and the user explicitly authorizes a separate macOS side-loaded copy, use `scripts/build_macos_sidecar.py` instead of editing the primary application. Run `--dry-run` first. It changes the real renderer, product identity, bundle ID, URL scheme, user-data product name, update feed, ASAR integrity hash, and signature in the copy only. Replacing an existing stopped copy requires `--replace`; never replace a running copy. Launch with an explicit separate `--user-data-dir`, inspect the real window, then run `scripts/verify_macos_sidecar.py`. Keep client screenshots local unless the user explicitly authorizes publishing them.

Start the existing app when feasible and capture a baseline at representative viewport sizes. Inspect real states rather than only the landing screen: empty task, active conversation, long content, code/diff or tool output, composer focus, loading, error, approval, and narrow layout.

Read [references/codex-ui-surfaces.md](references/codex-ui-surfaces.md) before changing navigation, conversation structure, composer behavior, tool output, terminal/diff surfaces, or approval flows.

### 3. Convert inspiration into a design system

Create a compact evidence-to-decision table:

| Evidence | Interpretation | UI decision | Verification |
| --- | --- | --- | --- |
| Reference has strong vertical rhythm | Calm, editorial scan path | Increase section spacing and reduce borders | Compare full-page screenshot |
| Persona switches tasks frequently | Navigation speed matters | Persistent task rail with clear active state | Keyboard and narrow-width test |

Define a small token system before editing many components:

- semantic colors for canvas, surfaces, text, borders, accent, success, warning, and danger;
- type scale, weights, line heights, and code typography;
- spacing, radii, shadows, motion, and layout widths;
- component states for hover, focus, pressed, selected, disabled, loading, and error.

Prefer semantic CSS variables or the repository's existing token mechanism. Avoid scattering one-off literal colors and spacing values across components.

For a personal or character edition, define a theme package separately from core product logic. Include identity, copy, media, palette, typography roles, ornamental motifs, content labels, and responsive focal points. Keep functional state colors and approval semantics outside decorative theme overrides.

When using the bundled library, copy a preset into the target project rather than editing the source preset in place. Preserve its `schemaVersion` and `derivedFrom`, replace placeholder identity and media values, then validate the target theme against the repository's implementation needs.

For a recurring person, character, or IP, create a separate identity profile from `assets/theme-library/identity-profile.template.json`. Keep voice, collections, milestones, asset rights, privacy, and prohibited behaviors there; keep layout and visual tokens in the skin preset. Use `assets/theme-library/motifs.json` as a controlled ornament vocabulary instead of inventing inconsistent decorations per screen.

Export a portable theme bundle when integrating with a source checkout or adapter:

```bash
python3 <skill-dir>/scripts/export_theme_bundle.py \
  <skill-dir>/assets/theme-library/presets/<preset>.json \
  --output <target-project>/.codex-theme
```

Import the generated scoped CSS and manifest through the target repository's normal entry points. Do not inject it by modifying a sealed production app in place.

For an editable HTML-based source checkout, copy `assets/codex-ui-adapter.template.json` to `<target>/.codex-ui-adapter.json`, map its selectors to the real shell, sidebar, surfaces, cards, and composer, add `data-codex-ip-portrait` to the real portrait `<img>`, then run the executable installer:

```bash
python3 <skill-dir>/scripts/apply_theme_to_source.py \
  --target <target-project> \
  --preset <skill-dir>/assets/theme-library/presets/<preset>.json \
  --identity <skill-dir>/assets/default-identity/opcspace-ip-avatar.png
```

This must change the target HTML, write a live stylesheet, copy the portrait, and create `.codex-skin/applied.json` plus a backup. Verify the rendered target, not just the generated files. Roll back with `python3 <skill-dir>/scripts/apply_theme_to_source.py --target <target-project> --restore`.

Create a replacement identity bundle when the user provides their own IP image:

```bash
python3 <skill-dir>/scripts/create_identity_profile.py \
  --image <portrait.jpg> \
  --display-name "<name>" \
  --output <target-project>/.codex-theme/identity
```

Wire the generated profile and portrait into the same media slot as the default identity. Preserve a restore-default action and verify image-loading failure behavior.

### 4. Implement in stable layers

Make the smallest coherent set of changes in this order:

1. tokens, fonts, and global canvas;
2. application shell and responsive layout;
3. shared primitives;
4. Codex-specific surfaces;
5. theme media, ornaments, and personalized microcopy;
6. interaction polish and motion;
7. empty, loading, error, and overflow states.

Preserve data flow, commands, keyboard shortcuts, selection, scrolling, resize behavior, and approval semantics unless the user explicitly requests behavioral changes. Reuse existing components and dependencies when they can express the design cleanly. Do not add a new UI framework merely to obtain a visual effect.

Map decorative sections to real Codex actions. A themed capability card must open a real workflow, a personalized project item must represent a real project or task, and the large themed composer must remain the actual composer. Never ship a screenshot-like facade with dead controls.

Avoid generic “AI dashboard” styling: excessive gradient text, ornamental glass panels, uniform rounded cards, decorative charts, or oversized hero copy without product justification. Give the result a clear visual thesis derived from the supplied evidence.

### 5. Validate function and appearance

Run the repository's configured format, typecheck, lint, test, and build commands in proportion to the change. Fix new warnings and runtime errors caused by the redesign.

Perform visual QA at minimum on:

- wide desktop, compact desktop, and narrow/mobile widths supported by the app;
- default, hover, focus-visible, selected, disabled, loading, error, and overflow states;
- long task titles, long messages, code blocks, diffs, tool calls, and composer attachments;
- light/dark themes when both exist;
- keyboard navigation, visible focus, reduced motion, readable contrast, and zoom.

For portrait-led themes, also verify subject focal points, cropping, asset loading, fallback media, decorative overlap, text readability over imagery, and a low-decoration narrow layout.

Read [references/visual-qa.md](references/visual-qa.md) for the full review rubric. Compare screenshots against the design brief, not only against the reference image.

### 6. Hand off the redesign

Report:

- the visual direction and why it fits the input;
- the main files and systems changed;
- verification commands and results;
- screenshots or preview instructions when available;
- deliberate deviations from the reference;
- any remaining limitation or exact blocker.

Never claim visual parity without inspecting a rendered result. Never claim verification that was not run.

## Use bundled resources

- Read [references/input-translation.md](references/input-translation.md) for reference-image, persona, and style interpretation.
- Read [references/codex-ui-surfaces.md](references/codex-ui-surfaces.md) for product invariants and surface-specific checks.
- Read [references/personal-theme-packages.md](references/personal-theme-packages.md) for fan, idol, character, collectible, and portrait-led editions.
- Read [references/celebrity-elements.md](references/celebrity-elements.md) for career-aware celebrity and fan-culture composition.
- Read [references/local-codex-modification.md](references/local-codex-modification.md) before changing a local source checkout or installed desktop client.
- Read [references/visual-qa.md](references/visual-qa.md) before final visual review.
- Copy [assets/design-brief.template.md](assets/design-brief.template.md) only when the project benefits from a persistent design brief.
- Adapt [assets/personal-theme.template.json](assets/personal-theme.template.json) when the codebase benefits from switchable or shareable themes.
- Read [references/theme-library.md](references/theme-library.md), select from [assets/theme-library/catalog.json](assets/theme-library/catalog.json), and adapt one preset for reusable skins.
- Adapt `assets/theme-library/identity-profile.template.json` for identity-specific settings and select ornaments from `assets/theme-library/motifs.json`.
- Use `assets/theme-library/default-identity.json` as the replaceable OPCspace starter identity.
- Run `python3 <skill-dir>/scripts/validate_theme_library.py <skill-dir>/assets/theme-library` after adding or changing presets.
- Run `scripts/detect_local_codex.py` to classify a local target, `scripts/export_theme_bundle.py` to prepare portable theme assets, and `scripts/apply_theme_to_source.py` to install and roll back a theme in an adapter-equipped source checkout.
- Run `scripts/live_skin_macos.py doctor|launch|apply|verify|remove|watch` for a verified, reversible live skin on the real signed macOS Codex renderer.
- Run `scripts/create_identity_profile.py` to package a user's replacement portrait without modifying the bundled default.
- Run `scripts/build_macos_sidecar.py` only after explicit authorization to create an isolated, ad-hoc-signed macOS copy of a sealed installed app.
- Run `scripts/verify_macos_sidecar.py` after every sidecar build or upstream Codex update.
- Run `scripts/audit_codex_ui.py` to generate a quick, read-only repository inventory.
