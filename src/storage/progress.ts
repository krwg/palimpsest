import type { ReaderStorageKeys } from '../types.js';

export const DEFAULT_STORAGE_KEYS: ReaderStorageKeys = {
  settings: 'palimpsest-reader',
  progress: 'palimpsest-progress',
};

export interface ReaderSettings {
  size: number;
  theme: string;
  spacing: 'compact' | 'normal' | 'spacious';
  narrow: boolean;
}

export function loadSettings(
  keys: ReaderStorageKeys = DEFAULT_STORAGE_KEYS,
): ReaderSettings {
  try {
    const s = JSON.parse(localStorage.getItem(keys.settings) || '{}') as Partial<ReaderSettings>;
    return {
      size: typeof s.size === 'number' ? s.size : 1,
      theme: s.theme || 'dossier',
      spacing: s.spacing || 'normal',
      narrow: !!s.narrow,
    };
  } catch {
    return { size: 1, theme: 'dossier', spacing: 'normal', narrow: false };
  }
}

export function saveSettings(
  settings: ReaderSettings,
  keys: ReaderStorageKeys = DEFAULT_STORAGE_KEYS,
): void {
  const { size, theme, spacing, narrow } = settings;
  localStorage.setItem(keys.settings, JSON.stringify({ size, theme, spacing, narrow }));
}

export interface ChapterProgress {
  scrollY: number;
  pct: number;
  ts: number;
}

export function loadAllProgress(
  keys: ReaderStorageKeys = DEFAULT_STORAGE_KEYS,
): Record<string, ChapterProgress> {
  try {
    return JSON.parse(localStorage.getItem(keys.progress) || '{}') as Record<
      string,
      ChapterProgress
    >;
  } catch {
    return {};
  }
}

export function saveChapterProgress(
  chId: string,
  scrollY: number,
  pct: number,
  keys: ReaderStorageKeys = DEFAULT_STORAGE_KEYS,
): void {
  const all = loadAllProgress(keys);
  all[chId] = { scrollY, pct, ts: Date.now() };
  localStorage.setItem(keys.progress, JSON.stringify(all));
}
