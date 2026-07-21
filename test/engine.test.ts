import { describe, expect, it } from 'vitest';
import { parseChapter } from '../src/parse/chapter.js';
import { renderBody } from '../src/render/body.js';
import { renderInline } from '../src/render/inline.js';
import { parseHash, chapterHash } from '../src/router/hash.js';
import { themeToCssVars } from '../src/theme/applyTheme.js';
import { dossierTheme } from '../src/theme/presets.js';
import { createServiceWorkerSource } from '../src/sw/createServiceWorkerSource.js';
import { ENGINE_NAME, ENGINE_SHORT_NAME, PalST } from '../src/brand.js';
import { resolveReaderFeatures, resolveReaderStrings } from '../src/i18n/strings.js';
import {
  isChapterReadable,
  listReadableChapters,
  adjacentReadableIds,
} from '../src/manifest/access.js';
import { formatProgressLabel } from '../src/storage/progressLabel.js';
import {
  defaultChapterNavHtml,
  defaultTableOfContents,
} from '../src/slots/defaults.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('PalST brand', () => {
  it('exports engine short name without renaming the package', () => {
    expect(ENGINE_NAME).toBe('Palimpsest');
    expect(ENGINE_SHORT_NAME).toBe('PalST');
    expect(PalST.shortName).toBe('PalST');
    expect(PalST.packageName).toBe('@krwg/palimpsest');
  });
});

describe('reader feature flags', () => {
  it('resolves defaults and string overrides', () => {
    const features = resolveReaderFeatures({
      chrome: true,
      navigation: { gestures: true },
    });
    expect(features.chrome).toBe(true);
    expect(features.lightbox).toBe(false);
    expect(features.progressBar).toBe(true);
    expect(features.navigation.gestures).toBe(true);
    expect(features.navigation.continuePrompt).toBe(false);
    const strings = resolveReaderStrings({ continueYes: 'Continue RU' });
    expect(strings.continueYes).toBe('Continue RU');
    expect(strings.continueNo).toBe('Start over');
    expect(strings.soonLabel).toBe('Soon');
  });
});

describe('parseChapter', () => {
  it('parses ::chapter:: frontmatter, glossary, and term markers', () => {
    const raw = readFileSync(join(here, 'fixtures/sample-chapter.txt'), 'utf8');
    const parsed = parseChapter(raw);
    expect(parsed.meta.title).toContain('Sample');
    expect(parsed.glossary['1']).toMatch(/dossier/i);
    expect(parsed.body).toContain('word[[1]]');
    expect(parsed.body).not.toMatch(/^\[\[1\]\]:/m);
  });

  it('falls back when frontmatter is missing', () => {
    const parsed = parseChapter('Hello[[1]]\n\n[[1]]: Term — note', {
      title: 'Fallback',
    });
    expect(parsed.meta.title).toBe('Fallback');
    expect(parsed.glossary['1']).toContain('Term');
  });
});

describe('render', () => {
  it('turns term markers into buttons', () => {
    const html = renderInline('See word[[1]] here', {
      '1': 'Word — a unit of language',
    });
    expect(html).toContain('data-term="1"');
    expect(html).toContain('>word</button>');
  });

  it('renders exhibits and paragraphs from body', () => {
    const body = `Opening line.\n\n:::document\n::label:: DOC\n\nBody of exhibit.\n:::\n\nClosing.`;
    const html = renderBody(body, {}, { exhibitStamp: 'CLASSIFIED' });
    expect(html).toContain('Opening line');
    expect(html).toContain('CLASSIFIED');
    expect(html).toContain('exhibit-wrap');
    expect(html).toContain('Closing');
  });
});

describe('hash router helpers', () => {
  it('parses chapter hashes', () => {
    expect(parseHash('#/chapter/ch01')).toEqual({
      kind: 'chapter',
      chapterId: 'ch01',
    });
    expect(parseHash('#/')).toEqual({ kind: 'home' });
    expect(chapterHash('ch02')).toBe('#/chapter/ch02');
  });
});

describe('theme tokens', () => {
  it('emits CSS variables from dossier theme', () => {
    const vars = themeToCssVars(dossierTheme);
    expect(vars['--ps-bg']).toBe(dossierTheme.colors.background);
    expect(vars['--ps-font-body']).toContain('Cormorant');
  });
});

describe('service worker factory', () => {
  it('embeds caller asset list', () => {
    const src = createServiceWorkerSource({
      cacheName: 'demo-v1',
      assets: ['index.html', 'chapters/manifest.json'],
    });
    expect(src).toContain('demo-v1');
    expect(src).toContain('chapters/manifest.json');
    expect(src).toContain('addAll');
  });
});

const sampleChapters = [
  { id: 'ch01', title: 'One', file: 'ch01.txt', status: 'published' },
  { id: 'ch02', title: 'Two', file: 'ch02.txt', status: 'soon' },
  { id: 'ch03', title: 'Three', file: 'ch03.txt', status: 'published' },
  { id: 'ch04', title: 'Draft', file: 'ch04.txt', status: 'draft' },
];

describe('chapter access policy', () => {
  it('published-only matches Piligrim gating', () => {
    expect(isChapterReadable(sampleChapters[0], 'published-only')).toBe(true);
    expect(isChapterReadable(sampleChapters[1], 'published-only')).toBe(false);
    expect(
      isChapterReadable({ id: 'x', title: 'X', file: 'x.txt' }, 'published-only'),
    ).toBe(false);
    expect(listReadableChapters(sampleChapters, 'published-only').map((c) => c.id)).toEqual([
      'ch01',
      'ch03',
    ]);
  });

  it('all-except-draft keeps soon chapters readable', () => {
    expect(isChapterReadable(sampleChapters[1], 'all-except-draft')).toBe(true);
    expect(isChapterReadable(sampleChapters[3], 'all-except-draft')).toBe(false);
  });

  it('adjacentReadableIds skips soon under published-only', () => {
    const { prevId, nextId } = adjacentReadableIds(
      sampleChapters,
      'ch01',
      'published-only',
    );
    expect(prevId).toBeNull();
    expect(nextId).toBe('ch03');
  });
});

describe('progress labels', () => {
  it('formats like Piligrim thresholds', () => {
    const strings = resolveReaderStrings({
      progressDone: 'прочитано',
      progressPct: '~{pct}%',
    });
    expect(formatProgressLabel(null, strings)).toBeNull();
    expect(formatProgressLabel({ pct: 0.02 }, strings)).toBeNull();
    expect(formatProgressLabel({ pct: 0.4 }, strings)).toBe('~40%');
    expect(formatProgressLabel({ pct: 0.98 }, strings)).toBe('прочитано');
  });
});

describe('toc + chapter nav', () => {
  it('locks soon rows and builds prev/next with ghosts', () => {
    const toc = defaultTableOfContents({
      chapters: sampleChapters,
      progress: { ch01: { pct: 0.5 } },
      onNavigate: () => {},
      chapterAccess: 'published-only',
      strings: resolveReaderStrings({ soonLabel: 'скоро' }),
    });
    expect(toc).toContain('ps-toc-locked');
    expect(toc).toContain('скоро');
    expect(toc).toContain('#/chapter/ch01');
    expect(toc).not.toContain('#/chapter/ch02');

    const nav = defaultChapterNavHtml({
      chapters: sampleChapters,
      chapterId: 'ch01',
      chapterAccess: 'published-only',
      strings: resolveReaderStrings({ soonLabel: 'скоро' }),
    });
    // Manifest-adjacent next is soon → ghost (Piligrim); gestures skip via adjacentReadableIds
    expect(nav).toContain('скоро →');
    expect(nav).not.toContain('Three');
  });
});
