export type HashRoute =
  | { kind: 'home' }
  | { kind: 'chapter'; chapterId: string };

/** Parse `#/chapter/:id` style hashes. */
export function parseHash(hash = typeof location !== 'undefined' ? location.hash : ''): HashRoute {
  const h = hash.replace(/^#/, '');
  const m = h.match(/^\/?chapter\/([^/?#]+)/);
  if (m) return { kind: 'chapter', chapterId: decodeURIComponent(m[1]) };
  return { kind: 'home' };
}

export function chapterHash(chapterId: string): string {
  return `#/chapter/${encodeURIComponent(chapterId)}`;
}

export function startHashRouter(onRoute: (route: HashRoute) => void): () => void {
  const fire = () => onRoute(parseHash(location.hash));
  window.addEventListener('hashchange', fire);
  fire();
  return () => window.removeEventListener('hashchange', fire);
}
