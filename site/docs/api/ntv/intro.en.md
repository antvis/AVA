---
title: NarrativeTextVis
order: 1
---

`NarrativeTextVis` is a react component to render [ntv-schema](../../guide/ntv/ntv-schema.zh.md)。

## Props

| Props         | type               | description                | default         |
| ------------ | ------------------- | -------------------- | --------------- |
| spec         | `NarrativeTextSpec`             | data             | -              |
| size         | 'normal' \| 'small'    | font size, normal is 14px, small is 12px           | 'normal'              |
| theme         | 'light' \| 'dark'    | theme color, current support light mode and dark mode        | 'light'              |
| entityStyle         |  `EntityStyle`   | entity style configuration          |                       |            |
| showCollapse         | boolean \| CollapseConfig    |     Paragraph collapsible configuration      | false              |

```typescript
type CollapseConfig = {
  /** show level line  */
  showBulletsLine?: boolean;
  /** custom switcher icon */
  switcherIcon?: (collapsed: boolean) => ReactNode;
  /** controlled collapsed keys */
  collapsedKeys?: string[];
  /** collapse key change event */
  onCollapsed?: (collapsedKeys: string[]) => void;
};
```
