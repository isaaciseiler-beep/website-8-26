# Page-to-page transition implementation

Implemented locally on October 31, 2026. Preview: `http://127.0.0.1:8080/`. Existing edits, including concurrent content/UI work, were preserved. This task did not publish or push.

## Changes

- One coordinator owns route handoff, including browser Back/Forward. The previous page remains mounted while destination code prepares. A viewport snapshot dissolves over the ready destination for the shared 340ms motion duration; text is never scaled or translated. There is only one live route, avoiding duplicate headers, focus targets, maps, and background work.
- Destination mounting and scroll placement resolve the handoff together. History positions are captured before the old page is replaced, so a shorter destination cannot clamp the value being saved. Separate history entries for the same URL retain separate positions; the memory cache is bounded to 40 entries, with the existing URL-based session fallback for reloads.
- Returns restore the followed content link's focus and any disclosure containing it. New destinations focus their main region without scrolling it. Restoration stops on user input and has a bounded wait for changed/shorter content.
- All three project templates now return to the actual Work history entry. Direct project entry falls back to `/work`, replacing the obsolete homepage-section target. Work links explicitly record their source.
- Explore's full-project links use client navigation in the site, with “Back to exploration” restoring the original view and Sources disclosure. The standalone embedded canvas keeps ordinary anchors and does not require a router. Search project results retain the originating Work/Explore context too.
- Committed Explore state, draft, local controls, and local history survive a page round trip. This is memory-only, per history entry, and bounded to 20 entries; pending provider work is cancelled and never resumed as a stale loading state.
- Album overview/interior transitions use the same coordinator. Album state derives synchronously from its URL; browser Back and “All photos” restore the original gallery position rather than running a second smooth scroll. Removed the competing album exit/entry fade.
- Code preparation covers all lazy route families. Query/hash updates within an exploration keep their own lifecycle. Reduced motion skips snapshots and cancels any fallback animation; unsupported browsers get a short opacity settle using the existing motion roles.
- Rapid navigation supersedes old preparations and stale snapshot callbacks. Snapshot completion is tied to its own arrival revision, so an old layout-effect cleanup cannot release the next destination prematurely.

## Browser verification

Connected Chrome, then the local in-app preview:

| Journey | Observed result |
| --- | --- |
| Work → government benchmark → Work | Correct route, initial project scroll 0, return focus and Work position restored |
| Work → congressional report → Work | Correct route, initial project scroll 0, return focus and Work position restored |
| Work → Taiwan project → Work | Work returned to 550.5px and the selected project link |
| Work → journalism thesis → Work | Work returned to 550.5px and the selected project link |
| Work → Boehringer project → Work | Work returned to 1,131px and the selected project link |
| Work → OpenAI project → Work | Exact 1,131px return, selected project link focused |
| Browser Forward → project, scroll → Back → Forward | Project position restored exactly: 861px before/after |
| Comparison, local measure change, unfinished draft → Writing → Back | Draft and `preparednessScore` selection restored with the committed comparison |
| Explore → Taiwan album → All photos | Album opened at scroll 0; overview returned at 1,018px with the draft and comparison measure preserved |
| Taiwan Explore → Sources → Full project → Back to exploration | Same exploration restored and Sources reopened |
| Homepage → Music/Writing/Photo Map | Destinations opened; map showed the expected missing-token fallback, and browser Back returned to the homepage |
| 320px Work → thesis → Work | Correct routes and focus, with no horizontal overflow in either direction |

All six desktop project arrivals reported no horizontal overflow. A final default-width thesis round trip returned to exactly 148.5px and restored its link focus; see [the return screenshot](work-return.png). The preview's normal viewport and light appearance were restored after the in-app checks. Chrome retained its prior dark appearance.

## Tests and limits

Seven focused transition regressions cover delayed preparation, superseded navigation, forward/Back snapshot completion, separate same-URL history entries, contextual return/fallback, suspended destination readiness, reduced motion, and restoration of Explore controls/drafts.

The last focused run included the five required portfolio suites and the motion/navigation suites: 122 of 127 tests passed. All seven transition tests passed; five existing content/UI assertions in `ExplorationCanvas.test.tsx` failed while concurrent edits changed portfolio copy and composition. Those unrelated edits were preserved. ESLint and the production build passed separately. The existing TypeScript check has unrelated ES2020 and older test typing failures; no transition implementation errors were reported.

Map camera playback still needs a configured environment. Ancillary classic, game, document, tracker, and unknown routes use the same coordinator and preparation policy, but were not all manually played end to end in this pass. No physical-device or numerical FPS improvement is claimed.

The asynchronous snapshot handoff follows the documented [View Transition update callback lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition) and preserves [React Suspense mounting behavior](https://react.dev/reference/react/Suspense).
