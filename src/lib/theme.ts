'use client';

import { createContext, useContext } from 'react';

export const LIGHT = {
  dark: false,
  bg:          '#FAF7F2',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F3EFE6',
  text:        '#1A1814',
  muted:       '#7A746A',
  soft:        '#B8B0A2',
  border:      '#E8E1D3',
  borderSoft:  '#EEE8DB',
  debit:       '#A8482C',
  credit:      '#3F7245',
  accent:      '#967853',
  warn:        '#A07920',
  warnBg:      '#F7EFD5',
  shadow:      'rgba(40,30,15,0.10)',
  shadowSoft:  'rgba(60,50,30,0.06)',
};

export const DARK = {
  dark: true,
  bg:          '#0E0C09',
  surface:     '#181511',
  surfaceAlt:  '#211C16',
  text:        '#F2EDE0',
  muted:       '#8E887A',
  soft:        '#5A554B',
  border:      '#2A2620',
  borderSoft:  '#221E18',
  debit:       '#D88260',
  credit:      '#8FB682',
  accent:      '#C9A675',
  warn:        '#D4B86A',
  warnBg:      '#3A2F12',
  shadow:      'rgba(0,0,0,0.55)',
  shadowSoft:  'rgba(0,0,0,0.35)',
};

export type Theme = typeof LIGHT;

export const ThemeContext = createContext<Theme>(LIGHT);
export function useTheme() { return useContext(ThemeContext); }

/** Deterministic warm hue 15–85 from a category name string */
export function hueForCat(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  return (h % 70) + 15;
}

export function catBg(name: string, dark: boolean) {
  const hue = hueForCat(name);
  return dark ? `oklch(0.24 0.04 ${hue})` : `oklch(0.93 0.045 ${hue})`;
}

export function catFg(name: string, dark: boolean) {
  const hue = hueForCat(name);
  return dark ? `oklch(0.82 0.08 ${hue})` : `oklch(0.42 0.10 ${hue})`;
}

export function catStroke(name: string, dark: boolean) {
  const hue = hueForCat(name);
  return dark ? `oklch(0.65 0.10 ${hue})` : `oklch(0.50 0.12 ${hue})`;
}
