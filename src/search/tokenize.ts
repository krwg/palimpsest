/** Lowercase unicode letter/number tokens; keeps hyphenated forms as one token when possible. */
export function tokenize(text: string): string[] {
  const normalized = text.normalize('NFKC').toLowerCase();
  const tokens = normalized.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return tokens ?? [];
}

export function plainTextFromChapter(parts: {
  title?: string;
  when?: string;
  era?: string;
  body: string;
  glossary?: Record<string, string>;
}): string {
  const glossary = parts.glossary
    ? Object.values(parts.glossary).join('\n')
    : '';
  // Strip dialect markers lightly for indexing
  const body = parts.body
    .replace(/:::\s*document[\s\S]*?:::/gi, ' ')
    .replace(/::figure::[\s\S]*?::\/figure::/gi, ' ')
    .replace(/\[\[[^\]]+\]\]:?/g, ' ')
    .replace(/[*_#>`|]+/g, ' ');
  return [parts.title, parts.era, parts.when, body, glossary]
    .filter(Boolean)
    .join('\n');
}
