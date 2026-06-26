# Design — MyStock

A locked design system for this LINE LIFF stock management app. Every page reads this file before emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

## Genre
modern-minimal

## Macrostructure family
- App pages: Workbench — functional header → scrollable content → fixed bottom action bar
- No marketing pages, no content pages.

## Theme
A custom OKLCH palette anchored on LINE green (#06C755), tuned for a medical-supply app used by nurses in a hospital setting. The paper stack is near-white with a faint warm tint for readability under fluorescent light.

- `--color-paper`      oklch(97% 0.002 95)
- `--color-paper-2`    oklch(99% 0.001 95)
- `--color-ink`        oklch(22% 0.005 260)
- `--color-ink-2`      oklch(48% 0.005 260)
- `--color-rule`       oklch(90% 0.002 95)
- `--color-accent`     oklch(68% 0.20 160)
- `--color-accent-ink` oklch(99% 0 0)
- `--color-focus`      oklch(68% 0.20 160 / 0.35)
- `--color-danger`     oklch(58% 0.21 25)
- `--color-danger-bg`  oklch(96% 0.02 25)
- `--color-warning`    oklch(72% 0.16 85)
- `--color-warning-bg` oklch(97% 0.03 85)
- `--color-success-bg` oklch(96% 0.03 160)

## Typography
- Display: Inter 700, style normal (roman only — no italic headers)
- Body: Inter 400
- Mono: JetBrains Mono 400 (for User IDs, codes)
- Display tracking: -0.02em
- Type scale: system font stack as fallback for LINE in-app browser performance.

## Spacing
4-point named scale. Pages use named tokens (`var(--space-md)`), not raw values.

- `--space-3xs`: 0.25rem  ·  `--space-2xs`: 0.5rem  ·  `--space-xs`: 0.75rem
- `--space-sm`:  1rem     ·  `--space-md`:  1.5rem  ·  `--space-lg`: 2rem
- `--space-xl`:  3rem     ·  `--space-2xl`: 4.5rem

## Motion
- Easings: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`
- Duration: `--dur-fast: 150ms`, `--dur-short: 220ms`
- Reveal pattern: fade + slide-up (≤350ms)
- Reduced-motion fallback: opacity-only, ≤150ms.
- No framer-motion / gsap — CSS transitions and animations only.

## Microinteractions stance
- Silent success — green flash on the changed element, no toast celebration.
- Error: inline message, no modal.
- Hover delay: N/A (mobile-first, touch-only).
- Focus: instant visible ring at ≥3:1 contrast on `:focus-visible`.
- Active: scale(0.97) on buttons, 150ms.

## CTA voice
- Primary CTA: solid LINE green, `border-radius: 0.75rem`, text white, padding 0.75rem 1.5rem.
- Secondary CTA: outlined LINE green, same radius.
- Danger CTA: solid red, same shape.
- Minimum touch target: 44×44px.

## Per-page allowances
- App pages MUST NOT use enrichment — function carries the page.
- All pages: typography-only heroes (no illustration, no mockup, no Lottie).

## What pages MUST share
- The LINE green accent colour (≤8% per viewport).
- The Inter display + body font stack.
- The CTA voice (button shape, border-radius, padding rhythm).
- Section heading: label + heading stacked vertical, no left-margin hanging labels.
- Fixed bottom navigation bar with glass-morphism backplate.

## What pages MAY differ on
- Content layout within the Workbench family (list vs. form vs. timeline vs. settings).
- Component density (card spacing, list item height).
- Local state colours (danger red on low-stock cards only).

## Exports

### tokens.css
```css
:root {
  --color-paper:      oklch(97% 0.002 95);
  --color-paper-2:    oklch(99% 0.001 95);
  --color-ink:        oklch(22% 0.005 260);
  --color-ink-2:      oklch(48% 0.005 260);
  --color-rule:       oklch(90% 0.002 95);
  --color-accent:     oklch(68% 0.20 160);
  --color-accent-ink: oklch(99% 0 0);
  --color-focus:      oklch(68% 0.20 160 / 0.35);
  --color-danger:     oklch(58% 0.21 25);
  --color-danger-bg:  oklch(96% 0.02 25);
  --color-warning:    oklch(72% 0.16 85);
  --color-warning-bg: oklch(97% 0.03 85);
  --color-success-bg: oklch(96% 0.03 160);

  --font-display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
  --font-body:    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
  --font-mono:    "JetBrains Mono", "SF Mono", "Cascadia Code", monospace;

  --space-3xs: 0.25rem;  --space-2xs: 0.5rem;  --space-xs: 0.75rem;
  --space-sm:  1rem;     --space-md:  1.5rem;  --space-lg: 2rem;
  --space-xl:  3rem;     --space-2xl: 4.5rem;

  --text-xs:  0.6875rem; --text-sm:  0.8125rem; --text-md: 1rem;
  --text-lg:  1.25rem;   --text-xl:  1.5rem;    --text-2xl: 2rem;
  --text-3xl: 2.5rem;

  --ease-out:  cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast:  150ms;
  --dur-short: 220ms;
  --radius-sm: 0.5rem;   --radius-md: 0.75rem;  --radius-lg: 1rem;
  --radius-xl: 1.25rem;  --radius-full: 9999px;
}
```

### Tailwind v4 `@theme`
```css
@theme {
  --color-paper:      oklch(97% 0.002 95);
  --color-paper-2:    oklch(99% 0.001 95);
  --color-ink:        oklch(22% 0.005 260);
  --color-ink-2:      oklch(48% 0.005 260);
  --color-accent:     oklch(68% 0.20 160);
  --color-accent-ink: oklch(99% 0 0);
  --color-danger:     oklch(58% 0.21 25);
  --font-display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
  --font-body:    "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
}
```

### DTCG `tokens.json`
```json
{
  "color": {
    "paper":      { "$value": "oklch(97% 0.002 95)", "$type": "color" },
    "paper-2":    { "$value": "oklch(99% 0.001 95)", "$type": "color" },
    "ink":        { "$value": "oklch(22% 0.005 260)", "$type": "color" },
    "ink-2":      { "$value": "oklch(48% 0.005 260)", "$type": "color" },
    "accent":     { "$value": "oklch(68% 0.20 160)", "$type": "color" },
    "accent-ink": { "$value": "oklch(99% 0 0)", "$type": "color" },
    "danger":     { "$value": "oklch(58% 0.21 25)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Inter", "$type": "fontFamily" },
    "body":    { "$value": "Inter", "$type": "fontFamily" }
  },
  "space": {
    "md": { "$value": "1.5rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables
```css
:root {
  --background:        oklch(97% 0.002 95);
  --foreground:        oklch(22% 0.005 260);
  --primary:           oklch(68% 0.20 160);
  --primary-foreground: oklch(99% 0 0);
  --muted:             oklch(90% 0.002 95);
  --muted-foreground:  oklch(48% 0.005 260);
  --border:            oklch(90% 0.002 95);
  --input:             oklch(90% 0.002 95);
  --ring:              oklch(68% 0.20 160 / 0.35);
  --radius:            0.75rem;
}
```
