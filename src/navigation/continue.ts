import type { ReaderStrings } from '../i18n/strings.js';
import type { ChapterProgress } from '../storage/progress.js';
import { saveChapterProgress } from '../storage/progress.js';
import type { ReaderStorageKeys } from '../types.js';

export function showContinuePrompt(options: {
  chapterId: string;
  saved: ChapterProgress | null | undefined;
  strings: Pick<ReaderStrings, 'continueMessage' | 'continueYes' | 'continueNo'>;
  storageKeys: ReaderStorageKeys;
  onProgress?: (pct: number) => void;
}): void {
  const { chapterId, saved, strings, storageKeys, onProgress } = options;
  if (!saved || saved.pct < 0.03 || saved.scrollY < 80) return;
  const pct = Math.round(saved.pct * 100);
  const overlay = document.createElement('div');
  overlay.className = 'ps-continue-prompt continue-prompt';
  overlay.innerHTML = `
    <div class="continue-card">
      <p>${strings.continueMessage.replace('{pct}', String(pct))}</p>
      <div class="continue-actions">
        <button type="button" class="continue-yes">${strings.continueYes}</button>
        <button type="button" class="continue-no">${strings.continueNo}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));
  overlay.querySelector('.continue-yes')!.addEventListener('click', () => {
    window.scrollTo(0, saved.scrollY);
    overlay.remove();
    onProgress?.(saved.pct);
  });
  overlay.querySelector('.continue-no')!.addEventListener('click', () => {
    saveChapterProgress(chapterId, 0, 0, storageKeys);
    overlay.remove();
  });
}

export function bindChapterGestures(options: {
  prevId: string | null;
  nextId: string | null;
  strings: Pick<ReaderStrings, 'prevChapter' | 'nextChapter'>;
  go: (chapterId: string) => void;
}): () => void {
  const { prevId, nextId, strings, go } = options;
  const zones: HTMLElement[] = [];
  if (prevId) {
    const z = document.createElement('button');
    z.className = 'ps-nav-zone nav-zone nav-zone-prev';
    z.setAttribute('aria-label', strings.prevChapter);
    z.onclick = () => go(prevId);
    document.body.appendChild(z);
    zones.push(z);
  }
  if (nextId) {
    const z = document.createElement('button');
    z.className = 'ps-nav-zone nav-zone nav-zone-next';
    z.setAttribute('aria-label', strings.nextChapter);
    z.onclick = () => go(nextId);
    document.body.appendChild(z);
    zones.push(z);
  }

  let touchStartX = 0;
  let touchStartY = 0;
  const onTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0 && prevId) go(prevId);
    if (dx < 0 && nextId) go(nextId);
  };
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    zones.forEach((z) => z.remove());
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchend', onTouchEnd);
  };
}
