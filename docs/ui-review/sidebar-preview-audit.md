# Sidebar and preview refinement — October 22, 2026

Implemented icon-only sidebar Search; removed About, scheduling, and Skull/Windows appearance selection. Saved Skull preferences migrate to light/dark. Goodreads uses a Lucide book icon; it links to the owner-provided Isaac Seiler profile (205879141-isaac-seiler).

Unified text at #474747 in light mode and white in dark mode, separated black control ink from text, neutralized olive theme accents, and standardized interface corners on 7px. White image captions and inverted buttons retain contrast.

Removed repeated project and section headings from the visual hierarchy while preserving accessible headings. Project process selection now follows the composition's selected section. Added overflow protection and inherited label contrast for selected controls.

The recess reveal uses a registered CSS angle, a feathered counterclockwise sweep, and a soft fade on exit. Resting opacity remains zero, and reduced motion skips the sweep.

Verification: 63 focused tests passed. All 16 authored layouts rendered at desktop and 390px widths without document overflow; panel corners measured 7px. Inspected the Taiwan flow and sidebar in light and dark modes, restoring light afterward. Vite production build passed, with the existing large Mapbox chunk warning. These are local authored UI checks, not proof of live Mistral/Typesafe service behavior. Provider keys remain unavailable locally.
