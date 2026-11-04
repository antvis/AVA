# Personal Theme Packages

Use this mode for fan editions, celebrity or idol skins, fictional characters, original IP, personal brands, collectible interfaces, and scrapbook-like Codex designs.

## Minimum bar

A personal theme must change the complete visual narrative, not only colors. Theme at least five relevant zones:

1. application identity or edition label;
2. navigation, projects, or task groups;
3. hero or welcome surface;
4. capability or quick-action cards;
5. composer and its controls;
6. profile, status, or account area;
7. empty states and lightweight ornaments.

Every functional zone must remain connected to real product behavior.

## Pattern: portrait-led collectible edition

The supplied example can be generalized as:

- warm low-contrast canvas with one muted accent family;
- fixed left navigation combining Codex destinations, themed projects, and a personal checklist;
- edition label and personalized identity in the header;
- large rounded hero with a portrait, signature-like wordmark, subtle botanical or star line art, seal, label, and paper ephemera;
- four capability cards mapped to explore code, build features, review code, and fix failures;
- oversized, soft-edged composer using the same paper-and-ink language;
- small profile portrait and edition selector in the lower navigation;
- restrained stickers, stamps, Polaroid frames, tape, hearts, or constellation marks used as layering details.

Preserve this hierarchy instead of placing decoration everywhere: identity first, primary product actions second, supporting memorabilia third.

## Build the theme model

Keep theme content in a configuration object or token layer when the repository supports it. Adapt `assets/personal-theme.template.json`; do not force its schema onto an incompatible codebase.

Separate three layers:

- **Product semantics:** danger, warning, success, approval, focus, diff additions/deletions.
- **Theme system:** canvas, paper, ink, accent, border, shadow, radius, ornament opacity, fonts.
- **Theme content:** edition name, greeting, hero copy, images, signature, badges, project labels, quick actions.

Never allow theme colors to obscure risky actions, errors, selection, or code diffs.

## Handle identity assets

Inventory every portrait, signature, logo, sticker, font, and illustration with its source and allowed use. Prefer user-supplied, original, public-domain, or explicitly licensed assets. Do not hotlink remote media.

For each important raster image:

- store a local optimized version;
- preserve a high-quality source outside the runtime bundle when appropriate;
- define focal point or object position for responsive cropping;
- provide intrinsic dimensions to prevent layout shift;
- provide meaningful alt text when the image conveys content;
- define a neutral fallback when the asset is missing;
- remove unnecessary metadata when privacy matters.

If the user requests a recognizable public figure but supplies no reusable image, request an owned or licensed asset before shipping the final implementation. A placeholder or original non-identifying illustration is acceptable for a prototype if labeled clearly.

## Default and replacement identity

Use the bundled OPCspace purple-haired IP portrait and `default-identity.json` when no portrait is supplied. Keep the default immutable so users can restore it.

When a user supplies a replacement:

- create a separate identity profile rather than changing the preset;
- accept JPEG, PNG, or WebP up to the implementation's declared limit;
- copy the image into a local theme-owned directory rather than hotlinking it;
- update Hero and avatar media slots together;
- provide a restore-default action;
- persist the choice locally only with the user's action;
- fall back to the OPCspace default, then to the neutral illustration if both images fail;
- keep source, license, hash, and publishing status in the identity profile.

## Responsive transformation

Do not shrink the desktop collage uniformly.

- Collapse themed project and checklist groups behind navigation on narrow screens.
- Reduce or remove nonessential stamps, paper scraps, sparkles, and line art.
- Keep the subject's face or primary focal point visible using theme focal-point data.
- Move hero copy to a readable solid surface when image overlap becomes unsafe.
- Convert four capability cards to a two-column grid or horizontal scroller, then one column if needed.
- Keep the real composer reachable and above overlays or decorative layers.

## Interaction and motion

Use low-amplitude motion: paper lift, stamp settle, subtle star shimmer, or card elevation. Respect reduced-motion preferences. Do not animate the portrait continuously or allow ornaments to intercept pointer events.

## Acceptance criteria

- The edition is recognizable without reading its name.
- At least five product zones share the theme language.
- All displayed actions are real or explicitly marked prototype-only.
- Portrait and decoration never reduce composer, code, diff, approval, or error readability.
- The design still works when theme images fail to load.
- Wide and narrow screenshots have been inspected.
- Asset provenance and any licensing limitation are reported.
