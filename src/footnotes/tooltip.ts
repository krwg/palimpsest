export function cleanTooltipText(s: string): string {
  return String(s)
    .replace(/\[\[\d+\]\]/g, '')
    .replace(/\[(\d+)\]/g, '')
    .replace(/__([^_]+)__/g, '$1');
}

export function parseTooltipDef(def: string): { term: string; body: string } {
  const cleaned = cleanTooltipText(def).trim();
  const nl = cleaned.indexOf('\n\n');
  if (nl > 0) {
    return {
      term: cleaned.slice(0, nl).trim(),
      body: cleaned.slice(nl + 2).trim(),
    };
  }
  const dash = cleaned.indexOf(' — ');
  if (dash > 0) {
    return {
      term: cleaned.slice(0, dash).trim(),
      body: cleaned.slice(dash + 3).trim(),
    };
  }
  return { term: '', body: cleaned };
}

function escapeHTML(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderTooltipBody(text: string): string {
  return text
    .split(/\n\n+/)
    .filter(Boolean)
    .map((p) => `<p>${escapeHTML(p)}</p>`)
    .join('');
}

export interface FootnoteBindOptions {
  isMobile?: () => boolean;
  longBodyThreshold?: number;
}

export function bindFootnotes(
  container: ParentNode,
  glossary: Record<string, string>,
  options: FootnoteBindOptions = {},
): () => void {
  const isMobile =
    options.isMobile ??
    (() =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 600px)').matches);
  const threshold = options.longBodyThreshold ?? 380;
  let activeTooltip: HTMLElement | null = null;

  function closeTooltip() {
    if (activeTooltip) {
      activeTooltip.classList.remove('tooltip-visible');
      const tip = activeTooltip;
      setTimeout(() => tip.remove(), 200);
      activeTooltip = null;
    }
    document.body.classList.remove(
      'tooltip-open',
      'tooltip-open-light',
      'tooltip-panel-open',
    );
  }

  function buildTooltipElement(def: string, mobile: boolean) {
    const { term, body } = parseTooltipDef(def);
    const long = body.length > threshold;
    const tip = document.createElement('div');
    if (mobile) tip.className = 'tooltip tooltip-sheet ps-tooltip';
    else if (long) tip.className = 'tooltip tooltip-panel ps-tooltip';
    else tip.className = 'tooltip tooltip-float ps-tooltip';
    const handle = mobile ? '<div class="sheet-handle" aria-hidden="true"></div>' : '';
    const termHtml = term ? `<span class="t-term">${escapeHTML(term)}</span>` : '';
    tip.innerHTML = `${handle}${termHtml}<div class="t-body">${renderTooltipBody(body)}</div>`;
    return { tip, long };
  }

  const onTermClick = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    const btn = e.currentTarget as HTMLElement;
    const id = btn.dataset.term;
    if (!id) return;
    const def = glossary[id];
    if (!def) return;
    const already = activeTooltip && activeTooltip.dataset.owner === id;
    closeTooltip();
    if (already) return;

    const mobile = isMobile();
    const { tip, long } = buildTooltipElement(def, mobile);
    tip.dataset.owner = id;
    document.body.appendChild(tip);
    const panel = long && !mobile;
    const sheet = mobile;
    document.body.classList.add(
      sheet ? 'tooltip-open' : panel ? 'tooltip-panel-open' : 'tooltip-open-light',
    );

    if (sheet || panel) {
      requestAnimationFrame(() => tip.classList.add('tooltip-visible'));
    } else {
      const r = btn.getBoundingClientRect();
      const pad = 12;
      const gap = 10;
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      let left = r.right + gap;
      if (left + tw > window.innerWidth - pad) left = r.left - tw - gap;
      left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
      let top = r.top + r.height / 2 - th / 2;
      top = Math.max(pad, Math.min(top, window.innerHeight - th - pad));
      tip.style.left = `${left + window.scrollX}px`;
      tip.style.top = `${top + window.scrollY}px`;
      requestAnimationFrame(() => tip.classList.add('tooltip-visible'));
    }
    activeTooltip = tip;
  };

  const buttons = container.querySelectorAll<HTMLElement>('.ps-term, .term');
  buttons.forEach((btn) => btn.addEventListener('click', onTermClick));

  const onDocClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!t.closest?.('.tooltip') && !t.closest?.('.term') && !t.closest?.('.ps-term')) {
      closeTooltip();
    }
  };
  document.addEventListener('click', onDocClick);
  window.addEventListener('resize', closeTooltip);

  return () => {
    buttons.forEach((btn) => btn.removeEventListener('click', onTermClick));
    document.removeEventListener('click', onDocClick);
    window.removeEventListener('resize', closeTooltip);
    closeTooltip();
  };
}
