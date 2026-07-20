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
    navigation: {
      gestures: !!features?.navigation?.gestures,
      continuePrompt: !!features?.navigation?.continuePrompt,
    },
  };
}
