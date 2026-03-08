# Dark Mode Component Patterns

How specific UI elements adapt for dark mode. Every component category needs deliberate treatment — what works in light mode often fails silently in dark.

## Images & Media

Photographs and rich media appear dramatically brighter on dark backgrounds, creating harsh visual contrast that dominates the layout.

### Strategies

- **Semi-transparent scrim**: Overlay `rgba(0,0,0,0.08-0.15)` to reduce brightness without crushing detail
- **CSS filter**: Apply `brightness(0.85) contrast(1.05)` in dark mode for subtle toning
- **Toned borders**: Wrap images in a subtle border matching the surface elevation to contain them visually
- **Clear containment**: Images should integrate into the dark layout, not punch holes of light through it

### Illustrations

Illustrations with baked-in white or light backgrounds look like broken thumbnails on dark surfaces. Solutions:
- Provide dark-variant illustrations (best quality)
- Use transparent-background illustrations
- Apply CSS `mix-blend-mode` to blend illustration edges
- As a last resort, darken with filters — but this degrades quality

### Icons

- Use light-colored icons with sufficient contrast against dark surfaces (minimum 3:1 per WCAG)
- Desaturate colored icons to match the overall dark palette
- Test icon visibility at small sizes — fine details disappear on dark backgrounds
- Avoid filled icons with bright colors; prefer outlined or monochrome icons

## Interactive States

Every interactive state behaves differently on dark surfaces. The light-mode mental model (hover = darken, press = darken more) reverses.

| State | Dark Mode Treatment |
|-------|-------------------|
| **Default** | Resting surface elevation |
| **Hover** | Add 3-5% lightness to surface |
| **Active/Pressed** | Reduce lightness 2% (brief dip below default) |
| **Focus** | Light-colored outline or ring (NOT dark blue — invisible on dark) |
| **Disabled** | Reduced opacity; intentionally fails WCAG contrast per 2.1 spec |
| **Error** | Desaturated error color (red shifts toward salmon/pink); pair with icon |
| **Selected** | Lighter surface + subtle brand-tinted overlay |

### Focus Indicators (Critical)

The standard dark blue focus ring used in light mode is completely invisible on dark backgrounds. This is one of the most commonly missed dark mode bugs.

- Use light-colored focus rings (off-white, light brand color)
- Ensure focus indicators meet 3:1 contrast against the dark surface
- Test keyboard navigation in dark mode specifically — tab through every interactive element
- Never rely on shadows for focus indication (shadows vanish on dark surfaces)

## Borders & Dividers

In light mode, borders are darker than surfaces. In dark mode, this relationship inverts.

### Principles

- Borders must be LIGHTER than the surface they sit on
- Use 8-12% lightness above the surface level for standard borders
- Use 4-6% lightness above for subtle separators/dividers
- Primary, secondary, and tertiary border levels with progressively lighter values

### Better Alternative: Elevation as Boundary

Prefer surface elevation differences over borders. A card at one elevation level sitting on a lower elevation doesn't need a border — the lightness difference IS the boundary. Fewer borders = cleaner dark mode.

When borders are necessary:
- Form inputs need clear boundaries (users must know where to type)
- Tables and data grids need cell separation
- Grouped controls need visible containment

## Forms & Inputs

Form controls are high-risk in dark mode because browsers draw some elements natively.

- Set `color-scheme: dark` on the root element to inform browser-drawn UI (scrollbars, form controls, date pickers)
- Custom-styled inputs need explicit dark borders — unfocused inputs vanish on dark surfaces
- Placeholder text needs retesting — light mode placeholders are often too dark to read on dark backgrounds
- Error states: combine desaturated red border + error icon + text (never color alone)

## Cards & Containers

- Use surface elevation (lightness) for card backgrounds, NOT shadows
- Don't add borders unless necessary — elevation difference creates the boundary
- Nested cards: inner card must be at a higher elevation (lighter) than outer card
- Reduce decorative elements that compete with content — dark mode's reduced color range means every element carries more visual weight

## Charts & Data Visualization

- Reduce saturation of chart colors to prevent visual vibration
- Adjust gridlines: lighter than the chart surface, not darker
- Axis labels and values need contrast retesting
- Tooltips should use a higher elevation surface (lighter background)
- Legends: ensure all label + color-swatch pairings remain distinguishable

## Shadows

Shadows behave fundamentally differently in dark mode because the background is already dark.

### Principles

- Shadows provide minimal visual information in dark mode — surface lightness does the heavy lifting
- Don't remove shadows entirely (they still provide subtle depth cues on lighter surfaces)
- Make shadows more subtle: reduce opacity and spread significantly
- Never use colored shadows (physically impossible on dark surfaces)
- Never use light-colored shadows (physically makes no sense)
- Consider replacing shadows with faint outer glows (semi-transparent, ~30% opacity with blur) for specific emphasis only

## Gradients

Gradients amplify saturation on dark backgrounds and can create distracting bright spots.

- Reduce overall lightness significantly
- Narrow the range between gradient stops (less contrast between endpoints)
- Reduce chroma/saturation of gradient colors
- Avoid gradients that create bright hotspots — they draw disproportionate attention in dark contexts
- Test gradients on real OLED screens where color rendering shifts at low lightness values

## Third-Party Embeds

Maps, video players, social embeds, and other third-party content often don't respect dark mode.

- Check if the embed offers a dark mode parameter (Google Maps, YouTube, etc.)
- Wrap embeds in a container with matching elevation to reduce visual disconnection
- If the embed is light-only, consider a subtle border or container treatment to frame it intentionally

---

**Key principle**: Dark mode isn't a CSS filter. Each component category needs deliberate attention because the rules of visual hierarchy, depth, and state communication all shift when the background goes dark.
