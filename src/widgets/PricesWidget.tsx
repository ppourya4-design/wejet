import React, { useCallback, useEffect, useState } from 'react';
import { CachedResult, PricesPayload, WidgetInstance, WidgetManifest } from '../types/models';
import { WejetIPC } from '../services/ipc';
import { useWejet } from '../context/WejetContext';
import { Icon } from '../components/Icons';
import { fmtNum, fmtPrice, formatRelativeAge } from '../utils/format';

export const pricesManifest: WidgetManifest = {
  id: 'prices',
  name: 'Currencies, Gold & Crypto',
  nameFa: 'نرخ ارز، طلا، سکه و رمزارز',
  description: 'Live & cached rates for USD, EUR, 18K Gold, Iranian Coin, BTC & ETH.',
  descriptionFa: 'نمایش دلار، یورو، طلای ۱۸ عیار، سکه امامی، بیت‌کوین و اتریوم با کش هوشمند.',
  category: 'information',
  icon: 'prices',
  defaultSize: { width: 320, height: 268 },
  minSize: { width: 268, height: 210 },
  settingsSchema: [
    {
      key: 'refreshSeconds',
      type: 'select',
      labelFa: 'بازه بروزرسانی خودکار',
      labelEn: 'Auto-Refresh Interval',
      defaultValue: '300',
      options: [
        { value: '30', labelFa: 'هر ۳۰ ثانیه', labelEn: '30 seconds' },
        { value: '60', labelFa: 'هر ۱ دقیقه', labelEn: '1 minute' },
        { value: '120', labelFa: 'هر ۲ دقیقه', labelEn: '2 minutes' },
        { value: '300', labelFa: 'هر ۵ دقیقه (پیشنهادی)', labelEn: '5 minutes (Default)' },
      ],
    },
  ],
};

export const PricesWidget: React.FC<{ instance: WidgetInstance }> = ({ instance }) => {
  const { settings } = useWejet();
  const [prices, setPrices] = useState<CachedResult<PricesPayload> | null>(null);

  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;
  const refreshSec = Math.max(30, Number(instance.settings.refreshSeconds ?? 300));

  const load = useCallback(async (force = false) => {
    const res = await WejetIPC.fetchPrices(force);
    setPrices(res);
  }, []);

  useEffect(() => {
    void load(false);
    const id = window.setInterval(() => void load(false), refreshSec * 1000);
    return () => window.clearInterval(id);
  }, [load, refreshSec]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '14px 16px',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--wejet-font-sm)', fontWeight: 650 }}>
          {isFa ? 'بازار ارز، طلا و رمزارز' : 'Market Rates'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {prices && (
            <span style={{ fontSize: '0.68rem', color: 'var(--wejet-text-muted)' }}>
              {formatRelativeAge(prices.ageSeconds, settings.language, pd)}
            </span>
          )}
          <button
            type="button"
            className="wj-icon-btn"
            style={{ width: 24, height: 24 }}
            onClick={() => void load(true)}
            title={isFa ? 'بروزرسانی نرخ‌ها' : 'Refresh rates'}
          >
            <Icon name="refresh" size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', flex: 1 }}>
        {(prices?.data.quotes ?? []).map((q) => {
          const up = q.change24h >= 0;
          return (
            <div
              key={q.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                borderRadius: 9,
                background: 'var(--wejet-surface-hover)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="ltr-inline"
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    width: 38,
                    textAlign: 'center',
                    padding: '2px 4px',
                    borderRadius: 6,
                    background: 'var(--wejet-accent-soft)',
                    color: 'var(--wejet-accent)',
                  }}
                >
                  {q.symbol}
                </span>
                <span style={{ fontSize: 'var(--wejet-font-xs)', fontWeight: 500 }}>
                  {isFa ? q.nameFa : q.nameEn}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="tabular-nums" style={{ fontSize: 'var(--wejet-font-xs)', fontWeight: 650 }}>
                  {fmtPrice(q.price, pd)}{' '}
                  <small style={{ color: 'var(--wejet-text-muted)', fontWeight: 400 }}>
                    {isFa ? q.unitFa : q.unitEn}
                  </small>
                </span>
                <span
                  className="tabular-nums ltr-inline"
                  style={{
                    fontSize: '0.67rem',
                    color: up ? 'var(--wejet-success)' : 'var(--wejet-danger)',
                    fontWeight: 600,
                  }}
                >
                  {up ? '+' : ''}
                  {fmtNum(q.change24h.toFixed(1), pd)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
