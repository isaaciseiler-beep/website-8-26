## Verdict on layout

**Keep one column, but make it the same column answers use.** Don't split help into two columns. Help is a sequence: orient → try a question → learn how it works → give feedback. Two columns break that reading order and make onboarding feel like a dashboard instead of an answer. The extra right-hand space isn't really the problem. The problem is that the help pane uses a different grid from the answer pane, so going from help to an answer causes a layout jump.

- Set help's text measure to match the answer body measure. Your tablet answer is ~656px. Pick one value, about 640–680px, and use it for the lead, the prompt list and the body text. Right now there are three measures: a lead at ~590, a list at 760, and 760 body lines running about 95 characters, which is too long.
- If 1120px still feels empty, the fix is spacing, not a second column: more top padding, a larger title.
- On desktop only, if you want to use the width, put the prompts in a 3-up row of answer-style cards. Keep everything else in one column.

## Make help read like an AI answer (priority order)

1. **Give help the same anatomy as an answer.** The question goes in the field, then a title, then the same segmented control: `Start · How it works · Feedback`. That one change makes it feel like the system answered "How to explore" rather than opening a modal. Reuse the answer footer as well.
2. **Decide what the field holds in help state.** If "How to explore" is the real value, pressing ↑/Enter resubmits it, and editing it is strange. Either treat it like any answered question (resubmitting is a no-op that keeps help showing) or show it as a dimmed echo that clears when the visitor focuses the field.
3. **Make the prompts the strongest element.** They are currently 14px medium, which is weaker than the instructions paragraph below them. Set them at body size or larger. Replace ↗ with →, because ↗ means "leaves the site" and these answer in place. Save ↗ for real external links like Send feedback.
4. **Cut the controls paragraph from first-visit help.** "Press Enter… Back… Clear…" describes controls the visitor hasn't seen yet. "Press Enter" is also wrong on a phone. Move these into a one-time inline hint under the first answer, near the actual controls.
5. **Shorten the lead.** It is nearly as large as the title on desktop (24px vs ~36px). Drop it to ~19–20px, or cut it to one line: "Ask anything about Isaac's work, or start here."
6. **Fix "Feedback" meaning two things.** The site's "Feedback +" and "Send feedback" sit next to "What feedback did Isaac give." Rename the site one to something like "Suggest an improvement" or "Note to Isaac."
7. **Even out spacing.** The gap above "Help make this better" is about 1.7× the other section gaps. Use a single section rhythm, e.g. 40/12.
8. **Check the prompt list.** You listed Congress as the fourth initial prompt, but only three render.

## Study Mode answer (tablet)

- The ~370px image comes before the text that answers the question. Either put the first paragraph above the image or cap the image at about 45% of the viewport height.
- The "Study Mode" caption repeats the selector label. Use the caption for provenance instead, e.g. "OpenAI launch screens, 2025."
- The disclosure icons are mixed: chevrons on the title, the selector and "Continue reading", but + on "Explore further" and "Feedback". Use chevron for "reveal more of this" and + for "add/expand a section", and apply that rule everywhere.
- The footer's "How to explore" floats off-center. Left-align it with the content edge.
- The ⌄ next to the title is ambiguous: does it switch projects? It needs a label or a different affordance.

## Edge cases worth testing

**Textarea / combobox behavior**
- During IME composition, Enter must not commit. Check `isComposing` and keyCode 229, which Android Gboard sends.
- Shift+Enter, and pasted text containing newlines: normalize to a single line or explicitly allow it. Prefer `beforeinput` `insertLineBreak` over relying on keydown.
- Escape with suggestions open should close the list. Escape again should restore or clear, and it must not do both at once.
- Since `aria-expanded` isn't available on a textbox, announce the suggestion count in a live region. Use `aria-activedescendant` and `aria-autocomplete="list"`, which are both valid on a textbox. Test VoiceOver with Alt+Down and arrow navigation.
- Height measurement:
  - Re-measure after `document.fonts.ready`.
  - Test on resize and orientation change, at 200% zoom, with text-spacing overrides, and with long unbroken URLs.
  - At the 160px cap, the caret must stay in view, and the scrollbar should appear only at the cap.
- On iOS, use a font-size of at least 16px to avoid auto-zoom. Set `enterkeyhint="go"`. Check whether restoring the value programmatically breaks undo.

**Results and state**
- An AI response arriving after Clear or Back must be dropped. Version each request.
- Test pressing Enter twice quickly, and pressing Back mid-animation.
- Resize the window during the fold or retract animation.
- With `prefers-reduced-motion`, the fold should become an instant swap.

**Product suppression**
- Aliases and typos: "study and learn", "studymode", "study mode" in lowercase.
- Generic words that are also product names should not trigger a product: canvas, memory, tasks, projects.
- Vague questions like "what does he think of ChatGPT?" Decide whether that counts as naming a product.
- A product named partway through a follow-up should unlock product content for that answer only.