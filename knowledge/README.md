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
grounding and retrieval guidance, not fine-tuning data: selected voice,
identity, freshness, behavior, and privacy sections are included as persistent
assistant guidance, while the full file remains retrievable like any other
Markdown knowledge file.

Example:

```md
# Project

## Project title

Add concise facts, accomplishments, dates, collaborators, links, and preferred language here.
```
