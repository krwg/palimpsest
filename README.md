# Palimpsest

**Palimpsest — an engine for text with layers. Markdown in, dossier out.**

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License"></a>
  <a href="https://www.npmjs.com/package/@krwg/palimpsest"><img src="https://img.shields.io/npm/v/@krwg/palimpsest?style=flat-square" alt="npm"></a>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
</p>

A lightweight engine for publishing long-form text as an interactive reading experience — footnotes, offline reading, dossier aesthetics.

Palimpsest turns markdown into a reading site with real depth: inline tooltip footnotes, chapter-based navigation, offline reading via service worker, and a minimalist dossier aesthetic out of the box. Built for serial fiction, investigative writing, and documentary projects — anything where the text has layers worth surfacing, not burying in a PDF.

> Extracted from [Piligrim](https://github.com/krwg/piligrim) — the novel reader is the first consumer, not the source of hardcoded constants.

## Install

```bash
npm install @krwg/palimpsest
```

```ts
import {
  createReader,
  dossierTheme,
  parseChapter,
  renderBody,
  createServiceWorkerSource,
} from '@krwg/palimpsest';
import '@krwg/palimpsest/styles.css';

await createReader({
  root: document.getElementById('app')!,
  theme: [dossierTheme],
  manifestUrl: './chapters/manifest.json',
  storageKeys: {
    settings: 'my-book-settings',
    progress: 'my-book-progress',
  },
});
```

## Architecture

```
markdown dialect → parseChapter() → { meta, glossary, body }
                 → renderBody()    → HTML
                 → bindFootnotes() → interactive layers

theme tokens → applyTheme() → CSS custom properties (--ps-*)
plugin slots → FootnoteRenderer | DocumentExhibit | TableOfContents | ChapterTransition
```

### Theme tokens

```ts
import { applyTheme, paperTheme, sepiaTheme, nightTheme } from '@krwg/palimpsest';

applyTheme(paperTheme); // or sepia / night / dossier
```

All colors, fonts, widths, and motion land on `--ps-*` variables so themes switch without a rebuild. Default typography dogfoods the Piligrim stack: **Cormorant Garamond** + **IBM Plex Sans** + **Special Elite** (exhibits).

### Plugin slots

Override any default when calling `createReader`:

| Slot | Default |
|------|---------|
| `FootnoteRenderer` | Tooltip (desktop) / bottom sheet (mobile) |
| `DocumentExhibit` | Archival sheet with optional bilingual toggle |
| `TableOfContents` | Chapter list + per-chapter progress bars |
| `ChapterTransition` | Instant HTML swap |

### Offline

```ts
import { writeFileSync } from 'node:fs';
import { createServiceWorkerSource } from '@krwg/palimpsest';

writeFileSync(
  'sw.js',
  createServiceWorkerSource({
    cacheName: 'my-reader-v1',
    assets: ['index.html', 'chapters/manifest.json', 'chapters/ch01.txt'],
  }),
);
```

## Chapter dialect (short)

```md
::chapter::
title: Chapter title
when: Place, year
::/chapter::

Prose with a glossary term[[1]].

:::document
::label:: EXHIBIT
Body of the document.
:::

[[1]]: term — footnote body shown in a tooltip.
```

See `test/fixtures/sample-chapter.txt` and Piligrim’s `chapters/_TEMPLATE.md` for the full surface (`::figure::`, `::translate::`, hand layers, …).

## Scripts

```bash
npm install
npm test
npm run build
```

## Roadmap

Milestone **0.1.0** — extract engine, document API, publish package.  
Next: migrate [Piligrim](https://github.com/krwg/piligrim) onto `@krwg/palimpsest`, then expand demos / `npm create` template.

## License

GPL-3.0-or-later (same family as Piligrim).
