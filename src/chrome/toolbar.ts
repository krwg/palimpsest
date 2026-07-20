import type { ReaderStrings } from '../i18n/strings.js';
import type { ReaderSettings } from '../storage/progress.js';
import { saveSettings } from '../storage/progress.js';
import type { ReaderStorageKeys } from '../types.js';
import { applyTheme } from '../theme/applyTheme.js';
import type { PalimpsestTheme } from '../types.js';

const THEME_ICON: Record<string, string> = {
  dossier: '◐',
  paper: '○',
  sepia: '◑',
  night: '●',
  white: '○',
};

function spacingValue(spacing: ReaderSettings['spacing']): number {
  return { compact: 1.55, normal: 1.75, spacious: 2 }[spacing] || 1.75;
}

export interface ChromeController {
  apply: () => void;
  destroy: () => void;
}

export function mountReaderChrome(options: {
  settings: ReaderSettings;
  storageKeys: ReaderStorageKeys;
  strings: ReaderStrings;
  themes: Record<string, PalimpsestTheme>;
  themeOrder?: string[];
  onSettingsChange?: (settings: ReaderSettings) => void;
}): ChromeController {
  const {
    settings,
    storageKeys,
    strings,
    themes,
    onSettingsChange,
  } = options;
  const themeOrder =
    options.themeOrder ??
    Object.keys(themes).filter((n) => themes[n]);

  document.getElementById('ps-reader-bar')?.remove();
  document.getElementById('ps-reader-reveal')?.remove();

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="ps-reader-bar reader-bar" id="ps-reader-bar" role="toolbar" aria-label="${strings.toolbarLabel}">
      <div class="reader-bar-compact">
        <button type="button" id="ps-font-minus" aria-label="${strings.fontMinus}">A−</button>
        <span class="reader-size-label">${Math.round(settings.size * 100)}%</span>
        <button type="button" id="ps-font-plus" aria-label="${strings.fontPlus}">A+</button>
        <button type="button" id="ps-cycle-theme" aria-label="${strings.cycleTheme}">${THEME_ICON[settings.theme] || '◐'}</button>
        <button type="button" id="ps-reader-more" aria-label="${strings.moreSettings}" aria-expanded="false">⋯</button>
      </div>
      <div class="reader-popover" id="ps-reader-popover" hidden>
        <p class="reader-popover-label">${strings.spacingLabel}</p>
        <div class="reader-popover-row">
          <button type="button" data-spacing="compact" class="${settings.spacing === 'compact' ? 'active' : ''}">S</button>
          <button type="button" data-spacing="normal" class="${settings.spacing === 'normal' ? 'active' : ''}">M</button>
          <button type="button" data-spacing="spacious" class="${settings.spacing === 'spacious' ? 'active' : ''}">L</button>
        </div>
        <button type="button" id="ps-toggle-narrow" class="reader-popover-item${settings.narrow ? ' active' : ''}">${strings.narrowColumn}</button>
        <button type="button" id="ps-toggle-chrome" class="reader-popover-item${settings.chromeHidden ? ' active' : ''}">${strings.hideChrome}</button>
      </div>
    </div>
    <div class="reader-reveal-zone" id="ps-reader-reveal" aria-hidden="true"></div>`;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  let popoverOpen = false;
  let chromeHideTimer = 0;

  function persist() {
    saveSettings(settings, storageKeys);
    onSettingsChange?.(settings);
  }

  function apply() {
    const body = document.body;
    body.classList.add('ps-in-reader', 'in-reader');
    body.classList.toggle('reader-narrow', settings.narrow);
    body.classList.toggle('chrome-hidden', settings.chromeHidden);
    const theme = themes[settings.theme];
    if (theme) applyTheme(theme, body);
    const prose = document.querySelector('.reader .prose, .ps-prose') as HTMLElement | null;
    if (prose) {
      prose.style.fontSize = `${(1.05 * settings.size).toFixed(2)}rem`;
      prose.style.lineHeight = String(spacingValue(settings.spacing));
    }
    document.querySelectorAll('[data-spacing]').forEach((btn) => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.spacing === settings.spacing);
    });
    const themeBtn = document.getElementById('ps-cycle-theme');
    if (themeBtn) themeBtn.textContent = THEME_ICON[settings.theme] || '◐';
    const narrowBtn = document.getElementById('ps-toggle-narrow');
    if (narrowBtn) narrowBtn.classList.toggle('active', settings.narrow);
    const chromeBtn = document.getElementById('ps-toggle-chrome');
    if (chromeBtn) chromeBtn.classList.toggle('active', settings.chromeHidden);
    const sizeLabel = document.querySelector('.reader-size-label');
    if (sizeLabel) sizeLabel.textContent = `${Math.round(settings.size * 100)}%`;
  }

  function closePopover() {
    popoverOpen = false;
    const pop = document.getElementById('ps-reader-popover');
    const more = document.getElementById('ps-reader-more');
    if (pop) pop.hidden = true;
    if (more) more.setAttribute('aria-expanded', 'false');
  }

  document.getElementById('ps-font-minus')!.onclick = () => {
    settings.size = Math.max(0.75, settings.size - 0.08);
    persist();
    apply();
  };
  document.getElementById('ps-font-plus')!.onclick = () => {
    settings.size = Math.min(1.55, settings.size + 0.08);
    persist();
    apply();
  };
  document.getElementById('ps-cycle-theme')!.onclick = () => {
    const i = themeOrder.indexOf(settings.theme);
    settings.theme = themeOrder[(i + 1) % themeOrder.length] ?? settings.theme;
    persist();
    apply();
  };
  document.getElementById('ps-reader-more')!.onclick = (e) => {
    e.stopPropagation();
    popoverOpen = !popoverOpen;
    const pop = document.getElementById('ps-reader-popover');
    if (pop) pop.hidden = !popoverOpen;
    document.getElementById('ps-reader-more')!.setAttribute('aria-expanded', String(popoverOpen));
  };
  document.querySelectorAll('[data-spacing]').forEach((btn) => {
    (btn as HTMLElement).onclick = () => {
      settings.spacing = ((btn as HTMLElement).dataset.spacing || 'normal') as ReaderSettings['spacing'];
      persist();
      apply();
      closePopover();
    };
  });
  document.getElementById('ps-toggle-narrow')!.onclick = () => {
    settings.narrow = !settings.narrow;
    persist();
    apply();
  };
  document.getElementById('ps-toggle-chrome')!.onclick = () => {
    settings.chromeHidden = !settings.chromeHidden;
    apply();
    closePopover();
  };
  document.getElementById('ps-reader-reveal')!.onclick = () => {
    document.body.classList.remove('chrome-hidden');
    window.clearTimeout(chromeHideTimer);
    chromeHideTimer = window.setTimeout(() => {
      if (settings.chromeHidden) document.body.classList.add('chrome-hidden');
    }, 4000);
  };

  const onDocClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (popoverOpen && !t.closest?.('#ps-reader-bar')) closePopover();
  };
  document.addEventListener('click', onDocClick);

  apply();

  return {
    apply,
    destroy() {
      document.removeEventListener('click', onDocClick);
      window.clearTimeout(chromeHideTimer);
      document.getElementById('ps-reader-bar')?.remove();
      document.getElementById('ps-reader-reveal')?.remove();
      document.body.classList.remove('ps-in-reader', 'in-reader', 'chrome-hidden', 'reader-narrow');
    },
  };
}
