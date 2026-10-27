# AI window refinement — October 22, 2026

Scope: the homepage's authored AI interfaces. The original header, sidebar, and photo gallery remain intact.

## Changes

- One expanding response surface. Active content starts near the header; the idle input retains its centered position above the gallery.
- Smaller, consistent headings; fewer nested fills and repeated labels. The selected government controls live beside their scores.
- Removed duplicate score bars and government counts from comparisons. Evidence and sources stay collapsed until opened.
- View selectors follow the content; single-choice selectors are omitted. Photo grids omit redundant headings and single-page pagination.
- Teaching forms retain topic/audience when switching between lesson, feedback, and language. Reorder actions appear on hover/focus and remain visible on touch devices.
- Project sections use one selector instead of a large wall of buttons. Sources remain secondary.

## Theme and review

The supplied neutral, spacing, radius, typography-size, and motion tokens remain in use. Satoshi and user-approved Lucide outlines are intentional asset choices. Inputs/selects and native disclosures retain accessible semantics; native focus and select popups are accessibility/platform adaptations. Custom surfaces were simplified within the theme; the site shell was intentionally preserved.

Browser evidence: all 24 presets rendered at 886px and 390px wide without page overflow; phone controls and images stayed inside the AI window. Visually reviewed comparison, teaching, photography, and project process, in light and dark modes. Confirmed teaching input persistence and benchmark measure changes. At idle, the measured visible fraction of the first photo row was 0.5. Dark appearance was restored after review.

`comparison-light.png` and `comparison-dark.png` capture the local preview. The final dark screenshot was captured after the sidebar transition settled.

Validation: 74 focused tests passed across five files, including all 24 example-prompt routes, all preset renders, control behavior, stale-response protection, and mocked Mistral API contracts. Production build and `git diff --check` passed. Repository-wide TypeScript checking still reports preexisting errors in App.tsx, SkullHome.tsx, and ChatOrb.test.tsx; none were reported in the edited UI files. The build warns about existing large bundles, including Mapbox.

No live provider calls were verified: credentials remain in Vercel, unavailable to this local preview. This is local authored UI and mocked API evidence, not deployment or live model-quality proof.
