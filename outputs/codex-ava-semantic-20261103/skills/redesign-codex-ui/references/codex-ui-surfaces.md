# Codex UI Surfaces

Treat this as a verification map, not a fixed architecture. Confirm which surfaces exist in the target repository.

## Product invariants

- Keep the current task and workspace identity legible.
- Preserve navigation between tasks and any create/search/filter actions.
- Preserve chronological conversation reading and clear speaker/tool boundaries.
- Keep code, diffs, terminal output, citations, and structured tool results selectable and readable.
- Keep approval, permission, destructive-action, and error states unmistakable.
- Keep composer submission, cancellation, attachment, mode/model selection, and keyboard behavior intact.
- Preserve streaming, progress, interruption, retry, and completion feedback.
- Keep settings and account controls reachable.

## Surface review

### Application shell

Check resizable panes, min/max widths, sticky regions, safe areas, title bar or window controls, focus order, and persistence of collapsed state.

### Task navigation

Check long names, active and unread states, grouping, search results, empty lists, pinned/archived items, context menus, and keyboard selection.

### Conversation

Check prose width, headings, lists, tables, links, images, citations, code, tool calls, progress messages, timestamps, and very long content. Keep semantic hierarchy stronger than decorative card boundaries.

### Composer

Check empty, multiline, attachment, disabled, streaming, and error states. Keep the primary submit/stop action stable as content grows. Do not let decorative chrome reduce the usable input area.

### Code, diff, and terminal

Use a legible monospace stack and preserve whitespace. Test horizontal overflow, line numbers, additions/deletions, ANSI colors, selection, copy actions, and high-contrast themes.

### Approvals and risky actions

Do not encode risk through color alone. Keep scope, consequence, and available actions explicit. Preserve confirmation and cancellation semantics.

### Responsive behavior

Prioritize conversation and composer on narrow screens. Convert secondary panes to drawers or overlays only if focus trapping, dismissal, scroll locking, and state restoration work correctly.
