import type { ChapterManifestEntry } from '../types.js';

/**
 * How createReader decides which chapters are navigable.
 * - `published-only` — Piligrim semantics: only `status === 'published'` (missing status = locked)
 * - `all-except-draft` — legacy engine default: anything except `draft`
 */
export type ChapterAccessPolicy = 'published-only' | 'all-except-draft';

export function isChapterReadable(
  entry: ChapterManifestEntry,
  policy: ChapterAccessPolicy = 'published-only',
): boolean {
  const status = entry.status;
  if (policy === 'all-except-draft') {
    return status !== 'draft';
  }
  return status === 'published';
}

export function listReadableChapters(
  chapters: ChapterManifestEntry[],
  policy: ChapterAccessPolicy = 'published-only',
): ChapterManifestEntry[] {
  return chapters.filter((c) => isChapterReadable(c, policy));
}

export function adjacentReadableIds(
  chapters: ChapterManifestEntry[],
  chapterId: string,
  policy: ChapterAccessPolicy = 'published-only',
): { prevId: string | null; nextId: string | null; nextEntry: ChapterManifestEntry | null } {
  const readable = listReadableChapters(chapters, policy);
  const idx = readable.findIndex((c) => c.id === chapterId);
  const prevId = idx > 0 ? readable[idx - 1].id : null;
  const nextEntry =
    idx >= 0 && idx < readable.length - 1 ? readable[idx + 1] : null;
  return { prevId, nextId: nextEntry?.id ?? null, nextEntry };
}
