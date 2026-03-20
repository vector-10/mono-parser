---
name: mono-parser-frontend-design
description: >
  Design system and frontend skill for building the Mono-Parser dashboard and UI components.
  Use this skill whenever building any UI for Mono-Parser — dashboards, data tables, charts,
  forms, modals, nav components, loan application views, or any internal fintech interface
  screen. Also use when styling or extending any existing Mono-Parser page or component,
  even if the user just says "make it match the landing page" or "build a dashboard screen".
---

# Mono-Parser Frontend Design Skill

Build production-grade UI for Mono-Parser — a B2B fintech credit scoring platform for Nigerian lenders. Every screen must feel like it belongs to the same product family as the landing page: clean, trustworthy, data-dense but never cluttered.

---

## Design Identity

**Aesthetic**: Refined fintech minimalism. Think Bloomberg terminal meets modern SaaS — precise, professional, slightly serious. No gradients for decoration. No rounded-everything. Trust is the UX.

**Personality**: Confident, data-forward, Nigerian market-aware. The product handles real money decisions — the UI should feel like it knows that.

---

## Tech Stack

- **Framework**: Next.js (App Router or Pages)
- **Styling**: Tailwind CSS utility classes only
- **Icons**: `react-icons` — **never lucide-react**
  - Prefer `react-icons/ri` (Remix Icons) for UI chrome: `RiDashboardLine`, `RiFileList3Line`, `RiBarChartLine`
  - Use `react-icons/tb` (Tabler Icons) for data/finance: `TbCurrencyNaira`, `TbTrendingUp`, `TbShieldCheck`
  - Use `react-icons/hi2` (Heroicons) for actions: `HiArrowRight`, `HiCheckCircle`, `HiXCircle`
  - **No colored icon containers** — icons should be monochrome or use the brand blue `#0055ba` only when intentional

---

## Color Palette

```
Primary Blue:    #0055ba   — CTAs, active states, key data highlights
Dark Blue:       #003d85   — Hover on primary, deep accents
Success Green:   #59a927   — Approved status, positive indicators (use sparingly)
Near Black:      #010101   — Dark surfaces (nav, footer, code blocks)
White:           #ffffff   — Primary background
Gray 50:         #f9fafb   — Section alternating backgrounds
Gray 100:        #f3f4f6   — Card borders, dividers
Gray 200:        #e5e7eb   — Input borders, table lines
Gray 600:        #4b5563   — Body text, descriptions
Gray 900:        #111827   — Headings, primary text
```

**Usage rules:**
- Never use green as a background fill — only for text, icons, borders
- Status colors: Approved=`#59a927`, Pending=`#d97706`, Declined=`#dc2626`, Review=`#0055ba`
- Dark sections (`#010101`) use white text and `gray-400` for secondary text

---

## Typography

**Font Stack** (import via `next/font/google` or `@import`):

```
Display / Headings:  "DM Serif Display" — authoritative, editorial weight
  - Use for: hero h1, section titles, large metric numbers
  - Weights: 400 (regular is the only weight — it's naturally bold-feeling)

UI / Body:           "DM Sans" — clean, geometric, readable at small sizes
  - Use for: body copy, labels, nav, table content, buttons
  - Weights: 300, 400, 500, 600

Mono / Code:         "JetBrains Mono" — technical, developer-facing
  - Use for: API keys, code blocks, score numbers, loan IDs
  - Weights: 400, 500
```

**Scale (Tailwind):**
```
Hero H1:        text-5xl lg:text-7xl  — DM Serif Display
Section H2:     text-3xl lg:text-5xl  — DM Serif Display
Card H3:        text-lg font-semibold — DM Sans
Body:           text-sm / text-base   — DM Sans 400
Caption/Label:  text-xs font-medium   — DM Sans 500, uppercase tracking-wide
Score/Metric:   text-4xl font-normal  — DM Serif Display or JetBrains Mono
```

**Anti-patterns to avoid:**
- No `font-extrabold` on DM Serif (it has no bold variant — it'll fallback ugly)
- No Inter, Roboto, or system fonts
- Don't mix more than 2 font families in one view

---

## Layout System

**Dashboard shell:**
```
Sidebar:   w-60 fixed left-0, bg-[#010101], text-white
Main:      ml-60, bg-gray-50 min-h-screen
Topbar:    h-16 bg-white border-b border-gray-100 sticky top-0 z-10
Content:   max-w-7xl mx-auto px-6 py-8
```

**Grid patterns:**
```
Stats row:      grid grid-cols-2 lg:grid-cols-4 gap-4
Two column:     grid lg:grid-cols-5 gap-8 (2+3 split, like landing page)
Card grid:      grid sm:grid-cols-2 lg:grid-cols-3 gap-6
Full width:     w-full (tables, charts)
```

**Spacing rhythm:** Use multiples of 4 — `gap-4`, `p-6`, `mb-8`, `pt-16`. Avoid odd spacing.

---

## Component Patterns

### Stat Card
```jsx
<div className="bg-white rounded-xl border border-gray-100 p-6">
  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
    {label}
  </p>
  <p className="text-3xl font-normal text-gray-900" style={{fontFamily: 'DM Serif Display'}}>
    {value}
  </p>
  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
</div>
```

### Credit Score Badge
```jsx
// Score bands: 350-549 red, 550-649 amber, 650-749 blue, 750-850 green
<span className="font-mono text-2xl font-medium text-[#0055ba]">{score}</span>
<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${decisionColor}`}>
  {decision}
</span>
```

Decision colors:
- APPROVED: `bg-[#59a927]/10 text-[#59a927]`
- DECLINED: `bg-red-50 text-red-600`
- PENDING: `bg-amber-50 text-amber-600`
- REVIEW: `bg-[#0055ba]/10 text-[#0055ba]`

### Data Table
```jsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-gray-100">
      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
        {col}
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-50">
    {/* rows */}
  </tbody>
</table>
```

### Sidebar Nav Item
```jsx
// Active
<a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#0055ba]/10 text-[#0055ba] text-sm font-medium">
  <Icon className="w-4 h-4" /> {label}
</a>
// Inactive
<a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition">
  <Icon className="w-4 h-4" /> {label}
</a>
```

### Primary Button
```jsx
<button className="inline-flex items-center gap-2 bg-[#0055ba] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#004494] transition shadow-sm shadow-[#0055ba]/20">
  {label} <HiArrowRight className="w-4 h-4" />
</button>
```

---

## Dashboard-Specific Patterns

### Loan Application View
- Left: applicant summary card (name, ID, amount requested, date)
- Right: credit score ring + decision badge + 5-factor breakdown
- Bottom: transaction table with pagination
- Score breakdown uses horizontal bar progress, NOT circular charts

### Analytics / Overview Page
- Top row: 4 stat cards (Applications Today, Approval Rate, Avg Score, Revenue)
- Middle: Time series chart (use Recharts `AreaChart` with `#0055ba` fill, 10% opacity)
- Bottom: Recent applications table

### API Keys / Settings
- Clean form layout, `bg-white` cards, `border border-gray-100`
- API key display: `font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200`

---

## Animation

Keep it subtle — this is a fintech product, not a portfolio site.

```css
/* Reveal on mount */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fadeUp 0.4s ease-out forwards; }

/* Stagger children */
.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 60ms; }
.stagger > *:nth-child(3) { animation-delay: 120ms; }
.stagger > *:nth-child(4) { animation-delay: 180ms; }
```

No bounce, no spring, no dramatic entrances. Just clean opacity + translate.

---

## Nigerian Context

- Currency: always `₦` not `NGN` — use `TbCurrencyNaira` icon where space is tight
- Amounts: format as `₦100,000` not `100000`
- Phone numbers: `+234` prefix
- Score labels can use local context: "Excellent" / "Good" / "Fair" / "Poor" / "Very Poor"
- Avoid assuming credit card infrastructure — focus on bank account / BVN flows

---

## What to Avoid

- ❌ `lucide-react` — banned, use `react-icons`
- ❌ Colored icon boxes (green/blue filled squares behind icons)
- ❌ Purple gradients, glassmorphism, neon glows
- ❌ Inter / Roboto / system fonts
- ❌ `font-extrabold` on display text
- ❌ Rounded corners beyond `rounded-xl` (no `rounded-3xl` cards)
- ❌ Excessive shadows — `shadow-sm` is the default, `shadow-lg` only on modals/dropdowns
- ❌ Emoji in UI (use icons)
- ❌ "AI slop" components: floating chat bubbles, glowing orbs, animated gradient backgrounds
