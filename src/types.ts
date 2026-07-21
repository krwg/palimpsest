export interface PalimpsestColorTokens {
  background: string;
  surface: string;
  proseBackground: string;
  text: { primary: string; secondary: string; muted: string };
  border: string;
  accent: { primary: string; soft: string; footnote: string; footnoteSoft: string };
}

export interface PalimpsestTypography {
  body: { family: string; size: string; lineHeight: number };
  heading: { family: string; weight: number };
  mono: { family: string };
  typewriter?: { family: string };
}

export interface PalimpsestLayout {
  maxWidth: string;
  narrowWidth: string;
  footnoteStyle: 'tooltip' | 'sidebar' | 'inline-expand';
  chapterNav: 'hash' | 'scroll' | 'paginated';
  radius: string;
}

export interface PalimpsestMotion {
  enabled: boolean;
  transitionDuration: string;
}

export interface PalimpsestTheme {
  name: string;
  icon?: string;
  colors: PalimpsestColorTokens;
  typography: PalimpsestTypography;
  layout: PalimpsestLayout;
  motion: PalimpsestMotion;
}

export interface ChapterMeta {
  title?: string;
  era?: string;
  when?: string;
  epigraph?: string;
  epigraph_source?: string;
  [key: string]: string | undefined;
}

export interface ParsedChapter {
  meta: ChapterMeta;
  glossary: Record<string, string>;
  body: string;
}

export interface ChapterManifestEntry {
  id: string;
  title: string;
  file: string;
  status?: string;
  number?: number | string;
  era?: string;
  when?: string;
  epigraph?: string;
  epigraph_source?: string;
  publish_date?: string;
  date_badge?: string;
  [key: string]: unknown;
}

export interface ChapterManifest {
  title?: string;
  chapters: ChapterManifestEntry[];
  [key: string]: unknown;
}

export interface RenderOptions {
  figureCredit?: string;
  exhibitStamp?: string;
  figureSrcPrefix?: string;
  translateLabels?: { toTranslation: string; toOriginal: string };
  renderExhibit?: (
    inner: string,
    glossary: Record<string, string>,
    options: RenderOptions,
  ) => string;
}

export interface ReaderStorageKeys {
  settings: string;
  progress: string;
}

export interface CreateReaderOptions {
  root: HTMLElement;
  baseUrl?: string;
  manifestUrl?: string;
  theme?: PalimpsestTheme | PalimpsestTheme[];
  initialThemeName?: string;
  storageKeys?: Partial<ReaderStorageKeys>;
  render?: RenderOptions;
  slots?: Partial<import('./slots/types.js').PalimpsestSlots>;
  serviceWorkerUrl?: string;
  /** When false, skip SKIP_WAITING + reload (default true when SW url set). */
  serviceWorkerAutoUpdate?: boolean;
  /**
   * Which chapters are navigable.
   * Default `published-only` (Piligrim). Use `all-except-draft` for older demos.
   */
  chapterAccess?: import('./manifest/access.js').ChapterAccessPolicy;
  /** Prefetch next readable chapter file (default true). */
  prefetchNext?: boolean;
  /**
   * Optional page meta updater. When set, called on home + chapter routes.
   * Pass `setPageMeta` or a host wrapper that adds brand title suffixes.
   */
  pageMeta?: (input: import('./browser/pageMeta.js').PageMetaInput & {
    kind: 'home' | 'chapter' | 'locked';
    chapterId?: string;
  }) => void;
  onRoute?: (route: { kind: 'home' | 'chapter' | 'locked'; chapterId?: string }) => void;
  chrome?: boolean;
  lightbox?: boolean;
  progressBar?: boolean;
  /** Full-text search overlay (Ctrl/⌘ K). Default off. */
  search?: boolean;
  /** Append prev/next chapter footer (default true). */
  chapterNav?: boolean;
  navigation?: import('./i18n/strings.js').ReaderNavigationOptions;
  strings?: Partial<import('./i18n/strings.js').ReaderStrings>;
}
