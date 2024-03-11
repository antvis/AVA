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
| palette         |  `PaletteConfig`   | palette configuration          |                       |            |
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

```typescript
type PaletteConfig = Partial<
  Record<'light'|'dark', Partial<
    Record<
      EntityType | 'text', {
        /** color */ 
        color: string, 
        /** Compare the indicator with the assessment attribute value of 'positive'. The color Settings are displayed */ 
        positiveColor: string;
        /** Compare the indicator with the assessment attribute value of 'negative'. The color Settings are displayed */ 
        negativeColor: string;
      }
    >
  >>
>;
```
