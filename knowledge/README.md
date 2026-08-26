# Assistant Knowledge

Drop Markdown files in this folder to teach the website assistant more about Isaac.

The Vercel chat function automatically reads `.md` and `.mdx` files from this folder at request time. Use clear headings because each heading section becomes a retrievable knowledge chunk.

Suggested files:

- `isaac-ai-agent-training.md`
- `bio.md`
- `projects.md`
- `voice.md`
- `faq.md`

`isaac-ai-agent-training.md` is treated specially by the chat API. It is agent
grounding, not fine-tuning data: only the canonical public identity, current
route rules, and privacy policy are included as persistent guidance. The file
is excluded from ordinary retrieval so its instructions cannot appear as
visitor-facing evidence.

Example:

```md
# Project

## Project title

Add concise facts, accomplishments, dates, collaborators, links, and preferred language here.
```
