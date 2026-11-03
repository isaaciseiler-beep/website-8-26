I haven't opened any code, so this review is based only on your description.

## 1. Composer expand/retract

**Problems**
- **Switching between the input and the mirror on blur causes a jump.** A one-line input and a wrapped mirror have different heights, so blurring resizes the composer and moves the results under it. The caret position is also lost when focus returns.
- **Animating width from 608 to 1120 reflows every line on every frame.** Text rewraps mid-transition, which looks jittery and costs performance.
- **Running the two steps one after the other feels slow** if each takes more than about 250ms.

**Proposal**
- **Use one element.** An auto-growing `<textarea>` with `role="combobox"` wraps the same way whether or not it's focused, so there's no mirror and no swap. Enter submits and Shift+Enter is ignored. If you have to keep the native input, put the mirror in exactly the same spot with the same text metrics, crossfade opacity, and animate the wrapper's height from measured values.
- **Keep the composer at its readable width (about 608px) and its top edge fixed at all times.** Only the panel frame should grow around it.
- **Expand:** lay the results out at their final 1120 width on the first frame and reveal them with `clip-path: inset()`, horizontal first (about 200ms), then vertical (about 260ms), with an ease-out curve. Nothing rewraps.
- **Retract:** fade the content out (120ms) and make it inert, fold the height to the composer (220ms), then close the width clip (180ms).
- **Interruptions:** use CSS transitions or Web Animations that start from the current computed value. If someone submits mid-retract, reverse from where it is, never snap.
- **Scroll:** if the visitor has scrolled down when they press Clear, scroll the composer into view before folding. Keep `overflow-anchor` from jumping the page when the pane grows.
- **Preview to final result:** keep the local preview's height as a minimum until the composed result is measured, then animate only the difference. This removes the second jump.
- **Reduced motion:** apply size changes instantly and use only a 120ms opacity fade.

## 2. Image proportions

**Problems**
- A fixed 16:9 frame with `object-fit: contain` letterboxes portrait and square artifacts. The empty bars look like a broken layout.
- Forcing every image to 16:9 on mobile shrinks portrait artifacts until they can't be read.
- Putting a wide landscape image beside text squeezes both.

**Proposal**
- **Use each image's real proportions.** Store width and height at build time and set `aspect-ratio` from them, limited to between 4:5 and 2:1. Only images outside that range get `contain` on a quiet surface token, with a hairline border when the image itself has a white background.
- **Choose the desktop layout by orientation:**
  - Landscape (wider than 1.4:1): image full width above the text.
  - Square or portrait: two columns, image about 5/12 and text 7/12, with the image sticky at the top of its column.
- **Mobile:** use the real proportions, with a maximum height of `60svh`.
- **Cropping:** never crop screenshots or artifacts, because they contain text. Photos keep `cover` at 4:3, with a focal point if you have one and centered otherwise.
- Always set `width` and `height` attributes, and use `srcset`/`sizes` that match the actual column widths, so nothing shifts while loading.

## 3. Entry questions

"Study modes" and named feedback in the contextual prompts are jargon to someone seeing the page for the first time. Visitors don't yet know what a mode, lens or benchmark is.

- **Starter prompts** should be plain questions about outcomes, about seven words or fewer:
  - "What did Isaac build for governments?"
  - "What was teaching in Taiwan like?"
  - "What did he do in Congress?"
  - "How did his career get here?"
- **The first suggestion shown on load should be the broadest one.** Cycling hides the others, so the first impression has to carry the page.
- **Contextual prompts** should appear only after a result and come from what's on screen, for example "Compare with the Congress work" or "Show how it was made." Introduce a technical word only after the visitor has seen the thing it names.
- **Placeholder:** use something like "Ask about Isaac's work" that states what the input is for.

## 4. "How to explore" in the results pane

Drop the floating disclosure. It competes with autocomplete and breaks the rule against floating shadowed cards. Instead, make "How does this work?" one of the suggestions. Choosing it runs a **local, deterministic layout** with no model call, matched from phrases like "how / help / what is this," and shown in the same pane with normal expand and retract.

Divide the sections with spacing, not cards:

1. **Try it.** Three numbered steps (ask a question, change the view, open a project) with two example questions you can click to run.
2. **How it works**, in two sentences: matching on your device gives an instant preview, and a model then assembles the result from a fixed set of layouts and Isaac's published work. It can't invent facts, scores or links. Put the details (Mistral, the optional Jev hints, validated compositions, no generated code, photos never sent) in a collapsed "Technical details" section, like Sources.
3. **Feedback.** "Something wrong or missing?" opens a short form or email. It can include the current question and layout ID, and it should say plainly what gets sent.

Keep the visible text to about 120 words.

## 5. Aesthetics

- **One heading per result.** Meta text at 13px in muted gray, body at 16/1.55, and text limited to about 68ch even when the pane is 1120 wide. Give the extra width to images.
- **Separate with hairlines and spacing, not filled boxes.** Look for any remaining nested surfaces and remove them.
- **Fade result groups in by opacity only,** with a 40ms stagger and at most three groups.
- **Controls:** one quiet row directly under the heading, not scattered around the pane.

## 6. Accessibility

- When the composer swaps elements or the pane retracts, the current value and focus must stay available to screen readers.
- On Clear, return focus to the composer.
- Announce new results once in a polite live region, not as they stream in.

## Open questions

- **Feedback:** where should it go? Email, a form endpoint, or an issue tracker? Scheduling a meeting is off the table.
- **Composer:** are you open to replacing the native input with a textarea? It's the cleanest fix for the blur jump.
- **Images:** can image width and height be generated at build time for every artifact? The proportion changes depend on it.
