# French Typing Studio

Modern French typing and rich-text editing app built with React, TypeScript, TipTap, and Tailwind CSS.

## Features

- Rich-text editor with bold, italic, underline, strikethrough, headings, font sizes, alignment, lists, undo/redo, and clear formatting
- French character palette for accents, ligatures, guillemets, euro symbol, and curly apostrophe
- `Alt/Option` accent shortcuts that cycle through French variants like `é → è → ê → ë`
- `Shift + click` uppercase insertion and `Alt + click` single-character copy
- Browser spellcheck plus LanguageTool-powered French writing checks with inline issue underlines and suggestions
- Copy rich text, copy plain text, select all, clear, and export as `.txt` or `.html`
- Local draft sidebar with autosave, multiple writing sessions, duplicate, delete, and import support
- Light and dark themes plus a distraction-free focus mode

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run lint
npm run build
```

## LanguageTool endpoint

By default the app uses LanguageTool's public API:

```bash
VITE_LANGUAGETOOL_API_BASE_URL=https://api.languagetool.org/v2
```

For production deployment, point this to your own LanguageTool server or a paid API setup to avoid public endpoint limits.
