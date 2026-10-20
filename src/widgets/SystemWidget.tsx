import React, { useEffect, useState } from 'react';
import { SystemMetrics, WidgetInstance, WidgetManifest } from '../types/models';
import { WejetIPC } from '../services/ipc';
import { useWejet } from '../context/WejetContext';
import { SparklineChart } from '../components/SparklineChart';
import { fmtNum } from '../utils/format';

export const systemManifest: WidgetManifest = {
  id: 'system',
  name: 'System Telemetry',
  nameFa: 'پایش زنده سیستم',
  description: 'Real-time CPU, RAM, Disk, Network & 60-second lightweight SVG history.',
  descriptionFa: 'نمایش زنده پردازنده، رم، دیسک، شبکه و نمودار ۶۰ ثانیه‌ای فوق‌سبک SVG.',
  category: 'system',
  icon: 'system',
  defaultSize: { width: 320, height: 212 },
  minSize: { width: 256, height: 168 },
  settingsSchema: [
    {
      key: 'showChart',
      type: 'boolean',
      labelFa: 'نمایش نمودار تاریخچه ۶۰ ثانیه',
      labelEn: 'Show 60s SVG History Chart',
      defaultValue: true,
    },
    {
      key: 'showNetwork',
      type: 'boolean',
      labelFa: 'نمایش نرخ شبکه',
      labelEn: 'Show Network Throughput',
      defaultValue: true,
    },
  ],
};

export const SystemWidget: React.FC<{ instance: WidgetInstance }> = ({ instance }) => {
  const { settings } = useWejet();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>(() => Array(60).fill(14));

  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;
  const showChart = Boolean(instance.settings.showChart ?? true);
  const showNetwork = Boolean(instance.settings.showNetwork ?? true);

  useEffect(() => {
    if (!instance.visible || !settings.widgetsVisible) return;
    let active = true;

    const tick = async () => {
      const sample = await WejetIPC.getSystemMetrics();
      if (!active) return;
      setMetrics(sample);
      setCpuHistory((prev) => [...prev.slice(-59), sample.cpuPercent]);
    };

    void tick();
    const id = window.setInterval(() => void tick(), 1000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [instance.visible, settings.widgetsVisible]);

  const cpu = metrics ? Math.round(metrics.cpuPercent) : 0;
  const ramPct = metrics ? Math.round(metrics.ramPercent) : 0;
  const diskPct = metrics ? Math.round(metrics.diskPercent) : 0;

  return (
    <div
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
        <span style={{ fontSize: 'var(--wejet-font-sm)', fontWeight: 600 }}>
          {isFa ? 'پایش منابع سیستم' : 'System Monitor'}
        </span>
        {metrics?.cpuTempC != null && (
          <span className="wj-badge tabular-nums">
            {fmtNum(Math.round(metrics.cpuTempC), pd)}°C
          </span>
        )}
      </div>

      {/* 3 Compact Metric Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'CPU', val: `${fmtNum(cpu, pd)}%` },
          { label: 'RAM', val: `${fmtNum(ramPct, pd)}%` },
          { label: isFa ? 'دیسک' : 'Disk', val: `${fmtNum(diskPct, pd)}%` },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '7px 8px',
              borderRadius: 10,
              background: 'var(--wejet-surface-hover)',
              border: '1px solid var(--wejet-glass-border)',
            }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--wejet-text-muted)' }}>{item.label}</div>
            <div className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 650 }}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {showChart && (
        <div style={{ paddingTop: 2 }}>
          <SparklineChart data={cpuHistory} height={48} />
        </div>
      )}

      {showNetwork && metrics && (
        <div
          className="tabular-nums ltr-inline"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'var(--wejet-font-xs)',
            color: 'var(--wejet-text-muted)',
          }}
        >
          <span>
            RAM {fmtNum(metrics.ramUsedGb.toFixed(1), pd)}/{fmtNum(metrics.ramTotalGb.toFixed(0), pd)} GB
          </span>
          <span>
            ↓ {fmtNum(Math.round(metrics.netRxKbps), pd)} KB/s · ↑ {fmtNum(Math.round(metrics.netTxKbps), pd)} KB/s
          </span>
        </div>
      )}
    </div>
  );
};
