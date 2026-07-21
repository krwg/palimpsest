import type { SearchHit } from './index.js';
import type { ReaderStrings } from '../i18n/strings.js';
import { chapterHash } from '../router/hash.js';
import { escapeHTML } from '../render/inline.js';

export interface SearchOverlayOptions {
  strings: ReaderStrings;
  search: (query: string) => SearchHit[] | Promise<SearchHit[]>;
  onNavigate?: (chapterId: string) => void;
}

export interface SearchOverlayController {
  open: (initialQuery?: string) => void;
  close: () => void;
  destroy: () => void;
}

export function mountSearchOverlay(
  options: SearchOverlayOptions,
): SearchOverlayController {
  const root = document.createElement('div');
  root.id = 'ps-search-overlay';
  root.className = 'ps-search-overlay';
  root.hidden = true;
  root.innerHTML = `
    <div class="ps-search-dialog" role="dialog" aria-modal="true" aria-label="${escapeHTML(options.strings.searchTitle)}">
      <input type="search" class="ps-search-input" id="ps-search-input" placeholder="${escapeHTML(options.strings.searchPlaceholder)}" autocomplete="off" />
      <div class="ps-search-status" id="ps-search-status" aria-live="polite"></div>
      <ul class="ps-search-results" id="ps-search-results" role="listbox"></ul>
      <p class="ps-search-hint">${escapeHTML(options.strings.searchHint)}</p>
    </div>`;
  document.body.appendChild(root);

  const input = root.querySelector('#ps-search-input') as HTMLInputElement;
  const status = root.querySelector('#ps-search-status') as HTMLElement;
  const list = root.querySelector('#ps-search-results') as HTMLElement;
  let open = false;
  let seq = 0;
  let active = -1;
  let hits: SearchHit[] = [];

  function renderHits(next: SearchHit[]) {
    hits = next;
    active = next.length ? 0 : -1;
    if (!input.value.trim()) {
      status.textContent = '';
      list.innerHTML = '';
      return;
    }
    if (!next.length) {
      status.textContent = options.strings.searchEmpty;
      list.innerHTML = '';
      return;
    }
    status.textContent = '';
    list.innerHTML = next
      .map(
        (h, i) => `
      <li role="option" class="ps-search-hit${i === 0 ? ' is-active' : ''}" data-idx="${i}" data-id="${escapeHTML(h.chapterId)}">
        <strong>${escapeHTML(h.title)}</strong>
        <span>${escapeHTML(h.snippet)}</span>
      </li>`,
      )
      .join('');
  }

  async function runSearch() {
    const q = input.value;
    const my = ++seq;
    if (q.trim()) status.textContent = options.strings.searchIndexing;
    const result = await options.search(q);
    if (my !== seq) return;
    renderHits(result);
  }

  function go(chapterId: string) {
    close();
    if (options.onNavigate) options.onNavigate(chapterId);
    else location.hash = chapterHash(chapterId);
  }

  function setActive(i: number) {
    if (!hits.length) return;
    active = (i + hits.length) % hits.length;
    list.querySelectorAll('.ps-search-hit').forEach((el, idx) => {
      el.classList.toggle('is-active', idx === active);
    });
  }

  function onKey(e: KeyboardEvent) {
    if (!open) {
      const meta = e.metaKey || e.ctrlKey;
      if ((meta && e.key.toLowerCase() === 'k') || (e.key === '/' && !isTypingTarget(e.target))) {
        e.preventDefault();
        openOverlay();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active - 1);
      return;
    }
    if (e.key === 'Enter' && active >= 0 && hits[active]) {
      e.preventDefault();
      go(hits[active].chapterId);
    }
  }

  function isTypingTarget(t: EventTarget | null) {
    if (!(t instanceof HTMLElement)) return false;
    const tag = t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
  }

  function openOverlay(initialQuery = '') {
    open = true;
    root.hidden = false;
    document.body.classList.add('ps-search-open');
    input.value = initialQuery;
    void runSearch();
    requestAnimationFrame(() => input.focus());
  }

  function close() {
    open = false;
    root.hidden = true;
    document.body.classList.remove('ps-search-open');
    input.blur();
  }

  input.addEventListener('input', () => {
    void runSearch();
  });
  list.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest('.ps-search-hit') as HTMLElement | null;
    if (!li?.dataset.id) return;
    go(li.dataset.id);
  });
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });
  window.addEventListener('keydown', onKey);

  return {
    open: openOverlay,
    close,
    destroy() {
      window.removeEventListener('keydown', onKey);
      root.remove();
      document.body.classList.remove('ps-search-open');
    },
  };
}
