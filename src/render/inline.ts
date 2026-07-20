export function escapeHTML(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function linkTerms(html: string, glossary: Record<string, string>): string {
  html = html.replace(
    /__([\p{L}\p{N}][\p{L}\p{N}\-']*)__\[\[(\d+)\]\]/gu,
    (m, word, id) => {
      if (!glossary[id]) return m;
      return `<button type="button" class="ps-term term" data-term="${id}">${word}</button>`;
    },
  );
  html = html.replace(
    /(«?[\p{L}\p{N}][\p{L}\p{N}\-']*»?)\[\[(\d+)\]\]/gu,
    (_m, word, id) => {
      if (!glossary[id]) return word;
      return `<button type="button" class="ps-term term" data-term="${id}">${word}</button>`;
    },
  );
  return html;
}

export function renderInline(text: string, glossary: Record<string, string>): string {
  let html = escapeHTML(text);
  html = linkTerms(html, glossary);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<em>$1</em>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  return html;
}
