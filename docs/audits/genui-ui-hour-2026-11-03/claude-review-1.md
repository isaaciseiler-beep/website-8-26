No tools used; this review is based on the direction you described and the constraints in AGENTS.md.

## Five risks to check

1. **The sliding selector can break the motion rule.** AGENTS.md says to animate opacity only and honor reduced motion. A black/white surface that slides with `transform` or `left` breaks that. Its position is also usually measured from the label widths. If that happens before Satoshi loads, or the pane resizes mid-slide, the surface ends up misaligned. Check by switching facets on a cold load, during a resize, and with reduced motion on.

2. **The height jumps when switching facets.** Each facet has a different amount of content, and the AI result height follows a measured inner container. So every switch resizes the window, and the 24px lead makes that change bigger. Look for the old and new content both taking up space for a frame, scroll jumps when the window is below the fold, and leftover content that is still focusable.

3. **The type is too heavy in narrow panes.** A 36px title with a 24px lead, stacked above an image, can push the actual content below the first screen at about 360–420px. The title can also wrap to three or more lines on long project names. Check the narrowest pane for horizontal overflow and for the segmented control escaping the AI window, especially with four or more facets.

4. **The layout becomes inconsistent across projects.** "24px lead where supported" means some projects get a lead and some don't. Lining up results from two projects then looks uneven, and the panel's height changes by project as well as by facet. The same applies to projects with missing or portrait images on the image-left side, which collapse or stretch the split.

5. **Selected-state contrast and repeated headings.**
   - In dark mode the selected surface turns white. Check that its label switches to black, that focus is still visible on the selected segment as well as the others, and that the control isn't relying on the surface alone to show which facet is selected.
   - A visible 36px title must not repeat the project name already in the composer echo, a breadcrumb, or the image alt text. AGENTS.md rules out repeated headings.

## Three high-impact refinements

1. **Use native radios for the facet control.** Build it as `<fieldset>` + `<legend class="sr-only">` + radio inputs, and show the selected state with an opacity crossfade on the segment rather than a slide. That meets the opacity-only rule, removes the measurement bugs, gives you keyboard behavior for free, and avoids tab/tabpanel ARIA you'd have to maintain. It should also fit the "portable control" model in genui.ts better, since the facet is just a form value.

2. **Make the title the panel's only heading.** Render it as the region's real `h2`, link it with `aria-labelledby` on the result region, and drop any other heading or eyebrow. Use `text-wrap: balance` and a responsive clamp (about 28px on narrow screens, 36px on wide ones). Put the title and text before the image in the DOM, and only use CSS to place the image on the left at wide widths. That keeps reading order correct and makes the narrow stack text-first.

3. **Make the layout predictable.**
   - Fix the split ratio, for example a 5/7 grid, and lock the image with `aspect-ratio` and `object-fit: cover`.
   - Reserve the lead's space with the same type scale whether or not a lead exists. Use the published first sentence at 24px or the body text at the normal size, but never generate a lead.
   - Keep the facet control a fixed height and pin it above the content, so facet switches only change the content area's height.
