export interface ReaderStrings {
  toolbarLabel: string;
  fontMinus: string;
  fontPlus: string;
  cycleTheme: string;
  moreSettings: string;
  spacingLabel: string;
  narrowColumn: string;
  hideChrome: string;
  continueMessage: string;
  continueYes: string;
  continueNo: string;
  prevChapter: string;
  nextChapter: string;
  closeLightbox: string;
  expandFigure: string;
  translate: string;
  original: string;
  /** TOC / locked chapter eyebrow */
  chaptersLabel: string;
  soonLabel: string;
  lockedEyebrow: string;
  lockedMessage: string;
  backToChapters: string;
  homeLink: string;
  /** Progress label when pct ≥ 0.97 */
  progressDone: string;
  /** Progress mid-read; `{pct}` → integer 0–100 */
  progressPct: string;
  continueCta: string;
  searchTitle: string;
  searchPlaceholder: string;
  searchEmpty: string;
  searchHint: string;
  searchIndexing: string;
}

export const defaultReaderStrings: ReaderStrings = {
  toolbarLabel: 'Reading settings',
  fontMinus: 'Decrease font size',
  fontPlus: 'Increase font size',
  cycleTheme: 'Cycle theme',
  moreSettings: 'More settings',
  spacingLabel: 'Line spacing',
  narrowColumn: 'Narrow column',
  hideChrome: 'Hide toolbar',
  continueMessage: 'You left off around ~{pct}%',
  continueYes: 'Continue',
  continueNo: 'Start over',
  prevChapter: 'Previous chapter',
  nextChapter: 'Next chapter',
  closeLightbox: 'Close',
  expandFigure: 'Expand illustration',
  translate: 'Translate',
  original: 'Original',
  chaptersLabel: 'Chapters',
  soonLabel: 'Soon',
  lockedEyebrow: 'Sealed',
  lockedMessage: 'This chapter will appear later.',
  backToChapters: '← Back to chapters',
  homeLink: 'Home →',
  progressDone: 'Done',
  progressPct: '~{pct}%',
  continueCta: 'Continue',
  searchTitle: 'Search',
  searchPlaceholder: 'Search chapters…',
  searchEmpty: 'No matches',
  searchHint: 'Ctrl/⌘ K · ↑↓ · Enter',
  searchIndexing: 'Indexing…',
};

export function resolveReaderStrings(
  partial?: Partial<ReaderStrings>,
): ReaderStrings {
  return { ...defaultReaderStrings, ...partial };
}

export interface ReaderNavigationOptions {
  gestures?: boolean;
  continuePrompt?: boolean;
}

export interface ReaderFeatureOptions {
  chrome?: boolean;
  lightbox?: boolean;
  progressBar?: boolean;
  search?: boolean;
  navigation?: ReaderNavigationOptions;
}

export function resolveReaderFeatures(
  features?: ReaderFeatureOptions,
): Required<ReaderFeatureOptions> & {
  navigation: Required<ReaderNavigationOptions>;
} {
  return {
    chrome: !!features?.chrome,
    lightbox: !!features?.lightbox,
    progressBar: features?.progressBar !== false,
    search: !!features?.search,
    navigation: {
      gestures: !!features?.navigation?.gestures,
      continuePrompt: !!features?.navigation?.continuePrompt,
    },
  };
}
