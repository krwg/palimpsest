import type { ParsedChapter, RenderOptions } from '../types.js';
import { renderBody } from '../render/body.js';
import { renderExhibit } from '../render/exhibit.js';
import { bindFootnotes } from '../footnotes/tooltip.js';
import { escapeHTML, renderInline } from '../render/inline.js';
import type { ChapterManifestEntry } from '../types.js';

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
}

export interface ChapterTransitionContext {
  root: HTMLElement;
  html: string;
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
  const items = ctx.chapters
    .filter((c) => c.status !== 'draft')
    .map((c) => {
      const pct = ctx.progress[c.id]?.pct ?? 0;
      const bar = `<span class="ps-toc-progress" aria-hidden="true"><i style="width:${Math.round(pct * 100)}%"></i></span>`;
      const status = c.status === 'published' || !c.status ? '' : ` <em class="ps-toc-status">${escapeHTML(String(c.status))}</em>`;
      return `<li><a href="#/chapter/${encodeURIComponent(c.id)}">${escapeHTML(c.title || c.id)}</a>${status}${bar}</li>`;
    })
    .join('');
  return `<nav class="ps-toc" aria-label="Chapters"><ol>${items}</ol></nav>`;
}

export function defaultChapterTransition(ctx: ChapterTransitionContext): void {
  ctx.root.innerHTML = ctx.html;
}

export function defaultRenderChapterHtml(
  parsed: ParsedChapter,
  options: RenderOptions = {},
): string {
  const { meta, glossary, body } = parsed;
  const title = meta.title ? `<h1 class="ps-chapter-title">${escapeHTML(meta.title)}</h1>` : '';
  const when = meta.when
    ? `<p class="ps-chapter-when">${escapeHTML(meta.when)}</p>`
    : '';
  let epigraph = '';
  if (meta.epigraph) {
    const src = meta.epigraph_source
      ? `<cite>${escapeHTML(meta.epigraph_source)}</cite>`
      : '';
    epigraph = `<blockquote class="ps-epigraph"><p>${renderInline(meta.epigraph, glossary)}</p>${src}</blockquote>`;
  }
  const prose = renderBody(body, glossary, options);
  return `<article class="reader ps-reader"><header class="ps-chapter-header">${title}${when}${epigraph}</header><div class="prose ps-prose">${prose}</div></article>`;
}

export const defaultSlots: PalimpsestSlots = {
  FootnoteRenderer: defaultFootnoteRenderer,
  DocumentExhibit: defaultDocumentExhibit,
  TableOfContents: defaultTableOfContents,
  ChapterTransition: defaultChapterTransition,
};
