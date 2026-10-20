import React, { useMemo, useState } from 'react';
import { useWejet } from '../context/WejetContext';
import { t } from '../i18n/translations';
import { evaluateSafeMath, fmtNum } from '../utils/format';
import { Icon } from '../components/Icons';
import { THEME_PRESETS } from '../themes/themes';
import { WidgetRegistry } from '../widgets/registry';
import { WejetIPC } from '../services/ipc';
import { ThemeId } from '../types/models';

interface CommandActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  run: () => void;
}

function parseTimerQuerySeconds(q: string): number | null {
  const m = q.trim().match(/^(\d+)\s*(min|mins|minute|minutes|m|دقیقه|sec|secs|s|ثانیه)$/i);
  if (!m) return null;
  const val = Number(m[1]);
  if (!Number.isFinite(val) || val <= 0) return null;
  const unit = m[2].toLowerCase();
  return unit.startsWith('s') || unit === 'ثانیه' ? val : val * 60;
}

export const CommandCenter: React.FC = () => {
  const {
    settings,
    profiles,
    launcher,
    clipboard,
    commandCenterOpen,
    setCommandCenterOpen,
    setQuickNoteOpen,
    createQuickNote,
    switchProfile,
    updateSettings,
    addWidgetFromManifest,
    copyClipboardItem,
    openMiniTool,
  } = useWejet();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;
  const mathAnswer = useMemo(() => evaluateSafeMath(query), [query]);
  const parsedTimerSec = useMemo(() => parseTimerQuerySeconds(query), [query]);

  const actions = useMemo<CommandActionItem[]>(() => {
    const list: CommandActionItem[] = [];

    if (mathAnswer !== null) {
      list.push({
        id: 'math-result',
        title: `= ${fmtNum(mathAnswer, pd)}`,
        subtitle: isFa ? 'Enter برای کپی پاسخ محاسبه در کلیپ‌بورد' : 'Press Enter to copy result',
        icon: 'calculator',
        run: () => {
          void copyClipboardItem(String(mathAnswer));
          setCommandCenterOpen(false);
        },
      });
    }

    if (parsedTimerSec !== null) {
      const mins = Math.round((parsedTimerSec / 60) * 10) / 10;
      list.push({
        id: 'timer-direct',
        title: isFa ? `شروع تایمر ${fmtNum(mins, pd)} دقیقه‌ای` : `Start ${mins} min Timer`,
        subtitle: isFa ? 'باز کردن تایمر شیشه‌ای و شروع شمارش معکوس' : 'Launch countdown timer overlay',
        icon: 'clock',
        run: () => {
          setCommandCenterOpen(false);
          openMiniTool('timer', parsedTimerSec);
        },
      });
    }

    if (query.trim().toLowerCase().startsWith('note ') && query.trim().length > 5) {
      const noteText = query.trim().slice(5).trim();
      list.push({
        id: 'inline-note',
        title: isFa ? `ذخیره یادداشت فوری: «${noteText}»` : `Save Quick Note: "${noteText}"`,
        subtitle: isFa ? 'افزودن مستقیم به یادداشت‌ها' : 'Add directly to Notes Inbox',
        icon: 'notes',
        run: () => {
          void createQuickNote(noteText);
          setQuery('');
          setCommandCenterOpen(false);
        },
      });
    }

    // Core Quick Actions
    list.push(
      {
        id: 'act-toggle-lock',
        title: settings.layoutLocked
          ? isFa
            ? 'باز کردن قفل و ورود به حالت ویرایش چیدمان (Edit Mode)'
            : 'Unlock & Edit Desktop Layout'
          : isFa
            ? 'قفل کردن چیدمان میزکار (Lock Layout)'
            : 'Lock Desktop Layout',
        subtitle: 'Ctrl + Alt + L',
        icon: settings.layoutLocked ? 'unlock' : 'lock',
        run: () => {
          void updateSettings({ layoutLocked: !settings.layoutLocked });
          setCommandCenterOpen(false);
        },
      },
      {
        id: 'act-quick-note',
        title: isFa ? 'یادداشت سریع جدید (Quick Note)' : 'New Quick Note',
        subtitle: 'Ctrl + Alt + N',
        icon: 'notes',
        run: () => {
          setCommandCenterOpen(false);
          setQuickNoteOpen(true);
        },
      },
      {
        id: 'act-toggle-vis',
        title: settings.widgetsVisible
          ? isFa
            ? 'مخفی کردن موقت ویجت‌های دسکتاپ'
            : 'Hide All Desktop Widgets'
          : isFa
            ? 'نمایش ویجت‌های دسکتاپ'
            : 'Show Desktop Widgets',
        subtitle: isFa ? 'لایه میزکار' : 'Desktop Layer',
        icon: settings.widgetsVisible ? 'eye-off' : 'eye',
        run: () => {
          void updateSettings({ widgetsVisible: !settings.widgetsVisible });
          setCommandCenterOpen(false);
        },
      },
      {
        id: 'act-manager',
        title: isFa ? 'باز کردن مرکز مدیریت Wejet' : 'Open Wejet Control Center',
        subtitle: isFa ? 'تنظیمات، گالری ویجت‌ها و پوسته‌ها' : 'Dashboard, Widgets & Settings',
        icon: 'settings',
        run: () => {
          setCommandCenterOpen(false);
          void WejetIPC.openManager();
        },
      }
    );

    // Mini Tools
    (
      [
        ['calculator', isFa ? 'ابزارک ماشین‌حساب' : 'Mini Calculator', 'calculator'],
        ['timer', isFa ? 'تایمر تمرکز و پومودورو' : 'Focus & Pomodoro Timer', 'clock'],
        ['stopwatch', isFa ? 'کرنومتر (Stopwatch)' : 'Stopwatch', 'clock'],
        ['converter', isFa ? 'مبدل واحدها (طول، وزن، دما، داده)' : 'Unit Converter', 'trending'],
        ['color', isFa ? 'انتخابگر رنگ و Accent' : 'Color Picker & Accent', 'palette'],
      ] as const
    ).forEach(([tab, label, ic]) => {
      list.push({
        id: `tool-${tab}`,
        title: label,
        subtitle: isFa ? 'ابزارک داخلی Wejet' : 'Built-in Mini Tool',
        icon: ic,
        run: () => {
          setCommandCenterOpen(false);
          openMiniTool(tab);
        },
      });
    });

    // Launcher Items
    launcher.forEach((item) => {
      list.push({
        id: `launch-${item.id}`,
        title: `${isFa ? 'اجرا:' : 'Launch:'} ${(isFa && item.label) || item.name}`,
        subtitle: item.target,
        icon: item.icon,
        run: () => {
          void WejetIPC.launchTarget(item.target);
          setCommandCenterOpen(false);
        },
      });
    });

    // Spaces / Profiles
    profiles.forEach((p) => {
      list.push({
        id: `space-${p.id}`,
        title: `${isFa ? 'فضای کاری:' : 'Switch Space:'} ${isFa ? p.nameFa : p.nameEn}`,
        subtitle: isFa ? p.descriptionFa : p.descriptionEn,
        icon: p.icon,
        run: () => {
          void switchProfile(p.id);
          setCommandCenterOpen(false);
        },
      });
    });

    // Themes
    (Object.keys(THEME_PRESETS) as Exclude<ThemeId, 'system'>[]).forEach((thId) => {
      const preset = THEME_PRESETS[thId];
      list.push({
        id: `theme-${thId}`,
        title: `${isFa ? 'پوسته:' : 'Theme:'} ${isFa ? preset.nameFa : preset.nameEn}`,
        subtitle: isFa ? preset.subtitleFa : preset.subtitleEn,
        icon: 'palette',
        run: () => {
          void updateSettings({ theme: thId });
          setCommandCenterOpen(false);
        },
      });
    });

    // Add Widgets
    WidgetRegistry.list().forEach(({ manifest }) => {
      list.push({
        id: `add-w-${manifest.id}`,
        title: `${isFa ? 'افزودن ویجت:' : 'Add Widget:'} ${isFa ? manifest.nameFa : manifest.name}`,
        subtitle: isFa ? manifest.descriptionFa : manifest.description,
        icon: manifest.icon,
        run: () => {
          void addWidgetFromManifest(manifest);
          setCommandCenterOpen(false);
        },
      });
    });

    // Clipboard snippets
    clipboard.slice(0, 6).forEach((clip) => {
      list.push({
        id: `clip-${clip.id}`,
        title: clip.content.slice(0, 56),
        subtitle: isFa ? 'کپی از تاریخچه کلیپ‌بورد' : 'Copy from Clipboard History',
        icon: 'copy',
        run: () => {
          void copyClipboardItem(clip.content);
          setCommandCenterOpen(false);
        },
      });
    });

    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 14);
    return list.filter(
      (a) =>
        a.id === 'math-result' ||
        a.id === 'timer-direct' ||
        a.id === 'inline-note' ||
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
    );
  }, [
    addWidgetFromManifest,
    clipboard,
    copyClipboardItem,
    createQuickNote,
    isFa,
    launcher,
    mathAnswer,
    openMiniTool,
    parsedTimerSec,
    pd,
    profiles,
    query,
    setCommandCenterOpen,
    setQuickNoteOpen,
    settings.layoutLocked,
    settings.widgetsVisible,
    switchProfile,
    updateSettings,
  ]);

  if (!commandCenterOpen) return null;

  const safeIdx = Math.min(selectedIndex, Math.max(0, actions.length - 1));

  return (
    <div
      onClick={() => setCommandCenterOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(3, 8, 18, 0.48)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '11vh',
      }}
    >
      <div
        className="wejet-elevated-glass wj-animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600,
          maxWidth: '92vw',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '15px 18px',
            borderBottom: '1px solid var(--wejet-glass-border)',
          }}
        >
          <span style={{ color: 'var(--wejet-accent)', display: 'flex' }}>
            <Icon name="search" size={19} />
          </span>
          <input
            autoFocus
            value={query}
            dir={/^[\d(+\-a-zA-Z/=]/.test(query.trim()) ? 'ltr' : undefined}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(actions.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter' && actions[safeIdx]) {
                e.preventDefault();
                actions[safeIdx].run();
              }
            }}
            placeholder={t(settings.language, 'searchCommandPlaceholder')}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: 'var(--wejet-font-md)',
              textAlign: /^[\d(+\-a-zA-Z/=]/.test(query.trim()) ? 'left' : undefined,
              outline: 'none',
            }}
          />
          <kbd
            className="ltr-inline"
            style={{
              fontSize: '0.68rem',
              padding: '2px 7px',
              borderRadius: 6,
              background: 'var(--wejet-surface-hover)',
              color: 'var(--wejet-text-muted)',
              border: '1px solid var(--wejet-glass-border)',
            }}
          >
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: 370, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {actions.map((item, idx) => {
            const active = idx === safeIdx;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={item.run}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: 'none',
                  background: active ? 'var(--wejet-accent-soft)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <span style={{ color: active ? 'var(--wejet-accent)' : 'var(--wejet-text-secondary)' }}>
                    <Icon name={item.icon} size={17} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--wejet-font-sm)',
                        fontWeight: active ? 600 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--wejet-text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                {active && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--wejet-accent)', fontWeight: 600 }}>
                    ↵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
