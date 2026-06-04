'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ALL_THEMES = [
  'theme-default',
  'theme-whatsapp',
  'theme-midnight',
  'theme-ocean',
  'theme-purple',
  'theme-enterprise',
];

function applyColorTheme(value: string) {
  const root = document.documentElement;
  root.classList.remove(...ALL_THEMES);
  root.classList.add(`theme-${value}`);
}

export function ColorThemeHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('color-theme') || 'default';
    applyColorTheme(saved);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Apply immediately on mount
    const saved = localStorage.getItem('color-theme') || 'default';
    applyColorTheme(saved);

    // Listen for storage changes so theme is applied across tabs and from ThemeSwitcher
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'color-theme') {
        applyColorTheme(e.newValue || 'default');
      }
    };

    // Listen for custom event dispatched by ThemeSwitcher on same page
    const handleThemeChange = (e: CustomEvent) => {
      applyColorTheme(e.detail || 'default');
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('color-theme-change', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('color-theme-change', handleThemeChange as EventListener);
    };
  }, []);

  return null;
}
