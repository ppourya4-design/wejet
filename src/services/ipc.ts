import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  AppSettings,
  CachedResult,
  CitySearchItem,
  ClipboardEntry,
  DesktopLayout,
  DesktopProfile,
  LauncherItem,
  MediaSessionInfo,
  NoteItem,
  PricesPayload,
  SystemMetrics,
  WeatherPayload,
  WindowsModStatus,
} from '../types/models';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  firstRunComplete: false,
  language: 'fa',
  usePersianDigits: true,
  theme: 'dark-glass',
  accentColor: '#5CC8FF',
  useWallpaperAccent: false,
  activeProfileId: 'productivity',
  layoutLocked: true,
  clickThroughWhenLocked: false,
  widgetsVisible: true,
  globalOpacity: 84,
  snapToGrid: true,
  collisionAwareness: true,
  startWithWindows: false,
  launchMinimizedToTray: false,
  smartHide: 'hide_in_fullscreen_and_games',
  reducedMotion: false,
  weatherCity: 'تهران / Tehran',
  weatherLat: 35.6892,
  weatherLon: 51.389,
  priceRefreshSeconds: 300,
  clipboardEnabled: true,
  clipboardMaxItems: 15,
  hotkeys: {
    toggleLock: 'CommandOrControl+Alt+L',
    quickNote: 'CommandOrControl+Alt+N',
    commandCenter: 'CommandOrControl+Space',
    profileWork: 'CommandOrControl+Alt+1',
    profileGaming: 'CommandOrControl+Alt+2',
    profileStudy: 'CommandOrControl+Alt+3',
  },
};

export function createCuratedDefaultLayout(): DesktopLayout {
  return {
    version: 1,
    referenceWidth: 1440,
    referenceHeight: 900,
    widgets: [
      {
        instanceId: 'w-clock-default',
        widgetType: 'clock',
        monitorId: 'primary-0',
        x: 1080,
        y: 36,
        anchorXRatio: 0.75,
        anchorYRatio: 0.04,
        width: 320,
        height: 184,
        opacity: 84,
        visible: true,
        locked: false,
        zIndex: 1,
        settings: {
          style: 'minimal',
          format24h: true,
          showSeconds: false,
          showPersianDate: true,
          showGregorianDate: true,
        },
      },
      {
        instanceId: 'w-weather-default',
        widgetType: 'weather',
        monitorId: 'primary-0',
        x: 36,
        y: 36,
        anchorXRatio: 0.025,
        anchorYRatio: 0.04,
        width: 320,
        height: 228,
        opacity: 84,
        visible: true,
        locked: false,
        zIndex: 2,
        settings: { unit: 'C', showForecast: true },
      },
      {
        instanceId: 'w-notes-default',
        widgetType: 'notes',
        monitorId: 'primary-0',
        x: 36,
        y: 536,
        anchorXRatio: 0.025,
        anchorYRatio: 0.595,
        width: 320,
        height: 316,
        opacity: 86,
        visible: true,
        locked: false,
        zIndex: 3,
        settings: {},
      },
      {
        instanceId: 'w-system-default',
        widgetType: 'system',
        monitorId: 'primary-0',
        x: 1080,
        y: 432,
        anchorXRatio: 0.75,
        anchorYRatio: 0.48,
        width: 320,
        height: 212,
        opacity: 82,
        visible: true,
        locked: false,
        zIndex: 4,
        settings: { showChart: true, showNetwork: true },
      },
      {
        instanceId: 'w-music-default',
        widgetType: 'music',
        monitorId: 'primary-0',
        x: 1080,
        y: 664,
        anchorXRatio: 0.75,
        anchorYRatio: 0.74,
        width: 320,
        height: 184,
        opacity: 86,
        visible: true,
        locked: false,
        zIndex: 5,
        settings: {},
      },
    ],
  };
}

export function createDefaultProfiles(): DesktopProfile[] {
  const base = createCuratedDefaultLayout();
  return [
    {
      id: 'productivity',
      nameFa: 'بهره‌وری (پیش‌فرض)',
      nameEn: 'Personal & Productivity',
      descriptionFa: 'چیدمان متعادل شامل ساعت، آب‌وهوا، یادداشت، پایش سیستم و موسیقی',
      descriptionEn: 'Balanced desktop with clock, weather, notes, telemetry, and media',
      icon: 'sparkles',
      theme: 'dark-glass',
      accentColor: '#5CC8FF',
      opacity: 84,
      layout: base,
    },
    {
      id: 'work',
      nameFa: 'کاری',
      nameEn: 'Work',
      descriptionFa: 'تمرکز بر تقویم جلالی، نرخ ارز و طلا، وظایف روزانه و ساعت',
      descriptionEn: 'Focused workspace with Jalali calendar, market rates, tasks, and clock',
      icon: 'briefcase',
      theme: 'frost',
      accentColor: '#38BDF8',
      opacity: 88,
      layout: {
        ...base,
        widgets: [
          ...base.widgets.filter((w) => w.widgetType === 'clock' || w.widgetType === 'notes'),
          {
            instanceId: 'w-calendar-work',
            widgetType: 'calendar',
            monitorId: 'primary-0',
            x: 36,
            y: 36,
            anchorXRatio: 0.025,
            anchorYRatio: 0.04,
            width: 328,
            height: 312,
            opacity: 88,
            visible: true,
            locked: false,
            zIndex: 6,
            settings: {},
          },
          {
            instanceId: 'w-prices-work',
            widgetType: 'prices',
            monitorId: 'primary-0',
            x: 1080,
            y: 240,
            anchorXRatio: 0.75,
            anchorYRatio: 0.27,
            width: 320,
            height: 268,
            opacity: 86,
            visible: true,
            locked: false,
            zIndex: 7,
            settings: {},
          },
        ],
      },
    },
    {
      id: 'gaming',
      nameFa: 'گیمینگ',
      nameEn: 'Gaming',
      descriptionFa: 'سبک و خلوت با پایش زنده پردازنده/رم و کنترل موسیقی',
      descriptionEn: 'Ultra-lean HUD with hardware telemetry, clock, and media controls',
      icon: 'gamepad',
      theme: 'midnight',
      accentColor: '#818CF8',
      opacity: 76,
      layout: {
        ...base,
        widgets: base.widgets.filter(
          (w) => w.widgetType === 'clock' || w.widgetType === 'system' || w.widgetType === 'music'
        ),
      },
    },
    {
      id: 'study',
      nameFa: 'مطالعه',
      nameEn: 'Study',
      descriptionFa: 'محیط آرام با تقویم، چک‌لیست مطالعه و ساعت شیشه‌ای گرم',
      descriptionEn: 'Calm glass environment with calendar, study checklist, and warm tone',
      icon: 'book',
      theme: 'warm',
      accentColor: '#FBBF24',
      opacity: 86,
      layout: {
        ...base,
        widgets: [
          ...base.widgets.filter((w) => w.widgetType === 'clock' || w.widgetType === 'notes'),
          {
            instanceId: 'w-calendar-study',
            widgetType: 'calendar',
            monitorId: 'primary-0',
            x: 36,
            y: 36,
            anchorXRatio: 0.025,
            anchorYRatio: 0.04,
            width: 328,
            height: 312,
            opacity: 88,
            visible: true,
            locked: false,
            zIndex: 6,
            settings: {},
          },
        ],
      },
    },
    {
      id: 'minimal',
      nameFa: 'مینیمال',
      nameEn: 'Minimal',
      descriptionFa: 'حداکثر فضای تصویر زمینه با ساعت شفاف و وضعیت هوا',
      descriptionEn: 'Pure wallpaper showcase with ultra-translucent clock and weather',
      icon: 'feather',
      theme: 'minimal',
      accentColor: '#94A3B8',
      opacity: 68,
      layout: {
        ...base,
        widgets: base.widgets.filter((w) => w.widgetType === 'clock' || w.widgetType === 'weather'),
      },
    },
    {
      id: 'development',
      nameFa: 'توسعه نرم‌افزار',
      nameEn: 'Development',
      descriptionFa: 'پرتابگر سریع ابزارها، پایش منابع سیستم و یادداشت فنی',
      descriptionEn: 'Dev launcher shortcuts, 60s hardware graphs, and scratchpad notes',
      icon: 'terminal',
      theme: 'aurora',
      accentColor: '#34D399',
      opacity: 84,
      layout: {
        ...base,
        widgets: [
          ...base.widgets.filter(
            (w) => w.widgetType === 'clock' || w.widgetType === 'system' || w.widgetType === 'notes'
          ),
          {
            instanceId: 'w-launcher-dev',
            widgetType: 'launcher',
            monitorId: 'primary-0',
            x: 36,
            y: 36,
            anchorXRatio: 0.025,
            anchorYRatio: 0.04,
            width: 320,
            height: 248,
            opacity: 85,
            visible: true,
            locked: false,
            zIndex: 8,
            settings: {},
          },
        ],
      },
    },
  ];
}

const channel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('wejet-sync-bus') : null;

function readLocal<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(`wejet:${key}`);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore storage errors
  }
  const init = fallback();
  writeLocal(key, init);
  return init;
}

function writeLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`wejet:${key}`, JSON.stringify(val));
    channel?.postMessage({ key, val });
  } catch {
    // ignore storage errors
  }
}

export const WejetIPC = {
  async getSettings(): Promise<AppSettings> {
    if (isTauriRuntime()) return invoke<AppSettings>('get_settings');
    return readLocal('settings', () => DEFAULT_SETTINGS);
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    if (isTauriRuntime()) return invoke<AppSettings>('save_settings', { settings });
    writeLocal('settings', settings);
    return settings;
  },

  async setAutostart(enabled: boolean): Promise<boolean> {
    if (isTauriRuntime()) return invoke<boolean>('set_autostart', { enabled });
    const s = await WejetIPC.getSettings();
    await WejetIPC.saveSettings({ ...s, startWithWindows: enabled });
    return enabled;
  },

  async extractWallpaperColor(): Promise<string | null> {
    if (isTauriRuntime()) return invoke<string | null>('extract_wallpaper_color');
    return '#38BDF8';
  },

  async getLayout(): Promise<DesktopLayout> {
    if (isTauriRuntime()) return invoke<DesktopLayout>('get_layout');
    return readLocal('layout', createCuratedDefaultLayout);
  },

  async saveLayout(layout: DesktopLayout): Promise<DesktopLayout> {
    if (isTauriRuntime()) return invoke<DesktopLayout>('save_layout', { layout });
    writeLocal('layout', layout);
    return layout;
  },

  async getProfiles(): Promise<DesktopProfile[]> {
    if (isTauriRuntime()) return invoke<DesktopProfile[]>('get_profiles');
    return readLocal('profiles', createDefaultProfiles);
  },

  async saveProfiles(profiles: DesktopProfile[]): Promise<DesktopProfile[]> {
    if (isTauriRuntime()) return invoke<DesktopProfile[]>('save_profiles', { profiles });
    writeLocal('profiles', profiles);
    return profiles;
  },

  async activateProfile(profileId: string): Promise<DesktopProfile> {
    if (isTauriRuntime()) return invoke<DesktopProfile>('activate_profile', { profileId });
    const profiles = await WejetIPC.getProfiles();
    const found = profiles.find((p) => p.id === profileId) ?? profiles[0];
    const s = await WejetIPC.getSettings();
    await WejetIPC.saveSettings({
      ...s,
      activeProfileId: found.id,
      theme: found.theme,
      accentColor: found.accentColor,
      globalOpacity: found.opacity,
    });
    await WejetIPC.saveLayout(found.layout);
    return found;
  },

  async getSystemMetrics(): Promise<SystemMetrics> {
    if (isTauriRuntime()) return invoke<SystemMetrics>('get_system_metrics');
    const t = Date.now() / 1000;
    const cpu = 14 + Math.sin(t * 0.65) * 7 + Math.cos(t * 1.4) * 3.5;
    return {
      cpuPercent: Math.max(2, Math.min(96, cpu)),
      ramUsedGb: 7.4 + Math.sin(t * 0.2) * 0.3,
      ramTotalGb: 16.0,
      ramPercent: 46.2,
      diskUsedGb: 284,
      diskTotalGb: 512,
      diskPercent: 55.5,
      netRxKbps: Math.max(8, 340 + Math.sin(t * 0.9) * 210),
      netTxKbps: Math.max(4, 62 + Math.cos(t * 1.1) * 35),
      cpuTempC: 47.0,
    };
  },

  async fetchWeather(forceRefresh = false): Promise<CachedResult<WeatherPayload>> {
    if (isTauriRuntime()) {
      return invoke<CachedResult<WeatherPayload>>('fetch_weather', { forceRefresh });
    }
    const settings = await WejetIPC.getSettings();
    const cacheKey = 'cache-weather';
    const cached = readLocal<CachedResult<WeatherPayload> | null>(cacheKey, () => null);
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      cached &&
      !forceRefresh &&
      nowSec - cached.fetchedAt < 1800 &&
      Math.abs(cached.data.latitude - settings.weatherLat) < 0.05
    ) {
      return { ...cached, ageSeconds: nowSec - cached.fetchedAt, isStale: false };
    }
    try {
      const resp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${settings.weatherLat}&longitude=${settings.weatherLon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
      );
      if (resp.ok) {
        const parsed = (await resp.json()) as {
          current: {
            temperature_2m: number;
            apparent_temperature: number;
            relative_humidity_2m: number;
            wind_speed_10m: number;
            weather_code: number;
            is_day: number;
          };
          daily: {
            time: string[];
            weather_code: number[];
            temperature_2m_max: number[];
            temperature_2m_min: number[];
          };
        };
        const fresh: CachedResult<WeatherPayload> = {
          data: {
            city: settings.weatherCity,
            latitude: settings.weatherLat,
            longitude: settings.weatherLon,
            temperatureC: parsed.current.temperature_2m,
            feelsLikeC: parsed.current.apparent_temperature,
            humidity: parsed.current.relative_humidity_2m,
            windKph: parsed.current.wind_speed_10m,
            weatherCode: parsed.current.weather_code,
            isDay: parsed.current.is_day === 1,
            tempMinC: parsed.daily.temperature_2m_min[0] ?? 14,
            tempMaxC: parsed.daily.temperature_2m_max[0] ?? 24,
            forecast: parsed.daily.time.slice(1, 5).map((date, idx) => ({
              date,
              weatherCode: parsed.daily.weather_code[idx + 1] ?? 1,
              tempMin: parsed.daily.temperature_2m_min[idx + 1] ?? 13,
              tempMax: parsed.daily.temperature_2m_max[idx + 1] ?? 22,
            })),
          },
          fetchedAt: nowSec,
          ageSeconds: 0,
          isStale: false,
          provider: 'Open-Meteo',
        };
        writeLocal(cacheKey, fresh);
        return fresh;
      }
    } catch {
      // Fall through to cached or seed data cleanly
    }
    if (cached) {
      return { ...cached, ageSeconds: Math.max(60, nowSec - cached.fetchedAt), isStale: true };
    }
    return {
      data: {
        city: settings.weatherCity,
        latitude: settings.weatherLat,
        longitude: settings.weatherLon,
        temperatureC: 21,
        feelsLikeC: 20,
        humidity: 34,
        windKph: 11.5,
        weatherCode: 1,
        isDay: true,
        tempMinC: 14,
        tempMaxC: 24,
        forecast: [
          { date: '2026-10-21', weatherCode: 0, tempMin: 14, tempMax: 24 },
          { date: '2026-10-22', weatherCode: 2, tempMin: 13, tempMax: 22 },
          { date: '2026-10-23', weatherCode: 61, tempMin: 11, tempMax: 19 },
          { date: '2026-10-24', weatherCode: 1, tempMin: 12, tempMax: 21 },
        ],
      },
      fetchedAt: nowSec - 1620,
      ageSeconds: 1620,
      isStale: true,
      provider: 'Cached',
    };
  },

  async searchWeatherCity(query: string): Promise<CitySearchItem[]> {
    if (isTauriRuntime()) return invoke<CitySearchItem[]>('search_weather_city', { query });
    const defaults: CitySearchItem[] = [
      { name: 'Tehran / تهران', country: 'Iran', admin1: 'Tehran', latitude: 35.6892, longitude: 51.389 },
      { name: 'Isfahan / اصفهان', country: 'Iran', admin1: 'Isfahan', latitude: 32.6546, longitude: 51.668 },
      { name: 'Shiraz / شیراز', country: 'Iran', admin1: 'Fars', latitude: 29.5918, longitude: 52.5837 },
      { name: 'Mashhad / مشهد', country: 'Iran', admin1: 'Khorasan', latitude: 36.2605, longitude: 59.6168 },
      { name: 'Tabriz / تبریز', country: 'Iran', admin1: 'East Azerbaijan', latitude: 38.0962, longitude: 46.2738 },
      { name: 'Amsterdam', country: 'Netherlands', admin1: 'North Holland', latitude: 52.3676, longitude: 4.9041 },
      { name: 'London', country: 'United Kingdom', admin1: 'England', latitude: 51.5072, longitude: -0.1276 },
    ];
    const q = query.trim().toLowerCase();
    return defaults.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  },

  async fetchPrices(forceRefresh = false): Promise<CachedResult<PricesPayload>> {
    if (isTauriRuntime()) return invoke<CachedResult<PricesPayload>>('fetch_prices', { forceRefresh });
    const nowSec = Math.floor(Date.now() / 1000);
    return {
      data: {
        quotes: [
          { id: 'usd', symbol: 'USD', nameFa: 'دلار آمریکا', nameEn: 'US Dollar', price: 84500, unitFa: 'تومان', unitEn: 'IRT', change24h: 0.42 },
          { id: 'eur', symbol: 'EUR', nameFa: 'یورو اروپا', nameEn: 'Euro', price: 91800, unitFa: 'تومان', unitEn: 'IRT', change24h: 0.31 },
          { id: 'gold18k', symbol: '18K', nameFa: 'طلای ۱۸ عیار', nameEn: '18K Gold (g)', price: 5940000, unitFa: 'تومان', unitEn: 'IRT', change24h: 0.68 },
          { id: 'coin', symbol: 'COIN', nameFa: 'سکه امامی', nameEn: 'Iranian Coin', price: 64800000, unitFa: 'تومان', unitEn: 'IRT', change24h: 0.75 },
          { id: 'btc', symbol: 'BTC', nameFa: 'بیت‌کوین', nameEn: 'Bitcoin', price: 96420, unitFa: 'دلار', unitEn: 'USD', change24h: 1.85 },
          { id: 'eth', symbol: 'ETH', nameFa: 'اتریوم', nameEn: 'Ethereum', price: 3410, unitFa: 'دلار', unitEn: 'USD', change24h: 2.14 },
        ],
      },
      fetchedAt: nowSec,
      ageSeconds: 18,
      isStale: false,
      provider: 'CoinGecko + FX',
    };
  },

  async getNotes(): Promise<NoteItem[]> {
    if (isTauriRuntime()) return invoke<NoteItem[]>('get_notes');
    const now = Math.floor(Date.now() / 1000);
    return readLocal<NoteItem[]>('notes', () => [
      {
        id: 'note-welcome',
        title: 'یادداشت‌ها و اولویت‌های امروز',
        body: 'با میانبر Ctrl + Alt + N یادداشت فوری ثبت کنید و با Ctrl + Space مرکز فرمان شیشه‌ای را باز نمایید.',
        todos: [
          { id: 't1', text: 'مرور برنامه روزانه در تقویم جلالی', completed: true },
          { id: 't2', text: 'تنظیم چیدمان ویجت‌ها با Ctrl + Alt + L', completed: false },
          { id: 't3', text: 'امتحان کردن پوسته شفق قطبی (Aurora)', completed: false },
        ],
        pinned: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async saveNotes(notes: NoteItem[]): Promise<NoteItem[]> {
    if (isTauriRuntime()) return invoke<NoteItem[]>('save_notes', { notes });
    writeLocal('notes', notes);
    return notes;
  },

  async addQuickNote(text: string): Promise<NoteItem[]> {
    if (isTauriRuntime()) return invoke<NoteItem[]>('add_quick_note', { text });
    const existing = await WejetIPC.getNotes();
    const now = Math.floor(Date.now() / 1000);
    const updated: NoteItem[] = [
      {
        id: `note-${Date.now()}`,
        title: text.slice(0, 36),
        body: text,
        todos: [],
        pinned: false,
        createdAt: now,
        updatedAt: now,
      },
      ...existing,
    ];
    writeLocal('notes', updated);
    return updated;
  },

  async getClipboardHistory(): Promise<ClipboardEntry[]> {
    if (isTauriRuntime()) return invoke<ClipboardEntry[]>('get_clipboard_history');
    const now = Math.floor(Date.now() / 1000);
    return readLocal<ClipboardEntry[]>('clipboard', () => [
      { id: 'c1', content: 'https://github.com/wejet-desktop/wejet', pinned: true, copiedAt: now - 120 },
      { id: 'c2', content: 'cargo tauri build --bundles msi,nsis', pinned: false, copiedAt: now - 45 },
    ]);
  },

  async copyToClipboard(text: string): Promise<ClipboardEntry[]> {
    if (isTauriRuntime()) return invoke<ClipboardEntry[]>('copy_to_clipboard', { text });
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // ignore browser permission restrictions
    }
    const existing = await WejetIPC.getClipboardHistory();
    const now = Math.floor(Date.now() / 1000);
    const next = [
      { id: `clip-${Date.now()}`, content: text, pinned: false, copiedAt: now },
      ...existing.filter((x) => x.content !== text),
    ].slice(0, 15);
    writeLocal('clipboard', next);
    return next;
  },

  async saveClipboardHistory(items: ClipboardEntry[]): Promise<ClipboardEntry[]> {
    if (isTauriRuntime()) return invoke<ClipboardEntry[]>('save_clipboard_history', { items });
    writeLocal('clipboard', items);
    return items;
  },

  async clearClipboardHistory(): Promise<ClipboardEntry[]> {
    if (isTauriRuntime()) return invoke<ClipboardEntry[]>('clear_clipboard_history');
    const existing = await WejetIPC.getClipboardHistory();
    const pinned = existing.filter((c) => c.pinned);
    writeLocal('clipboard', pinned);
    return pinned;
  },

  async getLauncherItems(): Promise<LauncherItem[]> {
    if (isTauriRuntime()) return invoke<LauncherItem[]>('get_launcher_items');
    return readLocal<LauncherItem[]>('launcher', () => [
      { id: 'l-exp', name: 'File Explorer', label: 'پوشه‌ها', target: 'explorer.exe', kind: 'app', icon: 'folder' },
      { id: 'l-note', name: 'Notepad', label: 'یادداشت', target: 'notepad.exe', kind: 'app', icon: 'file-text' },
      { id: 'l-calc', name: 'Calculator', label: 'ماشین‌حساب', target: 'calc.exe', kind: 'app', icon: 'calculator' },
      { id: 'l-gh', name: 'GitHub', label: 'گیت‌هاب', target: 'https://github.com', kind: 'url', icon: 'globe' },
    ]);
  },

  async saveLauncherItems(items: LauncherItem[]): Promise<LauncherItem[]> {
    if (isTauriRuntime()) return invoke<LauncherItem[]>('save_launcher_items', { items });
    writeLocal('launcher', items);
    return items;
  },

  async launchTarget(target: string): Promise<void> {
    if (isTauriRuntime()) return invoke<void>('launch_target', { target });
    if (/^https?:\/\//i.test(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  },

  async discoverInstalledApps(): Promise<LauncherItem[]> {
    if (isTauriRuntime()) return invoke<LauncherItem[]>('discover_installed_apps');
    return WejetIPC.getLauncherItems();
  },

  async getMediaInfo(): Promise<MediaSessionInfo> {
    if (isTauriRuntime()) return invoke<MediaSessionInfo>('get_media_info');
    return readLocal<MediaSessionInfo>('media-demo', () => ({
      available: true,
      isPlaying: true,
      title: 'Midnight Glass',
      artist: 'Nils Frahm · Ambient Studio',
      albumTitle: 'Spaces & Reflections',
      sourceApp: 'Windows Media Session',
      coverDataUrl: null,
    }));
  },

  async mediaControl(action: 'play_pause' | 'next' | 'previous'): Promise<boolean> {
    if (isTauriRuntime()) return invoke<boolean>('media_control', { action });
    const tracks = [
      { title: 'Midnight Glass', artist: 'Nils Frahm · Ambient Studio', albumTitle: 'Spaces & Reflections' },
      { title: 'Tehran Dawn', artist: 'Kayhan Kalhor', albumTitle: 'Silent City' },
      { title: 'Solaris Horizon', artist: 'Ólafur Arnalds', albumTitle: 'Living Room Songs' },
    ];
    const current = await WejetIPC.getMediaInfo();
    const idx = Math.max(0, tracks.findIndex((t) => t.title === current.title));
    if (action === 'play_pause') {
      const updated = { ...current, available: true, isPlaying: !current.isPlaying };
      writeLocal('media-demo', updated);
    } else {
      const nextIdx = action === 'next' ? (idx + 1) % tracks.length : (idx - 1 + tracks.length) % tracks.length;
      writeLocal('media-demo', {
        ...current,
        ...tracks[nextIdx],
        available: true,
        isPlaying: true,
      });
    }
    return true;
  },

  async openManager(section?: string): Promise<void> {
    if (isTauriRuntime()) {
      await invoke<void>('open_manager', { section: section ?? null });
      return;
    }
    window.dispatchEvent(new CustomEvent('wejet-local-switch-window', { detail: { mode: 'manager', section } }));
  },

  async getWindowsModStatus(): Promise<WindowsModStatus> {
    if (isTauriRuntime()) return invoke<WindowsModStatus>('get_windows_mod_status');
    return readLocal<WindowsModStatus>('mods', () => ({
      id: 'desktop_icons',
      supportedOnHost: false,
      desktopIconsVisible: true,
      hasBackup: false,
    }));
  },

  async setDesktopIcons(visible: boolean): Promise<WindowsModStatus> {
    if (isTauriRuntime()) return invoke<WindowsModStatus>('set_desktop_icons', { visible });
    const next: WindowsModStatus = {
      id: 'desktop_icons',
      supportedOnHost: false,
      desktopIconsVisible: visible,
      hasBackup: true,
    };
    writeLocal('mods', next);
    return next;
  },

  async revertWindowsMods(): Promise<WindowsModStatus> {
    if (isTauriRuntime()) return invoke<WindowsModStatus>('revert_windows_mods');
    const next: WindowsModStatus = {
      id: 'desktop_icons',
      supportedOnHost: false,
      desktopIconsVisible: true,
      hasBackup: false,
    };
    writeLocal('mods', next);
    return next;
  },

  async exportSetupFile(name: string): Promise<string> {
    if (isTauriRuntime()) return invoke<string>('export_setup_file', { name });
    const [settings, layout, profiles, launcher] = await Promise.all([
      WejetIPC.getSettings(),
      WejetIPC.getLayout(),
      WejetIPC.getProfiles(),
      WejetIPC.getLauncherItems(),
    ]);
    return JSON.stringify(
      {
        format: 'wejet-setup',
        version: 1,
        exportedAt: Math.floor(Date.now() / 1000),
        name,
        theme: settings.theme,
        accentColor: settings.accentColor,
        opacity: settings.globalOpacity,
        layout,
        profiles,
        launcher,
      },
      null,
      2
    );
  },

  async importSetupFile(rawJson: string): Promise<AppSettings> {
    if (isTauriRuntime()) return invoke<AppSettings>('import_setup_file', { rawJson });
    const parsed = JSON.parse(rawJson) as {
      version: number;
      theme: AppSettings['theme'];
      accentColor: string;
      opacity: number;
      layout: DesktopLayout;
      profiles: DesktopProfile[];
      launcher: LauncherItem[];
    };
    if (parsed.version !== 1) throw new Error('Unsupported .wejet file version');
    const s = await WejetIPC.getSettings();
    const updated: AppSettings = {
      ...s,
      theme: parsed.theme,
      accentColor: parsed.accentColor,
      globalOpacity: parsed.opacity,
    };
    await Promise.all([
      WejetIPC.saveSettings(updated),
      WejetIPC.saveLayout(parsed.layout),
      WejetIPC.saveProfiles(parsed.profiles),
      WejetIPC.saveLauncherItems(parsed.launcher),
    ]);
    return updated;
  },

  async exportFullBackup(): Promise<string> {
    if (isTauriRuntime()) return invoke<string>('export_full_backup');
    const [settings, profiles, layouts, notes, launcher] = await Promise.all([
      WejetIPC.getSettings(),
      WejetIPC.getProfiles(),
      WejetIPC.getLayout(),
      WejetIPC.getNotes(),
      WejetIPC.getLauncherItems(),
    ]);
    return JSON.stringify(
      {
        version: 1,
        exportedAt: Math.floor(Date.now() / 1000),
        settings,
        profiles,
        layouts,
        notes,
        launcher,
      },
      null,
      2
    );
  },

  async restoreFullBackup(rawJson: string): Promise<AppSettings> {
    if (isTauriRuntime()) return invoke<AppSettings>('restore_full_backup', { rawJson });
    const parsed = JSON.parse(rawJson) as {
      version: number;
      settings: AppSettings;
      profiles: DesktopProfile[];
      layouts: DesktopLayout;
      notes: NoteItem[];
      launcher: LauncherItem[];
    };
    if (parsed.version !== 1) throw new Error('Unsupported backup version');
    await Promise.all([
      WejetIPC.saveSettings(parsed.settings),
      WejetIPC.saveProfiles(parsed.profiles),
      WejetIPC.saveLayout(parsed.layouts),
      WejetIPC.saveNotes(parsed.notes),
      WejetIPC.saveLauncherItems(parsed.launcher),
    ]);
    return parsed.settings;
  },

  subscribeSync(onEvent: (key: string, val: unknown) => void): () => void {
    const cleanups: UnlistenFn[] = [];
    if (isTauriRuntime()) {
      void listen('wejet://settings-changed', (e) => onEvent('settings', e.payload)).then((u) => cleanups.push(u));
      void listen('wejet://layout-changed', (e) => onEvent('layout', e.payload)).then((u) => cleanups.push(u));
      void listen('wejet://profiles-changed', (e) => onEvent('profiles', e.payload)).then((u) => cleanups.push(u));
      void listen('wejet://notes-changed', (e) => onEvent('notes', e.payload)).then((u) => cleanups.push(u));
      void listen('wejet://launcher-changed', (e) => onEvent('launcher', e.payload)).then((u) => cleanups.push(u));
      void listen('wejet://open-quick-note', () => onEvent('open-quick-note', true)).then((u) => cleanups.push(u));
      void listen('wejet://open-command-center', () => onEvent('open-command-center', true)).then((u) => cleanups.push(u));
      void listen<string>('wejet://navigate', (e) => onEvent('navigate', e.payload)).then((u) => cleanups.push(u));
    }
    const onMsg = (ev: MessageEvent<{ key: string; val: unknown }>) => {
      onEvent(ev.data.key, ev.data.val);
    };
    channel?.addEventListener('message', onMsg);
    return () => {
      cleanups.forEach((fn) => fn());
      channel?.removeEventListener('message', onMsg);
    };
  },
};
