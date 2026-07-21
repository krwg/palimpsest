import type { PalimpsestTheme } from '../types.js';

export const PILIGRIM_THEME_CLASS: Record<string, string> = {
  dossier: 'paper',
  paper: 'white',
  sepia: 'sepia',
  night: 'night',
};

export function legacyThemeClass(themeName: string): string {
  return PILIGRIM_THEME_CLASS[themeName] ?? themeName;
}

export function themeToCssVars(theme: PalimpsestTheme): Record<string, string> {
  const { colors: c, typography: t, layout: l, motion: m } = theme;
  return {
    '--ps-bg': c.background,
    '--ps-surface': c.surface,
    '--ps-prose-bg': c.proseBackground,
    '--ps-text': c.text.primary,
    '--ps-text-secondary': c.text.secondary,
    '--ps-muted': c.text.muted,
    '--ps-border': c.border,
    '--ps-accent': c.accent.primary,
    '--ps-accent-soft': c.accent.soft,
    '--ps-term': c.accent.footnote,
    '--ps-term-bg': c.accent.footnoteSoft,
    '--ps-font-body': t.body.family,
    '--ps-font-heading': t.heading.family,
    '--ps-font-mono': t.mono.family,
    '--ps-font-typewriter': t.typewriter?.family ?? t.mono.family,
    '--ps-font-size': t.body.size,
    '--ps-line-height': String(t.body.lineHeight),
    '--ps-heading-weight': String(t.heading.weight),
    '--ps-reader-max': l.maxWidth,
    '--ps-reader-narrow': l.narrowWidth,
    '--ps-radius': l.radius,
    '--ps-transition': m.enabled ? `${m.transitionDuration} ease` : '0s',
  };
}

export function applyTheme(
  theme: PalimpsestTheme,
  target: HTMLElement = typeof document !== 'undefined' ? document.body : (null as unknown as HTMLElement),
): void {
  if (!target) return;
  const vars = themeToCssVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    target.style.setProperty(key, value);
  }
  target.dataset.psTheme = theme.name;
  target.classList.add('ps-themed');

  target.classList.remove(
    'theme-dossier',
    'theme-paper',
    'theme-sepia',
    'theme-night',
    'theme-white',
  );
  target.classList.add(`theme-${legacyThemeClass(theme.name)}`);
}
