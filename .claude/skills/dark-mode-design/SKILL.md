---
name: dark-mode-design
description: Use when implementing, converting to, or fixing dark mode interfaces. Covers dark surface elevation, color adaptation, theme switching, and avoiding dark mode anti-patterns that create eye strain or look like generic AI output.
---

This skill guides creation of sophisticated, production-grade dark mode interfaces that go beyond simple color inversion. Dark mode done right reduces eye strain, saves battery on OLED, and creates a premium aesthetic. Dark mode done wrong creates a murky, low-contrast mess or a neon-soaked AI cliche.

## Design Direction

Dark mode is NOT inverted light mode. It requires fundamentally different design decisions:

- **Depth model reverses**: Light mode uses shadows for elevation. Dark mode uses lighter surfaces.
- **Color behavior changes**: Accents must desaturate. Text weight must decrease. Contrast rules shift.
- **Visual weight redistributes**: Elements that receded in light mode may dominate in dark mode.
- **User context differs**: Dark mode users are often in low-light environments where eye strain sensitivity is higher.

**CRITICAL**: Every dark mode decision should be intentional. If your dark mode looks like `filter: invert(1)` applied to light mode, start over.

## Dark Mode Color Principles
> *Consult [color science reference](reference/color-science.md) for OKLCH dark palettes, surface elevation, and accent adaptation.*

Build depth through surface lightness, not shadows. Use 3-5 surface levels that increase in lightness.

**DO**: Use dark gray surfaces (oklch 12-20%), never pure black (#000)
**DO**: Desaturate accent colors 15-25% for dark mode—full saturation on dark backgrounds causes visual vibration
**DO**: Reduce text font-weight by 50-100 units in dark mode—light-on-dark text appears heavier than it is
**DO**: Tint your dark surfaces toward your brand hue (even oklch chroma of 0.005-0.01 adds cohesion)
**DON'T**: Use pure black (#000000) backgrounds—infinite contrast causes halation and eye strain, especially for users with astigmatism (~50% of population)
**DON'T**: Keep light mode accent colors at full saturation—they'll glow and bleed on dark surfaces
**DON'T**: Use the "dark mode = neon accents on black" aesthetic—it's the #1 dark mode AI slop tell
**DON'T**: Use colored shadows or drop shadows in dark mode—shadows are invisible on dark backgrounds, use lighter surfaces for elevation
**DON'T**: Use the same border colors as light mode—borders need to be lighter than surfaces, or replaced by elevation differences

## Surface Elevation System
> *Consult [color science reference](reference/color-science.md) for complete elevation scale and tinting.*

Replace shadow-based depth with surface lightness:

| Level | Purpose | Lightness (OKLCH) |
|-------|---------|-------------------|
| Base/Canvas | Page background | 10-13% |
| Surface 1 | Cards, containers | 15-18% |
| Surface 2 | Elevated elements, drawers | 20-23% |
| Surface 3 | Modals, popovers, tooltips | 25-28% |
| Surface 4 | Active/selected states | 28-32% |

**Key insight**: Each level should be 3-5% lightness apart. Smaller steps are imperceptible; larger steps create visual discontinuity.

## Theme Architecture
> *Consult [implementation reference](reference/implementation.md) for CSS patterns, React/framework integration, and system preference detection.*

Use semantic design tokens with two layers:
- **Primitive layer**: Raw color values (unchanging across themes)
- **Semantic layer**: Role-based tokens that remap per theme

**DO**: Detect system preference with `prefers-color-scheme` as default
**DO**: Allow manual override stored in localStorage
**DO**: Transition theme changes smoothly (200-300ms on backgrounds, instant on text)
**DO**: Use `color-scheme: dark` on `<html>` to inform browser UI (scrollbars, form controls)
**DON'T**: Flash wrong theme on load (FART—Flash of inAccurate coloR Theme)—use blocking script or server hint
**DON'T**: Animate every element during theme switch—transition only backgrounds and surfaces
**DON'T**: Force dark mode on users who prefer light—always respect system preference as default

## Component Adaptation
> *Consult [component patterns reference](reference/component-patterns.md) for specific UI element guidance.*

Different components need different dark mode treatment:

**DO**: Adjust image brightness/contrast for dark contexts (CSS filter or semi-transparent overlay)
**DO**: Swap or adapt illustrations that have light backgrounds baked in
**DO**: Use `outline` or lighter borders instead of shadows for card separation
**DO**: Reduce opacity of decorative elements that compete with content
**DON'T**: Use the same images unchanged—bright images on dark surfaces create harsh, jarring contrast
**DON'T**: Keep light-mode illustrations with white backgrounds—they look like broken thumbnails
**DON'T**: Use colored text on dark backgrounds without rechecking contrast—colors that passed on white often fail on dark gray

## Accessibility
> *Consult [accessibility reference](reference/accessibility.md) for contrast testing, reduced brightness, and OLED considerations.*

**DO**: Retest all text against WCAG AA (4.5:1 body, 3:1 large) on actual dark surfaces—don't assume light mode ratios hold
**DO**: Increase line-height by 0.05-0.1 for dark mode—perceived text weight is lighter so text needs more breathing room
**DO**: Ensure focus indicators are visible on dark backgrounds (light outlines, not dark ones)
**DO**: Test on real OLED screens—true black pixels affect color perception at edges
**DON'T**: Use thin font weights (100-200) in dark mode—halation makes them unreadable
**DON'T**: Rely on shadows for focus indication—they vanish on dark surfaces

---

## The Dark Mode Slop Test

**Quality check**: Does your dark mode look like every other "dark theme" generated by AI in 2024-2025?

Common dark mode AI slop tells:
- Pure black background with cyan or purple neon accents
- Gradient text glowing on dark surfaces
- Glassmorphism cards with blur and glow borders
- Every accent color cranked to maximum saturation
- Generic charcoal gray with zero brand personality
- Same layout as light mode, just darker—no adaptation of visual hierarchy, elevation, or image treatment
- Colored shadows that make no physical sense on dark backgrounds

**The test**: If you put this dark mode next to a random AI-generated dark dashboard, would someone be able to tell them apart? If not, you've failed. A distinctive dark mode should feel purposefully designed for darkness, not converted from light.

---

## Implementation Principles

Dark mode requires more design decisions than light mode, not fewer. The reduced color range means every choice carries more weight. Small differences in surface elevation, accent saturation, and text weight compound into either a sophisticated experience or a generic one.

Test in actual dark environments. A dark mode that looks good in a bright office may wash out in a dark room. And vice versa—one that feels moody and sophisticated at night may look muddy under fluorescent lights.

Interpret the mood: dark mode can be warm and cozy (amber-tinted surfaces), cool and professional (blue-tinted surfaces), or rich and luxurious (deep plum or emerald tints). Choose a personality and commit.

Remember: Dark mode is a first-class design, not an afterthought filter.
