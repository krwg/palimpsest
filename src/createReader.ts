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
  defaultRenderChapterHtml,
  defaultSlots,
  type PalimpsestSlots,
} from './slots/defaults.js';

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
  const themes = resolveThemes(options.theme);
  let settings: ReaderSettings = loadSettings(storageKeys);
  if (options.initialThemeName) settings.theme = options.initialThemeName;
  if (!themes[settings.theme]) settings.theme = Object.keys(themes)[0] ?? dossierTheme.name;

  let manifest: ChapterManifest | null = null;
  let chapterCleanup: (() => void) | null = null;
  let scrollCleanup: (() => void) | null = null;

  function applyActiveTheme() {
    const theme = themes[settings.theme] ?? dossierTheme;
    applyTheme(theme, document.body);
  }

  applyActiveTheme();

  if (options.serviceWorkerUrl && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register(options.serviceWorkerUrl).catch(() => {});
  }

  async function ensureManifest(): Promise<ChapterManifest> {
    if (manifest) return manifest;
    const res = await fetch(manifestUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
    manifest = (await res.json()) as ChapterManifest;
    return manifest;
  }

  function renderHome(m: ChapterManifest) {
    chapterCleanup?.();
    scrollCleanup?.();
    chapterCleanup = null;
    scrollCleanup = null;
    const progress = loadAllProgress(storageKeys);
    const toc = slots.TableOfContents({
      chapters: m.chapters,
      progress,
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
    options.onRoute?.({ kind: 'home' });
  }

  async function renderChapter(chapterId: string) {
    const m = await ensureManifest();
    const entry = m.chapters.find((c) => c.id === chapterId);
    if (!entry) {
      renderHome(m);
      return;
    }
    const fileUrl = joinUrl(baseUrl, entry.file.startsWith('chapters/') ? entry.file : `chapters/${entry.file}`);
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
    const html = defaultRenderChapterHtml(parsed, renderOpts);
    chapterCleanup?.();
    scrollCleanup?.();
    await slots.ChapterTransition({ root, html });
    bindExhibitTranslate(root, options.render?.translateLabels);
    chapterCleanup = slots.FootnoteRenderer({
      container: root,
      glossary: parsed.glossary,
    });

    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      const bar = document.getElementById('ps-read-progress');
      if (bar) bar.style.width = `${(pct * 100).toFixed(2)}%`;
      window.clearTimeout((onScroll as unknown as { t?: number }).t);
      (onScroll as unknown as { t?: number }).t = window.setTimeout(() => {
        saveChapterProgress(chapterId, window.scrollY, pct, storageKeys);
      }, 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    scrollCleanup = () => window.removeEventListener('scroll', onScroll);

    if (!document.getElementById('ps-read-progress-track')) {
      const track = document.createElement('div');
      track.id = 'ps-read-progress-track';
      track.className = 'ps-read-progress-track read-progress-track';
      track.innerHTML = '<div class="ps-read-progress read-progress" id="ps-read-progress"></div>';
      document.body.appendChild(track);
    }

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
      chapterCleanup?.();
      scrollCleanup?.();
      document.getElementById('ps-read-progress-track')?.remove();
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
