# Dark Mode Color Science

## Why Not Pure Black

Pure black (#000000, oklch(0% 0 0)) creates real problems:

- **Halation**: Bright text on pure black causes light to "bleed" around letterforms for users with astigmatism (~50% of population). The iris opens wider in dark environments, increasing optical aberrations.
- **Excessive contrast**: 21:1 contrast (white on black) is NOT better—it causes eye fatigue faster than 15:1. Your eyes constantly adjust between extremes.
- **Unnatural**: Nothing in nature is pure black. Real dark surfaces always reflect some light, even deep space photographs show faint background glow.
- **OLED smearing**: On OLED displays, pure black pixels turn off completely. Scrolling bright text over pure black causes visible smearing as pixels reactivate.

**The sweet spot**: oklch(12-15% 0.005-0.01 [brand-hue]) for base surfaces.

## Building a Dark Surface Scale

### The Elevation-As-Lightness System

In light mode, elevation = shadow (floating elements cast shadows on lower surfaces).
In dark mode, elevation = lightness (higher elements are lighter).

```css
:root[data-theme="dark"] {
  /* Base canvas — the darkest surface */
  --surface-base: oklch(12% 0.01 250);

  /* Level 1 — cards, primary containers */
  --surface-1: oklch(16% 0.01 250);

  /* Level 2 — overlays on cards, nested containers */
  --surface-2: oklch(20% 0.01 250);

  /* Level 3 — modals, dialogs, popovers */
  --surface-3: oklch(24% 0.01 250);

  /* Level 4 — tooltips, highest elevation */
  --surface-4: oklch(28% 0.01 250);
}
```

**Key rule**: Steps should be 3-5% lightness apart. Smaller steps are imperceptible; larger steps create discontinuity.

### Brand-Tinted Surfaces

Every surface should carry a hint of your brand hue (chroma 0.005-0.015):

```css
/* Cold tech brand (blue tint) */
--surface-base: oklch(13% 0.01 250);

/* Warm creative brand (orange/amber tint) */
--surface-base: oklch(13% 0.01 60);

/* Earthy natural brand (green tint) */
--surface-base: oklch(13% 0.008 160);

/* Luxury brand (deep plum tint) */
--surface-base: oklch(13% 0.01 320);

/* Neutral professional (very low chroma) */
--surface-base: oklch(13% 0.005 250);
```

The tint is nearly invisible consciously but creates subliminal cohesion with your brand color.

### Hover and Active States

On dark surfaces, hover states ADD lightness:

```css
/* On surface-1 (16% lightness) */
.card:hover {
  background: oklch(20% 0.01 250); /* +4% lightness */
}

.card:active {
  background: oklch(14% 0.01 250); /* -2% lightness (pressed feel) */
}

/* Or use color-mix for relative adjustments */
.card:hover {
  background: color-mix(in oklch, var(--surface-1), white 8%);
}
```

## Adapting Colors for Dark Mode

### Accent Color Desaturation

Full-saturation colors vibrate on dark backgrounds. Reduce chroma by 15-25%:

```css
/* Light mode accent */
--accent-light: oklch(55% 0.20 250);  /* Full chroma */

/* Dark mode accent — reduce chroma, increase lightness slightly */
--accent-dark: oklch(65% 0.15 250);   /* -0.05 chroma, +10% lightness */
```

**Why**: On a dark background, high chroma creates a "glow" effect where the color appears to bleed beyond its boundaries. Desaturation controls this.

### The Chroma-Lightness Rule

As you move colors onto dark backgrounds, follow this pattern:

| Adjustment | Light Mode → Dark Mode |
|-----------|----------------------|
| **Lightness** | Increase 5-15% (colors need to be brighter to maintain visual weight) |
| **Chroma** | Decrease 15-25% (high saturation vibrates on dark) |
| **Hue** | Usually stays the same (shift only for accessibility) |

### Text Colors

Never use pure white (#fff) for body text:

```css
/* ❌ Pure white — harsh, causes eye fatigue */
--text-primary: oklch(100% 0 0);

/* ✅ Off-white — slightly reduced, tinted toward brand */
--text-primary: oklch(90% 0.01 250);

/* Secondary text */
--text-secondary: oklch(70% 0.01 250);

/* Disabled/tertiary text */
--text-tertiary: oklch(50% 0.01 250);
```

**Critical**: Reduce font weight by 50-100 units in dark mode. Light text on dark backgrounds appears optically heavier.

```css
:root[data-theme="dark"] {
  --body-weight: 350;    /* Instead of 400 */
  --heading-weight: 600; /* Instead of 700 */
}
```

### Semantic Colors

Standard semantic colors need dark mode adjustment:

| State | Adjustment | Why |
|-------|-----------|-----|
| **Success (green)** | +15% lightness, -0.03 chroma | Greens appear darker on dark backgrounds |
| **Error (red)** | +10% lightness, -0.04 chroma | Saturated red is aggressive on dark |
| **Warning (amber)** | -5% lightness, -0.02 chroma | Amber is already light; tone it down |
| **Info (blue)** | +10% lightness, -0.03 chroma | Blues recede on dark; boost lightness |

```css
:root[data-theme="dark"] {
  --color-success: oklch(60% 0.12 145); /* vs 45% 0.15 in light */
  --color-error: oklch(60% 0.14 25);    /* vs 50% 0.18 in light */
  --color-warning: oklch(65% 0.13 80);  /* vs 70% 0.15 in light */
  --color-info: oklch(65% 0.12 250);    /* vs 55% 0.15 in light */
}
```

## The 60-30-10 Rule in Dark Mode

In dark mode, the ratio shifts:
- **60%**: Dark surfaces (base and elevation surfaces)
- **30%**: Text colors (primary, secondary, tertiary)
- **10%**: Accent colors (even LESS than light mode—accents are more powerful on dark)

**Common mistake**: Using accent colors everywhere because "the interface feels too dark." Resist this. The dark negative space IS the design. Accents work because they're rare.

## Borders in Dark Mode

In light mode, borders are darker than surfaces. In dark mode, borders are lighter:

```css
/* Light mode border */
--border-light: oklch(85% 0.01 250);

/* Dark mode border — lighter than surface */
--border-dark: oklch(25% 0.01 250); /* Against 16% surface */

/* Subtle separator (lower contrast) */
--border-subtle: oklch(20% 0.01 250);
```

**Better approach**: Use surface elevation differences instead of borders. A card at surface-1 on surface-base doesn't need a border—the lightness difference IS the boundary. Fewer borders = cleaner dark mode.

## Gradient Treatment

Gradients need special handling in dark mode:

- Reduce overall lightness significantly
- Narrow the range between stops (less contrast)
- Reduce chroma (gradients amplify saturation on dark)
- Avoid gradients that create bright spots—they draw disproportionate attention

```css
/* Light mode */
--gradient-hero: linear-gradient(
  135deg,
  oklch(55% 0.15 250),
  oklch(60% 0.12 300)
);

/* Dark mode — lower lightness, lower chroma, narrower range */
--gradient-hero: linear-gradient(
  135deg,
  oklch(30% 0.08 250),
  oklch(35% 0.06 300)
);
```

---

**Avoid**: Pure black backgrounds. Full-saturation accents. Pure white text. Same border colors as light mode. Shadows for depth (use surface lightness). Treating dark mode as a filter over light mode.
