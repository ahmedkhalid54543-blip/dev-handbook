# Dark Mode Accessibility

Dark mode introduces unique accessibility challenges. Contrast ratios that passed in light mode may fail in dark mode. Never assume — retest everything.

## WCAG Contrast Requirements (Apply to Both Themes)

| Content Type | AA Minimum | AAA Target |
|-------------|-----------|------------|
| Normal text (<18px / <14px bold) | 4.5:1 | 7:1 |
| Large text (≥18px or ≥14px bold) | 3:1 | 4.5:1 |
| UI components, graphical objects | 3:1 | — |

### The "Maximum Contrast" Myth

21:1 contrast (pure white on pure black) is NOT better. It causes:
- **Eye fatigue**: Eyes constantly adjust between extremes
- **Halation**: Bright text bleeds around letterforms (see below)
- **OLED smearing**: Pure black pixels turn off completely; scrolling bright content causes visible smearing as pixels reactivate

Optimal dark mode contrast: 12:1 to 16:1 for primary text. High enough for readability, low enough to avoid strain.

## Halation

The most important dark-mode-specific accessibility concern. Affects ~50% of adults (anyone with astigmatism).

### What Happens

In dark environments, the iris opens wider. This increased aperture deforms the lens, causing optical aberrations. Bright text on very dark backgrounds appears to "bleed" — letterforms look fuzzy or have a glow/halo around them.

### Mitigation

- Use off-white text, not pure white (reduce lightness to ~90%)
- Use slightly heavier font weights in dark mode (increase by 50-100 units)
- Avoid thin font weights (100-200) entirely in dark mode — they become unreadable
- Use dark gray surfaces, not pure black — this reduces the luminance gap
- Increase line height by 0.05-0.1 to give text more breathing room
- For content-heavy interfaces, always provide a light mode alternative

## Typography Adjustments

Light text on dark backgrounds appears optically heavier than the same weight in light mode. This is a well-documented perceptual effect.

### Weight Adjustments

- Body text: reduce from 400 to ~350 (or use a lighter optical variant)
- Headings: reduce from 700 to ~600
- Never use weights below 300 in dark mode
- Increase letter-spacing slightly for body text to compensate for perceived heaviness

### Line Height

Increase line-height by 0.05-0.1 in dark mode. The perceived lighter optical weight means text needs more breathing room for comfortable readability on dark surfaces.

### Size Minimums

Thin, small text becomes critically hard to read on dark backgrounds. Enforce:
- Body text: 16px minimum (even more important than in light mode)
- Caption/small text: 12px absolute minimum, prefer 14px
- Labels: ensure sufficient weight at small sizes

## Color-Only Information

Never rely on color alone to communicate state — this is a WCAG requirement in both modes, but dark mode makes it worse because desaturated dark-mode colors are harder to distinguish from each other.

- Pair status colors with icons (checkmark for success, X for error, triangle for warning)
- Use labels alongside color indicators
- Add patterns or shapes as secondary identifiers in charts and data visualization
- Test with color blindness simulators on the dark mode palette specifically

## Focus Indicators

One of the most commonly broken things in dark mode.

- Default browser focus rings (dark blue) are invisible on dark backgrounds
- Replace with light-colored outlines that meet 3:1 contrast against the dark surface
- Use `outline` not `box-shadow` for focus — shadows are unreliable on dark surfaces
- Test keyboard-only navigation in dark mode: tab through every interactive element
- Ensure focus is visible on all surface elevation levels (a focus ring visible on the base canvas may be invisible on a surface-3 modal)

## Disabled States

Per WCAG 2.1, disabled elements are explicitly exempt from contrast requirements. This makes sense — low contrast signals "you can't interact with this."

- Reduce opacity to ~40-50% for disabled elements
- This will intentionally fail contrast checks — that's correct behavior
- Never make disabled elements invisible — they should be perceivable but clearly non-interactive

## Motion Sensitivity

Dark interfaces can intensify the perception of motion and animation.

- Respect `prefers-reduced-motion` media query — this is more critical in dark mode
- Theme transition animations should be optional: transition backgrounds smoothly (200-300ms) but never transition text color (disrupts reading)
- Disable all transitions during initial page load to prevent theme flash (FART)
- Animated elements on dark backgrounds are more attention-grabbing — use sparingly

## OLED Considerations

True-black OLED pixels create unique accessibility challenges:

- Pure black pixels turn off completely on OLED displays
- Scrolling bright content over pure black causes visible smearing/ghosting as pixels reactivate
- Color perception shifts at very low lightness values on OLED panels
- Test on real OLED screens — emulators don't reproduce these effects
- Dark gray (12-15% lightness) avoids all OLED artifacts

## Testing Protocol

### Environments

Dark mode behaves differently across lighting conditions. Test in all of these:
- Bright sunlight / outdoor
- Standard office lighting
- Dim room / evening
- Complete darkness

### Devices

- Real OLED screen (colors and blacks render differently than LCD)
- Low-end/cheap display (color reproduction varies dramatically)
- Mobile, tablet, and desktop
- Different browsers (they render dark mode form controls differently)

### Tools

- Run contrast checker on EVERY text + surface combination in dark mode
- Use color blindness simulators (protanopia, deuteranopia, tritanopia) on the dark palette
- Test with screen readers in dark mode (some announce theme changes)
- Keyboard-only navigation test

### Behavioral Checks

Research suggests verifying real user behavior in dark mode:
- Task completion time (should not increase vs light mode)
- Error rate and mis-taps (dark mode can obscure interactive targets)
- Drop-off in critical flows
- Theme switch timing and frequency (are users switching back to light for reading?)

---

**Key principle**: Dark mode accessibility is NOT a subset of light mode accessibility. It requires independent testing across all contrast ratios, focus indicators, typography weights, and environmental conditions. Assume nothing transfers.
