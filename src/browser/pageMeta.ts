export interface PageMetaInput {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  /** theme-color meta; when omitted, existing value is left alone */
  themeColor?: string;
}

function absUrl(path: string, base = typeof location !== 'undefined' ? location.href : ''): string {
  try {
    return new URL(path, base).href;
  } catch {
    return path;
  }
}

function ensureMeta(attr: 'name' | 'property', key: string, val: string): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', val);
}

/** Update document title + common OG / Twitter / description / theme-color tags. */
export function setPageMeta(input: PageMetaInput): void {
  document.title = input.title;
  if (input.description != null) {
    ensureMeta('name', 'description', input.description);
    ensureMeta('property', 'og:description', input.description);
  }
  ensureMeta('property', 'og:title', input.title);
  ensureMeta('property', 'og:type', 'website');
  ensureMeta('name', 'twitter:card', 'summary_large_image');
  if (input.image) {
    ensureMeta('property', 'og:image', absUrl(input.image));
  }
  if (input.path != null) {
    ensureMeta('property', 'og:url', absUrl(input.path));
  }
  if (input.themeColor) {
    ensureMeta('name', 'theme-color', input.themeColor);
  }
}
