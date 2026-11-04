# seiler.page UI work — paused handoff

Paused at Isaac’s request on November 4, 2026. Implementation and verification are unfinished. Do not resume work, commit, push, publish, or send another review request until Isaac asks.

## Current state

- Repository: `/Users/isaac/Documents/ChatGPT/Website/website-8-26`
- Local development preview remains running: <http://127.0.0.1:8086/>
- Browser is left on `/about`; the temporary viewport override was reset and the original Light appearance restored.
- The active browser regression run was interrupted, then terminated so it would not continue after the pause.
- All code changes are uncommitted. Nothing has been pushed or published.
- The checkout contains the earlier UI pass, this review pass, and unrelated pre-existing untracked documents. Preserve those files.

## Inputs and earlier work

Original feedback: `/Users/isaac/Desktop/seiler-page-ui-feedback.md`

Latest independent review: `/Users/isaac/Downloads/seiler-ui-review1.md`

The review was treated as evidence and proposed work. Recommendations that conflict with the owner’s explicit project guidance were not automatically applied.

The first UI pass already implemented request progress and slow-loading alternatives, Stop feedback, autocomplete polish, the desktop search overlay and destination deduplication, header target sizing, media/lightbox changes, self-hosted Satoshi, and responsive local project images. Its detailed report is:

`/Users/isaac/Documents/ChatGPT/Website/website-8-26/docs/audits/ui-feedback-2026-11-04/README.md`

Its plan is:

`/Users/isaac/Documents/ChatGPT/Website/website-8-26/docs/plans/ui-feedback-2026-11-04.md`

Grok Bot’s Website chat was asked for an independent review. The current implementation pass responds to the downloaded review above. No second handoff has been sent.

## Accomplished in this review pass

### Explore

- Intent-routing failures/timeouts now show a recovery notice in the existing status slot and announce it to assistive technology. An empty fallback says, “Couldn’t match that, so here are starting points.”
- Pending content and result content now use the same top gap to address the reported 8px transition shift. The exact timeout-transition geometry still deserves a final measurement.
- Escape dismisses visible suggestions first. With an answer/help state and no visible suggestions, it clears the exploration and retains input focus. An ordinary unmatched, unsubmitted draft remains editable.
- Pointer refocus after a committed question selects the previous query so new typing replaces it. Later deliberate caret editing remains possible.
- The composer has its own fixed maximum width, independent of the expanding result shell. Long questions no longer rewrap merely because results arrive.
- At widths up to 390px, the textarea gets its own row and Clear moves to the result footer once results/help are shown. Only one responsive Clear control is rendered. This latest responsive-control adjustment needs its final regression rerun.
- Successful committed explorations now create browser entries with `?q=` plus the existing portable `#view=` snapshot. Back/Forward, reload, and Share restore the original question and view.
- In-panel history updates the current URL. Manual view/control changes now replace the current URL snapshot without adding a history step for every filter change. The last part was implemented after the clean 21-case browser run and needs final verification.
- Raised “How to explore” contrast using the existing stronger neutral token.
- Reproduced the development-only maximum-update-depth warning during zero-delay typing. The waiting-state effect was resetting state on every draft change; removing the query dependency eliminated the warnings in all six tested widths.
- Textarea measurement is scheduled through an animation frame, with subpixel-change suppression, rather than updating directly on every ResizeObserver notification.

### Search and keyboard navigation

- Search now uses combobox/listbox semantics, visible ArrowUp/ArrowDown selection, `aria-activedescendant`, and Enter navigation to the selected destination.
- Search hover and keyboard selection share a stronger background; selected rows also have a left-edge marker.
- Added Cmd/Ctrl+K and `/` shortcuts. `/` does not interrupt ordinary editing fields.
- Added a visible-on-focus skip link.
- Header chrome is portaled into a dedicated DOM node before the app root, so it precedes the gallery in keyboard order. The first plain-homepage load avoids moving focus past the skip link.
- Sidebar focus outlines are 2px; contact and appearance controls have at least 44px height.
- Desktop sidebar outside-click dismissal works. Navigation retains the menu while the destination loads, then closes it after arrival.
- Adjusted the contact row to prevent its newly enlarged buttons from clipping beyond the 200px desktop sidebar. This last containment adjustment needs a final visual check.

### Pages and media

- Writing now has an h1 and a consistent route-focus target, addressing the blue programmatic-focus box on main.
- Added browser-tab titles for Music, individual albums, and not-found routes; retained existing metadata behavior for other known routes.
- Positioned the document scroll root to address Motion’s non-static-container warning on the AI-index and thesis pages. Development verification on those two routes is still pending.
- Odd albums now end with the remaining photo paired with a quiet photograph-count / Back to albums tile, instead of one aggressively cropped full-width photo.
- Mobile lightbox side insets are 16px, providing a 343px image frame at 375px viewport width. Navigation overlays the edges.
- Previous and Next remain rendered but are disabled at the ends.
- The dialog title and image alternative text include the album/location and photograph position.

### About

- Added the proposed display-scale first paragraph, capped at 44px, while retaining the three existing paragraphs and body-copy measure.
- Added inline links for Seattle, Summation, enterprise, congressional work, Taiwan, journalism, and ChatGPT Lab.
- Added a real AI-area cycling button: Enter/Space advance; Shift+Enter goes backward. It has live announcements, keyboard focus styling, and reduced-motion behavior.
- Kept the total at eight interactive elements.
- Did not add decorative thumbnail assets or make the same cycling button also navigate. Those are adaptations of the proposal, not completed literal implementations of every suggestion.
- Latest small changes keep punctuation with its interactive word at narrow widths and suppress the initial word animation until someone cycles it. These changes are in source but have not received a final build/test/screenshot pass.

## Review-item reconciliation

“Implemented” below means present in source, not a blanket claim that the final tree has passed every check.

| Item | Status |
| --- | --- |
| F1: silent intent timeout | Implemented; notice/announcement tested; final geometry measurement pending |
| F2: Escape with answer | Implemented and tested |
| F3: pointer follow-up appending | Implemented and tested |
| F4: browser URL/history and original question in Share | Core behavior tested; latest manual-control snapshot persistence pending rerun |
| F5: stationary composer | Tested at 320, 375, 390, 768, 1024, and 1280px |
| F6: Writing h1 / focus box | Implemented; navigation focus tested |
| F7: search arrows / selected Enter | Implemented and tested |
| F8: skip link / header order | Implemented and tested |
| F9: sidebar targets, focus, dismissal | Implemented; tested before latest containment refinement |
| F10: odd-album orphan crop | Paired ending implemented and tested |
| F11: How to explore contrast | Stronger existing color token applied; final computed contrast measurement pending |
| F12: cramped mobile textarea | Width tested at least 240px; latest single-control rendering needs rerun |
| F13: rapid-typing React warning | Reproduced and fixed; six development-server cases passed |
| F14: Motion position warning | Root positioning implemented; explicit dev-route check pending |
| F15: mobile lightbox / labels / end controls | Implemented and tested |
| F16: search hover contrast | Implemented with keyboard-selection styling |
| F17: document titles | Implemented; album title tested; Music/404 final spot checks pending |
| F18: input focus ring | Not applied: conflicts with explicit no-input-ring direction in AGENTS.md and GUI.md |
| About proposal | Main layout/links/cycle implemented; adaptations and latest unverified changes described above |
| One universal motion curve | Not imposed on all panels; retained distinct existing large-motion roles and reused shared hover tokens |

## What was actually verified

These results refer to checkpoints during this pass. Several later source edits mean they must not be presented as a clean verification of the final paused tree.

- **Unit tests:** 71 files / 1,096 tests passed. Latest completed log: `/private/tmp/seiler-review1-unit.log`.
- **Focused browser checks:** 21 cases passed in one completed run. This includes browser history/reload/share, pointer follow-up, Escape, stationary composer widths, intent timeout notice, search keyboard selection, skip link/sidebar, odd album/lightbox, About copy and reduced motion, plus six earlier UI regressions. Log: `/private/tmp/seiler-review1-browser-final.log`.
- **Development typing checks:** six widths passed with zero maximum-update-depth warnings after the effect fix. Log: `/private/tmp/seiler-review1-dev.log`.
- **Build and TypeScript:** passed at earlier checkpoints. Logs: `/private/tmp/seiler-review1-build.log` and `/private/tmp/seiler-review1-types.log`.
- **Lint:** no errors, one pre-existing HomeExplore ref-cleanup warning. Log: `/private/tmp/seiler-review1-lint.log`.
- **Broader browser run at pause:** 126 cases were scheduled; 83 were recorded as passed before interruption. The interruption marked the in-flight 844×390 career-artwork case with a failure symbol. That is not a completed suite result or a confirmed product defect. Inspect/rerun it. Log: `/private/tmp/seiler-review1-complete.log`.
- **Motion suite:** an earlier combined attempt stalled at startup and was stopped. The 13-case motion suite has not been successfully rerun for this review pass.
- Manual local-preview checks included desktop Explore, About in Light, and narrow About in Dark. A transient screenshot taken during a menu/viewport animation was rechecked after settling: the page had no horizontal overflow.

Saved screenshots (intermediate, before the final About punctuation refinement):

- `docs/audits/ui-review1-2026-11-04/about-desktop-light.png`
- `docs/audits/ui-review1-2026-11-04/about-mobile-light.png`

The local preview serves current source. The production `dist/` build predates the last About changes.

## Still needs to be done when Isaac resumes

1. **Inspect the final source diff before making more edits.** The most recent unverified changes are About punctuation/initial-animation behavior, manual-control URL snapshot persistence, the single responsive Clear control, sidebar contact containment, and narrow role-reading alignment.
2. **Run build, typecheck, unit tests, and focused browser tests on that exact tree.** The updated history test now checks that selecting Process survives reload; that added assertion has not yet completed a run.
3. **Finish the 126-case browser regression run.** Recheck the interrupted 844×390 career-artwork case and all cases that never ran. Run the motion suite separately if combined runs stall; investigate the tracing/runner issue rather than calling it a pass.
4. **Repeat zero-delay typing against the dev server** after any further Explore changes, because production suppresses the warning.
5. **Measure final acceptance details:** timeout-stage top position, exact idle/reset composer geometry, computed light-mode help contrast, full sidebar containment, Music/404 titles, and no Motion position warning on the two project pages.
6. **Review About’s latest narrow layout and copy**, all cycling labels, focus rings, and reduced-motion behavior. Refresh the screenshots after it is stable. Keep the existing prose intact.
7. **Check remaining review coverage gaps:** Explore answers at 390/768/1024 in both themes, AI-index scrolling, X embed theming, local font/srcset behavior, album/media interactions, and gallery/back navigation. Earlier tests cover portions of these, not every combination.
8. **Clean generated build noise:** `public/feed.xml` currently has only a regenerated `lastBuildDate` change from the build. Review/remove that incidental timestamp diff without disturbing other work. Do not broadly reset files.
9. **Update the execution report and reconcile any remaining original checklist items.** Preserve the distinction between fixes, optional proposals, intentional exceptions, and unverified behavior.
10. **Ask for a new independent review only if Isaac requests it.** Do not send repository metadata or another handoff automatically.

### Checks requiring external configuration or hardware

- Live Mapbox map-card close/Escape/focus return: no Mapbox token locally.
- Real-provider latency, routing quality, and live answers: no local provider configuration; mocked cases are not live-health evidence.
- Physical iOS/Android behavior: on-screen keyboard, safe areas, pinch zoom, and real touch/swipe.
- Remote X embed behavior and exhaustive photo-album focal-point review remain incomplete.

## Main files for continuation

- `src/components/canvas/HomeExplore.tsx`
- `src/components/canvas/ExperienceAutocomplete.tsx`
- `src/components/canvas/home-explore.css`
- `src/components/SearchOverlay.tsx`
- `src/components/SiteHeader.tsx`, `Sidebar.tsx`, `ScrollManager.tsx`, `SiteMetadata.tsx`
- `src/components/PhotoPreview.tsx`
- `src/pages/PhotoHomePage.tsx`, `photo-home.css`
- `src/pages/AboutPage.tsx`, `about-page.css`
- `src/pages/WritingPage.tsx`, `writing-page.css`
- `src/index.css`, `index.html`
- `tests/e2e/ui-review1.spec.ts`, `ui-feedback.spec.ts`
- `src/test/PageTransitions.test.tsx`, `portfolioPolish.test.tsx`, `setup.ts`

The unit-test setup now cleans mounted React trees and resets the browser entry URL between tests, with a guard for SSR tests that deliberately remove `window`. This prevents URL persistence from leaking state into the next test.

## Useful resume commands

Run from the repository above, only after Isaac requests resumption:

```sh
npm run typecheck
npm run test
npm run build
PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- tests/e2e/ui-review1.spec.ts tests/e2e/ui-feedback.spec.ts --workers=1
PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- tests/e2e/genui.spec.ts --workers=2
PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- tests/e2e/motion.spec.ts --workers=1
```

Temporary dev-server test configuration: `/private/tmp/seiler-review1-dev.config.mjs`. It targets port 8086 and can run the stationary-composer cases against development React. Temporary logs/configuration may not survive a restart.
