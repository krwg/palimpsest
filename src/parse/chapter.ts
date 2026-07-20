import type { ChapterMeta, ParsedChapter } from '../types.js';

export function parseMetaBlock(fmBlock: string): ChapterMeta {
  const meta: ChapterMeta = {};
  let key: string | null = null;
  const bag: Record<string, string | string[]> = {};

  for (const line of fmBlock.split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(\|)?\s*(.*)$/);
    if (m) {
      key = m[1];
      if (m[2] === '|') bag[key] = [];
      else {
        let v = m[3].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        bag[key] = v;
        key = null;
      }
    } else if (key && Array.isArray(bag[key])) {
      (bag[key] as string[]).push(line.replace(/^\s{2}/, ''));
    }
  }

  for (const [k, v] of Object.entries(bag)) {
    meta[k] = Array.isArray(v) ? v.join(' ').trim() : v;
  }
  return meta;
}

export function extractGlossary(bodyRaw: string): {
  glossary: Record<string, string>;
  body: string;
} {
  const glossary: Record<string, string> = {};
  const chunks = bodyRaw.split(/\n(?=\[\[\d+\]\]:)/);
  const bodyParts: string[] = [];
  for (const chunk of chunks) {
    const m = chunk.match(/^\[\[(\d+)\]\]:\s*([\s\S]*)$/);
    if (m) glossary[m[1]] = m[2].trim();
    else bodyParts.push(chunk);
  }
  return { glossary, body: bodyParts.join('').trim() };
}

/** Parse Piligrim / Palimpsest chapter dialect into meta + glossary + body. */
export function parseChapter(raw: string, fallback: ChapterMeta = {}): ParsedChapter {
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const fmPatterns = [
    /^::chapter::\n([\s\S]*?)\n::\/chapter::\n([\s\S]*)$/,
    /^---\n([\s\S]*?)\n---\n([\s\S]*)$/,
  ];

  for (const pattern of fmPatterns) {
    const fmMatch = normalized.match(pattern);
    if (fmMatch) {
      const meta = parseMetaBlock(fmMatch[1]);
      const { glossary, body } = extractGlossary(fmMatch[2]);
      return { meta, glossary, body };
    }
  }

  const { glossary, body } = extractGlossary(normalized);
  return {
    meta: {
      title: fallback.title || '',
      era: fallback.era || '',
      when: fallback.when || '',
      epigraph: fallback.epigraph || '',
      epigraph_source: fallback.epigraph_source || '',
    },
    glossary,
    body,
  };
}
