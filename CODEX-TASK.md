# Codex Task: Build Dev Handbook Website

## What This Is
An interactive learning website teaching App development lifecycle to a non-technical learner (Jason). 
All content is in `/data/` as JSON files. Your job is to build the frontend that renders them.

## Tech Stack
- Pure HTML + CSS + Vanilla JavaScript (NO frameworks, NO npm, NO build tools)
- Content loaded from JSON files via fetch()
- Progress stored in localStorage
- Responsive design (mobile-first, phone is primary device)
- Chinese language UI

## Files to Create

### 1. `index.html` — Dashboard Homepage
- Top: Title "App 研发全链路" + total progress ring (x/9 stages completed)
- **"继续学习" button** (first CTA, above the fold): reads `lastVisited` from localStorage, links to that stage+section. If no history, shows "开始诊断 →" linking to diagnosis
- **Diagnosis card**: "Mi English 工程健康诊断" — clicking opens inline diagnosis quiz (load from `/data/diagnosis.json`), calculates score 0-100, shows score range label + recommended stages
- **Role overview table**: Load from `/data/roles.json`, responsive table (horizontal scroll on mobile)
- **9 stage cards**: 3x3 grid (desktop), 2-col (tablet), 1-col (mobile). Each card shows: icon + number + title + estimated time + completion (x/N sections) + status badge. Click → `stage.html?id=XX`
- **Bottom fixed nav** (mobile): 4 tabs: 首页 | Prompt 实验室 | 术语表 | 进度
- Color scheme: gradient from orange #FF6B35 → red #FF5252 → purple #7C4DFF → blue #448AFF → green #66BB6A
- Background: #F5F7FA, Cards: white, Text: #333, Secondary: #888

### 2. `stage.html` — Stage Detail (single template, dynamic rendering)
- URL: `stage.html?id=01` — loads `/data/stages/stage-{id}.json`
- **Top nav**: ← Back to home | Stage title | completion (x/N sections)
- **Hero**: Stage number (big) + title + hookQuestion (italicized callout) + deliverable + role badges + estimated time
- **Section nav**: Collapsible TOC with section titles, each marked read/unread (dot indicator)
- **Sections**: Rendered sequentially. Each section:
  - Section title (h2) with estimated time badge
  - Content rendered as formatted text (support \n\n for paragraphs, **bold**, `code`, ```code blocks```)
  - "必学"/"可选"/"扩展" tag badges
  - Mark as read button at bottom of each section (updates localStorage)
- **AI Collaboration block** (after sections):
  - Prompt templates: Card style with copy button (clipboard API)
  - AI Fail stories: Red-bordered cards with bad→good prompt comparison
- **Exercises**: 3-tier display (⭐/⭐⭐/⭐⭐⭐), collapsible panels
- **Checklist**: Checkbox list, persisted to localStorage. All checked → show 🎉 congratulation
- **Stage connection narrative**: `nextStageLink` text at bottom
- **Bottom nav**: Previous stage | Home | Next stage (buttons ≥ 44px height)
- **Content rendering rules**: 
  - Parse markdown-like syntax: **bold**, `inline code`, ```code blocks``` (with syntax highlighting class), \n\n = new paragraph
  - Tables in content: render as HTML tables
  - Blue callout blocks for Mi English cases

### 3. `css/variables.css`
```css
:root {
  --color-orange: #FF6B35;
  --color-red: #FF5252;
  --color-purple: #7C4DFF;
  --color-blue: #448AFF;
  --color-cyan: #00BCD4;
  --color-green: #66BB6A;
  --bg-primary: #F5F7FA;
  --bg-card: #FFFFFF;
  --text-primary: #333333;
  --text-secondary: #888888;
  --radius-card: 16px;
  --radius-button: 8px;
  --spacing-page-desktop: 48px;
  --spacing-page-mobile: 16px;
  --font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  --font-mono: 'Menlo', 'Monaco', monospace;
}
```

### 4. `css/global.css`
- Reset + base styles
- Responsive breakpoints: desktop (>1024px), tablet (768-1024), mobile (<768)
- Card component styles
- Button styles (min-height 44px on mobile)
- Bottom fixed nav (mobile only, 56px height)
- Progress ring component (SVG-based)
- Tag/badge component styles
- Collapsible panel styles (click to expand, 200ms transition)
- Code block styling
- Callout block styling (blue for cases, red for fails)
- Table responsive styling

### 5. `css/components.css`
- Quiz/exercise component
- Checklist component with checkbox animation
- Copy button component
- Diagnosis quiz component
- Prompt template card
- AI fail card
- Section read indicator

### 6. `js/app.js`
- Progress manager: read/write localStorage
  - Track per-stage: sections read, checklist items, exercises done, stage completed
  - Track global: lastVisited (stage+section), total stages completed
  - Track diagnosis: firstScore, latestScore, lastTaken
- Navigation: bottom nav active state, page routing
- "继续学习" logic
- Progress export/import (JSON download/upload)

### 7. `js/stage-renderer.js`
- Fetch stage JSON by id from URL param
- Render all sections with markdown-like formatting
- Render prompts with copy buttons
- Render AI fails
- Render exercises (collapsible)
- Render checklist (interactive, persistent)
- Section read tracking
- Stage completion logic

### 8. `js/diagnosis.js`
- Load diagnosis.json
- Render quiz as radio button groups
- Calculate weighted score
- Show result with emoji + message + recommended stages
- Save score to localStorage
- Compare with first score if exists

## Key UX Requirements
- Mobile-first design (phone is the PRIMARY device)
- All interactions via CLICK/TAP (no hover-dependent UI)
- Smooth transitions (300ms page, 200ms panels)
- Bottom fixed nav on mobile screens
- 44px minimum touch target for buttons
- Loading states for JSON fetches
- Empty states for no-progress scenarios
- WCAG AA contrast (4.5:1 minimum)

## Content Rendering
The JSON content fields use a simple markdown subset:
- `\n\n` → paragraph break
- `**text**` → bold
- `\`text\`` → inline code
- ` ```\ncode\n``` ` → code block
- `| col | col |` table syntax → HTML table

## localStorage Schema
```json
{
  "devHandbook": {
    "progress": {
      "stage-01": {
        "completed": false,
        "sectionsRead": ["s1", "s2"],
        "checklist": [true, false, false, false, false],
        "exercisesDone": ["level1"]
      }
    },
    "diagnosis": {
      "firstScore": null,
      "latestScore": null,
      "answers": {},
      "lastTaken": null
    },
    "lastVisited": { "stage": "01", "section": "s2" },
    "exportedAt": null
  }
}
```

## DO NOT
- Do not use any npm packages or build tools
- Do not use React/Vue/Svelte
- Do not create a package.json
- Do not hardcode content (all from JSON)
- Do not use hover-only interactions

## VERIFY AFTER BUILD
- Open index.html in browser (can use file:// or python -m http.server)
- Check mobile view (375px width)
- Click through to stage.html?id=01
- Verify checklist saves to localStorage
- Verify diagnosis quiz works
- Verify copy button on prompt templates
