/**
 * Theme Service — Manages app color themes
 * Themes are defined as data-theme attributes on <html> so CSS variables work automatically.
 */

export type ThemeId = 'light' | 'dark' | 'amoled' | 'neon' | 'ocean' | 'sunset';

export interface Theme {
  id: ThemeId;
  name: string;
  icon: string;
  // For preview swatches only — actual colors come from CSS [data-theme] selectors
  previewBg: string;
  previewAccent: string;
  previewAccent2: string;
}

export const THEMES: Theme[] = [
  { id: 'light',  name: 'Light',  icon: '☀️', previewBg: '#fce7f3', previewAccent: '#ec4899', previewAccent2: '#8b5cf6' },
  { id: 'dark',   name: 'Dark',   icon: '🌙', previewBg: '#0d0d1a', previewAccent: '#8b5cf6', previewAccent2: '#6d28d9' },
  { id: 'amoled', name: 'AMOLED', icon: '⚫', previewBg: '#000000', previewAccent: '#a855f7', previewAccent2: '#7c3aed' },
  { id: 'neon',   name: 'Neon',   icon: '⚡', previewBg: '#0a001f', previewAccent: '#c026d3', previewAccent2: '#a21caf' },
  { id: 'ocean',  name: 'Ocean',  icon: '🌊', previewBg: '#001a2e', previewAccent: '#0ea5e9', previewAccent2: '#0284c7' },
  { id: 'sunset', name: 'Sunset', icon: '🌅', previewBg: '#1a0a00', previewAccent: '#f97316', previewAccent2: '#ea580c' },
];

const THEME_KEY = 'aura_theme';

export function getCurrentTheme(): ThemeId {
  return (localStorage.getItem(THEME_KEY) as ThemeId) || 'light';
}

export function applyTheme(themeId: ThemeId): void {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem(THEME_KEY, themeId);
}

export function initTheme(): void {
  const saved = localStorage.getItem(THEME_KEY) as ThemeId | null;
  // If no saved preference, always start with light (beautiful pink theme)
  applyTheme(saved || 'light');
}
