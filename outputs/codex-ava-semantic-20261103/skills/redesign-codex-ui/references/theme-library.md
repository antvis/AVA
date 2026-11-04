# Theme Library

Use the bundled library as a set of design archetypes, not finished celebrity products. Each preset contains original styling rules and placeholder asset slots; the implementation still requires user-approved identity content.

## Select a preset

Score the request on six axes:

| Axis | Low end | High end |
| --- | --- | --- |
| Identity intensity | Subtle monogram | Portrait-led edition |
| Decoration | Minimal | Collectible collage |
| Density | Focused | Information-rich |
| Contrast | Soft | Dramatic |
| Material | Digital/system | Paper/tactile |
| Energy | Quiet | Performative |

Choose the closest primary preset:

- `keepsake-olive`: warm portrait-led scrapbook; closest to the supplied cream-and-olive fan edition.
- `midnight-stage`: dramatic concert, performance, or fan-club edition.
- `editorial-muse`: fashion, photography, magazine, or refined creator edition.
- `pixel-companion`: virtual idol, game character, mascot, or playful digital companion.
- `storybook-garden`: soft fictional character, fantasy, healing, or illustrated IP.
- `quiet-monogram`: founder, author, consultant, or understated personal brand.
- `red-carpet-noir`: actor, premiere, award-season, or luxury cinematic edition.
- `cinema-contact-sheet`: actor, director, filmography, or analog production archive.
- `vinyl-archive`: musician, album, discography, or tactile retro music edition.
- `celestial-fanclub`: idol, fan-club, luminous constellation, or dreamy community edition.

Prefer one clear archetype. If necessary, borrow exactly one feature family from a second preset, such as `keepsake-olive` media layering with `quiet-monogram` typography.

## Customize in order

1. Replace identity, edition name, greeting, and microcopy.
2. Register asset sources and licenses in `assetPolicy.provenance`.
3. Adjust media slots and focal points around supplied assets.
4. Tune palette while preserving semantic contrast.
5. Map quick actions, navigation labels, and projects to real Codex behavior.
6. Tune decoration and motion last.
7. Verify desktop, narrow, missing-media, and reduced-motion states.

Store reusable identity settings separately with `identity-profile.template.json`. This allows one identity to use several skins without duplicating personal copy, collections, milestones, rights, and privacy rules. Select decoration identifiers from `motifs.json` so ornament behavior stays consistent across presets.

Do not change layout and decoration simultaneously before the real assets are available; portrait crop and text placement depend on media composition.

## Library contract

Every preset must provide:

- `schemaVersion`, `id`, `label`, `category`, `tags`, and `derivedFrom`;
- identity intensity, design thesis, mood, and forbidden motifs;
- layout archetype, hero treatment, navigation treatment, and composer treatment;
- complete theme palette and typography roles;
- shape, elevation, decoration, and motion rules;
- media slots with focal point and fallback behavior;
- quick actions mapped to `explore`, `build`, `review`, and `fix`;
- narrow-width and missing-media behavior;
- asset provenance policy and accessibility constraints.

Run `scripts/validate_theme_library.py` after changes. The validator checks the catalog, identifiers, required fields, colors, action mappings, file paths, and preset uniqueness. It does not replace rendered visual QA.

## Separate identity from skin

Use the identity profile for:

- display name, edition naming, preferred address, and language;
- tone, greeting patterns, vocabulary, and disallowed impersonation;
- themed project groups, collections, rituals, and milestones;
- portrait, avatar, signature, logo, and memorabilia provenance;
- privacy, attribution, commercial-use, and publishing rules.

Use the skin preset for layout, palette, typography, shape, decoration, motion, media placement, and responsive behavior. Do not embed sensitive personal facts in a public preset.

## Add a new preset

Create a preset only when it introduces a meaningfully different hierarchy or material language. A new accent color alone is a variant, not a new archetype.

1. Copy the closest preset.
2. Assign a lowercase hyphenated `id` and matching filename.
3. Change the design thesis, layout or material logic, not only the palette.
4. Add the entry to `catalog.json`.
5. Run the validator.
6. Render a representative wide and narrow screen before accepting it into the library.
