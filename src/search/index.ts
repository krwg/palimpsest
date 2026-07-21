import type { ParsedChapter } from '../types.js';
import { plainTextFromChapter, tokenize } from './tokenize.js';

export interface SearchDocument {
  chapterId: string;
  title: string;
  text: string;
}

export interface SearchHit {
  chapterId: string;
  title: string;
  score: number;
  /** Short excerpt around the first match */
  snippet: string;
}

export interface SearchIndex {
  docs: SearchDocument[];
  /** token → Map<docIndex, termFrequency> */
  inverted: Map<string, Map<number, number>>;
}

export function documentFromParsed(
  chapterId: string,
  parsed: ParsedChapter,
  fallbackTitle?: string,
): SearchDocument {
  const title = parsed.meta.title || fallbackTitle || chapterId;
  const text = plainTextFromChapter({
    title,
    when: parsed.meta.when,
    era: parsed.meta.era,
    body: parsed.body,
    glossary: parsed.glossary,
  });
  return { chapterId, title, text };
}

export function buildSearchIndex(docs: SearchDocument[]): SearchIndex {
  const inverted = new Map<string, Map<number, number>>();
  docs.forEach((doc, i) => {
    const seen = new Map<string, number>();
    for (const tok of tokenize(doc.text)) {
      seen.set(tok, (seen.get(tok) || 0) + 1);
    }
    for (const [tok, tf] of seen) {
      let postings = inverted.get(tok);
      if (!postings) {
        postings = new Map();
        inverted.set(tok, postings);
      }
      postings.set(i, tf);
    }
  });
  return { docs, inverted };
}

function snippetAround(text: string, queryTokens: string[], radius = 56): string {
  const lower = text.toLowerCase();
  let best = -1;
  for (const tok of queryTokens) {
    const idx = lower.indexOf(tok);
    if (idx >= 0 && (best < 0 || idx < best)) best = idx;
  }
  if (best < 0) {
    const cut = text.trim().slice(0, radius * 2);
    return cut.length < text.trim().length ? `${cut}…` : cut;
  }
  const start = Math.max(0, best - radius);
  const end = Math.min(text.length, best + radius);
  const slice = text.slice(start, end).trim();
  return `${start > 0 ? '…' : ''}${slice}${end < text.length ? '…' : ''}`;
}

/**
 * Ranked search: sum tf over query tokens; require at least one token hit.
 * Empty query → [].
 */
export function searchIndex(index: SearchIndex, query: string, limit = 20): SearchHit[] {
  const qTokens = [...new Set(tokenize(query))];
  if (!qTokens.length) return [];

  const scores = new Map<number, number>();
  for (const tok of qTokens) {
    const postings = index.inverted.get(tok);
    if (!postings) continue;
    for (const [docIdx, tf] of postings) {
      // Title matches get a boost via counting title tokens separately
      const doc = index.docs[docIdx];
      const titleHit = tokenize(doc.title).includes(tok) ? 4 : 0;
      scores.set(docIdx, (scores.get(docIdx) || 0) + tf + titleHit);
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([docIdx, score]) => {
      const doc = index.docs[docIdx];
      return {
        chapterId: doc.chapterId,
        title: doc.title,
        score,
        snippet: snippetAround(doc.text, qTokens),
      };
    });
}
