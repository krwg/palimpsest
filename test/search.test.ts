import { describe, expect, it } from 'vitest';
import { parseChapter } from '../src/parse/chapter.js';
import { tokenize, plainTextFromChapter } from '../src/search/tokenize.js';
import {
  buildSearchIndex,
  documentFromParsed,
  searchIndex,
} from '../src/search/index.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('search tokenize', () => {
  it('keeps unicode words and lowercases', () => {
    expect(tokenize('Молоко и FFI')).toEqual(['молоко', 'и', 'ffi']);
  });
});

describe('search index', () => {
  it('ranks chapter hits with snippets', () => {
    const raw = readFileSync(join(here, 'fixtures/sample-chapter.txt'), 'utf8');
    const parsed = parseChapter(raw);
    const docs = [
      documentFromParsed('sample', parsed),
      {
        chapterId: 'other',
        title: 'Unrelated',
        text: plainTextFromChapter({ title: 'Unrelated', body: 'Nothing about layers here.' }),
      },
    ];
    const index = buildSearchIndex(docs);
    const hits = searchIndex(index, 'dossier layer');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].chapterId).toBe('sample');
    expect(hits[0].snippet.toLowerCase()).toMatch(/dossier|layer/);
  });

  it('returns empty for blank query', () => {
    const index = buildSearchIndex([
      { chapterId: 'a', title: 'A', text: 'hello world' },
    ]);
    expect(searchIndex(index, '   ')).toEqual([]);
  });
});
