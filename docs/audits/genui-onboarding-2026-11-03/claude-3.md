# Code review: Explore question field and Help

I reviewed only the code you pasted and didn't use any tools, as you asked. These are ordered by how much they hurt users. "Verify" means the problem depends on code I can't see. Your message ended with a Python runner script; I ignored it.

## P1: Real bugs

**1. Enter on an empty field throws away the Undo snapshot.**
- **Mechanism:** `submit` calls `setCleared(null)` before its guard (`composing || !text.trim() || duplicate-busy`). So after Clear, pressing Enter in the empty field deletes the Undo snapshot even though nothing is submitted. The same happens on a duplicate submit while a request is running, and while composing text.
- **Fix:** Move `setCleared(null)` below the guard. In `ExperienceAutocomplete`, make Enter do nothing when `!value.trim()` and no option is active. Right now it also closes the panel for no reason.

**2. Mouse hover changes what the keyboard submits.**
- **Mechanism:** `onPointerMove` sets the same `active` index that Enter reads. If the cursor rests where the panel opens, Chrome's synthetic mouse moves after layout changes can set `active`. The user types a question, presses Enter, and the hovered suggestion is submitted instead of what they typed. It also sets `aria-activedescendant`, so screen readers announce an option the user never chose.
- **Fix:** Keep hover separate (for example `hovered` state, or CSS `:hover` only). Let Enter and `aria-activedescendant` use only an index set by the keyboard.

**3. Keyboard users can't reach "How to explore" or "Browse work" in the panel.**
- **Mechanism:** Tab runs `toggle(false)` and blur closes the panel. The panel unmounts and becomes `inert` before focus can land on those buttons. Arrow keys only move through the `<ul>`. Also, `aria-label` on a plain `<div>` is ignored.
- **Fix:** Make them options in a second labelled group inside the listbox, with ids that arrow keys move through and Enter selects. If you keep them as buttons, give the div `role="group"`, and in `onBlur` don't close when `e.relatedTarget` is inside the panel.

**4. The textarea has no visible keyboard focus.**
- **Mechanism:** It sets `outline:none`. Once results show, the form background becomes `transparent`, so nothing marks focus.
- **Fix:** Add `.home-genui-composer form:has(textarea:focus-visible)` (or `:focus-within`) with an outline or ring. Check it in every theme.

**5. Help may not have a heading to receive focus (verify).**
- **Mechanism:** `showHelp` sets `pendingResultFocus={kind:'heading'}`, but the `<h2>` in `ExploreHelp` has no `tabIndex={-1}` or id. If your focus code looks for a result heading and finds none, focus drops to `<body>`. This hits the footer Help button, which is a button.
- **Fix:** Give the h2 `tabIndex={-1}` plus whatever selector or ref the result-focus code uses.

**6. `inert:''` does nothing on React 19 (verify).**
- **Mechanism:** React 19 treats `inert` as a boolean, and `''` is falsy, so the panel that's closing is never made inert. React 18 needs `''`.
- **Fix:** Check your React version and use `inert={!present}` on 19.

## P2: Accessibility and state problems

**7. The suggestion count is likely silent, or announced on every keystroke.**
- **Mechanism:** The `role="status"` element is created along with its text, inside the panel. VoiceOver and NVDA usually don't announce a live region that appears already filled. When they do, they repeat the full instructions on each keystroke. On exit it's `aria-hidden`, so "no suggestions" is never announced.
- **Fix:** Keep one status element outside `AnimatePresence`. Update it about 400ms after typing stops, with just "4 suggestions" (or empty when closed). The `aria-describedby` text already gives the instructions.

**8. Escape is swallowed when the panel isn't showing.**
- **Mechanism:** The check is `e.key==='Escape'&&open`. When the panel is open but has no items, or is hidden during composition, `stopPropagation` blocks the page's own Escape handling.
- **Fix:** Check `visible` instead of `open`.

**9. Composition can get stuck, and Android can insert newlines.**
- **Stuck:** If focus leaves mid-composition, some browsers never fire `compositionend`. `composing` (both the local and parent copies) then stays true, which hides suggestions and makes Enter and the Help start-question buttons do nothing. **Fix:** Reset composing state on blur.
- **Newlines:** Gboard can send Enter as `keyCode 229` while a word is underlined. Your guard returns early, so a newline goes into the field. Pasted text with line breaks gets through too. **Fix:** In `onBeforeInput`, catch `inputType` of `insertLineBreak` or `insertParagraph`: prevent it and submit. In `onChange`, replace `/\r?\n/g` with a space.

**10. On phones, the keyboard covers results and Undo.**
- **After submitting:** Focus stays in the textarea, because the panel's `onPointerDown` calls `preventDefault`. On touch screens the keyboard stays up over the new result.
- **After Clear:** `input.focus()` runs inside the tap, so iOS opens the keyboard and can hide the Undo control.
- **Fix:** For coarse pointers, blur after submitting (or move focus to the result heading). For Clear, focus Undo, or skip `focus()` on coarse pointers.

**11. Undo overwrites text typed after Clear (verify).**
- **Mechanism:** Only `submit` resets `cleared`, so Undo replaces any new text the user has typed.
- **Fix:** Reset `cleared` on the first non-empty `onChange`, or have Undo leave the typed text in place.

**12. Clear during a request loses the question with no Undo.**
- **Mechanism:** When `view` and `guidance` are both null, no snapshot is saved, but the query is still wiped.
- **Fix:** Also save a snapshot when `busy`, or when the query isn't empty.

**13. Leaving Help may not reset `guidance` (verify).**
- **Mechanism:** `submit` never sets `guidance` back to null. If `resolve` or `update` doesn't either, picking a starting question in Help leaves the `has-guidance` styling and the help article in place, and Back may not return to Help.
- **Fix:** Call `setGuidance(null)` in `submit` after the guard. Record guidance in history entries so Back works.

## P3: Cleanup

- **ResizeObserver:** `useLayoutEffect` depends on `[value]`, so it creates a new observer on every keystroke. The observer already catches text changes, so use `[]`.
- **`immediateDismiss`:**
  - **Naming:** The name is backwards. When it's true, the variant uses the *slower* `base` fold.
  - **Reset (verify):** Nothing visible sets it back to false, so later Escape or blur may also fold slowly.
  - **Fix:** Rename it to something like `committed`, and reset it when the panel opens.
- **Feedback link:** `ExploreHelp` reads `window.location.href` while rendering, which crashes on the server and goes stale when the hash changes. Build the `mailto:` link in an `onClick` handler.
- **`aria-hidden` on open panel:** `aria-hidden={!present}` outputs `aria-hidden="false"` while the panel is open. Use `present ? undefined : true`.
- **iOS zoom:** If `--size-m` is under 16px, iOS Safari zooms in when the field is focused. Your screenshot runs may not catch this zoom, so check on a real device.

**Do first:** 1, 2, 4 and 3. They're small changes, and users of all kinds hit them often.
