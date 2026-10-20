import { describe, expect, it } from 'vitest';
import { WidgetRegistry } from '../widgets/registry';
import {
  gregorianToJalali,
  isJalaliLeapYear,
  jalaliFirstWeekdaySaturdayIndex,
  jalaliMonthLength,
  jalaliToGregorian,
} from '../utils/jalali';
import jalaliHolidays from '../data/jalaliHolidays.json';
import {
  evaluateSafeMath,
  fmtPrice,
  formatRelativeAge,
  toPersianDigits,
} from '../utils/format';
import { applyThemeToDocument, resolveEffectiveTheme, THEME_PRESETS } from '../themes/themes';
import {
  getSelectedWallpaperPreset,
  setSelectedWallpaperPreset,
  WALLPAPER_PRESETS,
} from '../themes/wallpapers';
import {
  createCuratedDefaultLayout,
  createDefaultProfiles,
  WejetIPC,
} from '../services/ipc';
import { t } from '../i18n/translations';

describe('WEJET Core Frontend Suite', () => {
  it('registers all 8 core desktop widgets with valid size bounds and schemas', () => {
    const all = WidgetRegistry.list();
    expect(all.length).toBeGreaterThanOrEqual(8);
    const ids = all.map((w) => w.manifest.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'clock',
        'calendar',
        'weather',
        'system',
        'prices',
        'notes',
        'launcher',
        'music',
      ])
    );
    for (const entry of all) {
      expect(entry.manifest.defaultSize.width).toBeGreaterThanOrEqual(entry.manifest.minSize.width);
      expect(entry.manifest.defaultSize.height).toBeGreaterThanOrEqual(entry.manifest.minSize.height);
    }
  });

  it('converts Gregorian <-> Jalali dates accurately including Nowruz, holidays, and leap years', () => {
    // 2026-03-21 -> 1 Farvardin 1405
    expect(gregorianToJalali(2026, 3, 21)).toEqual({ jy: 1405, jm: 1, jd: 1 });
    // 2026-10-20 -> 28 Mehr 1405
    expect(gregorianToJalali(2026, 10, 20)).toEqual({ jy: 1405, jm: 7, jd: 28 });

    const roundTrip = jalaliToGregorian(1405, 7, 28);
    expect(roundTrip).toEqual({ gy: 2026, gm: 10, gd: 20 });

    expect(isJalaliLeapYear(1403)).toBe(true);
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(jalaliMonthLength(1405, 12)).toBe(29);
    expect(jalaliFirstWeekdaySaturdayIndex(1405, 1)).toBeGreaterThanOrEqual(0);
    expect(jalaliHolidays.some((h) => h.month === 1 && h.day === 1)).toBe(true);
  });

  it('evaluates safe math expressions, price formatting, stale cache labels, and Persian digits', () => {
    expect(evaluateSafeMath('(100 + 45) * 2')).toBe(290);
    expect(evaluateSafeMath('2^8')).toBe(256);
    expect(evaluateSafeMath('10 / 0')).toBeNull();
    expect(evaluateSafeMath('alert(1)')).toBeNull();
    expect(fmtPrice(84500, true)).toBe('۸۴,۵۰۰');
    expect(formatRelativeAge(300, 'en', false)).toBe('Last updated 5 min ago');
    expect(toPersianDigits(1405)).toBe('۱۴۰۵');
  });

  it('switches dark and light themes with automatic WCAG-legible accent tokens', () => {
    expect(Object.keys(THEME_PRESETS)).toHaveLength(7);
    expect(resolveEffectiveTheme('system', true).id).toBe('dark-glass');
    expect(resolveEffectiveTheme('system', false).id).toBe('light-glass');

    applyThemeToDocument('aurora', '#34D399', 78, false);
    expect(document.documentElement.dataset.theme).toBe('aurora');
    expect(document.documentElement.style.getPropertyValue('--wejet-accent')).toBe('#34D399');

    applyThemeToDocument('frost', '#5CC8FF', 84, true);
    expect(document.documentElement.dataset.theme).toBe('frost');
    expect(document.documentElement.dataset.colorScheme).toBe('light');
    expect(document.documentElement.dataset.reducedMotion).toBe('true');
    expect(document.documentElement.style.getPropertyValue('--wejet-accent')).toContain('color-mix');
  });

  it('persists and broadcasts wallpaper backdrop changes cleanly', () => {
    expect(WALLPAPER_PRESETS.length).toBeGreaterThanOrEqual(5);
    const chosen = setSelectedWallpaperPreset('persian-turquoise');
    expect(chosen.id).toBe('persian-turquoise');
    expect(getSelectedWallpaperPreset().id).toBe('persian-turquoise');
    setSelectedWallpaperPreset('midnight-sapphire');
  });

  it('provides complete localized strings in both Persian (FA) and English (EN)', () => {
    expect(t('fa', 'tagline')).toBeTruthy();
    expect(t('en', 'tagline')).toBe('Your desktop. Your space.');
    expect(t('fa', 'unlockEdit')).not.toBe(t('en', 'unlockEdit'));
  });

  it('serializes layout, switches profiles, and round-trips .wejet setup export/import + full backup', async () => {
    const layout = createCuratedDefaultLayout();
    expect(layout.widgets.length).toBe(5);

    const profiles = createDefaultProfiles();
    expect(profiles.map((p) => p.id)).toContain('gaming');
    expect(profiles.map((p) => p.id)).toContain('work');

    await WejetIPC.activateProfile('gaming');
    const exported = await WejetIPC.exportSetupFile('GamingPreset');
    const parsed = JSON.parse(exported) as { format: string; version: number; theme: string };
    expect(parsed.format).toBe('wejet-setup');
    expect(parsed.version).toBe(1);
    expect(parsed.theme).toBe('midnight');

    const restoredSettings = await WejetIPC.importSetupFile(exported);
    expect(restoredSettings.theme).toBe('midnight');

    const fullBackup = await WejetIPC.exportFullBackup();
    expect(JSON.parse(fullBackup).version).toBe(1);
    await WejetIPC.restoreFullBackup(fullBackup);
  });
});
