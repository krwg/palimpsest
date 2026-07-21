// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReader } from '../src/createReader.js';
import { mountReaderChrome } from '../src/chrome/toolbar.js';
import {
  DEFAULT_STORAGE_KEYS,
  loadSettings,
  saveSettings,
  saveChapterProgress,
  loadAllProgress,
} from '../src/storage/progress.js';
import { renderExhibit, bindExhibitTranslate } from '../src/render/exhibit.js';
import { applyTheme, legacyThemeClass } from '../src/theme/applyTheme.js';
import { dossierTheme, paperTheme, nightTheme } from '../src/theme/presets.js';
import { resolveReaderStrings } from '../src/i18n/strings.js';

const chapterTxt = `::chapter::
title: Demo
::/chapter::

Hello term[[1]].

[[1]]: term — note
`;

describe('legacyThemeClass', () => {
  it('maps PalST names to Piligrim CSS class suffixes', () => {
    expect(legacyThemeClass('dossier')).toBe('paper');
    expect(legacyThemeClass('paper')).toBe('white');
    expect(legacyThemeClass('night')).toBe('night');
    expect(legacyThemeClass('custom')).toBe('custom');
  });

  it('applyTheme sets data-ps-theme and legacy class', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    applyTheme(dossierTheme, el);
    expect(el.dataset.psTheme).toBe('dossier');
    expect(el.classList.contains('theme-paper')).toBe(true);
    applyTheme(paperTheme, el);
    expect(el.dataset.psTheme).toBe('paper');
    expect(el.classList.contains('theme-white')).toBe(true);
    expect(el.classList.contains('theme-paper')).toBe(false);
    el.remove();
  });
});

describe('storage/progress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips settings including chromeHidden', () => {
    saveSettings(
      {
        size: 1.2,
        theme: 'night',
        spacing: 'spacious',
        narrow: true,
        chromeHidden: true,
      },
      DEFAULT_STORAGE_KEYS,
    );
    const loaded = loadSettings(DEFAULT_STORAGE_KEYS);
    expect(loaded.theme).toBe('night');
    expect(loaded.narrow).toBe(true);
    expect(loaded.chromeHidden).toBe(true);
    expect(loaded.size).toBe(1.2);
  });

  it('stores chapter progress by id', () => {
    saveChapterProgress('ch01', 120, 0.4, DEFAULT_STORAGE_KEYS);
    expect(loadAllProgress(DEFAULT_STORAGE_KEYS).ch01).toMatchObject({
      scrollY: 120,
      pct: 0.4,
    });
  });
});

describe('render/exhibit', () => {
  it('renders stamp and translate toggle', () => {
    const html = renderExhibit(
      '::label:: DOC\n\nEnglish line.\n\n::translate::\n\nRussian line.',
      {},
      { exhibitStamp: 'CLASSIFIED', translateLabels: { toTranslation: 'TR', toOriginal: 'OR' } },
    );
    expect(html).toContain('CLASSIFIED');
    expect(html).toContain('exhibit-wrap');
    expect(html).toContain('TR');

    const root = document.createElement('div');
    root.innerHTML = html;
    document.body.appendChild(root);
    bindExhibitTranslate(root, { toTranslation: 'TR', toOriginal: 'OR' });
    const btn = root.querySelector('.exhibit-translate-btn') as HTMLButtonElement;
    const wrap = root.querySelector('.exhibit-wrap') as HTMLElement;
    expect(wrap.dataset.exhibitLang).toBe('en');
    btn.click();
    expect(wrap.dataset.exhibitLang).toBe('ru');
    expect(btn.textContent).toBe('OR');
    root.remove();
  });
});

describe('chrome/toolbar', () => {
  afterEach(() => {
    document.getElementById('ps-reader-bar')?.remove();
    document.getElementById('ps-reader-reveal')?.remove();
    localStorage.clear();
    document.body.className = '';
  });

  it('mounts, applies theme icon from theme.icon, and destroys cleanly', () => {
    const settings = loadSettings(DEFAULT_STORAGE_KEYS);
    settings.theme = 'night';
    const chrome = mountReaderChrome({
      settings,
      storageKeys: DEFAULT_STORAGE_KEYS,
      strings: resolveReaderStrings(),
      themes: { dossier: dossierTheme, night: nightTheme, paper: paperTheme },
    });
    expect(document.getElementById('ps-reader-bar')).toBeTruthy();
    expect(document.getElementById('ps-cycle-theme')?.textContent).toBe('●');
    chrome.destroy();
    expect(document.getElementById('ps-reader-bar')).toBeNull();
    expect(document.body.classList.contains('ps-in-reader')).toBe(false);
  });
});

describe('createReader', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('manifest.json')) {
          return new Response(
            JSON.stringify({
              title: 'Test',
              chapters: [
                { id: 'ch01', title: 'One', file: 'ch01.txt', status: 'published' },
                { id: 'ch02', title: 'Two', file: 'ch02.txt', status: 'soon' },
                { id: 'ch03', title: 'Three', file: 'ch03.txt', status: 'published' },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response(chapterTxt, { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('routes home → chapter → destroy without leftover chrome/progress', async () => {
    const root = document.getElementById('app')!;
    const reader = await createReader({
      root,
      baseUrl: 'https://example.test/',
      chrome: true,
      lightbox: true,
      navigation: { gestures: true, continuePrompt: false },
      theme: [dossierTheme, paperTheme],
    });

    await vi.waitFor(() => {
      expect(root.querySelector('.ps-home, .ps-toc')).toBeTruthy();
    });

    location.hash = '#/chapter/ch01';
    window.dispatchEvent(new Event('hashchange'));
    await vi.waitFor(() => {
      expect(root.querySelector('.ps-reader, .reader')).toBeTruthy();
    });
    expect(document.getElementById('ps-reader-bar')).toBeTruthy();
    expect(document.querySelector('.ps-nav-zone, .nav-zone')).toBeTruthy();

    location.hash = '#/';
    window.dispatchEvent(new Event('hashchange'));
    await vi.waitFor(() => {
      expect(root.querySelector('.ps-home')).toBeTruthy();
    });

    reader.destroy();
    expect(document.getElementById('ps-reader-bar')).toBeNull();
    expect(document.getElementById('ps-read-progress-track')).toBeNull();
    expect(document.querySelector('.ps-nav-zone, .nav-zone')).toBeNull();
  });

  it('renders locked page for soon chapters and chapter-nav for published', async () => {
    const root = document.getElementById('app')!;
    const reader = await createReader({
      root,
      baseUrl: 'https://example.test/',
      strings: { soonLabel: 'скоро', lockedEyebrow: 'Засекречено' },
    });

    await vi.waitFor(() => {
      expect(root.querySelector('.ps-toc-locked')).toBeTruthy();
    });

    location.hash = '#/chapter/ch02';
    window.dispatchEvent(new Event('hashchange'));
    await vi.waitFor(() => {
      expect(root.querySelector('.ps-locked-page, .locked-page')).toBeTruthy();
    });
    expect(root.textContent).toContain('Засекречено');

    location.hash = '#/chapter/ch01';
    window.dispatchEvent(new Event('hashchange'));
    await vi.waitFor(() => {
      expect(root.querySelector('.ps-chapter-nav, .chapter-nav')).toBeTruthy();
    });
    expect(root.querySelector('.ps-chapter-nav')?.textContent).toMatch(/скоро/);
    // Prefetch targets next *readable* chapter (skips soon), not manifest-adjacent
    expect(document.querySelector('link[data-ps-prefetch]')?.getAttribute('href')).toContain(
      'ch03.txt',
    );

    location.hash = '#/chapter/ch03';
    window.dispatchEvent(new Event('hashchange'));
    await vi.waitFor(() => {
      expect(root.querySelector('.ps-reader[data-chapter="ch03"], [data-chapter="ch03"]')).toBeTruthy();
    });
    expect(root.querySelector('.ps-chapter-nav')?.innerHTML).toContain('Home');

    reader.destroy();
  });
});
