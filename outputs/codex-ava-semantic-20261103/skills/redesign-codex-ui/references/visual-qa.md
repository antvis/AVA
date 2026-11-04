# Visual QA Rubric

## Composition

- Does the first glance reveal the current task, main content, and next action?
- Are pane widths and content measure appropriate for both prose and code?
- Does the hierarchy remain clear without relying on excessive borders or cards?
- Do dense and sparse states feel designed by the same system?

## Fidelity to the brief

- Can every prominent visual decision be traced to the reference, persona, style, or product constraint?
- Are deviations from the reference intentional and explained?
- Is the result original rather than a collage of fashionable effects?

## Component quality

- Are tokens used consistently for spacing, color, radius, type, and motion?
- Are hover, focus-visible, pressed, selected, disabled, loading, and error states present?
- Do icons share size, stroke, alignment, and optical weight?
- Do long labels, localization, and dynamic content remain intact?

## Codex content stress test

- Long task and workspace names
- Long markdown with nested lists, tables, quotes, and links
- Wide code, large diffs, terminal ANSI output, and streaming logs
- Multiple consecutive tool calls and approval prompts
- Empty, loading, interrupted, failed, and completed tasks
- Composer with multiline text and several attachments

## Personal and portrait-led themes

- Confirm the result changes identity, navigation, hero, quick actions, composer, and supporting states—not only colors.
- Check portrait focal points at every supported width.
- Check signatures, stamps, stickers, Polaroids, and line art for clipping and accidental pointer interception.
- Disable theme images and confirm useful fallbacks and readable layout.
- Confirm decorative layers never cover code, diffs, approvals, errors, menus, or the composer.
- Confirm user-supplied names and localized labels handle longer text.
- Record asset provenance and licensing constraints.

## Responsive and window behavior

- Test repository-supported breakpoints and at least one narrow width.
- Resize continuously to catch intermediate collisions.
- Check sticky headers, composer position, nested scrolling, drawers, and overlays.
- Check zoom at 200% when feasible.

## Accessibility

- Navigate all primary actions with the keyboard.
- Keep focus visible against every surface.
- Preserve semantic labels and logical focus order.
- Meet WCAG AA contrast for normal text and meaningful UI graphics where practical.
- Respect reduced motion and avoid essential information conveyed only by animation.
- Do not rely on color alone for selection, errors, diffs, or approvals.

## Runtime quality

- No new console errors, hydration warnings, missing keys, or broken asset requests.
- No layout shift caused by late fonts or icons beyond accepted baseline behavior.
- No regressions in scrolling, text selection, copy, drag, resize, or shortcut behavior.

Capture screenshots after the app reaches a stable state. Compare the same data and viewport when judging before/after changes.
