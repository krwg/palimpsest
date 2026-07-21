# Palimpsest

**Palimpsest — an engine for text with layers. Markdown in, dossier out.**

The engine short name is **PalST** (`ENGINE_SHORT_NAME` / `PalST` export). Use PalST in product UI and migration notes; the npm package remains `@krwg/palimpsest`.

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
  <a href="https://www.npmjs.com/package/@krwg/palimpsest"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fregistry.npmjs.org%2F%40krwg%2Fpalimpsest&query=%24.dist-tags.latest&label=npm&style=flat-square&color=cb3837" alt="npm"></a>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
</p>

A lightweight engine for publishing long-form text as an interactive reading experience — footnotes, offline reading, dossier aesthetics.

Palimpsest turns markdown into a reading site with real depth: inline tooltip footnotes, chapter-based navigation, offline reading via service worker, and a minimalist dossier aesthetic out of the box. Built for serial fiction, investigative writing, and documentary projects — anything where the text has layers worth surfacing, not burying in a PDF.

> Extracted from [Piligrim](https://github.com/krwg/piligrim) — the novel reader is the first consumer, not the source of hardcoded constants.

## Install

```bash
npm install @krwg/palimpsest
```

### Scaffold a new reader (PalST)

```bash
npm create palimpsest@latest my-book
# or from this repo before the create package is published:
npm create github:krwg/palimpsest/create-palimpsest my-book
```

This repository is also a **GitHub template**. Neutral demo (paper theme): `demo/` — published to GitHub Pages from `main`.

```ts
import {
  createReader,
  dossierTheme,
  parseChapter,
  renderBody,
  createServiceWorkerSource,
  ENGINE_SHORT_NAME,
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

## Feature flags and strings

Optional reader behaviors are off by default (except the progress bar). Pass English defaults or override with a string bag (Piligrim can supply Russian):

```ts
await createReader({
  root,
  chrome: true,
  lightbox: true,
  progressBar: true,
  navigation: { gestures: true, continuePrompt: true },
  strings: {
    continueYes: 'Продолжить',
    continueNo: 'С начала',
    translate: 'Перевести',
    original: 'Оригинал',
  },
});
```

Helpers: `resolveReaderFeatures`, `resolveReaderStrings`, `defaultReaderStrings`.

### Piligrim theme CSS compat

Canonical theme id is `data-ps-theme` (e.g. `dossier`). For hosts that still style with Piligrim classes (`theme-paper`, `theme-white`, …), `applyTheme` also sets `theme-${legacyThemeClass(name)}` via the permanent map `PILIGRIM_THEME_CLASS` (`dossier→paper`, `paper→white`, …). This is intentional host compatibility, not a temporary shim.

## Scripts

```bash
npm install
npm test
npm run build
```

## Roadmap

Milestone **0.1.0** — extract engine, document API.  
Milestone **0.2.0** — reader chrome, lightbox, continue/gestures, PalST short name, pre-migration harden, engine parity for Piligrim (`published`/`soon`, chapter-nav, prefetch, page meta, SW update).  
Milestone **0.3.0** — migrate Piligrim onto PalST (host cutover).

## License

MIT. Piligrim may stay GPL-3.0 — an MIT engine dependency is compatible with a GPL app.
