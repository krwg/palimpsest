import type { ParsedChapter, RenderOptions, ChapterManifestEntry } from '../types.js';
import { renderBody } from '../render/body.js';
import { renderExhibit } from '../render/exhibit.js';
import { bindFootnotes } from '../footnotes/tooltip.js';
import { escapeHTML, renderInline } from '../render/inline.js';
import {
  isChapterReadable,
  type ChapterAccessPolicy,
} from '../manifest/access.js';
import { formatProgressLabel } from '../storage/progressLabel.js';
import type { ReaderStrings } from '../i18n/strings.js';
import { defaultReaderStrings } from '../i18n/strings.js';

export interface FootnoteRendererContext {
  container: ParentNode;
  glossary: Record<string, string>;
}

export interface DocumentExhibitContext {
  inner: string;
  glossary: Record<string, string>;
  options: RenderOptions;
}

export interface TableOfContentsContext {
  chapters: ChapterManifestEntry[];
  progress: Record<string, { pct: number }>;
  onNavigate: (chapterId: string) => void;
  chapterAccess?: ChapterAccessPolicy;
  strings?: Partial<ReaderStrings>;
}

export interface ChapterTransitionContext {
  root: HTMLElement;
  html: string;
}

export interface ChapterNavContext {
  chapters: ChapterManifestEntry[];
  chapterId: string;
  chapterAccess?: ChapterAccessPolicy;
  strings?: Partial<ReaderStrings>;
}

export interface PalimpsestSlots {
  FootnoteRenderer: (ctx: FootnoteRendererContext) => () => void;
  DocumentExhibit: (ctx: DocumentExhibitContext) => string;
  TableOfContents: (ctx: TableOfContentsContext) => string;
  ChapterTransition: (ctx: ChapterTransitionContext) => void | Promise<void>;
}

export function defaultFootnoteRenderer(ctx: FootnoteRendererContext): () => void {
  return bindFootnotes(ctx.container, ctx.glossary);
}

export function defaultDocumentExhibit(ctx: DocumentExhibitContext): string {
  return renderExhibit(ctx.inner, ctx.glossary, ctx.options);
}

export function defaultTableOfContents(ctx: TableOfContentsContext): string {
  const policy = ctx.chapterAccess ?? 'published-only';
  const strings = { ...defaultReaderStrings, ...ctx.strings };
  const items = ctx.chapters
    .map((c) => {
      const readable = isChapterReadable(c, policy);
      const pct = ctx.progress[c.id]?.pct ?? 0;
      const label = formatProgressLabel({ pct }, strings);
      const progressBit = label
        ? `<span class="ps-toc-progress-label">${escapeHTML(label)}</span>`
        : '';
      const bar = readable
        ? `<span class="ps-toc-progress" aria-hidden="true"><i style="width:${Math.round(pct * 100)}%"></i></span>`
        : '';
      if (!readable) {
        return `<li class="ps-toc-locked"><span class="ps-toc-title">${escapeHTML(c.title || c.id)}</span><em class="ps-toc-status">${escapeHTML(strings.soonLabel)}</em></li>`;
      }
      return `<li><a href="#/chapter/${encodeURIComponent(c.id)}">${escapeHTML(c.title || c.id)}</a>${progressBit}${bar}</li>`;
    })
    .join('');
  return `<nav class="ps-toc" aria-label="${escapeHTML(strings.chaptersLabel)}"><ol>${items}</ol></nav>`;
}

export function defaultChapterTransition(ctx: ChapterTransitionContext): void {
  ctx.root.innerHTML = ctx.html;
}

export function defaultChapterNavHtml(ctx: ChapterNavContext): string {
  const policy = ctx.chapterAccess ?? 'published-only';
  const strings = { ...defaultReaderStrings, ...ctx.strings };
  const idx = ctx.chapters.findIndex((c) => c.id === ctx.chapterId);
  const prev = idx > 0 ? ctx.chapters[idx - 1] : null;
  const next = idx >= 0 && idx < ctx.chapters.length - 1 ? ctx.chapters[idx + 1] : null;
  const prevReadable = prev && isChapterReadable(prev, policy);
  const nextReadable = next && isChapterReadable(next, policy);

  const left = prev
    ? prevReadable
      ? `<a href="#/chapter/${encodeURIComponent(prev.id)}">← ${escapeHTML(prev.title || prev.id)}</a>`
      : `<span class="ps-nav-ghost">← ${escapeHTML(strings.soonLabel)}</span>`
    : '';
  const right = next
    ? nextReadable
      ? `<a href="#/chapter/${encodeURIComponent(next.id)}">${escapeHTML(next.title || next.id)} →</a>`
      : `<span class="ps-nav-ghost">${escapeHTML(strings.soonLabel)} →</span>`
    : `<a href="#/">${escapeHTML(strings.homeLink)}</a>`;

  return `<nav class="ps-chapter-nav chapter-nav" aria-label="${escapeHTML(strings.chaptersLabel)}"><div>${left}</div><div>${right}</div></nav>`;
}

export function defaultLockedChapterHtml(
  entry: ChapterManifestEntry,
  strings: ReaderStrings = defaultReaderStrings,
): string {
  return `<div class="ps-locked-page locked-page reader">
  <p class="ps-eyebrow eyebrow">${escapeHTML(strings.lockedEyebrow)}</p>
  <h1>${escapeHTML(entry.title || entry.id)}</h1>
  <p>${escapeHTML(strings.lockedMessage)}</p>
  <p><a href="#/">${escapeHTML(strings.backToChapters)}</a></p>
</div>`;
}

export function defaultRenderChapterHtml(
  parsed: ParsedChapter,
  options: RenderOptions = {},
  extras: {
    entry?: ChapterManifestEntry;
    chapterNavHtml?: string;
  } = {},
): string {
  const { meta, glossary, body } = parsed;
  const entry = extras.entry;
  const titleText = meta.title || entry?.title;
  const title = titleText
    ? `<h1 class="ps-chapter-title">${escapeHTML(titleText)}</h1>`
    : '';
  const eraRaw = meta.era || entry?.era;
  const era = eraRaw
    ? `<p class="ps-chapter-era chapter-era">${escapeHTML(eraRaw)}</p>`
    : '';
  const whenRaw = meta.when || entry?.when;
  const when = whenRaw
    ? `<p class="ps-chapter-when when">${escapeHTML(whenRaw)}</p>`
    : '';
  const number =
    entry?.number != null
      ? `<p class="ps-chapter-number chapter-badge">№ ${String(entry.number).padStart(2, '0')}</p>`
      : '';
  let epigraph = '';
  if (meta.epigraph) {
    const src = meta.epigraph_source
      ? `<cite>${escapeHTML(meta.epigraph_source)}</cite>`
      : '';
    epigraph = `<blockquote class="ps-epigraph epigraph"><p>${renderInline(meta.epigraph, glossary)}</p>${src}</blockquote>`;
  }
  const prose = renderBody(body, glossary, options);
  const nav = extras.chapterNavHtml ?? '';
  return `<article class="reader ps-reader" data-chapter="${escapeHTML(entry?.id || '')}"><header class="ps-chapter-header chapter-head">${number}${era}${title}${when}</header>${epigraph}<div class="prose ps-prose">${prose}</div>${nav}</article>`;
}

export const defaultSlots: PalimpsestSlots = {
  FootnoteRenderer: defaultFootnoteRenderer,
  DocumentExhibit: defaultDocumentExhibit,
  TableOfContents: defaultTableOfContents,
  ChapterTransition: defaultChapterTransition,
};
