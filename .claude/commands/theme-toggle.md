---
name: theme-toggle
description: Add proper theme switching (light/dark/system) to an existing codebase. Handles system preference detection, persistence, FART prevention, and smooth transitions.
args:
  - name: framework
    description: The framework in use (react, vue, svelte, vanilla, etc.) (optional)
    required: false
---

Add a production-grade theme switching system to an existing codebase. Handles the three-state toggle (Light / Dark / System), system preference detection, persistence, FART prevention, and smooth transitions.

## MANDATORY PREPARATION

### Context Gathering (Do This First)

You need to understand the technical environment:
- **Framework**: React, Vue, Svelte, vanilla JS, etc.?
- **Rendering**: Client-side, server-side, or static?
- **Existing tokens**: Does a token system exist? (CSS custom properties, Tailwind, CSS-in-JS?)
- **Current state**: Is there any existing dark mode support, or starting from scratch?
- **CSS strategy**: Global styles, CSS modules, Tailwind, styled-components, etc.?

Attempt to gather these from the current thread or codebase.

1. If you don't find exact information and have to infer, you MUST STOP and call the AskUserQuestionTool to confirm.
2. If confidence is medium or lower, you MUST STOP and call the AskUserQuestionTool with clarifying questions.

### Use dark-mode-design skill

Use the dark-mode-design skill for design principles, token architecture, and transition patterns. Do NOT proceed until it has executed.

---

## Step 1: Token Foundation

Before adding switching, ensure the codebase has a token system that CAN switch. If not, create one.

### Required Token Layers

**Semantic tokens** that remap per theme — these are the only tokens that change:

```
--color-bg          → light: high lightness / dark: low lightness
--color-surface     → light: white / dark: elevated gray
--color-text        → light: dark / dark: off-white
--color-accent      → light: full chroma / dark: desaturated
--color-border      → light: darker than surface / dark: lighter than surface
```

**Audit the codebase** for hard-coded color values. Every hard-coded color is a theming bug. Convert to semantic tokens before proceeding.

### Selector Strategy

Choose how theme is applied:
- **`data-theme` attribute** on `<html>` (recommended — works with all CSS strategies)
- **CSS class** (`.dark`) on `<html>` (Tailwind convention)
- **`color-scheme` property** — always set this in ADDITION to your selector for browser UI

## Step 2: System Preference Detection

### CSS Layer

Use `prefers-color-scheme` media query as the automatic default:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* dark tokens */
  }
}
```

The `:not([data-theme="light"])` ensures manual override takes precedence.

### JavaScript Layer

Listen for system preference changes so the theme updates live:
- Detect initial preference with `matchMedia('(prefers-color-scheme: dark)').matches`
- Listen for changes with `matchMedia().addEventListener('change', ...)`
- Only auto-switch if user hasn't set a manual override

## Step 3: Three-State Toggle

The industry best practice is three options, not two:
1. **Light** — forced light mode regardless of system
2. **Dark** — forced dark mode regardless of system
3. **System** — follows OS preference, updates automatically

### State Management
- Store preference in `localStorage` (web) or framework equivalent
- Distinguish between "user chose dark" and "system is dark" — they're different states
- When set to "system," resolve to actual light/dark based on current OS preference
- When system preference changes, only update if user is in "system" mode

### Toggle UI
- Three-way toggle or segmented control (not just a binary switch)
- Show current resolved theme AND user preference (e.g., "System (Dark)" when OS is dark)
- Place in settings, header, or wherever theme controls belong in the app

## Step 4: Prevent FART (Flash of inAccurate coloR Theme)

The worst theme switching bug: page loads in light mode, then flashes to dark after JavaScript hydrates.

### For Client-Side Rendering

Place a blocking inline script in `<head>` BEFORE any stylesheets:

```html
<script>
  const pref = localStorage.getItem('theme-preference') || 'system';
  const resolved = pref === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : pref;
  document.documentElement.dataset.theme = resolved;
</script>
```

This runs synchronously before first paint — no flash.

### For Server-Side Rendering

- Read theme preference from a cookie (not localStorage — cookies are available server-side)
- Render the correct `data-theme` attribute in the initial HTML response
- Set `<meta name="color-scheme" content="dark light">` as a fallback hint

### Verification

After implementation, test:
1. Hard refresh in dark mode — zero flash
2. Clear all storage, set OS to dark — page loads dark with no flash
3. Slow-throttle network — still no flash (the blocking script is tiny)

## Step 5: Smooth Theme Transitions

### What to Transition
- Background colors: 200-300ms ease-out
- Border colors: 200-300ms ease-out
- Box shadows: 200-300ms ease-out

### What NOT to Transition
- Text color — transitioning text disrupts reading mid-sentence
- Images — instant swap is better than awkward cross-fade
- Decorative SVGs — instant swap

### Disable Transitions on Load

Prevent the smooth transition from firing during initial page load (which would look like a slow flash):

1. Add a class (e.g., `.theme-loading`) to `<html>` in the blocking script
2. This class sets `transition: none !important` on all elements
3. Remove the class after first paint using `requestAnimationFrame` (double-rAF for safety)

### Disable Transitions on System Preference Change

When the OS dark mode toggles, apply the same transition-blocking technique — an instant switch feels more natural than a slow cross-fade for system-initiated changes.

## Step 6: Browser UI Integration

### color-scheme Property

Set `color-scheme` on the root element to inform browser-drawn UI:

```css
:root[data-theme="dark"] {
  color-scheme: dark;
}
:root[data-theme="light"] {
  color-scheme: light;
}
```

This affects: scrollbars, form controls (date pickers, selects, checkboxes), autofill styling, and the browser's default background color during page load.

### Meta Tag

Add to `<head>`:

```html
<meta name="color-scheme" content="dark light">
```

This tells the browser the page supports both modes before CSS even loads.

## Verify Theme Switching

### Functional Checks
- [ ] Light → Dark toggle works immediately
- [ ] Dark → Light toggle works immediately
- [ ] System mode follows OS preference
- [ ] Changing OS preference updates the app live (when in System mode)
- [ ] Changing OS preference does NOT override manual Light/Dark choice
- [ ] Preference persists across page refreshes
- [ ] Preference persists across browser sessions
- [ ] Hard refresh in dark mode shows no FART

### Transition Quality
- [ ] Backgrounds transition smoothly on manual toggle
- [ ] Text does NOT transition (instant swap)
- [ ] No transition flash on initial page load
- [ ] No transition flash on system preference change

### Edge Cases
- [ ] Open page in one tab, change theme in another — both update (if using storage events)
- [ ] Clear localStorage — falls back to system preference gracefully
- [ ] Form controls, scrollbars, date pickers match theme
- [ ] Third-party embeds handle theme change (or are contained gracefully)
- [ ] No hard-coded colors that ignore the theme switch

### Browser/Device Testing
- [ ] Chrome, Safari, Firefox, Edge
- [ ] Mobile and desktop
- [ ] iOS and Android system dark mode integration

**NEVER**:
- Use only CSS `@media (prefers-color-scheme)` with no manual override (users need control)
- Use only JavaScript theme switching with no system preference detection (users expect auto)
- Store theme preference without distinguishing "user chose dark" from "system is dark"
- Forget the blocking `<head>` script (FART is the most visible dark mode bug)
- Transition text color during theme switch
- Forget `color-scheme` property (browser UI won't match)
- Skip the `.theme-loading` transition blocker (slow flash on load)

Remember: Theme switching is one of the most visible, most testable pieces of UI in an app. Users notice when it flashes, lags, or forgets their preference. Get this right and it feels invisible — which is the goal.
