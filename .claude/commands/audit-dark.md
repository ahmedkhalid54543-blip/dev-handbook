---
name: audit-dark
description: Audit dark mode implementation quality. Identifies contrast failures, missing adaptations, token issues, and dark mode anti-patterns. Generates prioritized report.
args:
  - name: area
    description: The feature or area to audit (optional)
    required: false
---

Run systematic dark-mode-specific quality checks and generate a comprehensive audit report. Don't fix issues — document them for `/darken` or `/theme-toggle` to address.

**First**: Use the dark-mode-design skill for design principles and anti-patterns.

## Diagnostic Scan

Run comprehensive checks across dark-mode-specific dimensions:

### 1. Surface & Depth Model

- **Pure black check**: Is `#000000` or `oklch(0%)` used anywhere as a background? (Critical failure)
- **Elevation system**: Are there distinct surface levels? Can you see depth through lightness differences?
- **Shadow reliance**: Are shadows the primary depth mechanism? (They don't work on dark backgrounds)
- **Brand tinting**: Do dark surfaces carry subtle brand hue, or are they generic neutral gray?
- **Elevation direction**: Are higher-elevation surfaces always lighter? (Violation = broken depth model)

### 2. Color Adaptation

- **Full-saturation accents**: Are light-mode accent colors used at full saturation on dark surfaces? (Causes visual vibration)
- **Desaturation**: Are accents desaturated 15-25% from their light mode values?
- **Pure white text**: Is `#FFFFFF` or `oklch(100%)` used for body text? (Causes halation)
- **Text hierarchy**: Are there distinct primary/secondary/tertiary text levels with descending contrast?
- **Semantic colors**: Are error/success/warning/info colors adjusted for dark mode? (Light mode values often fail contrast)
- **Border direction**: Are borders lighter than their surfaces? (Opposite of light mode)

### 3. Typography

- **Font weight**: Is font weight reduced in dark mode? (Light-on-dark appears heavier)
- **Thin fonts**: Are any fonts at weight 100-200 used on dark surfaces? (Critical — unreadable due to halation)
- **Line height**: Is line height increased in dark mode? (Perceived weight change needs more breathing room)

### 4. Component Adaptation

- **Images**: Do photographs/media have brightness adjustment, scrims, or containment on dark surfaces?
- **Illustrations**: Are light-background illustrations swapped or adapted?
- **Icons**: Are icons light-colored with sufficient contrast on dark surfaces?
- **Focus indicators**: Are focus rings visible on ALL surface levels? (Dark blue focus rings vanish on dark — most common bug)
- **Form inputs**: Do inputs have visible boundaries on dark surfaces? Is `color-scheme: dark` set?
- **Charts/data viz**: Are chart colors desaturated? Gridlines lighter? Labels readable?
- **Third-party embeds**: Do maps, videos, widgets adapt to dark mode?
- **Scrollbars**: Do browser scrollbars match dark theme?

### 5. Token Architecture

- **Hard-coded colors**: Are colors defined inline instead of through tokens?
- **Semantic vs primitive**: Do components reference semantic tokens, or do they reference primitive values directly?
- **Theme leakage**: Are any tokens not remapped between themes? (Element that stays light-mode-colored in dark mode)
- **Consistency**: Is the same dark surface used inconsistently across similar components?

### 6. Theme Switching

- **FART check**: Does the page flash wrong theme on load? (Flash of inAccurate coloR Theme)
- **System preference**: Does the app detect `prefers-color-scheme`?
- **Manual override**: Can users override system preference?
- **Three-state toggle**: Does it offer Light / Dark / System? (Industry best practice)
- **Persistence**: Does preference survive page refresh / app restart?
- **Live update**: Does the theme change if the user changes OS dark mode while the app is open?
- **Transition quality**: Do backgrounds transition smoothly? Does text NOT transition? (Text transitions disrupt reading)

### 7. Accessibility

- **Contrast retesting**: Have ALL text + surface combinations been verified at WCAG AA on dark surfaces?
- **Focus visibility**: Are focus indicators visible on dark backgrounds across all elevation levels?
- **Motion sensitivity**: Is `prefers-reduced-motion` respected? (Dark interfaces intensify perceived motion)
- **OLED rendering**: On real OLED screens, does scrolling cause smearing? Are colors stable at low lightness?
- **Color-only information**: Is any state communicated through color alone without icon/label backup?

### 8. Anti-Patterns (CRITICAL)

Check against the dark mode slop tells:
- Pure black background with cyan or purple neon accents
- Gradient text glowing on dark surfaces
- Glassmorphism cards with blur and glow borders
- Every accent color at maximum saturation
- Generic charcoal gray with zero brand personality
- Same layout as light mode — no adaptation of hierarchy, elevation, or image treatment
- Colored shadows on dark backgrounds (physically nonsensical)

**CRITICAL**: This is an audit, not a fix. Document issues with clear explanations of impact. Use `/darken` to convert or fix, `/theme-toggle` to add switching.

## Generate Comprehensive Report

### Dark Mode Slop Verdict

**Start here.** Pass/fail: Does this dark mode look AI-generated? Could someone distinguish it from a random AI dark dashboard? List specific slop tells. Be brutally honest.

### Executive Summary
- Total issues found (by severity)
- Most critical issues (top 3-5)
- Overall dark mode quality assessment
- Recommended next steps

### Detailed Findings by Severity

For each issue:
- **Location**: Where the issue occurs (component, file, line, token)
- **Severity**: Critical / High / Medium / Low
- **Category**: Surface / Color / Typography / Component / Token / Switching / Accessibility
- **Description**: What the issue is
- **Impact**: How it affects users (eye strain, broken hierarchy, invisible controls, etc.)
- **Recommendation**: How to fix it
- **Suggested command**: `/darken`, `/theme-toggle`, or manual fix

#### Critical Issues
[Pure black backgrounds, invisible focus indicators, FART, full-saturation neon accents, hard-coded colors that don't theme]

#### High-Severity Issues
[Missing surface elevation, un-adapted images, contrast failures, no weight reduction]

#### Medium-Severity Issues
[Missing brand tint, no line-height adjustment, light-mode borders not inverted]

#### Low-Severity Issues
[Minor token inconsistencies, third-party embeds not themed, optimization opportunities]

### Patterns & Systemic Issues

Identify recurring problems:
- "Hard-coded hex values in 20+ components bypass the token system"
- "No surface elevation scale — all cards use the same background"
- "Focus indicators invisible on surfaces 2-4"
- "Images create bright rectangles with no dark mode treatment"

### Positive Findings

Note what's working well. Good dark mode is hard — celebrate what's done right:
- Well-structured token architecture
- Proper desaturation
- Smooth theme transitions
- Effective elevation system

### Recommendations by Priority

1. **Immediate**: Accessibility blockers (invisible focus, failed contrast, FART)
2. **Short-term**: Visual quality (surface elevation, desaturation, image treatment)
3. **Medium-term**: Polish (brand tinting, typography weight, line height)
4. **Long-term**: Enhancement (OLED optimization, behavioral testing, cross-device sync)

**NEVER**:
- Report issues without explaining WHY they matter in dark mode specifically
- Skip the slop test — it's the most important check
- Assume light mode contrast ratios hold in dark mode
- Forget to check focus indicators on ALL surface levels
- Report component issues without checking the actual dark mode rendering
- Skip positive findings (acknowledge good work)

Remember: You're auditing dark mode as a first-class design, not as a light-mode afterthought. The bar is: would a professional designer have shipped this dark mode? Judge accordingly.
