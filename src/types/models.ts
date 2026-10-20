export type Language = 'fa' | 'en';

export type ThemeId =
  | 'dark-glass'
  | 'light-glass'
  | 'midnight'
  | 'frost'
  | 'minimal'
  | 'aurora'
  | 'warm'
  | 'system';

export type SmartHideMode =
  | 'always_show'
  | 'hide_in_fullscreen'
  | 'hide_in_games'
  | 'hide_in_fullscreen_and_games';

export interface HotkeyMap {
  toggleLock: string;
  quickNote: string;
  commandCenter: string;
  profileWork: string;
  profileGaming: string;
  profileStudy: string;
}

export interface AppSettings {
  version: number;
  firstRunComplete: boolean;
  language: Language;
  usePersianDigits: boolean;
  theme: ThemeId;
  accentColor: string;
  useWallpaperAccent: boolean;
  activeProfileId: string;
  layoutLocked: boolean;
  clickThroughWhenLocked: boolean;
  widgetsVisible: boolean;
  globalOpacity: number;
  snapToGrid: boolean;
  collisionAwareness: boolean;
  startWithWindows: boolean;
  launchMinimizedToTray: boolean;
  smartHide: SmartHideMode;
  reducedMotion: boolean;
  weatherCity: string;
  weatherLat: number;
  weatherLon: number;
  priceRefreshSeconds: number;
  clipboardEnabled: boolean;
  clipboardMaxItems: number;
  hotkeys: HotkeyMap;
}

export type WidgetSettingType = 'boolean' | 'select' | 'range' | 'text';

export interface WidgetSettingOption {
  value: string;
  labelFa: string;
  labelEn: string;
}

export interface WidgetSetting {
  key: string;
  type: WidgetSettingType;
  labelFa: string;
  labelEn: string;
  defaultValue: string | number | boolean;
  options?: WidgetSettingOption[];
  min?: number;
  max?: number;
  step?: number;
}

export type WidgetCategory = 'information' | 'productivity' | 'system' | 'media' | 'tools';

export interface WidgetManifest {
  id: string;
  name: string;
  nameFa: string;
  description: string;
  descriptionFa: string;
  category: WidgetCategory;
  icon: string;
  defaultSize: {
    width: number;
    height: number;
  };
  minSize: {
    width: number;
    height: number;
  };
  settingsSchema: WidgetSetting[];
}

export type WidgetSettingsValues = Record<string, string | number | boolean>;

export interface WidgetInstance {
  instanceId: string;
  widgetType: string;
  monitorId: string;
  x: number;
  y: number;
  anchorXRatio: number;
  anchorYRatio: number;
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  settings: WidgetSettingsValues;
}

export interface DesktopLayout {
  version: number;
  referenceWidth: number;
  referenceHeight: number;
  widgets: WidgetInstance[];
}

export interface DesktopProfile {
  id: string;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  icon: string;
  theme: ThemeId;
  accentColor: string;
  opacity: number;
  layout: DesktopLayout;
}

export interface CachedResult<T> {
  data: T;
  fetchedAt: number;
  ageSeconds: number;
  isStale: boolean;
  provider: string;
}

export interface ForecastDay {
  date: string;
  weatherCode: number;
  tempMin: number;
  tempMax: number;
}

export interface WeatherPayload {
  city: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windKph: number;
  weatherCode: number;
  isDay: boolean;
  tempMinC: number;
  tempMaxC: number;
  forecast: ForecastDay[];
}

export interface CitySearchItem {
  name: string;
  country: string;
  admin1?: string | null;
  latitude: number;
  longitude: number;
}

export interface PriceQuote {
  id: string;
  symbol: string;
  nameFa: string;
  nameEn: string;
  price: number;
  unitFa: string;
  unitEn: string;
  change24h: number;
}

export interface PricesPayload {
  quotes: PriceQuote[];
}

export interface SystemMetrics {
  cpuPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  ramPercent: number;
  diskUsedGb: number;
  diskTotalGb: number;
  diskPercent: number;
  netRxKbps: number;
  netTxKbps: number;
  cpuTempC: number | null;
}

export interface TodoEntry {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  todos: TodoEntry[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ClipboardEntry {
  id: string;
  content: string;
  pinned: boolean;
  copiedAt: number;
}

export type LauncherKind = 'app' | 'file' | 'folder' | 'url';

export interface LauncherItem {
  id: string;
  name: string;
  label?: string | null;
  target: string;
  kind: LauncherKind;
  icon: string;
}

export interface MediaSessionInfo {
  available: boolean;
  isPlaying: boolean;
  title: string;
  artist: string;
  albumTitle: string;
  sourceApp: string;
  coverDataUrl?: string | null;
}

export interface WindowsModStatus {
  id: string;
  supportedOnHost: boolean;
  desktopIconsVisible: boolean;
  hasBackup: boolean;
}

export type MiniToolTab = 'calculator' | 'timer' | 'stopwatch' | 'converter' | 'color';
