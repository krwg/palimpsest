import type { RenderOptions } from '../types.js';
import { escapeHTML } from './inline.js';

export function parseFigureInner(
  inner: string,
): { src: string; caption: string; tag: string } | null {
  const normalized = inner.replace(/\r\n/g, '\n').trim();
  if (!normalized) return null;
  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 1) {
    const m = lines[0].match(/^(\S+)\s+(.+)$/);
    if (m && m[1].startsWith('assets/')) {
      return { src: m[1], caption: m[2], tag: '' };
    }
    return null;
  }
  let tag = '';
  let caption = '';
  if (lines.length >= 3) {
    tag = lines[lines.length - 1];
    caption = lines.slice(1, -1).join(' ');
  } else {
    caption = lines.slice(1).join(' ');
  }
  return { src: lines[0], caption, tag };
}

export function safeFigureSrc(
  src: string,
  prefix = 'assets/img/',
): string | null {
  const s = src.trim();
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `^${escaped}[a-zA-Z0-9._/-]+\\.(png|jpe?g|webp|svg)$`,
    'i',
  );
  if (!re.test(s)) return null;
  return s;
}

export function renderFigure(inner: string, options: RenderOptions = {}): string {
  const parsed = parseFigureInner(inner);
  if (!parsed) return '';
  const src = safeFigureSrc(parsed.src, options.figureSrcPrefix ?? 'assets/img/');
  if (!src) return '';
  const { caption, tag } = parsed;
  const alt = caption || tag || '';
  const tagHtml = tag ? `<span class="figure-tag">${escapeHTML(tag)}</span>` : '';
  const capHtml = caption ? `<figcaption>${escapeHTML(caption)}</figcaption>` : '';
  const credit =
    options.figureCredit === undefined
      ? ''
      : options.figureCredit
        ? `<p class="figure-credit">${escapeHTML(options.figureCredit)}</p>`
        : '';
  return `<figure class="chapter-figure ps-figure">${tagHtml}<button type="button" class="chapter-figure-btn" aria-label="Expand illustration"><img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async"></button>${capHtml}${credit}</figure>`;
}
