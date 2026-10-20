import React, { useState } from 'react';
import { LauncherItem, WidgetInstance, WidgetManifest } from '../types/models';
import { useWejet } from '../context/WejetContext';
import { isTauriRuntime, WejetIPC } from '../services/ipc';
import { Icon } from '../components/Icons';

export const launcherManifest: WidgetManifest = {
  id: 'launcher',
  name: 'Quick Launcher',
  nameFa: 'پرتابگر سریع برنامه‌ها',
  description: 'Launch apps, folders, files, and links with drag & drop and path safety.',
  descriptionFa: 'اجرای سریع برنامه‌ها، پوشه‌ها، فایل‌ها و لینک‌ها با پشتیبانی از Drag & Drop.',
  category: 'tools',
  icon: 'launcher',
  defaultSize: { width: 320, height: 248 },
  minSize: { width: 256, height: 184 },
  settingsSchema: [
    {
      key: 'columns',
      type: 'select',
      labelFa: 'تعداد ستون‌ها',
      labelEn: 'Grid Columns',
      defaultValue: '2',
      options: [
        { value: '2', labelFa: '۲ ستون', labelEn: '2 Columns' },
        { value: '3', labelFa: '۳ ستون فشرده', labelEn: '3 Columns' },
      ],
    },
  ],
};

export const LauncherWidget: React.FC<{ instance: WidgetInstance }> = ({ instance }) => {
  const { settings, launcher, saveLauncherList } = useWejet();
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftTarget, setDraftTarget] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isFa = settings.language === 'fa';
  const cols = Number(instance.settings.columns ?? 2);

  const handleBrowseNative = async () => {
    if (!isTauriRuntime()) {
      setAdding(true);
      return;
    }
    try {
      const dialog = await import('@tauri-apps/plugin-dialog');
      const selected = await dialog.open({ multiple: false });
      if (typeof selected === 'string' && selected.trim()) {
        const parts = selected.split(/[/\\]/);
        const name = parts[parts.length - 1] || 'Shortcut';
        const item: LauncherItem = {
          id: `launch-${Date.now()}`,
          name,
          label: name,
          target: selected,
          kind: 'file',
          icon: 'folder',
        };
        await saveLauncherList([...launcher, item]);
      }
    } catch {
      setAdding(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    const additions: LauncherItem[] = files.map((f, idx) => ({
      id: `drop-${Date.now()}-${idx}`,
      name: f.name,
      label: f.name,
      target: (f as File & { path?: string }).path || f.name,
      kind: 'file',
      icon: 'file-text',
    }));
    void saveLauncherList([...launcher, ...additions]);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim() || !draftTarget.trim()) return;
    const isUrl = /^https?:\/\//i.test(draftTarget.trim());
    const nextItem: LauncherItem = {
      id: `launch-${Date.now()}`,
      name: draftName.trim(),
      label: draftName.trim(),
      target: draftTarget.trim(),
      kind: isUrl ? 'url' : 'app',
      icon: isUrl ? 'globe' : 'sparkles',
    };
    void saveLauncherList([...launcher, nextItem]);
    setDraftName('');
    setDraftTarget('');
    setAdding(false);
  };

  const triggerLaunch = async (item: LauncherItem) => {
    try {
      await WejetIPC.launchTarget(item.target);
      setStatusMsg(isFa ? `اجرا شد: ${item.label || item.name}` : `Opened ${item.name}`);
      window.setTimeout(() => setStatusMsg(null), 1800);
    } catch {
      setStatusMsg(isFa ? 'مسیر قابل اجرا نیست' : 'Unable to open target');
      window.setTimeout(() => setStatusMsg(null), 2200);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '14px 16px',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--wejet-font-sm)', fontWeight: 650 }}>
          {isFa ? 'پرتابگر سریع' : 'Quick Launcher'}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            className="wj-icon-btn"
            style={{ width: 25, height: 25 }}
            onClick={() => void handleBrowseNative()}
            title={isFa ? 'انتخاب فایل از ویندوز' : 'Browse file'}
          >
            <Icon name="folder" size={14} />
          </button>
          <button
            type="button"
            className="wj-icon-btn"
            style={{ width: 25, height: 25 }}
            onClick={() => setAdding((v) => !v)}
            title={isFa ? 'افزودن میانبر' : 'Add item'}
          >
            <Icon name="plus" size={14} />
          </button>
        </div>
      </div>

      {adding ? (
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            className="wj-input"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={isFa ? 'عنوان میانبر (مثلاً VS Code)' : 'Label (e.g. Docs)'}
          />
          <input
            className="wj-input ltr-inline"
            value={draftTarget}
            onChange={(e) => setDraftTarget(e.target.value)}
            placeholder="https://... or explorer.exe"
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button type="button" className="wj-btn" onClick={() => setAdding(false)}>
              {isFa ? 'لغو' : 'Cancel'}
            </button>
            <button type="submit" className="wj-btn wj-btn-primary">
              {isFa ? 'افزودن' : 'Add'}
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 8,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {launcher.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void triggerLaunch(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 11px',
                borderRadius: 12,
                border: '1px solid var(--wejet-glass-border)',
                background: 'var(--wejet-surface-hover)',
                cursor: 'pointer',
                textAlign: 'start',
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: 'var(--wejet-accent-soft)',
                  color: 'var(--wejet-accent)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={item.icon} size={15} />
              </span>
              <span
                style={{
                  fontSize: 'var(--wejet-font-xs)',
                  fontWeight: 550,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {(isFa && item.label) || item.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {statusMsg && (
        <div style={{ fontSize: '0.69rem', color: 'var(--wejet-accent)' }}>{statusMsg}</div>
      )}
    </div>
  );
};
