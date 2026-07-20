import type { PalimpsestTheme } from '../types.js';

export const dossierTheme: PalimpsestTheme = {
  name: 'dossier',
  colors: {
    background: '#e8e4dc',
    surface: '#f4f1ea',
    proseBackground: '#faf8f4',
    text: { primary: '#1c1a17', secondary: '#3a3630', muted: '#5c574f' },
    border: 'rgba(28, 26, 23, 0.1)',
    accent: {
      primary: '#8b1e1e',
      soft: 'rgba(139, 30, 30, 0.12)',
      footnote: '#1a4d7a',
      footnoteSoft: 'rgba(26, 77, 122, 0.08)',
    },
  },
  typography: {
    body: {
      family: "'Cormorant Garamond', 'Times New Roman', Georgia, serif",
      size: 'clamp(1.05rem, 0.95rem + 0.4vw, 1.2rem)',
      lineHeight: 1.75,
    },
    heading: {
      family: "'Cormorant Garamond', 'Times New Roman', Georgia, serif",
      weight: 600,
    },
    mono: { family: "'IBM Plex Sans', system-ui, sans-serif" },
    typewriter: { family: "'Special Elite', 'Courier New', monospace" },
  },
  layout: {
    maxWidth: '680px',
    narrowWidth: '38rem',
    footnoteStyle: 'tooltip',
    chapterNav: 'hash',
    radius: '12px',
  },
  motion: { enabled: true, transitionDuration: '0.25s' },
};

export const paperTheme: PalimpsestTheme = {
  ...dossierTheme,
  name: 'paper',
  colors: {
    ...dossierTheme.colors,
    background: '#f2f2f7',
    surface: '#ffffff',
    proseBackground: '#ffffff',
    text: { primary: '#1d1d1f', secondary: '#3a3a3c', muted: '#6e6e73' },
    border: 'rgba(0, 0, 0, 0.08)',
  },
};

export const sepiaTheme: PalimpsestTheme = {
  ...dossierTheme,
  name: 'sepia',
  colors: {
    ...dossierTheme.colors,
    background: '#d9cfc0',
    surface: '#ebe3d6',
    proseBackground: '#f5efe4',
    text: { primary: '#2a2218', secondary: '#4a3f32', muted: '#6b5f4f' },
    border: 'rgba(42, 34, 24, 0.12)',
  },
};

export const nightTheme: PalimpsestTheme = {
  ...dossierTheme,
  name: 'night',
  colors: {
    background: '#0d0d0f',
    surface: '#1c1c1e',
    proseBackground: '#1c1c1e',
    text: { primary: '#f5f5f7', secondary: '#d1d1d6', muted: '#98989d' },
    border: 'rgba(255, 255, 255, 0.1)',
    accent: {
      primary: '#cc4444',
      soft: 'rgba(204, 68, 68, 0.16)',
      footnote: '#6eb3ff',
      footnoteSoft: 'rgba(110, 179, 255, 0.12)',
    },
  },
};

export const themePresets: Record<string, PalimpsestTheme> = {
  dossier: dossierTheme,
  paper: paperTheme,
  sepia: sepiaTheme,
  night: nightTheme,
};
