import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppSettings,
  ClipboardEntry,
  DesktopLayout,
  DesktopProfile,
  LauncherItem,
  MiniToolTab,
  NoteItem,
  WidgetInstance,
  WidgetManifest,
} from '../types/models';
import {
  createCuratedDefaultLayout,
  createDefaultProfiles,
  DEFAULT_SETTINGS,
  WejetIPC,
} from '../services/ipc';
import { applyThemeToDocument } from '../themes/themes';

interface WejetContextValue {
  ready: boolean;
  settings: AppSettings;
  layout: DesktopLayout;
  profiles: DesktopProfile[];
  notes: NoteItem[];
  launcher: LauncherItem[];
  clipboard: ClipboardEntry[];
  selectedWidgetId: string | null;
  editingSettingsWidgetId: string | null;
  commandCenterOpen: boolean;
  quickNoteOpen: boolean;
  miniToolOpen: MiniToolTab | null;
  initialTimerSeconds: number | null;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  updateLayout: (next: DesktopLayout) => Promise<void>;
  updateWidget: (instanceId: string, patch: Partial<WidgetInstance>) => Promise<void>;
  addWidgetFromManifest: (manifest: WidgetManifest) => Promise<void>;
  duplicateWidget: (instanceId: string) => Promise<void>;
  removeWidget: (instanceId: string) => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  saveNotesList: (notes: NoteItem[]) => Promise<void>;
  createQuickNote: (text: string) => Promise<void>;
  saveLauncherList: (items: LauncherItem[]) => Promise<void>;
  copyClipboardItem: (text: string) => Promise<void>;
  togglePinClipboard: (id: string) => Promise<void>;
  deleteClipboardItem: (id: string) => Promise<void>;
  clearClipboard: () => Promise<void>;
  setSelectedWidgetId: (id: string | null) => void;
  setEditingSettingsWidgetId: (id: string | null) => void;
  setCommandCenterOpen: (open: boolean) => void;
  setQuickNoteOpen: (open: boolean) => void;
  openMiniTool: (tab: MiniToolTab | null, timerSeconds?: number) => void;
  reloadAll: () => Promise<void>;
}

const WejetContext = createContext<WejetContextValue | null>(null);

export const WejetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [layout, setLayout] = useState<DesktopLayout>(createCuratedDefaultLayout);
  const [profiles, setProfiles] = useState<DesktopProfile[]>(createDefaultProfiles);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [launcher, setLauncher] = useState<LauncherItem[]>([]);
  const [clipboard, setClipboard] = useState<ClipboardEntry[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [editingSettingsWidgetId, setEditingSettingsWidgetId] = useState<string | null>(null);
  const [commandCenterOpen, setCommandCenterOpen] = useState(false);
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [miniToolOpen, setMiniToolOpen] = useState<MiniToolTab | null>(null);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState<number | null>(null);

  const reloadAll = useCallback(async () => {
    const [s, l, p, n, ln, cb] = await Promise.all([
      WejetIPC.getSettings(),
      WejetIPC.getLayout(),
      WejetIPC.getProfiles(),
      WejetIPC.getNotes(),
      WejetIPC.getLauncherItems(),
      WejetIPC.getClipboardHistory(),
    ]);
    setSettings(s);
    setLayout(l);
    setProfiles(p);
    setNotes(n);
    setLauncher(ln);
    setClipboard(cb);
    setReady(true);
  }, []);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  // Apply theme, direction, language, and OS dark-mode watcher immediately
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'fa' ? 'rtl' : 'ltr';
    applyThemeToDocument(
      settings.theme,
      settings.accentColor,
      settings.globalOpacity,
      settings.reducedMotion
    );

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSchemeChange = () => {
      if (settings.theme === 'system') {
        applyThemeToDocument(
          'system',
          settings.accentColor,
          settings.globalOpacity,
          settings.reducedMotion
        );
      }
    };
    mq?.addEventListener?.('change', onSchemeChange);
    return () => mq?.removeEventListener?.('change', onSchemeChange);
  }, [settings.language, settings.theme, settings.accentColor, settings.globalOpacity, settings.reducedMotion]);

  // Cross-window synchronization (Manager <-> Desktop Layer)
  useEffect(() => {
    return WejetIPC.subscribeSync((key, val) => {
      if (key === 'settings' && val) setSettings(val as AppSettings);
      if (key === 'layout' && val) setLayout(val as DesktopLayout);
      if (key === 'profiles' && val) setProfiles(val as DesktopProfile[]);
      if (key === 'notes' && val) setNotes(val as NoteItem[]);
      if (key === 'launcher' && val) setLauncher(val as LauncherItem[]);
      if (key === 'clipboard' && val) setClipboard(val as ClipboardEntry[]);
      if (key === 'open-quick-note') setQuickNoteOpen(true);
      if (key === 'open-command-center') setCommandCenterOpen(true);
    });
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...patch };
      void WejetIPC.saveSettings(merged);
      return merged;
    });
  }, []);

  const updateLayout = useCallback(async (next: DesktopLayout) => {
    setLayout(next);
    await WejetIPC.saveLayout(next);
  }, []);

  const updateWidget = useCallback(async (instanceId: string, patch: Partial<WidgetInstance>) => {
    setLayout((prev) => {
      const next: DesktopLayout = {
        ...prev,
        widgets: prev.widgets.map((w) => (w.instanceId === instanceId ? { ...w, ...patch } : w)),
      };
      void WejetIPC.saveLayout(next);
      return next;
    });
  }, []);

  const addWidgetFromManifest = useCallback(async (manifest: WidgetManifest) => {
    const defaultSettings: Record<string, string | number | boolean> = {};
    manifest.settingsSchema.forEach((field) => {
      defaultSettings[field.key] = field.defaultValue;
    });
    setLayout((prev) => {
      const offset = (prev.widgets.length % 5) * 24;
      const maxZ = prev.widgets.reduce((acc, w) => Math.max(acc, w.zIndex), 1);
      const instance: WidgetInstance = {
        instanceId: `w-${manifest.id}-${Date.now()}`,
        widgetType: manifest.id,
        monitorId: 'primary-0',
        x: 392 + offset,
        y: 96 + offset,
        anchorXRatio: (392 + offset) / 1440,
        anchorYRatio: (96 + offset) / 900,
        width: manifest.defaultSize.width,
        height: manifest.defaultSize.height,
        opacity: settings.globalOpacity,
        visible: true,
        locked: false,
        zIndex: maxZ + 1,
        settings: defaultSettings,
      };
      const next = { ...prev, widgets: [...prev.widgets, instance] };
      void WejetIPC.saveLayout(next);
      setSelectedWidgetId(instance.instanceId);
      return next;
    });
  }, [settings.globalOpacity]);

  const duplicateWidget = useCallback(async (instanceId: string) => {
    setLayout((prev) => {
      const src = prev.widgets.find((w) => w.instanceId === instanceId);
      if (!src) return prev;
      const maxZ = prev.widgets.reduce((acc, w) => Math.max(acc, w.zIndex), 1);
      const copy: WidgetInstance = {
        ...src,
        instanceId: `w-${src.widgetType}-${Date.now()}`,
        x: src.x + 24,
        y: src.y + 24,
        zIndex: maxZ + 1,
        settings: { ...src.settings },
      };
      const next = { ...prev, widgets: [...prev.widgets, copy] };
      void WejetIPC.saveLayout(next);
      setSelectedWidgetId(copy.instanceId);
      return next;
    });
  }, []);

  const removeWidget = useCallback(async (instanceId: string) => {
    setLayout((prev) => {
      const next = { ...prev, widgets: prev.widgets.filter((w) => w.instanceId !== instanceId) };
      void WejetIPC.saveLayout(next);
      return next;
    });
    setSelectedWidgetId((cur) => (cur === instanceId ? null : cur));
    setEditingSettingsWidgetId((cur) => (cur === instanceId ? null : cur));
  }, []);

  const switchProfile = useCallback(async (profileId: string) => {
    const activated = await WejetIPC.activateProfile(profileId);
    setLayout(activated.layout);
    setSettings((prev) => ({
      ...prev,
      activeProfileId: activated.id,
      theme: activated.theme,
      accentColor: activated.accentColor,
      globalOpacity: activated.opacity,
    }));
  }, []);

  const saveNotesList = useCallback(async (next: NoteItem[]) => {
    setNotes(next);
    await WejetIPC.saveNotes(next);
  }, []);

  const createQuickNote = useCallback(async (text: string) => {
    const next = await WejetIPC.addQuickNote(text);
    setNotes(next);
  }, []);

  const saveLauncherList = useCallback(async (items: LauncherItem[]) => {
    setLauncher(items);
    await WejetIPC.saveLauncherItems(items);
  }, []);

  const copyClipboardItem = useCallback(async (text: string) => {
    const next = await WejetIPC.copyToClipboard(text);
    setClipboard(next);
  }, []);

  const togglePinClipboard = useCallback(async (id: string) => {
    setClipboard((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c));
      void WejetIPC.saveClipboardHistory(next);
      return next;
    });
  }, []);

  const deleteClipboardItem = useCallback(async (id: string) => {
    setClipboard((prev) => {
      const next = prev.filter((c) => c.id !== id);
      void WejetIPC.saveClipboardHistory(next);
      return next;
    });
  }, []);

  const clearClipboard = useCallback(async () => {
    const next = await WejetIPC.clearClipboardHistory();
    setClipboard(next);
  }, []);

  const openMiniTool = useCallback((tab: MiniToolTab | null, timerSeconds?: number) => {
    setInitialTimerSeconds(timerSeconds ?? null);
    setMiniToolOpen(tab);
  }, []);

  // In-window keyboard shortcuts (complements OS global shortcuts seamlessly)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        setCommandCenterOpen((v) => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === 'KeyL') {
        e.preventDefault();
        void updateSettings({ layoutLocked: !settings.layoutLocked });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === 'KeyN') {
        e.preventDefault();
        setQuickNoteOpen((v) => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === 'Digit1') {
        e.preventDefault();
        void switchProfile('work');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === 'Digit2') {
        e.preventDefault();
        void switchProfile('gaming');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === 'Digit3') {
        e.preventDefault();
        void switchProfile('study');
        return;
      }
      if (e.key === 'Escape') {
        setCommandCenterOpen(false);
        setQuickNoteOpen(false);
        setEditingSettingsWidgetId(null);
        setMiniToolOpen(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.layoutLocked, switchProfile, updateSettings]);

  const value = useMemo<WejetContextValue>(
    () => ({
      ready,
      settings,
      layout,
      profiles,
      notes,
      launcher,
      clipboard,
      selectedWidgetId,
      editingSettingsWidgetId,
      commandCenterOpen,
      quickNoteOpen,
      miniToolOpen,
      initialTimerSeconds,
      updateSettings,
      updateLayout,
      updateWidget,
      addWidgetFromManifest,
      duplicateWidget,
      removeWidget,
      switchProfile,
      saveNotesList,
      createQuickNote,
      saveLauncherList,
      copyClipboardItem,
      togglePinClipboard,
      deleteClipboardItem,
      clearClipboard,
      setSelectedWidgetId,
      setEditingSettingsWidgetId,
      setCommandCenterOpen,
      setQuickNoteOpen,
      openMiniTool,
      reloadAll,
    }),
    [
      ready,
      settings,
      layout,
      profiles,
      notes,
      launcher,
      clipboard,
      selectedWidgetId,
      editingSettingsWidgetId,
      commandCenterOpen,
      quickNoteOpen,
      miniToolOpen,
      initialTimerSeconds,
      updateSettings,
      updateLayout,
      updateWidget,
      addWidgetFromManifest,
      duplicateWidget,
      removeWidget,
      switchProfile,
      saveNotesList,
      createQuickNote,
      saveLauncherList,
      copyClipboardItem,
      togglePinClipboard,
      deleteClipboardItem,
      clearClipboard,
      openMiniTool,
      reloadAll,
    ]
  );

  return <WejetContext.Provider value={value}>{children}</WejetContext.Provider>;
};

export function useWejet(): WejetContextValue {
  const ctx = useContext(WejetContext);
  if (!ctx) throw new Error('useWejet must be used inside WejetProvider');
  return ctx;
}
