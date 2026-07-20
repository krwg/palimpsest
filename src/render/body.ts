import type { RenderOptions } from '../types.js';
import { renderExhibit } from './exhibit.js';
import { renderFigure } from './figure.js';
import { renderInline } from './inline.js';

export function renderBody(
  body: string,
  glossary: Record<string, string>,
  options: RenderOptions = {},
): string {
  body = body.replace(/\r\n/g, '\n');
  const exhibits: string[] = [];
  const figures: string[] = [];
  let withPlaceholders = body.replace(/:::document\n([\s\S]*?)\n:::/g, (_, inner) => {
    exhibits.push(inner);
    return `\n\n@@EXHIBIT${exhibits.length - 1}@@\n\n`;
  });
  withPlaceholders = withPlaceholders.replace(
    /::figure::\s*([\s\S]*?)\s*::\/figure::/g,
    (_, inner) => {
      figures.push(inner);
      return `\n\n@@FIGURE${figures.length - 1}@@\n\n`;
    },
  );

  const blocks = withPlaceholders.split(/\n\s*\n/);
  let html = '';
  for (const block of blocks) {
    const t = block.trim();
    if (!t) continue;
    const exMatch = t.match(/^@@EXHIBIT(\d+)@@$/);
    if (exMatch) {
      const renderEx = options.renderExhibit ?? renderExhibit;
      html += renderEx(exhibits[Number(exMatch[1])], glossary, options);
      continue;
    }
    const figMatch = t.match(/^@@FIGURE(\d+)@@$/);
    if (figMatch) {
      html += renderFigure(figures[Number(figMatch[1])], options);
      continue;
    }
    if (/::figure::[\s\S]*?::\/figure::/i.test(t)) {
      const parts = t.split(/(::figure::\s*[\s\S]*?\s*::\/figure::)/gi);
      for (const part of parts) {
        const inline = part.match(/^::figure::\s*([\s\S]*?)\s*::\/figure::$/i);
        if (inline) html += renderFigure(inline[1], options);
        else if (part.trim()) html += `<p>${renderInline(part.trim(), glossary)}</p>`;
      }
      continue;
    }
    if (t === '***' || t === '---') {
      html += '<hr>';
      continue;
    }
    if (/^__(.+)__$/.test(t)) {
      html += `<p class="scene-label">${renderInline(t.slice(2, -2), glossary)}</p>`;
      continue;
    }
    if (t.startsWith('— ')) {
      html += `<p class="dialogue">${renderInline(t, glossary)}</p>`;
      continue;
    }
    html += `<p>${renderInline(t, glossary)}</p>`;
  }
  return html;
}
