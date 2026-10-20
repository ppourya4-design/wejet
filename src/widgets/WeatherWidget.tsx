import React, { useCallback, useEffect, useState } from 'react';
import {
  CachedResult,
  CitySearchItem,
  WeatherPayload,
  WidgetInstance,
  WidgetManifest,
} from '../types/models';
import { WejetIPC } from '../services/ipc';
import { useWejet } from '../context/WejetContext';
import { Icon, WeatherGlyph } from '../components/Icons';
import { fmtNum, formatRelativeAge } from '../utils/format';

export const weatherManifest: WidgetManifest = {
  id: 'weather',
  name: 'Weather Forecast',
  nameFa: 'آب‌وهوا و پیش‌بینی ۴ روزه',
  description: 'Open-Meteo weather with city search, 4-day forecast, and offline cache.',
  descriptionFa: 'وضعیت لحظه‌ای و پیش‌بینی ۴ روزه آب‌وهوا با جستجوی شهر و کش آفلاین.',
  category: 'information',
  icon: 'weather',
  defaultSize: { width: 320, height: 228 },
  minSize: { width: 260, height: 184 },
  settingsSchema: [
    {
      key: 'unit',
      type: 'select',
      labelFa: 'واحد دما',
      labelEn: 'Temperature Unit',
      defaultValue: 'C',
      options: [
        { value: 'C', labelFa: 'سلسیوس (°C)', labelEn: 'Celsius (°C)' },
        { value: 'F', labelFa: 'فارنهایت (°F)', labelEn: 'Fahrenheit (°F)' },
      ],
    },
    {
      key: 'showForecast',
      type: 'boolean',
      labelFa: 'نمایش پیش‌بینی ۴ روزه',
      labelEn: 'Show 4-Day Forecast',
      defaultValue: true,
    },
  ],
};

function describeWeatherCode(code: number, isFa: boolean): string {
  if (code === 0) return isFa ? 'صاف و آفتابی' : 'Clear sky';
  if (code <= 2) return isFa ? 'کمی ابری' : 'Partly cloudy';
  if (code === 3) return isFa ? 'ابری' : 'Overcast';
  if (code <= 48) return isFa ? 'مه‌آلود' : 'Misty';
  if (code <= 67) return isFa ? 'بارانی' : 'Rain';
  if (code <= 77) return isFa ? 'برفی' : 'Snow';
  return isFa ? 'رگبار و تندر' : 'Showers';
}

export const WeatherWidget: React.FC<{ instance: WidgetInstance }> = ({ instance }) => {
  const { settings, updateSettings } = useWejet();
  const [weather, setWeather] = useState<CachedResult<WeatherPayload> | null>(null);
  const [searching, setSearching] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CitySearchItem[]>([]);

  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;
  const unit = String(instance.settings.unit ?? 'C');
  const showForecast = Boolean(instance.settings.showForecast ?? true);

  const load = useCallback(async (force = false) => {
    const res = await WejetIPC.fetchWeather(force);
    setWeather(res);
  }, []);

  useEffect(() => {
    void load(false);
    // Refresh gently every 30 minutes (Section 20)
    const timer = window.setInterval(() => void load(false), 30 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load, settings.weatherLat, settings.weatherLon]);

  useEffect(() => {
    if (!searching) return;
    let active = true;
    void WejetIPC.searchWeatherCity(cityQuery).then((items) => {
      if (active) setCityResults(items);
    });
    return () => {
      active = false;
    };
  }, [cityQuery, searching]);

  const toUnit = (c: number) => (unit === 'F' ? Math.round((c * 9) / 5 + 32) : Math.round(c));

  if (!weather) {
    return (
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        <div style={{ width: '52%', height: 14, borderRadius: 6, background: 'var(--wejet-surface-hover)' }} />
        <div style={{ width: '36%', height: 34, borderRadius: 8, background: 'var(--wejet-surface-hover)' }} />
      </div>
    );
  }

  const d = weather.data;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '15px 18px',
        position: 'relative',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button
          type="button"
          onClick={() => setSearching((s) => !s)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: 'var(--wejet-font-sm)',
          }}
          title={isFa ? 'تغییر شهر' : 'Change city'}
        >
          <span>{d.city}</span>
          <Icon name="search" size={13} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)' }}>
            {formatRelativeAge(weather.ageSeconds, settings.language, pd)}
          </span>
          <button
            type="button"
            className="wj-icon-btn"
            style={{ width: 24, height: 24 }}
            onClick={() => void load(true)}
            title={isFa ? 'بروزرسانی' : 'Refresh'}
          >
            <Icon name="refresh" size={13} />
          </button>
        </div>
      </div>

      {/* Inline City Picker Popover */}
      {searching && (
        <div
          className="wejet-elevated-glass"
          style={{
            position: 'absolute',
            inset: '44px 12px 12px 12px',
            zIndex: 20,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <input
            autoFocus
            className="wj-input"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder={isFa ? 'جستجوی نام شهر (مثلاً Shiraz، London)...' : 'Search city name...'}
          />
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cityResults.map((c, idx) => (
              <button
                key={`${c.name}-${idx}`}
                type="button"
                onClick={() => {
                  void updateSettings({
                    weatherCity: c.name,
                    weatherLat: c.latitude,
                    weatherLon: c.longitude,
                  });
                  setSearching(false);
                }}
                style={{
                  textAlign: 'start',
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 'var(--wejet-font-xs)',
                }}
              >
                <strong>{c.name}</strong>{' '}
                <span style={{ color: 'var(--wejet-text-muted)' }}>{c.country}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Temp & Glyph */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 4 } as React.CSSProperties}>
        <div>
          <div
            className="tabular-nums ltr-inline"
            style={{ fontSize: '2.35rem', fontWeight: 650, lineHeight: 1.05, letterSpacing: '-0.03em' }}
          >
            {fmtNum(toUnit(d.temperatureC), pd)}°{unit}
          </div>
          <div style={{ fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-secondary)', marginTop: 3 }}>
            {describeWeatherCode(d.weatherCode, isFa)} ·{' '}
            <span className="tabular-nums">
              {fmtNum(toUnit(d.tempMaxC), pd)}° / {fmtNum(toUnit(d.tempMinC), pd)}°
            </span>
          </div>
        </div>
        <WeatherGlyph code={d.weatherCode} isDay={d.isDay} size={46} />
      </div>

      {/* 4-Day Forecast */}
      {showForecast && d.forecast.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            paddingTop: 8,
            borderTop: '1px solid var(--wejet-glass-border)',
          }}
        >
          {d.forecast.slice(0, 4).map((f) => {
            const dt = new Date(f.date);
            const dayLabel = Number.isNaN(dt.getTime())
              ? f.date.slice(5)
              : dt.toLocaleDateString(isFa ? 'fa-IR' : 'en-US', { weekday: 'short' });
            return (
              <div
                key={f.date}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '4px 2px',
                  borderRadius: 8,
                  background: 'var(--wejet-surface-hover)',
                }}
              >
                <span style={{ fontSize: '0.68rem', color: 'var(--wejet-text-muted)' }}>
                  {dayLabel}
                </span>
                <WeatherGlyph code={f.weatherCode} size={22} />
                <span className="tabular-nums" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                  {fmtNum(toUnit(f.tempMax), pd)}°
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
