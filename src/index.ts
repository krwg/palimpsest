export type {
  PalimpsestTheme,
  PalimpsestColorTokens,
  PalimpsestTypography,
  PalimpsestLayout,
  PalimpsestMotion,
  ChapterMeta,
  ParsedChapter,
  ChapterManifest,
  ChapterManifestEntry,
  RenderOptions,
  CreateReaderOptions,
  ReaderStorageKeys,
} from './types.js';

export { ENGINE_NAME, ENGINE_SHORT_NAME, PalST } from './brand.js';
export { parseChapter, parseMetaBlock, extractGlossary } from './parse/chapter.js';
export { renderInline, escapeHTML, linkTerms } from './render/inline.js';
export { renderBody } from './render/body.js';
export { renderExhibit, bindExhibitTranslate } from './render/exhibit.js';
export { renderFigure, parseFigureInner, safeFigureSrc } from './render/figure.js';
export {
  bindFootnotes,
  parseTooltipDef,
  cleanTooltipText,
} from './footnotes/tooltip.js';
export {
  parseHash,
  chapterHash,
  startHashRouter,
  type HashRoute,
} from './router/hash.js';
export {
  loadSettings,
  saveSettings,
  loadAllProgress,
  saveChapterProgress,
  DEFAULT_STORAGE_KEYS,
} from './storage/progress.js';
export { createServiceWorkerSource } from './sw/createServiceWorkerSource.js';
export { applyTheme, themeToCssVars, legacyThemeClass, PILIGRIM_THEME_CLASS } from './theme/applyTheme.js';
export {
  dossierTheme,
  paperTheme,
  sepiaTheme,
  nightTheme,
  themePresets,
} from './theme/presets.js';
export {
  defaultSlots,
  defaultRenderChapterHtml,
  defaultFootnoteRenderer,
  defaultDocumentExhibit,
  defaultTableOfContents,
  defaultChapterTransition,
} from './slots/defaults.js';
export type { PalimpsestSlots } from './slots/types.js';
export { createReader, type PalimpsestReader } from './createReader.js';
export {
  defaultReaderStrings,
  resolveReaderStrings,
  resolveReaderFeatures,
  type ReaderStrings,
  type ReaderNavigationOptions,
  type ReaderFeatureOptions,
} from './i18n/strings.js';
export { mountReaderChrome } from './chrome/toolbar.js';
export { bindFigureLightbox } from './media/lightbox.js';
export {
  showContinuePrompt,
  bindChapterGestures,
} from './navigation/continue.js';
