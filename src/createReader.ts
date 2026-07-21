import type {
  ChapterManifest,
  CreateReaderOptions,
  PalimpsestTheme,
  ReaderStorageKeys,
  RenderOptions,
} from './types.js';
import { applyTheme } from './theme/applyTheme.js';
import { dossierTheme, themePresets } from './theme/presets.js';
import { parseChapter } from './parse/chapter.js';
import { bindExhibitTranslate } from './render/exhibit.js';
import { chapterHash, startHashRouter, type HashRoute } from './router/hash.js';
import {
  DEFAULT_STORAGE_KEYS,
  loadAllProgress,
  loadSettings,
  saveChapterProgress,
  saveSettings,
  type ReaderSettings,
} from './storage/progress.js';
import {
  adjacentReadableIds,
  isChapterReadable,
  type ChapterAccessPolicy,
} from './manifest/access.js';
import {
  defaultChapterNavHtml,
  defaultLockedChapterHtml,
  defaultRenderChapterHtml,
  defaultSlots,
  type PalimpsestSlots,
} from './slots/defaults.js';
import {
  resolveReaderFeatures,
  resolveReaderStrings,
} from './i18n/strings.js';
import { mountReaderChrome, type ChromeController } from './chrome/toolbar.js';
import { bindFigureLightbox } from './media/lightbox.js';
import {
  bindChapterGestures,
  showContinuePrompt,
} from './navigation/continue.js';
import { setPrefetch } from './browser/prefetch.js';
import { registerServiceWorker } from './sw/registerServiceWorker.js';
import { legacyThemeClass } from './theme/applyTheme.js';

export interface PalimpsestReader {
  destroy: () => void;
  navigate: (chapterId: string | null) => void;
  getManifest: () => ChapterManifest | null;
  setTheme: (name: string) => void;
}

function resolveThemes(
  input?: PalimpsestTheme | PalimpsestTheme[],
): Record<string, PalimpsestTheme> {
  if (!input) return { ...themePresets };
  if (Array.isArray(input)) {
    const map: Record<string, PalimpsestTheme> = {};
    for (const t of input) map[t.name] = t;
    return map;
  }
  return { [input.name]: input };
}

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith('/') ? base : `${base}/`;
  return new URL(path.replace(/^\//, ''), b).href;
}

function chapterFileUrl(baseUrl: string, file: string): string {
  return joinUrl(baseUrl, file.startsWith('chapters/') ? file : `chapters/${file}`);
}

const THEME_COLORS: Record<string, string> = {
  dossier: '#e8e4dc',
  paper: '#f2f2f7',
  sepia: '#d9cfc0',
  night: '#0d0d0f',
};

export async function createReader(
  options: CreateReaderOptions,
): Promise<PalimpsestReader> {
  const root = options.root;
  const baseUrl = options.baseUrl ?? (typeof location !== 'undefined' ? location.href : '/');
  const manifestUrl = options.manifestUrl ?? joinUrl(baseUrl, 'chapters/manifest.json');
  const storageKeys: ReaderStorageKeys = {
    ...DEFAULT_STORAGE_KEYS,
    ...options.storageKeys,
  };
  const slots: PalimpsestSlots = { ...defaultSlots, ...options.slots };
  const features = resolveReaderFeatures({
    chrome: options.chrome,
    lightbox: options.lightbox,
    progressBar: options.progressBar,
    navigation: options.navigation,
  });
  const strings = resolveReaderStrings(options.strings);
  const chapterAccess: ChapterAccessPolicy =
    options.chapterAccess ?? 'published-only';
  const chapterNavEnabled = options.chapterNav !== false;
  const prefetchNext = options.prefetchNext !== false;
  const themes = resolveThemes(options.theme);
  let settings: ReaderSettings = loadSettings(storageKeys);
  if (options.initialThemeName) settings.theme = options.initialThemeName;
  if (!themes[settings.theme]) settings.theme = Object.keys(themes)[0] ?? dossierTheme.name;

  let manifest: ChapterManifest | null = null;
  let chapterCleanup: (() => void) | null = null;
  let scrollCleanup: (() => void) | null = null;
  let gestureCleanup: (() => void) | null = null;
  let lightboxCleanup: (() => void) | null = null;
  let chrome: ChromeController | null = null;

  function themeColorForSettings(): string {
    const legacy = legacyThemeClass(settings.theme);
    return (
      THEME_COLORS[settings.theme] ||
      THEME_COLORS[legacy] ||
      THEME_COLORS.dossier
    );
  }

  function applyActiveTheme() {
    const theme = themes[settings.theme] ?? dossierTheme;
    applyTheme(theme, document.body);
  }

  applyActiveTheme();

  if (features.chrome) {
    chrome = mountReaderChrome({
      settings,
      storageKeys,
      strings,
      themes,
      onSettingsChange: (next) => {
        settings = next;
      },
    });
  }

  if (options.serviceWorkerUrl) {
    registerServiceWorker(options.serviceWorkerUrl, {
      autoUpdate: options.serviceWorkerAutoUpdate !== false,
    });
  }

  async function ensureManifest(): Promise<ChapterManifest> {
    if (manifest) return manifest;
    const res = await fetch(manifestUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
    manifest = (await res.json()) as ChapterManifest;
    return manifest;
  }

  function clearChapterRuntime() {
    chapterCleanup?.();
    scrollCleanup?.();
    gestureCleanup?.();
    lightboxCleanup?.();
    chapterCleanup = null;
    scrollCleanup = null;
    gestureCleanup = null;
    lightboxCleanup = null;
    setPrefetch(null);
  }

  function renderHome(m: ChapterManifest) {
    clearChapterRuntime();
    document.body.classList.remove('ps-in-reader', 'in-reader');
    const progress = loadAllProgress(storageKeys);
    const toc = slots.TableOfContents({
      chapters: m.chapters,
      progress,
      chapterAccess,
      strings,
      onNavigate: (id) => {
        location.hash = chapterHash(id);
      },
    });
    const title = m.title
      ? `<h1 class="ps-site-title">${m.title}</h1>`
      : '';
    void slots.ChapterTransition({
      root,
      html: `<div class="ps-home">${title}${toc}</div>`,
    });
    options.pageMeta?.({
      kind: 'home',
      title: m.title || 'Reader',
      themeColor: themeColorForSettings(),
      path: '/',
    });
    options.onRoute?.({ kind: 'home' });
  }

  async function renderLocked(entry: ChapterManifest['chapters'][number]) {
    clearChapterRuntime();
    document.body.classList.remove('ps-in-reader', 'in-reader');
    chrome?.destroy();
    chrome = null;
    await slots.ChapterTransition({
      root,
      html: defaultLockedChapterHtml(entry, strings),
    });
    options.pageMeta?.({
      kind: 'locked',
      chapterId: entry.id,
      title: entry.title || entry.id,
      description: strings.lockedMessage,
      themeColor: themeColorForSettings(),
      path: `/chapter/${entry.id}`,
    });
    options.onRoute?.({ kind: 'locked', chapterId: entry.id });
  }

  async function renderChapter(chapterId: string) {
    const m = await ensureManifest();
    const entry = m.chapters.find((c) => c.id === chapterId);
    if (!entry) {
      renderHome(m);
      return;
    }
    if (!isChapterReadable(entry, chapterAccess)) {
      await renderLocked(entry);
      return;
    }

    const fileUrl = chapterFileUrl(baseUrl, entry.file);
    const res = await fetch(fileUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load chapter ${chapterId}`);
    const raw = await res.text();
    const parsed = parseChapter(raw, {
      title: entry.title,
      era: entry.era,
      when: entry.when,
      epigraph: entry.epigraph,
      epigraph_source: entry.epigraph_source,
    });
    const renderOpts: RenderOptions = {
      ...options.render,
      renderExhibit: (inner, glossary, opts) =>
        slots.DocumentExhibit({
          inner,
          glossary,
          options: opts,
        }),
    };

    const { prevId, nextId, nextEntry } = adjacentReadableIds(
      m.chapters,
      chapterId,
      chapterAccess,
    );
    const navHtml = chapterNavEnabled
      ? defaultChapterNavHtml({
          chapters: m.chapters,
          chapterId,
          chapterAccess,
          strings,
        })
      : '';

    const html = defaultRenderChapterHtml(parsed, renderOpts, {
      entry,
      chapterNavHtml: navHtml,
    });
    clearChapterRuntime();
    document.body.classList.add('ps-in-reader', 'in-reader');
    await slots.ChapterTransition({ root, html });

    if (features.chrome && !chrome) {
      chrome = mountReaderChrome({
        settings,
        storageKeys,
        strings,
        themes,
        onSettingsChange: (next) => {
          settings = next;
        },
      });
    }

    bindExhibitTranslate(root, {
      toTranslation: options.render?.translateLabels?.toTranslation ?? strings.translate,
      toOriginal: options.render?.translateLabels?.toOriginal ?? strings.original,
    });
    chapterCleanup = slots.FootnoteRenderer({
      container: root,
      glossary: parsed.glossary,
    });

    if (features.lightbox) {
      lightboxCleanup = bindFigureLightbox(root, strings);
    }

    if (features.chrome) {
      chrome?.apply();
    }

    if (prefetchNext && nextEntry) {
      setPrefetch(chapterFileUrl(baseUrl, nextEntry.file));
    }

    if (features.navigation.gestures) {
      gestureCleanup = bindChapterGestures({
        prevId,
        nextId,
        strings,
        go: (id) => {
          location.hash = chapterHash(id);
        },
      });
    }

    if (features.navigation.continuePrompt) {
      const saved = loadAllProgress(storageKeys)[chapterId];
      showContinuePrompt({
        chapterId,
        saved,
        strings,
        storageKeys,
        onProgress: (pct) => {
          const bar = document.getElementById('ps-read-progress');
          if (bar) bar.style.width = `${(pct * 100).toFixed(2)}%`;
        },
      });
    }

    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      if (features.progressBar) {
        const bar = document.getElementById('ps-read-progress');
        if (bar) bar.style.width = `${(pct * 100).toFixed(2)}%`;
      }
      window.clearTimeout((onScroll as unknown as { t?: number }).t);
      (onScroll as unknown as { t?: number }).t = window.setTimeout(() => {
        saveChapterProgress(chapterId, window.scrollY, pct, storageKeys);
      }, 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    scrollCleanup = () => window.removeEventListener('scroll', onScroll);

    if (features.progressBar && !document.getElementById('ps-read-progress-track')) {
      const track = document.createElement('div');
      track.id = 'ps-read-progress-track';
      track.className = 'ps-read-progress-track read-progress-track';
      track.innerHTML =
        '<div class="ps-read-progress read-progress" id="ps-read-progress"></div>';
      document.body.appendChild(track);
    }

    options.pageMeta?.({
      kind: 'chapter',
      chapterId,
      title: parsed.meta.title || entry.title,
      description: [entry.era, entry.when].filter(Boolean).join(' · '),
      themeColor: themeColorForSettings(),
      path: `/chapter/${chapterId}`,
    });
    options.onRoute?.({ kind: 'chapter', chapterId });
  }

  async function onRoute(route: HashRoute) {
    const m = await ensureManifest();
    if (route.kind === 'chapter') await renderChapter(route.chapterId);
    else renderHome(m);
  }

  const stopRouter = startHashRouter((route) => {
    void onRoute(route);
  });

  return {
    destroy() {
      stopRouter();
      clearChapterRuntime();
      chrome?.destroy();
      document.getElementById('ps-read-progress-track')?.remove();
      document.getElementById('ps-figure-lightbox')?.remove();
    },
    navigate(chapterId) {
      location.hash = chapterId ? chapterHash(chapterId) : '#/';
    },
    getManifest: () => manifest,
    setTheme(name) {
      if (!themes[name]) return;
      settings.theme = name;
      saveSettings(settings, storageKeys);
      applyActiveTheme();
    },
  };
}
