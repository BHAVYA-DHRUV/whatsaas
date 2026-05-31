export const APP_THEMES = [
  { id: 'light', label: 'Light', icon: 'sun' },
  { id: 'dark', label: 'Dark', icon: 'moon' },
  { id: 'whatsapp', label: 'WhatsApp Green', icon: 'message' },
  { id: 'midnight', label: 'Midnight', icon: 'stars' },
  { id: 'ocean', label: 'Ocean', icon: 'waves' },
  { id: 'purple', label: 'Purple', icon: 'sparkles' },
  { id: 'enterprise', label: 'Enterprise', icon: 'building' },
] as const;

export type AppThemeId = (typeof APP_THEMES)[number]['id'];

export const APP_THEME_IDS = APP_THEMES.map((t) => t.id) as AppThemeId[];
