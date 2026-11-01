# Mobile refinement

The site now uses safe-area spacing with viewport-fit=cover, 44px touch targets for header and Explore controls, 16px mobile form text, stable small-viewport homepage sizing, and more legible compact Work captions. A second pass rebalances the two columns below 400px so long titles remain inside their photographs, constrains open Search to the safe width, and expands sidebar disclosure targets. Existing Satoshi, neutral colors, 7px corner tokens, header blend layers, and two-column narrow galleries remain in use.

Verification: production build passed; focused five-file suite passed 83 tests in an isolated checkout of the mobile release (110 also passed in the shared working tree). The existing local authored browser suite passed 86 checks in the shared working tree. The dedicated mobile script passed 60 checks across light/dark themes and 320×568, 390×844, 466×678, 626×890, 890×626, and 844×390 viewport shapes. It checks idle photo allocation, touch targets, form text, comparisons, Taiwan stories, Work captions, overflow, control containment, preserving drafts/results across resize, and ensuring Work captions fit inside their images.

The viewport sizes are representative test panes, not a claim of exact iPhone Duo Safari dimensions. Apple documents separate outer and inner displays: https://www.apple.com/iphone-duo/specs/ . Physical Duo/Safari and hardware keyboard behavior were not tested. Provider behavior was local authored fallback, not a live-provider qualification. No deployment was performed.

Run `scripts/verify-mobile-portfolio.mjs` with PLAYWRIGHT_EXECUTABLE_PATH pointing to an installed Chromium executable when Playwright's default browser is unavailable.
