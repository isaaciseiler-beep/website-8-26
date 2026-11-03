I didn't use any tools or make any edits.

**The difference is clearly visible.** The new desktop version reads better than the shipped one:

- **Hierarchy:** "Inside the ChatGPT Lab" is now a real title. Before, it was a small caption under the image. The large opening paragraph then leads into the body text, so the order of reading is obvious.
- **Control affordance:** The filled segmented control with a black selected pill clearly works as a set of tabs. The old underline tabs looked like plain text.
- **Spacing:** The image-left, text-right layout and the removed "Explore another project" row get rid of most of the empty space below the old result. The panel is about 65px shorter, and nothing important was lost.
- **Narrow layout:** It stacks cleanly, the tabs fit across the full width, line length is comfortable, and nothing spills out of the window.

**Two visible defects to fix before shipping:**

1. **The desktop image looks boxed in.** The book photo sits as a gray band inside a white card, with visible white strips above and below it. It looks like an aspect-ratio mismatch. The narrow layout doesn't have this problem. Either make the photo fill the frame (cover, or match the frame to the image ratio) or drop the white card background.
2. **The two chevrons are hard to read on desktop.** "Lab overview ⌄" sits at the far right of the tab row, so it looks like it belongs to the tabs rather than to the text below. The title also has a chevron, so there are two dropdown signals near each other and it's unclear what each one changes. Move "Lab overview" next to the content it controls, as in the narrow layout, or make the title chevron look clearly different.

Everything else is ready to ship.
