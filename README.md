# 🧠 Dopamind

> You started reading. Then you zoned out. Then you forgot where you were. Sound familiar?

**Dopamind** is an open-source, ADHD-friendly learning tool that transforms long-form content — PDFs, ebooks, articles — into focused, digestible learning experiences.

Built for anyone who struggles to focus on long content — which, in a world of endless feeds and notifications, is most of us.

---

## Try it (no API key needed)

```bash
git clone https://github.com/jayjoolee/dopamind.git
cd dopamind
npm install
npm start
```

Open `http://localhost:3000` and click **✨ Try a demo (no key)** — you'll see exactly what Dopamind does to a piece of text, instantly, without signing up for anything.

When you're ready to run it on your own content, add a Claude API key in ⚙️ Settings (it stays in your browser, never touches any server).

---

## The Problem

Long content is brutal for ADHD brains:
- You start a PDF, lose the thread by page 3
- You read the same paragraph four times
- You finish a chapter and remember nothing
- You zone out mid-article and have no idea what you missed

Existing tools summarize content. That's not the same as helping you *learn* it.

---

## What Dopamind Does

Dopamind breaks content into **short, focused chunks** — each with:

- **A one-line hook** before you read ("Here's why this part matters")
- **Key points** after each chunk (so zoning out isn't fatal)
- **A "catch me up" button** — instantly see what you missed without scrolling back
- **Progress that feels real** — small wins trigger the dopamine hit your brain needs

---

## Roadmap

- [ ] **v0.1** — PDF / plain text input → ADHD-friendly reading view
- [ ] **v0.2** — EPUB support
- [ ] **v0.3** — YouTube video (with captions) support
- [ ] **v0.4** — "Catch me up" interactive mode
- [ ] **v1.0** — Web app with BYOK (Bring Your Own API Key)

---

## How It Works

Dopamind uses an LLM (Claude / OpenAI — your choice, your API key) to:

1. Parse your content
2. Break it into attention-sized chunks
3. Generate hooks, key points, and catch-up summaries
4. Present it in a clean, distraction-free interface

Your content never leaves your machine unless you choose to send it to an LLM API.

---

## Status

🚧 Early stage — building in public. Star this repo if the idea resonates.

---

## Contributing

Ideas, feedback, and PRs welcome. Especially from people who know firsthand what it's like to read the same sentence six times.

Open an issue or start a discussion.

---

## License

MIT
