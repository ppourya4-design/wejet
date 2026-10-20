import React from 'react';
import { useWejet } from '../context/WejetContext';
import { WidgetRegistry } from '../widgets/registry';
import { Icon } from './Icons';
import { fmtNum } from '../utils/format';

export const WidgetSettingsModal: React.FC = () => {
  const {
    settings,
    layout,
    editingSettingsWidgetId,
    setEditingSettingsWidgetId,
    updateWidget,
  } = useWejet();

  if (!editingSettingsWidgetId) return null;
  const widget = layout.widgets.find((w) => w.instanceId === editingSettingsWidgetId);
  if (!widget) return null;
  const def = WidgetRegistry.get(widget.widgetType);
  if (!def) return null;

  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;

  return (
    <div
      onClick={() => setEditingSettingsWidgetId(null)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(4, 8, 18, 0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="wejet-elevated-glass wj-animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 400, maxWidth: '100%', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name={def.manifest.icon} size={19} />
            <strong>{isFa ? def.manifest.nameFa : def.manifest.name}</strong>
          </div>
          <button
            type="button"
            className="wj-icon-btn"
            onClick={() => setEditingSettingsWidgetId(null)}
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Opacity control (20%–100%) */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--wejet-font-sm)' }}>
            <span>{isFa ? 'شفافیت سطح شیشه ویجت' : 'Widget Glass Opacity'}</span>
            <span className="tabular-nums">{fmtNum(widget.opacity, pd)}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            value={widget.opacity}
            onChange={(e) => void updateWidget(widget.instanceId, { opacity: Number(e.target.value) })}
            style={{ accentColor: 'var(--wejet-accent)' }}
          />
        </label>

        {/* Dynamic Schema Controls */}
        {def.manifest.settingsSchema.map((field) => {
          const val = widget.settings[field.key] ?? field.defaultValue;
          const label = isFa ? field.labelFa : field.labelEn;

          if (field.type === 'boolean') {
            return (
              <label
                key={field.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 'var(--wejet-font-sm)',
                  cursor: 'pointer',
                }}
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(val)}
                  onChange={(e) =>
                    void updateWidget(widget.instanceId, {
                      settings: { ...widget.settings, [field.key]: e.target.checked },
                    })
                  }
                  style={{ width: 17, height: 17, accentColor: 'var(--wejet-accent)' }}
                />
              </label>
            );
          }

          if (field.type === 'select' && field.options) {
            return (
              <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 'var(--wejet-font-sm)' }}>{label}</span>
                <select
                  className="wj-input"
                  value={String(val)}
                  onChange={(e) =>
                    void updateWidget(widget.instanceId, {
                      settings: { ...widget.settings, [field.key]: e.target.value },
                    })
                  }
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: '#111827', color: '#f8fafc' }}>
                      {isFa ? opt.labelFa : opt.labelEn}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 'var(--wejet-font-sm)' }}>{label}</span>
              <input
                className="wj-input"
                value={String(val)}
                onChange={(e) =>
                  void updateWidget(widget.instanceId, {
                    settings: { ...widget.settings, [field.key]: e.target.value },
                  })
                }
              />
            </label>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
          <button
            type="button"
            className="wj-btn"
            onClick={() =>
              void updateWidget(widget.instanceId, {
                width: def.manifest.defaultSize.width,
                height: def.manifest.defaultSize.height,
              })
            }
          >
            {isFa ? 'اندازه پیش‌فرض' : 'Reset Size'}
          </button>
          <button
            type="button"
            className="wj-btn wj-btn-primary"
            onClick={() => setEditingSettingsWidgetId(null)}
          >
            {isFa ? 'تأیید' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
