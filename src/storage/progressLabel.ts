import type { ReaderStrings } from '../i18n/strings.js';

export interface ProgressLike {
  pct: number;
}

/**
 * Human label for chapter progress, matching Piligrim semantics:
 * null below 3%, done at ≥97%, otherwise ~N%.
 */
export function formatProgressLabel(
  progress: ProgressLike | null | undefined,
  strings: Pick<ReaderStrings, 'progressDone' | 'progressPct'>,
): string | null {
  if (!progress || progress.pct < 0.03) return null;
  if (progress.pct >= 0.97) return strings.progressDone;
  return strings.progressPct.replace(
    '{pct}',
    String(Math.round(progress.pct * 100)),
  );
}
