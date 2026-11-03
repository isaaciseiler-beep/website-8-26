I didn't run any tools or edit any files. These findings come from reading the hook's source as pasted.

1. **Inert can stay stuck on open content.** The hook makes an open disclosure's content inert during the click capture phase, before it knows whether the disclosure will actually close. If the close doesn't happen, nothing undoes that, because the `toggle` listener only releases on open. Two ways this happens:
   - another handler calls `preventDefault()`;
   - the click lands on a button or link inside `<summary>`, which `closest('summary')` still matches.

   The disclosure stays open with keyboard- and screen-reader-dead content until the next revision. Fix: apply inert in a `toggle` handler when `open === false`, or check `defaultPrevented` in a microtask first.

2. **Disclosures that change without a click are missed.** Several paths open or close a disclosure with no click:
   - a sibling closing automatically in a `details[name]` group;
   - find-in-page opening a match;
   - a URL fragment pointing inside one;
   - code setting `details.open = …`.

   In these cases nothing makes closing content inert, and `following` stays false. The shell then runs its own height tween behind the native animation, which is the trailing behaviour this hook exists to remove. Drive both inert and `following` from `toggle` (it's capture-registered and fires for all of these), and keep click capture only as an early hint.

3. **The listener can attach to a stale node.** The effect depends on `[content, revision, reduced]`, not on `content.current`. If the content `<div>` remounts without a revision bump (a keyed child, or a parent switching layouts), the listener and the instant flag stay on the detached node.

4. **Two separate reduced-motion settings can disagree.** The CSS uses the OS media query, but the hook trusts the `reduced` prop. If that prop comes from a `MotionConfig` override or a site toggle and differs from the OS setting, one of two things happens:
   - CSS animates while the shell tweens separately;
   - the shell follows instantly while CSS snaps.

   Derive both from the same signal, or check `matchMedia` in the hook.

5. **The release timer ignores the real animation.** `following` turns off after `duration + 50` from the last click, not on `transitionend` of `::details-content`. Two gaps:
   - nested disclosures with a different `--motion-large-duration`, or retargeted transitions, end the follow window at the wrong time;
   - your sampling doesn't cover a disclosure clicked again mid-fold, or nested inner and outer disclosures.

   Those are also the cases where reopening the outer disclosure clears inert inside an inner one that is still folding.

Worth adding to the check: Safari 18.4+ has `::details-content` but no `interpolate-size`, so confirm it takes the instant fallback and still makes closed content inert.
