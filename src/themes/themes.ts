import { ThemeId } from '../types/models';

export interface ThemePreset {
  id: ThemeId;
  nameFa: string;
  nameEn: string;
  subtitleFa: string;
  subtitleEn: string;
  isDark: boolean;
  previewGradient: string;
  tokens: Record<string, string>;
}

export const THEME_PRESETS: Record<Exclude<ThemeId, 'system'>, ThemePreset> = {
  'dark-glass': {
    id: 'dark-glass',
    nameFa: 'شیشه تیره',
    nameEn: 'Dark Glass',
    subtitleFa: 'شیشه دودی مدرن هماهنگ با ویندوز ۱۱',
    subtitleEn: 'Smoked obsidian glass crafted for Windows 11',
    isDark: true,
    previewGradient: 'linear-gradient(135deg, #17233b 0%, #0b1220 100%)',
    tokens: {
      '--wejet-bg': '#0b111e',
      '--wejet-manager-bg': 'rgba(13, 19, 33, 0.88)',
      '--wejet-manager-sidebar': 'rgba(9, 14, 25, 0.76)',
      '--wejet-glass-base': '#121b2f',
      '--wejet-glass-bg': 'rgba(18, 27, 47, 0.68)',
      '--wejet-glass-elevated': 'rgba(19, 28, 48, 0.88)',
      '--wejet-glass-solid': 'rgba(22, 32, 54, 0.96)',
      '--wejet-glass-border': 'rgba(255, 255, 255, 0.13)',
      '--wejet-glass-border-strong': 'rgba(255, 255, 255, 0.25)',
      '--wejet-glass-highlight': 'rgba(255, 255, 255, 0.16)',
      '--wejet-surface-hover': 'rgba(255, 255, 255, 0.075)',
      '--wejet-surface-active': 'rgba(255, 255, 255, 0.125)',
      '--wejet-input-bg': 'rgba(8, 13, 24, 0.52)',
      '--wejet-text': '#f4f7fc',
      '--wejet-text-secondary': '#cbd5e8',
      '--wejet-text-muted': '#8e9fb9',
      '--wejet-blur': '22px',
      '--wejet-saturate': '165%',
      '--wejet-ambient-sheen':
        'radial-gradient(circle at top right, rgba(92, 200, 255, 0.09), transparent 62%)',
    },
  },
  'light-glass': {
    id: 'light-glass',
    nameFa: 'شیشه روشن',
    nameEn: 'Light Glass',
    subtitleFa: 'شیشه شفاف روزانه با کنتراست بالا',
    subtitleEn: 'Airy daylight Mica & translucent frosted glass',
    isDark: false,
    previewGradient: 'linear-gradient(135deg, #f8fbff 0%, #dbeafe 100%)',
    tokens: {
      '--wejet-bg': '#eef3fb',
      '--wejet-manager-bg': 'rgba(243, 247, 253, 0.90)',
      '--wejet-manager-sidebar': 'rgba(232, 239, 250, 0.80)',
      '--wejet-glass-base': '#f5f8ff',
      '--wejet-glass-bg': 'rgba(246, 249, 255, 0.72)',
      '--wejet-glass-elevated': 'rgba(250, 252, 255, 0.90)',
      '--wejet-glass-solid': 'rgba(252, 253, 255, 0.97)',
      '--wejet-glass-border': 'rgba(15, 23, 42, 0.11)',
      '--wejet-glass-border-strong': 'rgba(15, 23, 42, 0.22)',
      '--wejet-glass-highlight': 'rgba(255, 255, 255, 0.75)',
      '--wejet-surface-hover': 'rgba(15, 23, 42, 0.055)',
      '--wejet-surface-active': 'rgba(15, 23, 42, 0.10)',
      '--wejet-input-bg': 'rgba(255, 255, 255, 0.72)',
      '--wejet-text': '#0f172a',
      '--wejet-text-secondary': '#334155',
      '--wejet-text-muted': '#5b6b84',
      '--wejet-blur': '24px',
      '--wejet-saturate': '175%',
      '--wejet-shadow':
        '0 14px 34px -10px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.07)',
      '--wejet-shadow-elevated':
        '0 28px 64px -12px rgba(15, 23, 42, 0.22), 0 4px 14px rgba(15, 23, 42, 0.09)',
      '--wejet-ambient-sheen':
        'radial-gradient(circle at top left, rgba(255, 255, 255, 0.55), transparent 65%)',
    },
  },
  midnight: {
    id: 'midnight',
    nameFa: 'نیمه‌شب',
    nameEn: 'Midnight',
    subtitleFa: 'سرمه‌ای عمیق شبانه با مصرف نوری کم',
    subtitleEn: 'Deep abyssal sapphire tuned for late-night focus',
    isDark: true,
    previewGradient: 'linear-gradient(135deg, #0f172a 0%, #050814 100%)',
    tokens: {
      '--wejet-bg': '#050814',
      '--wejet-manager-bg': 'rgba(7, 11, 24, 0.91)',
      '--wejet-manager-sidebar': 'rgba(5, 8, 18, 0.84)',
      '--wejet-glass-base': '#090f23',
      '--wejet-glass-bg': 'rgba(9, 15, 35, 0.74)',
      '--wejet-glass-elevated': 'rgba(11, 18, 40, 0.91)',
      '--wejet-glass-solid': 'rgba(13, 21, 46, 0.97)',
      '--wejet-glass-border': 'rgba(148, 178, 255, 0.14)',
      '--wejet-glass-border-strong': 'rgba(148, 178, 255, 0.28)',
      '--wejet-glass-highlight': 'rgba(190, 212, 255, 0.15)',
      '--wejet-surface-hover': 'rgba(148, 178, 255, 0.08)',
      '--wejet-surface-active': 'rgba(148, 178, 255, 0.14)',
      '--wejet-input-bg': 'rgba(4, 7, 17, 0.64)',
      '--wejet-text': '#eef2ff',
      '--wejet-text-secondary': '#c7d2fe',
      '--wejet-text-muted': '#818cf8',
      '--wejet-blur': '24px',
      '--wejet-saturate': '155%',
      '--wejet-ambient-sheen':
        'radial-gradient(circle at top right, rgba(129, 140, 248, 0.12), transparent 64%)',
    },
  },
  frost: {
    id: 'frost',
    nameFa: 'یخ‌زده (Frost)',
    nameEn: 'Frost',
    subtitleFa: 'بلور مات قطبی با پخش نوری لطیف',
    subtitleEn: 'High-diffusion crystalline frosted acrylic',
    isDark: false,
    previewGradient: 'linear-gradient(135deg, #e0f2fe 0%, #f1f5f9 100%)',
    tokens: {
      '--wejet-bg': '#e6eff8',
      '--wejet-manager-bg': 'rgba(235, 244, 252, 0.86)',
      '--wejet-manager-sidebar': 'rgba(224, 236, 249, 0.78)',
      '--wejet-glass-base': '#e8f3fc',
      '--wejet-glass-bg': 'rgba(232, 243, 252, 0.64)',
      '--wejet-glass-elevated': 'rgba(241, 248, 254, 0.88)',
      '--wejet-glass-solid': 'rgba(246, 250, 255, 0.96)',
      '--wejet-glass-border': 'rgba(14, 116, 144, 0.16)',
      '--wejet-glass-border-strong': 'rgba(14, 116, 144, 0.30)',
      '--wejet-glass-highlight': 'rgba(255, 255, 255, 0.85)',
      '--wejet-surface-hover': 'rgba(15, 23, 42, 0.06)',
      '--wejet-surface-active': 'rgba(15, 23, 42, 0.11)',
      '--wejet-input-bg': 'rgba(255, 255, 255, 0.68)',
      '--wejet-text': '#0c1929',
      '--wejet-text-secondary': '#294058',
      '--wejet-text-muted': '#546e87',
      '--wejet-blur': '30px',
      '--wejet-saturate': '190%',
      '--wejet-ambient-sheen':
        'radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 62%)',
    },
  },
  minimal: {
    id: 'minimal',
    nameFa: 'مینیمال شفاف',
    nameEn: 'Minimal',
    subtitleFa: 'بیشترین دید تصویر زمینه با خطوط ظریف',
    subtitleEn: 'Ultra-sheer veil showcasing your wallpaper',
    isDark: true,
    previewGradient: 'linear-gradient(135deg, #273244 0%, #151b26 100%)',
    tokens: {
      '--wejet-bg': '#10141d',
      '--wejet-manager-bg': 'rgba(16, 20, 29, 0.86)',
      '--wejet-manager-sidebar': 'rgba(13, 17, 24, 0.72)',
      '--wejet-glass-base': '#141923',
      '--wejet-glass-bg': 'rgba(20, 25, 35, 0.42)',
      '--wejet-glass-elevated': 'rgba(22, 27, 38, 0.84)',
      '--wejet-glass-solid': 'rgba(24, 30, 42, 0.95)',
      '--wejet-glass-border': 'rgba(255, 255, 255, 0.10)',
      '--wejet-glass-border-strong': 'rgba(255, 255, 255, 0.22)',
      '--wejet-glass-highlight': 'rgba(255, 255, 255, 0.10)',
      '--wejet-surface-hover': 'rgba(255, 255, 255, 0.06)',
      '--wejet-surface-active': 'rgba(255, 255, 255, 0.11)',
      '--wejet-input-bg': 'rgba(12, 15, 22, 0.48)',
      '--wejet-text': '#f8fafc',
      '--wejet-text-secondary': '#e2e8f0',
      '--wejet-text-muted': '#94a3b8',
      '--wejet-blur': '14px',
      '--wejet-saturate': '135%',
      '--wejet-ambient-sheen': 'none',
    },
  },
  aurora: {
    id: 'aurora',
    nameFa: 'شفق قطبی (Aurora)',
    nameEn: 'Aurora',
    subtitleFa: 'طیف لطیف زمردی و فیروزه‌ای روی شیشه تیره',
    subtitleEn: 'Subtle northern-lights emerald & cyan ambient glass',
    isDark: true,
    previewGradient: 'linear-gradient(135deg, #0f2e34 0%, #131c38 100%)',
    tokens: {
      '--wejet-bg': '#091620',
      '--wejet-manager-bg': 'rgba(10, 23, 33, 0.88)',
      '--wejet-manager-sidebar': 'rgba(8, 18, 26, 0.78)',
      '--wejet-glass-base': '#0d2230',
      '--wejet-glass-bg': 'rgba(13, 34, 48, 0.66)',
      '--wejet-glass-elevated': 'rgba(14, 36, 50, 0.89)',
      '--wejet-glass-solid': 'rgba(16, 40, 56, 0.96)',
      '--wejet-glass-border': 'rgba(94, 234, 212, 0.18)',
      '--wejet-glass-border-strong': 'rgba(94, 234, 212, 0.34)',
      '--wejet-glass-highlight': 'rgba(167, 243, 208, 0.18)',
      '--wejet-surface-hover': 'rgba(94, 234, 212, 0.08)',
      '--wejet-surface-active': 'rgba(94, 234, 212, 0.14)',
      '--wejet-input-bg': 'rgba(6, 16, 24, 0.56)',
      '--wejet-text': '#f0fdfa',
      '--wejet-text-secondary': '#ccfbf1',
      '--wejet-text-muted': '#7dd3c8',
      '--wejet-blur': '24px',
      '--wejet-saturate': '180%',
      '--wejet-ambient-sheen':
        'radial-gradient(circle at top right, rgba(52, 211, 153, 0.14), rgba(56, 189, 248, 0.06) 45%, transparent 70%)',
    },
  },
  warm: {
    id: 'warm',
    nameFa: 'کوارتز گرم',
    nameEn: 'Warm Quartz',
    subtitleFa: 'تناژ گرم کهربایی و اسپرسو برای آرامش چشم',
    subtitleEn: 'Smoked espresso & warm amber glass for evening comfort',
    isDark: true,
    previewGradient: 'linear-gradient(135deg, #2d211b 0%, #171210 100%)',
    tokens: {
      '--wejet-bg': '#15110f',
      '--wejet-manager-bg': 'rgba(26, 20, 17, 0.89)',
      '--wejet-manager-sidebar': 'rgba(20, 15, 13, 0.80)',
      '--wejet-glass-base': '#241b17',
      '--wejet-glass-bg': 'rgba(36, 27, 23, 0.68)',
      '--wejet-glass-elevated': 'rgba(40, 30, 25, 0.90)',
      '--wejet-glass-solid': 'rgba(44, 34, 29, 0.96)',
      '--wejet-glass-border': 'rgba(253, 230, 198, 0.14)',
      '--wejet-glass-border-strong': 'rgba(253, 230, 198, 0.27)',
      '--wejet-glass-highlight': 'rgba(255, 243, 224, 0.16)',
      '--wejet-surface-hover': 'rgba(253, 230, 198, 0.08)',
      '--wejet-surface-active': 'rgba(253, 230, 198, 0.14)',
      '--wejet-input-bg': 'rgba(15, 11, 9, 0.56)',
      '--wejet-text': '#faf6f0',
      '--wejet-text-secondary': '#e7ddd3',
      '--wejet-text-muted': '#b5a395',
      '--wejet-blur': '22px',
      '--wejet-saturate': '155%',
      '--wejet-ambient-sheen':
        'radial-gradient(circle at top right, rgba(251, 191, 36, 0.11), transparent 62%)',
    },
  },
};

export function resolveEffectiveTheme(themeId: ThemeId, prefersDark: boolean): ThemePreset {
  if (themeId === 'system') {
    return prefersDark ? THEME_PRESETS['dark-glass'] : THEME_PRESETS['light-glass'];
  }
  return THEME_PRESETS[themeId] ?? THEME_PRESETS['dark-glass'];
}

export function applyThemeToDocument(
  themeId: ThemeId,
  accentColor: string,
  globalOpacity: number,
  reducedMotion: boolean
): void {
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const preset = resolveEffectiveTheme(themeId, prefersDark);
  const root = document.documentElement;

  Object.entries(preset.tokens).forEach(([k, v]) => {
    root.style.setProperty(k, v);
  });

  const safeAccent = /^#[0-9A-Fa-f]{6}$/.test(accentColor) ? accentColor : '#5CC8FF';
  const legibleAccent = preset.isDark
    ? safeAccent
    : `color-mix(in srgb, ${safeAccent} 60%, #072f54)`;
  root.style.setProperty('--wejet-accent', legibleAccent);
  root.style.setProperty('--wejet-accent-contrast', preset.isDark ? '#06131f' : '#ffffff');
  root.style.setProperty(
    '--wejet-accent-hover',
    preset.isDark
      ? `color-mix(in srgb, ${legibleAccent} 85%, white)`
      : `color-mix(in srgb, ${legibleAccent} 85%, black)`
  );
  root.style.setProperty(
    '--wejet-accent-soft',
    `color-mix(in srgb, ${legibleAccent} 16%, transparent)`
  );
  root.style.setProperty('--wejet-success', preset.isDark ? '#34d399' : '#047857');
  root.style.setProperty('--wejet-warning', preset.isDark ? '#fbbf24' : '#b45309');
  root.style.setProperty('--wejet-danger', preset.isDark ? '#f87171' : '#dc2626');
  root.style.setProperty('--wejet-widget-opacity', String(Math.max(0.2, Math.min(1, globalOpacity / 100))));
  root.dataset.theme = preset.id;
  root.dataset.colorScheme = preset.isDark ? 'dark' : 'light';
  root.dataset.reducedMotion = reducedMotion ? 'true' : 'false';
}
