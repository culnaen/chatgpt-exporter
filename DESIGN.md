# ChatGPT Exporter Design System

## 1. Atmosphere & Identity

ChatGPT Exporter should feel native to the ChatGPT shell: quiet, compact, and immediately understandable. Its signature is contextual utility: controls appear beside the content they affect, use the host application's light/dark surfaces, and disappear when the task is complete.

## 2. Color

| Role | Token | Light | Dark | Usage |
|---|---|---|---|---|
| Text/primary | `--ce-text-primary` | `#0d0d0d` | `#ececec` | Labels and controls |
| Surface/menu | `--ce-menu-primary` | `#ffffff` | `#2a2a2a` | Menus and contextual toolbar |
| Surface/secondary | `--ce-menu-secondary` | `#ececec` | `#212121` | Hover and secondary surfaces |
| Border/default | `--ce-border-light` | `rgba(13, 13, 13, 0.15)` | `rgba(255, 255, 255, 0.15)` | Cards and controls |
| Accent/selection | `--ce-selection-accent` | `rgb(28, 100, 242)` | `rgb(144, 202, 249)` | Selected messages and primary selection action |
| Accent/on-selection | `--ce-selection-on-accent` | `#ffffff` | `#0d0d0d` | Icons and text on the accent |
| Selection/surface | `--ce-selection-surface` | `rgba(28, 100, 242, 0.08)` | `rgba(144, 202, 249, 0.10)` | Selected message row |

Accent color is reserved for selected state, focus, and the primary action. Host ChatGPT variables are preferred when available; the documented values are stable fallbacks.

## 3. Typography

The userscript inherits ChatGPT's system font stack. Default body and control text is `16px/1.5`; compact contextual labels use `14px/1.4`. Weight `600` is reserved for selected counts and primary actions. No additional font is loaded.

## 4. Spacing & Layout

Spacing uses a 4px base unit.

| Token | Value | Usage |
|---|---|---|
| `--ce-space-1` | `4px` | Tight icon alignment |
| `--ce-space-2` | `8px` | Inline control gap |
| `--ce-space-3` | `12px` | Compact padding |
| `--ce-space-4` | `16px` | Standard control spacing |
| `--ce-space-6` | `24px` | Message marker offset |

The contextual toolbar is centered in the viewport, stays above the composer and safe-area inset, and becomes a single compact row within the mobile viewport. Message markers align with ChatGPT's centered conversation column and fall back to the viewport gutter on narrow screens.

## 5. Components

### Export Menu Item

- **Structure**: icon, localized label, optional progress/success replacement.
- **States**: default, hover, focus, loading, success, disabled.
- **Accessibility**: action has an accessible name and disabled actions do not run.
- **Motion**: color transitions use the existing 200ms menu timing.

### Message Selection Marker

- **Structure**: native `button` containing a circle/check SVG, attached to one conversation turn.
- **States**: hidden outside selection mode; unselected, hover, focus-visible, selected.
- **Accessibility**: 36px visual control with a 44px mobile target, localized `aria-label`, and `aria-pressed` state; keyboard activation uses native button behavior.
- **Motion**: opacity and transform communicate entry and selection in 150ms; disabled under `prefers-reduced-motion`.
- **Layout**: absolutely positioned relative to the full-width conversation turn.

### Message Selection Toolbar

- **Structure**: selected-count status, Cancel button, primary Export-selected button.
- **States**: active, export-disabled when the selection is empty, focus-visible, hover, pressed.
- **Accessibility**: `role="toolbar"`, live count announcement, native buttons, visible focus, and labels that do not rely on icons.
- **Motion**: toolbar enters with opacity and vertical transform over 200ms; reduced-motion users receive the settled state immediately.
- **Layout**: fixed centered cluster; mobile width is constrained to the viewport gutter and labels may wrap without horizontal overflow.

## 6. Motion & Interaction

Micro state changes use 150ms ease-out; menu and toolbar transitions use 200ms ease-in-out. Only opacity and transform animate. Selection mode starts explicitly from the export menu, every chosen row receives both a marker and a tonal highlight, and successful export clears the contextual selection. `prefers-reduced-motion: reduce` disables non-essential transitions.

## 7. Depth & Surface

The project uses a mixed strategy inherited from the existing UI: subtle borders separate controls, while elevated menu and toolbar surfaces use the existing `ce-card` shadow recipe. Selected conversation rows use tonal shift rather than an additional border or shadow.

## 8. Accessibility Constraints & Accepted Debt

Target WCAG 2.2 AA. All new actions require keyboard reachability, visible focus, a minimum 44px mobile touch target, readable selected-state contrast in light and dark modes, and no reliance on color alone. The selected-count status is announced politely. No new accessibility debt is accepted for this feature.
