I didn't open the source or run anything. This review is based only on your description and the test results you reported.

**No blocking issues in the earlier work** (facet underline, row motion, permits, cache key, Atlas poster). The textarea swap carries three concrete risks:

1. **The arrow keys now compete with moving the cursor.** When a submitted question wraps to two or more lines, users expect ArrowUp and ArrowDown to move the cursor between lines. If the existing handler blocks those keys whenever the autocomplete list could open, users can't move the cursor between lines. Only take over the arrow keys while the list is open and has options. Otherwise, let the textarea handle them.

2. **The textarea role isn't valid HTML.** HTML's accessibility rules don't allow a `<textarea>` to take `role="combobox"`, so axe's `aria-allowed-role` check may fail. Screen readers may also announce it as a multi-line field, which conflicts with the list behaviour. Re-run axe on idle, typing and list-open states. If it fails, the safer fix is a regular input that wraps visually, or plain textbox behaviour with the list linked by `aria-controls` / `aria-activedescendant`.

3. **Some search-input behaviours are gone:**
   - Pasted text can still contain line breaks, because blocking Enter only stops typed ones. Turn line breaks into spaces on change or before submitting.
   - Mobile keyboards lose their "Search" key unless you add `enterKeyHint="search"` (or `"send"`).
   - Tests and selectors that look for `searchbox` or `input[type=search]` will silently stop matching.
   - The browser's own Escape-to-clear no longer applies.

   Check that Escape still clears or dismisses the way the existing tests expect.

The height logic is fine: it measures on value changes, guards the width changes and recovers from a 0px measurement while hidden.
