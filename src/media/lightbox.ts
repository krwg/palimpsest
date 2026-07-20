import type { ReaderStrings } from '../i18n/strings.js';

export function bindFigureLightbox(
  container: ParentNode,
  strings: Pick<ReaderStrings, 'closeLightbox'>,
): () => void {
  let lb = document.getElementById('ps-figure-lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'ps-figure-lightbox';
    lb.className = 'ps-figure-lightbox figure-lightbox';
    lb.hidden = true;
    lb.innerHTML = `<button type="button" class="figure-lightbox-close" aria-label="${strings.closeLightbox}">×</button><img alt="">`;
    document.body.appendChild(lb);
  }

  const close = () => {
    lb!.hidden = true;
    document.body.classList.remove('lightbox-open');
  };

  const onLbClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t === lb || t.classList.contains('figure-lightbox-close')) close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && lb && !lb.hidden) close();
  };
  lb.addEventListener('click', onLbClick);
  document.addEventListener('keydown', onKey);

  const buttons = container.querySelectorAll('.chapter-figure-btn');
  const onOpen = (btn: Element) => {
    const img = btn.querySelector('img');
    if (!img || !lb) return;
    const full = lb.querySelector('img');
    if (!full) return;
    full.src = img.currentSrc || img.src;
    full.alt = img.alt;
    lb.hidden = false;
    document.body.classList.add('lightbox-open');
  };
  const handlers: Array<() => void> = [];
  buttons.forEach((btn) => {
    const fn = () => onOpen(btn);
    btn.addEventListener('click', fn);
    handlers.push(() => btn.removeEventListener('click', fn));
  });

  return () => {
    handlers.forEach((h) => h());
    lb?.removeEventListener('click', onLbClick);
    document.removeEventListener('keydown', onKey);
  };
}
