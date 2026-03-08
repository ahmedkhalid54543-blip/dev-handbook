---
name: darken
description: Convert an existing light-mode design to a production-grade dark mode. Applies proper surface elevation, color desaturation, and component adaptation — not simple inversion.
args:
  - name: target
    description: The feature, component, or page to convert to dark mode (optional)
    required: false
---

Convert an existing light-mode interface to a high-quality dark mode implementation. This is NOT color inversion — it requires rethinking depth, color, typography, and state communication.

## MANDATORY PREPARATION

### Context Gathering (Do This First)

You cannot build great dark mode without understanding:
- **Brand colors**: What's the primary brand hue? (needed for surface tinting)
- **Target audience**: Professional tool? Consumer app? Content-heavy?
- **Deployment context**: Is this web (CSS), native (SwiftUI/Android), or hybrid?
- **Existing tokens**: Does the codebase use design tokens or hard-coded colors?

Attempt to gather these from the current thread or codebase.

1. If you don't find exact information and have to infer, you MUST STOP and call the AskUserQuestionTool to confirm your inference.
2. Otherwise, if your level of confidence is medium or lower, you MUST STOP and call the AskUserQuestionTool with clarifying questions.

Do NOT proceed until you have answers. Guessing leads to generic dark mode slop.

### Use dark-mode-design skill

Use the dark-mode-design skill for design principles and anti-patterns. Do NOT proceed until it has executed and you know all DO's and DON'Ts.

---

## Audit Current Light Mode

Before converting, understand what you're working with:

1. **Inventory all colors**: Background, surface, text, accent, border, state, and semantic colors
2. **Map the depth model**: How is elevation communicated? (Shadows? Borders? Background shading?)
3. **Identify components that need special treatment**: Images, illustrations, charts, forms, third-party embeds
4. **Check for hard-coded values**: Colors not using tokens will need manual conversion

## Build the Dark Surface Scale

The foundation of good dark mode is the surface elevation system. Create 4-5 surface levels:

1. **Base/Canvas** (darkest) — Page background, 10-13% lightness
2. **Surface 1** — Cards, primary containers, 15-18% lightness
3. **Surface 2** — Elevated elements, drawers, 20-23% lightness
4. **Surface 3** — Modals, popovers, tooltips, 25-28% lightness
5. **Surface 4** — Active/selected states, 28-32% lightness

**Critical**: Steps should be 3-5% lightness apart. Tint all surfaces toward the brand hue (even minimal chroma adds subliminal cohesion).

## Adapt Colors

### Accent Colors
- Reduce saturation/chroma by 15-25%
- Increase lightness by 5-15% to maintain visual weight on dark backgrounds
- Brand accent can retain closer-to-original saturation for 1-2 high-emphasis uses only

### Text Colors
- Primary text: off-white (~90% lightness), never pure white
- Secondary text: ~65-70% lightness
- Tertiary/disabled: ~50% lightness
- Tint text toward brand hue for cohesion
- Reduce font weight by 50-100 units (light-on-dark appears heavier)

### Semantic Colors
- Success, error, warning, info all need desaturation and lightness adjustment
- Error red: shift slightly toward pink/salmon in dark mode (don't just lighten)
- Always combine semantic color with an icon (never color alone)

### Borders
- Borders must be LIGHTER than their surface (opposite of light mode)
- Prefer surface elevation differences over borders where possible
- Form inputs still need explicit borders for usability

## Adapt Components

Consult the [component patterns reference](reference/component-patterns.md) and address each:

- **Images**: Add scrims, borders, or brightness adjustment
- **Illustrations**: Swap to dark variants or adapt with blend modes
- **Icons**: Ensure light-colored with 3:1 contrast
- **Interactive states**: Hover adds lightness, active reduces it, focus uses light rings
- **Shadows**: Reduce dramatically — surface elevation does the work
- **Charts**: Desaturate colors, lighten gridlines, retest labels
- **Forms**: Set `color-scheme: dark`, ensure input boundaries are visible
- **Third-party embeds**: Check for dark mode parameters

## Implement Theme Architecture

### Token Strategy
- Define semantic tokens that remap between light and dark
- Components reference ONLY semantic tokens, never primitives directly
- Only the semantic layer changes between themes

### System Preference
- Detect with `prefers-color-scheme` as default
- Allow manual override (three-state: Light / Dark / System)
- Persist preference across sessions
- Listen for system preference changes

### Prevent FART
- Use blocking inline script in `<head>` before stylesheets
- OR server-side rendering with theme from cookie
- Disable transitions during initial load

### Theme Transition
- Transition backgrounds: 200-300ms ease-out
- Do NOT transition text color (disrupts reading)

## Verify Dark Mode Quality

### Contrast Check
- Test ALL text against WCAG AA on actual dark surfaces (don't assume light mode ratios hold)
- Test focus indicators on every surface level
- Test disabled states (should be perceivable but low contrast per WCAG 2.1)

### Visual Check
- Toggle light/dark rapidly — no flash, no stale tokens, no un-themed elements
- Check in actual dark environments (not just a bright office)
- Test on real OLED screens (pure black artifacts, color shifts at low lightness)
- Verify images, illustrations, and media don't create harsh light holes

### The Dark Mode Slop Test
Would someone mistake this for generic AI dark mode? Check for:
- Pure black background with neon accents
- Glassmorphism cards with glow borders
- Full-saturation colors on dark surfaces
- Same layout as light mode with zero adaptation
- No brand personality in the surfaces

If any of these are present, go back and fix. Dark mode should feel purposefully designed for darkness, not filtered from light.

**NEVER**:
- Invert colors (this is not how dark mode works)
- Use pure black (#000) backgrounds
- Keep full-saturation accents from light mode
- Use pure white (#FFF) for body text
- Keep the same border colors as light mode
- Use shadows as the primary depth mechanism
- Skip contrast retesting ("it passed in light mode")
- Forget `color-scheme: dark` for browser UI
- Ship without testing in actual low-light environments

Remember: Dark mode requires MORE design decisions than light mode, not fewer. The reduced color range means every choice carries more weight. Small differences in surface elevation, accent saturation, and text weight compound into either a sophisticated experience or a generic one.
