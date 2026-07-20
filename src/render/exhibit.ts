import type { RenderOptions } from '../types.js';
import { escapeHTML, renderInline } from './inline.js';

const DEFAULTS: Required<
  Pick<RenderOptions, 'exhibitStamp' | 'translateLabels'>
> = {
  exhibitStamp: 'EYES ONLY',
  translateLabels: { toTranslation: 'Translate', toOriginal: 'Original' },
};

export function renderExhibit(
  inner: string,
  glossary: Record<string, string>,
  options: RenderOptions = {},
): string {
  const stamp = options.exhibitStamp ?? DEFAULTS.exhibitStamp;
  const labels = options.translateLabels ?? DEFAULTS.translateLabels;
  const parts = inner.trim().split(/\n\s*\n/);
  let epigraph = '';
  let meta = '';
  let hand: { meta: string; lines: string[] } | '' = '';
  const bodyEn: string[] = [];
  const bodyRu: string[] = [];
  const handRu: string[] = [];
  let mode: 'en' | 'ru' | 'hand' | 'hand-ru' = 'en';

  function ingestHandRuBlock(text: string) {
    if (!text) return;
    if (text.includes('::hand-meta::')) {
      const [ruPart, enPart] = text.split(/::hand-meta::\s*/);
      for (const line of ruPart.trim().split(/\n+/).filter(Boolean)) handRu.push(line);
      mode = 'hand';
      hand = { meta: '', lines: [] };
      for (const line of enPart.trim().split(/\n+/).filter(Boolean)) hand.lines.push(line);
      return;
    }
    for (const line of text.trim().split(/\n+/).filter(Boolean)) handRu.push(line);
  }

  for (const p of parts) {
    const tt = p.trim();
    if (!tt) continue;
    if (tt.startsWith('::label::')) {
      bodyEn.push(
        `<span class="ex-label">${escapeHTML(tt.replace('::label::', '').trim())}</span>`,
      );
    } else if (tt.startsWith('::epigraph::')) {
      epigraph = tt.replace('::epigraph::', '').trim();
    } else if (tt.startsWith('::meta::')) {
      meta = tt.replace('::meta::', '').trim();
    } else if (tt.startsWith('::translate::')) {
      mode = 'ru';
    } else if (tt.startsWith('::hand-ru::')) {
      mode = 'hand-ru';
      ingestHandRuBlock(tt.replace(/^::hand-ru::\s*/, ''));
    } else if (tt.startsWith('::hand-meta::')) {
      mode = 'hand';
      const rest = tt.replace(/^::hand-meta::\s*/, '');
      hand = { meta: '', lines: [] };
      if (rest) {
        for (const line of rest.trim().split(/\n+/).filter(Boolean)) hand.lines.push(line);
      }
    } else if (tt.startsWith('::hand::')) {
      mode = 'hand';
      hand = { meta: '', lines: [tt.replace('::hand::', '').trim()] };
    } else if (tt.startsWith('::margin::')) {
      mode = 'hand';
      hand = { meta: tt.replace('::margin::', '').trim(), lines: [] };
    } else if (mode === 'ru') {
      bodyRu.push(`<p>${renderInline(tt, glossary)}</p>`);
    } else if (mode === 'hand-ru') {
      handRu.push(tt);
    } else if (mode === 'hand' && hand && typeof hand === 'object') {
      hand.lines.push(tt);
    } else {
      bodyEn.push(`<p>${renderInline(tt, glossary)}</p>`);
    }
  }

  let epigraphHtml = '';
  if (epigraph) {
    const sep = epigraph.indexOf('|||');
    if (sep > 0) {
      const quote = epigraph.slice(0, sep);
      const cite = epigraph.slice(sep + 3);
      epigraphHtml = `<blockquote class="exhibit-epigraph"><p>${renderInline(quote, glossary)}</p><cite>${renderInline(cite, glossary)}</cite></blockquote>`;
    } else {
      epigraphHtml = `<blockquote class="exhibit-epigraph"><p>${renderInline(epigraph, glossary)}</p></blockquote>`;
    }
  }

  const metaHtml = `<div class="exhibit-meta${meta ? '' : ' exhibit-meta--stamp-only'}"><span class="ex-meta-stamp">${escapeHTML(stamp)}</span>${meta ? `<p>${escapeHTML(meta)}</p>` : ''}</div>`;

  let handEnHtml = '';
  if (hand && typeof hand === 'object' && hand.lines.length) {
    const innerHand = hand.lines.map((l) => `<p>${renderInline(l, glossary)}</p>`).join('');
    handEnHtml = `<div class="exhibit-hand exhibit-lang exhibit-lang-en">${innerHand}</div>`;
  }

  let handRuHtml = '';
  if (handRu.length) {
    const innerHand = handRu.map((l) => `<p>${renderInline(l, glossary)}</p>`).join('');
    handRuHtml = `<div class="exhibit-hand exhibit-lang exhibit-lang-ru" hidden>${innerHand}</div>`;
  }

  const hasRu = bodyRu.length > 0;
  const enBlock = `<div class="exhibit-body exhibit-lang exhibit-lang-en">${bodyEn.join('')}</div>`;
  const ruBlock = hasRu
    ? `<div class="exhibit-body exhibit-lang exhibit-lang-ru" hidden>${bodyRu.join('')}</div>`
    : '';
  const translateBtn = hasRu
    ? `<div class="exhibit-footer"><button type="button" class="exhibit-translate-btn" data-lang="en">${escapeHTML(labels.toTranslation)}</button></div>`
    : '';

  return `<div class="exhibit-wrap ps-exhibit" data-exhibit-lang="en">${epigraphHtml}<div class="exhibit-sheet">${metaHtml}${enBlock}${ruBlock}${handEnHtml}${handRuHtml}${translateBtn}</div></div>`;
}

export function bindExhibitTranslate(
  container: ParentNode,
  labels: { toTranslation: string; toOriginal: string } = DEFAULTS.translateLabels,
): void {
  container.querySelectorAll('.exhibit-translate-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = (btn as HTMLElement).closest('.exhibit-wrap');
      if (!wrap || !(wrap instanceof HTMLElement)) return;
      const showRu = wrap.dataset.exhibitLang === 'en';
      wrap.dataset.exhibitLang = showRu ? 'ru' : 'en';
      wrap.querySelectorAll('.exhibit-lang-en').forEach((el) => {
        (el as HTMLElement).hidden = showRu;
      });
      wrap.querySelectorAll('.exhibit-lang-ru').forEach((el) => {
        (el as HTMLElement).hidden = !showRu;
      });
      (btn as HTMLElement).textContent = showRu
        ? labels.toOriginal
        : labels.toTranslation;
    });
  });
}
