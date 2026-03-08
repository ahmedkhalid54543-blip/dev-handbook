# Dark Mode Implementation

## Token Architecture

### Two-Layer System

Primitive tokens define raw values. Semantic tokens map to primitives and change per theme:

```css
/* === Primitive tokens (never change per theme) === */
:root {
  --blue-50: oklch(95% 0.03 250);
  --blue-500: oklch(55% 0.20 250);
  --blue-900: oklch(20% 0.05 250);
  --gray-50: oklch(95% 0.01 250);
  --gray-900: oklch(15% 0.01 250);
}

/* === Semantic tokens (change per theme) === */

/* Light mode (default) */
:root {
  --color-bg: var(--gray-50);
  --color-surface: white;
  --color-text-primary: var(--gray-900);
  --color-text-secondary: oklch(45% 0.01 250);
  --color-accent: var(--blue-500);
  --color-border: oklch(85% 0.01 250);
}

/* Dark mode */
:root[data-theme="dark"] {
  --color-bg: oklch(12% 0.01 250);
  --color-surface: oklch(16% 0.01 250);
  --color-text-primary: oklch(90% 0.01 250);
  --color-text-secondary: oklch(65% 0.01 250);
  --color-accent: oklch(65% 0.15 250); /* Desaturated */
  --color-border: oklch(25% 0.01 250);
}
```

**Key principle**: Only semantic tokens change between themes. Components reference semantic tokens exclusively.

### Surface Elevation Tokens

```css
:root[data-theme="dark"] {
  --surface-base: oklch(12% 0.01 250);
  --surface-1: oklch(16% 0.01 250);
  --surface-2: oklch(20% 0.01 250);
  --surface-3: oklch(24% 0.01 250);
  --surface-4: oklch(28% 0.01 250);

  /* Interaction modifiers */
  --surface-hover: color-mix(in oklch, currentColor, white 8%);
  --surface-active: color-mix(in oklch, currentColor, black 4%);
}
```

## System Preference Detection

### CSS: `prefers-color-scheme`

```css
/* Automatic system-matching dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: oklch(12% 0.01 250);
    --color-text-primary: oklch(90% 0.01 250);
    /* ... all dark tokens */
  }
}
```

### The `color-scheme` Property

Tell the browser your page supports dark mode. This affects scrollbars, form controls, and other browser-drawn UI:

```css
:root {
  color-scheme: light dark; /* Supports both */
}

:root[data-theme="dark"] {
  color-scheme: dark; /* Force dark browser chrome */
}
```

### The `light-dark()` Function

Modern CSS shorthand (Chrome 123+, Safari 17.5+):

```css
:root { color-scheme: light dark; }

body {
  background: light-dark(
    oklch(97% 0.01 250),  /* light value */
    oklch(12% 0.01 250)   /* dark value */
  );
  color: light-dark(
    oklch(15% 0.01 250),
    oklch(90% 0.01 250)
  );
}
```

## Preventing FART (Flash of inAccurate coloR Theme)

The worst dark mode bug: page loads in light mode, then flashes to dark after JavaScript runs.

### Solution 1: Blocking Inline Script (Recommended)

Place this in `<head>` before any stylesheets:

```html
<script>
  // Runs synchronously before paint
  const theme = localStorage.getItem('theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
</script>
```

### Solution 2: Server-Side Hint

Set theme via cookie and render correct `data-theme` on the server:

```javascript
// Server-side (Express example)
app.use((req, res, next) => {
  const theme = req.cookies.theme || 'light';
  res.locals.theme = theme;
  next();
});
```

```html
<html data-theme="<%= theme %>">
```

### Solution 3: Meta Tag for SSR

```html
<meta name="color-scheme" content="dark light">
```

This tells the browser to use dark defaults before CSS loads.

## Theme Toggle Implementation

### JavaScript Toggle

```javascript
function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';

  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
}

// Listen for system preference changes
matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    // Only auto-switch if user hasn't set manual preference
    if (!localStorage.getItem('theme')) {
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    }
  });
```

### Three-State Toggle (Light / Dark / System)

Better UX than a simple toggle—lets users explicitly choose "follow system":

```javascript
function setTheme(preference) {
  // preference: 'light' | 'dark' | 'system'
  localStorage.setItem('theme-preference', preference);

  const resolved = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;

  document.documentElement.dataset.theme = resolved;
}
```

## Smooth Theme Transitions

```css
/* Transition backgrounds smoothly, skip text (avoids reading disruption) */
* {
  transition: background-color 200ms ease-out, border-color 200ms ease-out;
}

/* Opt out for elements that shouldn't transition */
.no-theme-transition {
  transition: none !important;
}

/* Disable all transitions during initial load (prevents flash) */
.theme-loading * {
  transition: none !important;
}
```

**Implementation pattern**:
1. Add `.theme-loading` to `<html>` in blocking script
2. Remove `.theme-loading` after first paint (requestAnimationFrame)

```javascript
document.documentElement.classList.add('theme-loading');
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('theme-loading');
  });
});
```

## React / Framework Patterns

### React Context + Hook

```tsx
const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  toggle: () => void;
}>({ theme: 'light', toggle: () => {} });

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as 'light' | 'dark')
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

const useTheme = () => useContext(ThemeContext);
```

### Tailwind CSS

Tailwind's `dark:` variant works with class strategy:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'selector' for Tailwind v4
}
```

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <button class="bg-blue-500 dark:bg-blue-400">Click me</button>
</div>
```

**Better approach**: Use CSS custom properties with Tailwind. Define tokens once, reference everywhere:

```css
@layer base {
  :root {
    --bg: oklch(97% 0.01 250);
    --text: oklch(15% 0.01 250);
  }
  :root[data-theme="dark"] {
    --bg: oklch(12% 0.01 250);
    --text: oklch(90% 0.01 250);
  }
}
```

## Testing Dark Mode

### Development Testing Checklist

1. Toggle between light/dark rapidly—watch for flash, stale tokens, or un-themed elements
2. Refresh in dark mode—ensure no FART
3. Change system preference while page is open
4. Clear localStorage and verify system preference is respected
5. Check form controls, scrollbars, and browser-drawn UI
6. Test images, illustrations, and media in both themes
7. Verify third-party embeds (maps, videos, widgets) don't break

### CSS Debugging

```css
/* Temporarily highlight unthemed elements */
:root[data-theme="dark"] *:not([class]) {
  outline: 2px solid red !important; /* Debug only */
}
```

---

**Avoid**: Storing theme preference without respecting system default. Transitioning text color during theme switch. Using `@media` only without manual override capability. Forgetting `color-scheme` property.
