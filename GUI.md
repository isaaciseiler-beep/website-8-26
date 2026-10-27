# Portfolio UI

The supplied theme and all reference material are preserved under [docs/design/untitled-theme/GUI.md](docs/design/untitled-theme/GUI.md). The exported theme is applied to the AI window only; preserve the existing site shell and photography.

Use Satoshi instead of the exported font. Lucide outlines are the approved fallback for the unavailable licensed Central icons. Theme values live in `src/components/canvas/ai-theme.css` and should remain named references at use sites.

Follow the [interface judgment guide](docs/design/untitled-theme/gui/interface-judgment.md): one useful heading, one home for each fact, necessary controls, and progressive disclosure. The October 22 refinement reduces redundant surfaces and uses a single expanding response area.

Use [graphical-ui](docs/design/untitled-theme/skills/graphical-ui/SKILL.md), [graphical-convert](docs/design/untitled-theme/skills/graphical-convert/SKILL.md), or [graphical-audit](docs/design/untitled-theme/skills/graphical-audit/SKILL.md) as appropriate. This is a guidance-only export; no Graphical runtime or React upgrade is required.

Native select popups retain platform behavior. Text inputs and textareas have no focus outline or ring, per the owner’s preference. Other controls retain visible keyboard focus, including dark mode. These are intentional accessibility adaptations.
