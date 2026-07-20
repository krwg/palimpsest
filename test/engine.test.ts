import { describe, expect, it } from 'vitest';
import { parseChapter } from '../src/parse/chapter.js';
import { renderBody } from '../src/render/body.js';
import { renderInline } from '../src/render/inline.js';
import { parseHash, chapterHash } from '../src/router/hash.js';
import { themeToCssVars } from '../src/theme/applyTheme.js';
import { dossierTheme } from '../src/theme/presets.js';
import { createServiceWorkerSource } from '../src/sw/createServiceWorkerSource.js';
import { ENGINE_NAME, ENGINE_SHORT_NAME, PalST } from '../src/brand.js';
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
