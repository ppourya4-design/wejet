import React, { useEffect, useState } from 'react';
import { useWejet } from '../context/WejetContext';
import { t } from '../i18n/translations';
import { Icon } from '../components/Icons';
import { DesktopCanvas } from '../components/DesktopCanvas';
import { WidgetRegistry } from '../widgets/registry';
import { THEME_PRESETS } from '../themes/themes';
import {
  getSelectedWallpaperPreset,
  setSelectedWallpaperPreset,
  WALLPAPER_PRESETS,
  WallpaperPreset,
} from '../themes/wallpapers';
import {
  DesktopProfile,
  SmartHideMode,
  ThemeId,
  WidgetCategory,
  WindowsModStatus,
} from '../types/models';
import { isTauriRuntime, WejetIPC } from '../services/ipc';
import { fmtNum } from '../utils/format';

type ManagerSection =
  | 'dashboard'
  | 'widgets'
  | 'spaces'
  | 'themes'
  | 'tools'
  | 'settings'
  | 'about';

const ACCENT_SWATCHES = [
  '#5CC8FF',
  '#38BDF8',
  '#818CF8',
  '#34D399',
  '#FBBF24',
  '#FB7185',
  '#C084FC',
  '#F8FAFC',
];

function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const ManagerWindow: React.FC<{
  initialSection?: string;
  onSwitchToDesktopPreview?: () => void;
}> = ({ initialSection, onSwitchToDesktopPreview }) => {
  const {
    settings,
    layout,
    profiles,
    clipboard,
    updateSettings,
    updateWidget,
    addWidgetFromManifest,
    removeWidget,
    switchProfile,
    setEditingSettingsWidgetId,
    setCommandCenterOpen,
    setQuickNoteOpen,
    openMiniTool,
    copyClipboardItem,
    togglePinClipboard,
    deleteClipboardItem,
    clearClipboard,
    reloadAll,
  } = useWejet();

  const [section, setSection] = useState<ManagerSection>(
    (initialSection as ManagerSection) || 'dashboard'
  );
  const [categoryFilter, setCategoryFilter] = useState<'all' | WidgetCategory>('all');
  const [newSpaceName, setNewSpaceName] = useState('');
  const [modStatus, setModStatus] = useState<WindowsModStatus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [previewWallpaper, setPreviewWallpaper] = useState<WallpaperPreset>(() =>
    getSelectedWallpaperPreset()
  );

  useEffect(() => {
    const sync = () => setPreviewWallpaper(getSelectedWallpaperPreset());
    window.addEventListener('wejet:wallpaper-change', sync);
    return () => window.removeEventListener('wejet:wallpaper-change', sync);
  }, []);

  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    void WejetIPC.getWindowsModStatus().then(setModStatus);
  }, []);

  useEffect(() => {
    return WejetIPC.subscribeSync((key, val) => {
      if (key === 'navigate' && typeof val === 'string') {
        setSection(val as ManagerSection);
      }
    });
  }, []);

  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingEvening';

  const navItems: { id: ManagerSection; label: string; icon: string }[] = [
    { id: 'dashboard', label: t(settings.language, 'navDashboard'), icon: 'grid' },
    { id: 'widgets', label: t(settings.language, 'navWidgets'), icon: 'sparkles' },
    { id: 'spaces', label: t(settings.language, 'navSpaces'), icon: 'briefcase' },
    { id: 'themes', label: t(settings.language, 'navThemes'), icon: 'palette' },
    { id: 'tools', label: t(settings.language, 'navTools'), icon: 'calculator' },
    { id: 'settings', label: t(settings.language, 'navSettings'), icon: 'settings' },
    { id: 'about', label: t(settings.language, 'navAbout'), icon: 'info' },
  ];

  const handleSaveCustomSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    const created: DesktopProfile = {
      id: `custom-${Date.now()}`,
      nameFa: newSpaceName.trim(),
      nameEn: newSpaceName.trim(),
      descriptionFa: 'فضای شخصی ذخیره‌شده از چیدمان فعلی شما',
      descriptionEn: 'Custom saved personal desktop layout & theme',
      icon: 'sparkles',
      theme: settings.theme,
      accentColor: settings.accentColor,
      opacity: settings.globalOpacity,
      layout: JSON.parse(JSON.stringify(layout)) as typeof layout,
    };
    const updated = [...profiles, created];
    await WejetIPC.saveProfiles(updated);
    await reloadAll();
    setNewSpaceName('');
    notify(isFa ? 'فضای کاری جدید ذخیره شد' : 'New Space saved');
  };

  const handleExportSetup = async () => {
    const raw = await WejetIPC.exportSetupFile(settings.activeProfileId || 'MySpace');
    downloadTextFile(`${settings.activeProfileId || 'Wejet'}.wejet`, raw);
    notify(isFa ? 'فایل .wejet آماده و ذخیره شد' : 'Exported .wejet setup file');
  };

  const handleImportSetup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      await WejetIPC.importSetupFile(content);
      await reloadAll();
      notify(isFa ? 'چیدمان .wejet با موفقیت بارگذاری شد' : 'Setup imported cleanly');
    } catch {
      notify(isFa ? 'فایل انتخابی معتبر نیست' : 'Invalid .wejet setup file');
    }
  };

  const handleExportBackup = async () => {
    const raw = await WejetIPC.exportFullBackup();
    downloadTextFile('wejet-backup-v1.json', raw);
    notify(isFa ? 'نسخه پشتیبان کامل ذخیره شد' : 'Full backup exported');
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      await WejetIPC.restoreFullBackup(content);
      await reloadAll();
      notify(isFa ? 'اطلاعات پشتیبان بازیابی شد' : 'Backup restored successfully');
    } catch {
      notify(isFa ? 'فرمت فایل پشتیبان نامعتبر است' : 'Invalid backup JSON file');
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '248px 1fr',
        width: '100%',
        height: '100%',
        background: 'var(--wejet-manager-bg)',
        backdropFilter: 'blur(28px) saturate(165%)',
        color: 'var(--wejet-text)',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '22px 14px',
          background: 'var(--wejet-manager-sidebar)',
          borderInlineEnd: '1px solid var(--wejet-glass-border)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px' }}>
            <img src="/logo.svg" alt="Wejet" width={36} height={36} />
            <div>
              <div style={{ fontWeight: 750, letterSpacing: '0.05em', fontSize: '1.05rem' }}>
                WEJET
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--wejet-text-muted)' }}>
                {t(settings.language, 'tagline')}
              </div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '10px 13px',
                    borderRadius: 12,
                    border: active
                      ? '1px solid var(--wejet-glass-border-strong)'
                      : '1px solid transparent',
                    background: active ? 'var(--wejet-accent-soft)' : 'transparent',
                    color: active ? 'var(--wejet-accent)' : 'var(--wejet-text-secondary)',
                    fontWeight: active ? 650 : 500,
                    fontSize: 'var(--wejet-font-sm)',
                    cursor: 'pointer',
                    textAlign: 'start',
                  }}
                >
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom quick controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
          {!isTauriRuntime() && onSwitchToDesktopPreview && (
            <button
              type="button"
              className="wj-btn wj-btn-primary"
              style={{ width: '100%' }}
              onClick={onSwitchToDesktopPreview}
            >
              <Icon name="eye" size={15} />
              <span>{t(settings.language, 'openDesktopView')}</span>
            </button>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="wj-btn"
              style={{ flex: 1 }}
              onClick={() => void updateSettings({ language: isFa ? 'en' : 'fa' })}
            >
              {isFa ? 'English' : 'فارسی'}
            </button>
            <button
              type="button"
              className="wj-btn"
              style={{ flex: 1 }}
              onClick={() => setCommandCenterOpen(true)}
            >
              <Icon name="search" size={14} />
              <span className="ltr-inline">Ctrl+Space</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          overflowY: 'auto',
          padding: '28px 34px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {toast && (
          <div
            className="wejet-elevated-glass wj-animate-in"
            style={{
              position: 'fixed',
              bottom: 24,
              insetInlineEnd: 24,
              zIndex: 1300,
              padding: '10px 18px',
              fontSize: 'var(--wejet-font-sm)',
              borderColor: 'var(--wejet-accent)',
            }}
          >
            {toast}
          </div>
        )}

        {/* SECTION 1: DASHBOARD & LIVE DESKTOP PREVIEW */}
        {section === 'dashboard' && (
          <>
            <header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: 'var(--wejet-font-xl)', fontWeight: 700 }}>
                  {t(settings.language, greetingKey)}
                </h1>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 'var(--wejet-font-sm)',
                    color: 'var(--wejet-text-muted)',
                  }}
                >
                  {t(settings.language, 'desktopPreviewHint')}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`wj-btn ${!settings.layoutLocked ? 'wj-btn-primary' : ''}`}
                  onClick={() => void updateSettings({ layoutLocked: !settings.layoutLocked })}
                >
                  <Icon name={settings.layoutLocked ? 'unlock' : 'lock'} size={15} />
                  <span>
                    {settings.layoutLocked
                      ? t(settings.language, 'unlockEdit')
                      : t(settings.language, 'lockLayout')}
                  </span>
                </button>
                <button
                  type="button"
                  className="wj-btn"
                  onClick={() => setQuickNoteOpen(true)}
                >
                  <Icon name="notes" size={15} />
                  <span>{t(settings.language, 'quickNote')}</span>
                </button>
                <button
                  type="button"
                  className="wj-btn"
                  onClick={() =>
                    void updateSettings({ widgetsVisible: !settings.widgetsVisible })
                  }
                >
                  <Icon name={settings.widgetsVisible ? 'eye-off' : 'eye'} size={15} />
                  <span>
                    {settings.widgetsVisible
                      ? t(settings.language, 'hideWidgets')
                      : t(settings.language, 'showWidgets')}
                  </span>
                </button>
              </div>
            </header>

            {/* Live Scaled Desktop Layer Preview (Section 48) */}
            <section
              className="wejet-widget-glass"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{t(settings.language, 'desktopPreview')}</strong>
                  <span className="wj-badge">
                    {fmtNum(layout.widgets.filter((w) => w.visible).length, pd)}{' '}
                    {isFa ? 'ویجت فعال' : 'Active'}
                  </span>
                </div>
                <button
                  type="button"
                  className="wj-btn"
                  onClick={() => setSection('widgets')}
                >
                  <Icon name="plus" size={14} />
                  <span>{t(settings.language, 'addWidget')}</span>
                </button>
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 516,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid var(--wejet-glass-border-strong)',
                  background: previewWallpaper.cssBackground,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 1440,
                    height: 900,
                    transform: 'translate(-50%, -50%) scale(0.56)',
                    transformOrigin: 'center center',
                    direction: settings.language === 'fa' ? 'rtl' : 'ltr',
                  }}
                >
                  <DesktopCanvas previewScale={0.56} forceInteractive />
                </div>
              </div>
            </section>

            {/* Installed Active Widgets Strip */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong style={{ fontSize: 'var(--wejet-font-md)' }}>
                {t(settings.language, 'activeWidgets')}
              </strong>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: 12,
                }}
              >
                {layout.widgets.map((w) => {
                  const def = WidgetRegistry.get(w.widgetType);
                  if (!def) return null;
                  return (
                    <div
                      key={w.instanceId}
                      className="wejet-widget-glass"
                      style={{
                        padding: '12px 15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span style={{ color: 'var(--wejet-accent)' }}>
                          <Icon name={def.manifest.icon} size={18} />
                        </span>
                        <div>
                          <div style={{ fontSize: 'var(--wejet-font-sm)', fontWeight: 600 }}>
                            {isFa ? def.manifest.nameFa : def.manifest.name}
                          </div>
                          <div className="tabular-nums" style={{ fontSize: '0.7rem', color: 'var(--wejet-text-muted)' }}>
                            {fmtNum(w.width, pd)}×{fmtNum(w.height, pd)} · {fmtNum(w.opacity, pd)}%
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <button
                          type="button"
                          className="wj-icon-btn"
                          onClick={() => void updateWidget(w.instanceId, { visible: !w.visible })}
                          title={
                            w.visible
                              ? isFa
                                ? 'پنهان کردن'
                                : 'Hide'
                              : isFa
                                ? 'نمایش'
                                : 'Show'
                          }
                        >
                          <Icon name={w.visible ? 'eye' : 'eye-off'} size={15} />
                        </button>
                        <button
                          type="button"
                          className="wj-icon-btn"
                          onClick={() => setEditingSettingsWidgetId(w.instanceId)}
                          title={isFa ? 'تنظیمات ویجت' : 'Widget Settings'}
                        >
                          <Icon name="settings" size={15} />
                        </button>
                        <button
                          type="button"
                          className="wj-icon-btn"
                          style={{ color: 'var(--wejet-danger)' }}
                          onClick={() => void removeWidget(w.instanceId)}
                          title={isFa ? 'حذف ویجت' : 'Remove Widget'}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* SECTION 2: WIDGET GALLERY */}
        {section === 'widgets' && (
          <>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 'var(--wejet-font-xl)' }}>
                  {t(settings.language, 'navWidgets')}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--wejet-font-sm)', color: 'var(--wejet-text-muted)' }}>
                  {isFa
                    ? 'ویجت‌های بومی شیشه‌ای با مصرف نزدیک به صفر پردازنده در حالت بیکار'
                    : 'Lightweight glass widgets engineered for near-zero idle CPU'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(
                  [
                    ['all', isFa ? 'همه' : 'All'],
                    ['information', isFa ? 'اطلاعات' : 'Information'],
                    ['productivity', isFa ? 'بهره‌وری' : 'Productivity'],
                    ['system', isFa ? 'سیستم' : 'System'],
                    ['media', isFa ? 'رسانه' : 'Media'],
                    ['tools', isFa ? 'ابزارها' : 'Tools'],
                  ] as const
                ).map(([cat, label]) => (
                  <button
                    key={cat}
                    type="button"
                    className={`wj-btn ${categoryFilter === cat ? 'wj-btn-primary' : ''}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </header>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 16,
              }}
            >
              {WidgetRegistry.list()
                .filter((item) => categoryFilter === 'all' || item.manifest.category === categoryFilter)
                .map(({ manifest }) => (
                  <div
                    key={manifest.id}
                    className="wejet-widget-glass"
                    style={{
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: 'var(--wejet-accent-soft)',
                            color: 'var(--wejet-accent)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name={manifest.icon} size={20} />
                        </span>
                        <span className="wj-badge tabular-nums">
                          {fmtNum(manifest.defaultSize.width, pd)}×{fmtNum(manifest.defaultSize.height, pd)}
                        </span>
                      </div>
                      <div style={{ fontWeight: 650, fontSize: 'var(--wejet-font-md)' }}>
                        {isFa ? manifest.nameFa : manifest.name}
                      </div>
                      <div style={{ fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)', lineHeight: 1.55 }}>
                        {isFa ? manifest.descriptionFa : manifest.description}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="wj-btn wj-btn-primary"
                      onClick={() => {
                        void addWidgetFromManifest(manifest);
                        notify(
                          isFa
                            ? `ویجت «${manifest.nameFa}» به میزکار اضافه شد`
                            : `Added ${manifest.name} to desktop`
                        );
                      }}
                    >
                      <Icon name="plus" size={15} />
                      <span>{t(settings.language, 'addWidget')}</span>
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* SECTION 3: SPACES / PROFILES */}
        {section === 'spaces' && (
          <>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 'var(--wejet-font-xl)' }}>
                  {t(settings.language, 'navSpaces')}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--wejet-font-sm)', color: 'var(--wejet-text-muted)' }}>
                  {isFa
                    ? 'جابه‌جایی فوری بین چیدمان‌های کاری، گیمینگ، مطالعه و مینیمال با میانبرهای Ctrl+Alt+1..3'
                    : 'Switch complete layouts, themes & opacity presets instantly (Ctrl+Alt+1..3)'}
                </p>
              </div>
              <form onSubmit={(e) => void handleSaveCustomSpace(e)} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="wj-input"
                  style={{ width: 210 }}
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder={isFa ? 'نام فضای جدید...' : 'New Space name...'}
                />
                <button type="submit" className="wj-btn wj-btn-primary">
                  <Icon name="plus" size={14} />
                  <span>{isFa ? 'ذخیره چیدمان فعلی' : 'Save Current Space'}</span>
                </button>
              </form>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {profiles.map((p) => {
                const active = settings.activeProfileId === p.id;
                return (
                  <div
                    key={p.id}
                    className="wejet-widget-glass"
                    style={{
                      padding: 20,
                      borderColor: active ? 'var(--wejet-accent)' : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--wejet-accent)' }}>
                          <Icon name={p.icon} size={20} />
                        </span>
                        {active && <span className="wj-badge">{isFa ? 'فعال' : 'Active'}</span>}
                      </div>
                      <h3 style={{ margin: '10px 0 4px', fontSize: 'var(--wejet-font-md)' }}>
                        {isFa ? p.nameFa : p.nameEn}
                      </h3>
                      <p style={{ margin: 0, fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)', lineHeight: 1.5 }}>
                        {isFa ? p.descriptionFa : p.descriptionEn}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`wj-btn ${active ? 'wj-btn-primary' : ''}`}
                      onClick={() => void switchProfile(p.id)}
                    >
                      {active ? (isFa ? 'فضای فعال فعلی' : 'Active Space') : isFa ? 'فعال‌سازی فضا' : 'Switch to Space'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* SECTION 4: THEMES & APPEARANCE */}
        {section === 'themes' && (
          <>
            <h1 style={{ margin: 0, fontSize: 'var(--wejet-font-xl)' }}>
              {t(settings.language, 'navThemes')}
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
              {(
                [
                  ...Object.values(THEME_PRESETS),
                  {
                    id: 'system' as ThemeId,
                    nameFa: 'هماهنگ با ویندوز (System)',
                    nameEn: 'Follow Windows System',
                    subtitleFa: 'تغییر خودکار بین تیره و روشن بر اساس تنظیمات ویندوز',
                    subtitleEn: 'Automatically tracks Windows dark/light mode',
                    previewGradient: 'linear-gradient(135deg, #17233b 50%, #eef4fc 50%)',
                  },
                ] as const
              ).map((preset) => {
                const selected = settings.theme === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className="wejet-widget-glass"
                    onClick={() => void updateSettings({ theme: preset.id })}
                    style={{
                      padding: 16,
                      textAlign: 'start',
                      cursor: 'pointer',
                      borderColor: selected ? 'var(--wejet-accent)' : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        height: 52,
                        borderRadius: 11,
                        background: preset.previewGradient,
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    />
                    <div style={{ fontWeight: 650, fontSize: 'var(--wejet-font-sm)' }}>
                      {isFa ? preset.nameFa : preset.nameEn}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--wejet-text-muted)' }}>
                      {isFa ? preset.subtitleFa : preset.subtitleEn}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Preview Wallpaper Backdrop Switcher */}
            <div className="wejet-widget-glass" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 'var(--wejet-font-sm)', fontWeight: 600 }}>
                {isFa
                  ? 'تصویر پس‌زمینه پیش‌نمایش میزکار (برای تست بلور شیشه‌ای روی پس‌زمینه‌های مختلف)'
                  : 'Preview Wallpaper Backdrop (Test glass blur & contrast across moods)'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10 }}>
                {WALLPAPER_PRESETS.map((wp) => {
                  const activeWp = previewWallpaper.id === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      className="wejet-widget-glass"
                      onClick={() => {
                        setSelectedWallpaperPreset(wp.id);
                        setPreviewWallpaper(wp);
                      }}
                      style={{
                        padding: 10,
                        cursor: 'pointer',
                        textAlign: 'start',
                        borderColor: activeWp ? 'var(--wejet-accent)' : undefined,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          height: 40,
                          borderRadius: 9,
                          background: wp.cssBackground,
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      />
                      <span style={{ fontSize: 'var(--wejet-font-xs)', fontWeight: 600 }}>
                        {isFa ? wp.nameFa : wp.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent, Opacity & Typography Controls */}
            <div className="wejet-widget-glass" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 'var(--wejet-font-sm)', fontWeight: 600, marginBottom: 10 }}>
                  {t(settings.language, 'accentColor')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {ACCENT_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => void updateSettings({ accentColor: hex })}
                      aria-label={hex}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: hex,
                        border:
                          settings.accentColor.toLowerCase() === hex.toLowerCase()
                            ? '3px solid var(--wejet-text)'
                            : '1px solid rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    className="wj-btn"
                    onClick={async () => {
                      const extracted = await WejetIPC.extractWallpaperColor();
                      if (extracted) {
                        await updateSettings({ accentColor: extracted, useWallpaperAccent: true });
                        notify(isFa ? `رنگ استخراج شد: ${extracted}` : `Extracted ${extracted}`);
                      } else {
                        notify(isFa ? 'تصویر زمینه سفارشی یافت نشد' : 'Using default accent');
                      }
                    }}
                  >
                    <Icon name="palette" size={15} />
                    <span>{t(settings.language, 'wallpaperAccent')}</span>
                  </button>
                </div>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--wejet-font-sm)' }}>
                  <span>{t(settings.language, 'opacity')}</span>
                  <span className="tabular-nums">{fmtNum(settings.globalOpacity, pd)}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={settings.globalOpacity}
                  onChange={(e) => void updateSettings({ globalOpacity: Number(e.target.value) })}
                  style={{ accentColor: 'var(--wejet-accent)' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--wejet-font-sm)' }}>
                <input
                  type="checkbox"
                  checked={settings.usePersianDigits}
                  onChange={(e) => void updateSettings({ usePersianDigits: e.target.checked })}
                  style={{ accentColor: 'var(--wejet-accent)' }}
                />
                <span>{isFa ? 'نمایش ارقام فارسی (۰۱۲۳۴۵۶۷۸۹)' : 'Use Persian Numerals in RTL Mode'}</span>
              </label>
            </div>
          </>
        )}

        {/* SECTION 5: MINI TOOLS, CLIPBOARD & SAFE WINDOWS MODS */}
        {section === 'tools' && (
          <>
            <h1 style={{ margin: 0, fontSize: 'var(--wejet-font-xl)' }}>
              {t(settings.language, 'navTools')}
            </h1>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(
                [
                  ['calculator', isFa ? 'ماشین‌حساب' : 'Calculator'],
                  ['timer', isFa ? 'تایمر تمرکز' : 'Timer'],
                  ['stopwatch', isFa ? 'کرنومتر' : 'Stopwatch'],
                  ['converter', isFa ? 'مبدل واحدها' : 'Unit Converter'],
                  ['color', isFa ? 'انتخابگر رنگ' : 'Color Picker'],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  className="wj-btn wj-btn-primary"
                  onClick={() => openMiniTool(tab)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Local Clipboard History */}
            <section className="wejet-widget-glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{t(settings.language, 'clipboardTitle')}</strong>
                <button type="button" className="wj-btn" onClick={() => void clearClipboard()}>
                  {t(settings.language, 'clearClipboard')}
                </button>
              </div>
              {clipboard.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    background: 'var(--wejet-surface-hover)',
                  }}
                >
                  <code style={{ fontSize: 'var(--wejet-font-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.content}
                  </code>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="wj-icon-btn" onClick={() => void copyClipboardItem(c.content)}>
                      <Icon name="copy" size={14} />
                    </button>
                    <button
                      type="button"
                      className="wj-icon-btn"
                      style={{ color: c.pinned ? 'var(--wejet-accent)' : undefined }}
                      onClick={() => void togglePinClipboard(c.id)}
                    >
                      <Icon name="pin" size={14} />
                    </button>
                    <button
                      type="button"
                      className="wj-icon-btn"
                      style={{ color: 'var(--wejet-danger)' }}
                      onClick={() => void deleteClipboardItem(c.id)}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            {/* Safe Reversible Windows Mods (Sections 51–52) */}
            <section className="wejet-widget-glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <strong>{t(settings.language, 'windowsModsTitle')}</strong>
              <p style={{ margin: 0, fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)' }}>
                {t(settings.language, 'windowsModsDesc')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--wejet-font-sm)' }}>
                  <input
                    type="checkbox"
                    checked={modStatus?.desktopIconsVisible ?? true}
                    onChange={async (e) => {
                      const next = await WejetIPC.setDesktopIcons(e.target.checked);
                      setModStatus(next);
                    }}
                    style={{ accentColor: 'var(--wejet-accent)' }}
                  />
                  <span>{t(settings.language, 'desktopIconsVisible')}</span>
                </label>

                <button
                  type="button"
                  className="wj-btn wj-btn-danger"
                  onClick={async () => {
                    const reverted = await WejetIPC.revertWindowsMods();
                    setModStatus(reverted);
                    notify(isFa ? 'تمام تغییرات به حالت اولیه بازگردانده شد' : 'All Windows tweaks reverted');
                  }}
                >
                  {t(settings.language, 'revertAllMods')}
                </button>
              </div>
            </section>
          </>
        )}

        {/* SECTION 6: SETTINGS, STARTUP, SMART HIDE, EXPORT/IMPORT & BACKUP */}
        {section === 'settings' && (
          <>
            <h1 style={{ margin: 0, fontSize: 'var(--wejet-font-xl)' }}>
              {t(settings.language, 'navSettings')}
            </h1>

            <section className="wejet-widget-glass" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 15 }}>
              {[
                {
                  checked: settings.startWithWindows,
                  label: t(settings.language, 'startWithWindows'),
                  onChange: (v: boolean) => void WejetIPC.setAutostart(v).then(() => updateSettings({ startWithWindows: v })),
                },
                {
                  checked: settings.launchMinimizedToTray,
                  label: t(settings.language, 'launchMinimized'),
                  onChange: (v: boolean) => void updateSettings({ launchMinimizedToTray: v }),
                },
                {
                  checked: settings.clickThroughWhenLocked,
                  label: t(settings.language, 'clickThrough'),
                  onChange: (v: boolean) => void updateSettings({ clickThroughWhenLocked: v }),
                },
                {
                  checked: settings.snapToGrid,
                  label: t(settings.language, 'snapToGrid'),
                  onChange: (v: boolean) => void updateSettings({ snapToGrid: v }),
                },
                {
                  checked: settings.collisionAwareness,
                  label: t(settings.language, 'collisionAwareness'),
                  onChange: (v: boolean) => void updateSettings({ collisionAwareness: v }),
                },
                {
                  checked: settings.reducedMotion,
                  label: isFa ? 'کاهش انیمیشن‌ها (Reduced Motion)' : 'Reduce Motion Effects',
                  onChange: (v: boolean) => void updateSettings({ reducedMotion: v }),
                },
              ].map((row) => (
                <label
                  key={row.label}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 'var(--wejet-font-sm)' }}
                >
                  <span>{row.label}</span>
                  <input
                    type="checkbox"
                    checked={row.checked}
                    onChange={(e) => row.onChange(e.target.checked)}
                    style={{ width: 17, height: 17, accentColor: 'var(--wejet-accent)' }}
                  />
                </label>
              ))}

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420 }}>
                <span style={{ fontSize: 'var(--wejet-font-sm)' }}>{t(settings.language, 'smartHide')}</span>
                <select
                  className="wj-input"
                  value={settings.smartHide}
                  onChange={(e) => void updateSettings({ smartHide: e.target.value as SmartHideMode })}
                >
                  <option value="hide_in_fullscreen_and_games" style={{ background: '#111827', color: '#fff' }}>
                    {t(settings.language, 'smartHideBoth')}
                  </option>
                  <option value="hide_in_fullscreen" style={{ background: '#111827', color: '#fff' }}>
                    {t(settings.language, 'smartHideFull')}
                  </option>
                  <option value="hide_in_games" style={{ background: '#111827', color: '#fff' }}>
                    {t(settings.language, 'smartHideGames')}
                  </option>
                  <option value="always_show" style={{ background: '#111827', color: '#fff' }}>
                    {t(settings.language, 'smartHideAlways')}
                  </option>
                </select>
              </label>
            </section>

            {/* Export / Import (.wejet) & Backup/Restore */}
            <section className="wejet-widget-glass" style={{ padding: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="wj-btn wj-btn-primary" onClick={() => void handleExportSetup()}>
                {t(settings.language, 'exportSetup')}
              </button>
              <label className="wj-btn" style={{ cursor: 'pointer' }}>
                <span>{t(settings.language, 'importSetup')}</span>
                <input type="file" accept=".wejet,.json" hidden onChange={(e) => void handleImportSetup(e)} />
              </label>
              <button type="button" className="wj-btn" onClick={() => void handleExportBackup()}>
                {t(settings.language, 'exportBackup')}
              </button>
              <label className="wj-btn" style={{ cursor: 'pointer' }}>
                <span>{t(settings.language, 'restoreBackup')}</span>
                <input type="file" accept=".json" hidden onChange={(e) => void handleRestoreBackup(e)} />
              </label>
            </section>
          </>
        )}

        {/* SECTION 7: ABOUT */}
        {section === 'about' && (
          <section className="wejet-widget-glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 680 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img src="/logo.svg" alt="Wejet" width={52} height={52} />
              <div>
                <h2 style={{ margin: 0 }}>WEJET v1.0.0</h2>
                <div style={{ color: 'var(--wejet-accent)', fontSize: 'var(--wejet-font-sm)' }}>
                  {t(settings.language, 'tagline')}
                </div>
              </div>
            </div>
            <p style={{ margin: 0, lineHeight: 1.7, fontSize: 'var(--wejet-font-sm)', color: 'var(--wejet-text-secondary)' }}>
              {isFa
                ? 'Wejet یک محیط دسکتاپ بومی، فوق‌سبک و شیشه‌ای برای ویندوز ۱۱ و ۱۰ است که بر پایه Rust، Tauri 2 و WebView2 سیستمی ساخته شده است. تمام ویجت‌ها درون یک لایه واحد Desktop Layer با مصرف بسیار پایین رم و پردازنده اجرا می‌شوند و تمام داده‌ها به صورت محلی و بدون نیاز به حساب کاربری ذخیره می‌گردند.'
                : 'Wejet is a native, lightweight personal desktop environment for Windows 11 & 10 built on Rust, Tauri 2, and system WebView2. All desktop widgets share a single Desktop Layer WebView for minimal RAM/CPU overhead, storing data locally in atomic AppData JSON files with zero accounts or telemetry.'}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10,
                marginTop: 4,
              }}
            >
              <div className="wejet-widget-glass" style={{ padding: 12 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--wejet-text-muted)' }}>
                  {isFa ? 'ویجت‌های فعال لایه واحد' : 'Single-Layer Widgets'}
                </div>
                <div className="tabular-nums" style={{ fontSize: 'var(--wejet-font-md)', fontWeight: 700, marginTop: 2 }}>
                  {fmtNum(layout.widgets.filter((w) => w.visible).length, pd)} / {fmtNum(layout.widgets.length, pd)}
                </div>
              </div>
              <div className="wejet-widget-glass" style={{ padding: 12 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--wejet-text-muted)' }}>
                  {isFa ? 'حجم نصب‌کننده ویندوز' : 'Windows Setup Size'}
                </div>
                <div className="ltr-inline tabular-nums" style={{ fontSize: 'var(--wejet-font-md)', fontWeight: 700, marginTop: 2 }}>
                  2.20 MiB
                </div>
              </div>
              <div className="wejet-widget-glass" style={{ padding: 12 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--wejet-text-muted)' }}>
                  {isFa ? 'باینری بومی (LTO)' : 'Native Binary Payload'}
                </div>
                <div className="ltr-inline tabular-nums" style={{ fontSize: 'var(--wejet-font-md)', fontWeight: 700, marginTop: 2 }}>
                  5.20 MB
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="wj-badge">Rust + Tauri 2</span>
              <span className="wj-badge">Single Desktop WebView</span>
              <span className="wj-badge">WorkerW + DWM Acrylic</span>
              <span className="wj-badge">MIT License</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ManagerWindow;
