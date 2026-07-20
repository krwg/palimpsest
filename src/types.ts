/** Design tokens and public configuration types for Palimpsest. */

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
  /** Typewriter / exhibit hand layer (dossier aesthetic). */
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
  /** Credit line under figures; empty string disables. */
  figureCredit?: string;
  /** Stamp label on document exhibits (default: EYES ONLY). */
  exhibitStamp?: string;
  /** Allowed figure src prefix (default: assets/img/). */
  figureSrcPrefix?: string;
  /** Translate / original button labels for bilingual exhibits. */
  translateLabels?: { toTranslation: string; toOriginal: string };
  /** Override document exhibit HTML rendering (plugin slot). */
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
  /** Base URL for fetching chapters/manifest (trailing slash optional). */
  baseUrl?: string;
  manifestUrl?: string;
  theme?: PalimpsestTheme | PalimpsestTheme[];
  initialThemeName?: string;
  storageKeys?: Partial<ReaderStorageKeys>;
  render?: RenderOptions;
  slots?: Partial<import('./slots/types.js').PalimpsestSlots>;
  /** Register service worker at this URL (optional). */
  serviceWorkerUrl?: string;
  onRoute?: (route: { kind: 'home' | 'chapter'; chapterId?: string }) => void;
}
