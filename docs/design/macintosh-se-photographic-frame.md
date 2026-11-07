# Macintosh SE photographic frame

The owner requested removing the alternate computers and replacing the generated 1984 chassis with a faithful, photorealistic compact Macintosh matching the supplied Macintosh SE reference. A straight-on photo of the same auction lot was located at Bukowskis: item `10806888_fullsize.jpg` from lot 977786. It replaces the generated 128K frame.

The shipped JPEG is the unmodified original photograph. No image-generation, generative reconstruction, hardware redrawing, recoloring, or bitmap background extraction was used. The existing SVG rendering approach applies a carefully fitted cabinet silhouette in source coordinates, with smooth curves around the rounded plastic corners and recessed lower base. The photographed slots, eject holes, texture, wear, rainbow badge, and model lettering remain intact. Source and adaptation details are in `public/devices/ATTRIBUTION.md`.

`src/lib/macintoshModels.ts` now owns only the Macintosh SE geometry. The former model selector, stored preference, asynchronous image switching, and public alternate-model assets are removed. Old local model preferences cannot restore a rejected computer. The same native Explore editor/results remain inside the screen.

The 4:3 physical glass aperture is mapped to four measured source-photo points; this is the CRT's photographed physical aspect, rather than an assumption of square pixels from its 512 × 342 signal. Screen size remains bounded near the previous desktop pane size. The cabinet stays in normal document flow so its lower body can be seen by scrolling. The live region retains its own scroll viewport. The Guided Tour blue palette remains the owner's earlier explicit direction. Glass uses a faint crop of the original photographed tube, softer scanlines, restrained grain, and a small barrel displacement, while preserving native text and hit testing.

Verification: source-file hash comparison; geometry tests at narrow/desktop widths; legacy-preference and editor-state regression; focused Explore tests; typecheck, lint, production build; desktop/mobile light/dark browser review. Recorded screenshots are linked from the task response.
