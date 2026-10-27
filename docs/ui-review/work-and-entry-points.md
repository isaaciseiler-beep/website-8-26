# Work and visitor entry points — October 22, 2026

The homepage input now says “Ask about my work or photographs.” Rotating examples introduce AI in government, AI literacy in Taiwan, travel photography, and career experience. All four route to validated authored interfaces. The government benchmark includes a brief explanation of the public evidence behind the scores.

`/work` is now a dedicated editorial index: one large feature, two supporting stories, then the remaining public projects. Sidebar Work navigates directly there. The index uses existing project titles, images, category labels, and year strings; hidden projects remain excluded. No publication dates or reading times were invented.

The Work layout reuses the original header/sidebar, Satoshi, light/dark colors, 24px shell gutters, the site's 12/24/48/96px spacing rhythm, and `--site-corner-radius`. Browser-computed image radii were all 7px. All six images loaded. At 390px, content stacks into a single column with scrollWidth equal to the viewport; the featured project link reached the real project page. Both appearance modes were reviewed and dark restored.

Verification: 78 focused tests and production build passed. The repository-wide TypeScript check still reports the same unrelated App/SkullHome/ChatOrb issues recorded in README.md. No live provider or production deployment claim is made.

Evidence: `home-entry-points.png`, `work-light.png`, and `work-dark.png`.
