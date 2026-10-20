export interface WallpaperPreset {
  id: string;
  nameFa: string;
  nameEn: string;
  suggestedAccent: string;
  cssBackground: string;
}

const STORAGE_KEY = 'wejet_preview_wallpaper_id';

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'midnight-sapphire',
    nameFa: 'یاقوت کبود نیمه‌شب',
    nameEn: 'Midnight Sapphire',
    suggestedAccent: '#5CC8FF',
    cssBackground:
      'radial-gradient(circle at 18% 22%, rgba(56, 189, 248, 0.36), transparent 46%), radial-gradient(circle at 82% 76%, rgba(99, 102, 241, 0.38), transparent 50%), radial-gradient(circle at 50% 48%, rgba(20, 184, 166, 0.18), transparent 58%), linear-gradient(135deg, #0b132b 0%, #16223f 50%, #090d16 100%)',
  },
  {
    id: 'aurora-borealis',
    nameFa: 'شفق قطبی زمردی',
    nameEn: 'Emerald Aurora',
    suggestedAccent: '#34D399',
    cssBackground:
      'radial-gradient(ellipse at 20% 18%, rgba(16, 185, 129, 0.42), transparent 50%), radial-gradient(ellipse at 80% 24%, rgba(56, 189, 248, 0.34), transparent 48%), radial-gradient(ellipse at 65% 84%, rgba(168, 85, 247, 0.28), transparent 50%), linear-gradient(145deg, #051923 0%, #0a2e38 48%, #07111e 100%)',
  },
  {
    id: 'persian-turquoise',
    nameFa: 'فیروزه‌ای ایرانی',
    nameEn: 'Persian Turquoise',
    suggestedAccent: '#2DD4BF',
    cssBackground:
      'radial-gradient(circle at 78% 20%, rgba(45, 212, 191, 0.40), transparent 46%), radial-gradient(circle at 22% 78%, rgba(14, 165, 233, 0.36), transparent 50%), radial-gradient(circle at 52% 45%, rgba(245, 158, 11, 0.15), transparent 54%), linear-gradient(135deg, #071e26 0%, #0f3542 52%, #081521 100%)',
  },
  {
    id: 'warm-dusk',
    nameFa: 'غروب کهربایی',
    nameEn: 'Amber Dusk',
    suggestedAccent: '#FBBF24',
    cssBackground:
      'radial-gradient(circle at 24% 24%, rgba(251, 146, 60, 0.38), transparent 48%), radial-gradient(circle at 80% 72%, rgba(244, 63, 94, 0.30), transparent 50%), radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.16), transparent 56%), linear-gradient(135deg, #1c1210 0%, #2b1922 52%, #110d14 100%)',
  },
  {
    id: 'nordic-daylight',
    nameFa: 'سپیده‌دم قطبی (روشن)',
    nameEn: 'Nordic Daylight',
    suggestedAccent: '#0284C7',
    cssBackground:
      'radial-gradient(circle at 20% 22%, rgba(56, 189, 248, 0.42), transparent 48%), radial-gradient(circle at 82% 76%, rgba(129, 140, 248, 0.36), transparent 52%), linear-gradient(135deg, #dbeafe 0%, #cbd5e1 52%, #e0f2fe 100%)',
  },
];

export function getSelectedWallpaperPreset(): WallpaperPreset {
  if (typeof window === 'undefined') return WALLPAPER_PRESETS[0];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return WALLPAPER_PRESETS.find((w) => w.id === saved) ?? WALLPAPER_PRESETS[0];
}

export function setSelectedWallpaperPreset(id: string): WallpaperPreset {
  const preset = WALLPAPER_PRESETS.find((w) => w.id === id) ?? WALLPAPER_PRESETS[0];
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, preset.id);
    window.dispatchEvent(new CustomEvent('wejet:wallpaper-change', { detail: preset.id }));
  }
  return preset;
}
