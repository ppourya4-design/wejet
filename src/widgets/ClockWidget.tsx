import React, { useEffect, useState } from 'react';
import { WidgetInstance, WidgetManifest } from '../types/models';
import { useWejet } from '../context/WejetContext';
import {
  dateToJalali,
  JALALI_MONTHS_EN,
  JALALI_MONTHS_FA,
  JALALI_WEEKDAYS_FULL_FA,
} from '../utils/jalali';
import { fmtNum } from '../utils/format';

export const clockManifest: WidgetManifest = {
  id: 'clock',
  name: 'Clock & Dual Date',
  nameFa: 'ساعت و تاریخ دوگانه',
  description: 'Digital & analog glass clock with simultaneous Jalali and Gregorian dates.',
  descriptionFa: 'ساعت دیجیتال و آنالوگ شیشه‌ای همراه با نمایش همزمان تاریخ شمسی و میلادی.',
  category: 'information',
  icon: 'clock',
  defaultSize: { width: 320, height: 184 },
  minSize: { width: 240, height: 148 },
  settingsSchema: [
    {
      key: 'style',
      type: 'select',
      labelFa: 'سبک نمایش ساعت',
      labelEn: 'Visual Style',
      defaultValue: 'minimal',
      options: [
        { value: 'minimal', labelFa: 'مینیمال شیشه‌ای', labelEn: 'Minimal Glass' },
        { value: 'classic', labelFa: 'آنالوگ کلاسیک', labelEn: 'Classic Analog Glass' },
        { value: 'editorial', labelFa: 'تایپوگرافی بزرگ', labelEn: 'Large Editorial' },
      ],
    },
    {
      key: 'format24h',
      type: 'boolean',
      labelFa: 'فرمت ۲۴ ساعته',
      labelEn: '24-Hour Format',
      defaultValue: true,
    },
    {
      key: 'showSeconds',
      type: 'boolean',
      labelFa: 'نمایش ثانیه‌شمار',
      labelEn: 'Show Seconds',
      defaultValue: false,
    },
    {
      key: 'showPersianDate',
      type: 'boolean',
      labelFa: 'نمایش تاریخ شمسی (جلالی)',
      labelEn: 'Show Persian Date',
      defaultValue: true,
    },
    {
      key: 'showGregorianDate',
      type: 'boolean',
      labelFa: 'نمایش تاریخ میلادی',
      labelEn: 'Show Gregorian Date',
      defaultValue: true,
    },
  ],
};

export const ClockWidget: React.FC<{ instance: WidgetInstance }> = React.memo(({ instance }) => {
  const { settings } = useWejet();
  const [now, setNow] = useState<Date>(() => new Date());

  const style = String(instance.settings.style ?? 'minimal');
  const format24h = Boolean(instance.settings.format24h ?? true);
  const showSeconds = Boolean(instance.settings.showSeconds ?? false) || style === 'classic';
  const showPersian = Boolean(instance.settings.showPersianDate ?? true);
  const showGregorian = Boolean(instance.settings.showGregorianDate ?? true);
  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const rawHours = now.getHours();
  const displayHours = format24h ? rawHours : rawHours % 12 || 12;
  const ampm = format24h ? '' : rawHours >= 12 ? (isFa ? ' ب.ظ' : ' PM') : isFa ? ' ق.ظ' : ' AM';
  const hh = fmtNum(String(displayHours).padStart(2, '0'), pd);
  const mm = fmtNum(String(now.getMinutes()).padStart(2, '0'), pd);
  const ss = fmtNum(String(now.getSeconds()).padStart(2, '0'), pd);

  const jalali = dateToJalali(now);
  const weekdayFa = JALALI_WEEKDAYS_FULL_FA[now.getDay()];
  const weekdayEn = now.toLocaleDateString('en-US', { weekday: 'long' });
  const persianStr = isFa
    ? `${weekdayFa}، ${fmtNum(jalali.jd, pd)} ${JALALI_MONTHS_FA[jalali.jm - 1]} ${fmtNum(jalali.jy, pd)}`
    : `${jalali.jd} ${JALALI_MONTHS_EN[jalali.jm - 1]} ${jalali.jy}`;
  const gregorianStr = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (style === 'classic') {
    const secDeg = now.getSeconds() * 6;
    const minDeg = now.getMinutes() * 6 + now.getSeconds() * 0.1;
    const hrDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          height: '100%',
          padding: '14px 18px',
        }}
      >
        <svg width="104" height="104" viewBox="0 0 100 100" style={{ flexShrink: 0 }} aria-hidden>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="var(--wejet-surface-hover)"
            stroke="var(--wejet-glass-border-strong)"
            strokeWidth="1.5"
          />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 50 + Math.sin(angle) * 38;
            const y1 = 50 - Math.cos(angle) * 38;
            const x2 = 50 + Math.sin(angle) * 42;
            const y2 = 50 - Math.cos(angle) * 42;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--wejet-text-muted)"
                strokeWidth={i % 3 === 0 ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="25"
            stroke="var(--wejet-text)"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${hrDeg} 50 50)`}
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="16"
            stroke="var(--wejet-text-secondary)"
            strokeWidth="2.1"
            strokeLinecap="round"
            transform={`rotate(${minDeg} 50 50)`}
          />
          <line
            x1="50"
            y1="55"
            x2="50"
            y2="13"
            stroke="var(--wejet-accent)"
            strokeWidth="1.4"
            strokeLinecap="round"
            transform={`rotate(${secDeg} 50 50)`}
          />
          <circle cx="50" cy="50" r="3.2" fill="var(--wejet-accent)" />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <div
            className="tabular-nums ltr-inline"
            style={{ fontSize: '1.9rem', fontWeight: 650, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            {hh}:{mm}
            <span style={{ fontSize: '0.95rem', color: 'var(--wejet-accent)', marginInlineStart: 4 }}>
              :{ss}
            </span>
          </div>
          {showPersian && (
            <div style={{ fontSize: 'var(--wejet-font-sm)', color: 'var(--wejet-text-secondary)' }}>
              {persianStr}
            </div>
          )}
          {showGregorian && (
            <div
              className="ltr-inline"
              style={{ fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)' }}
            >
              {gregorianStr}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (style === 'editorial') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="wj-badge">{isFa ? weekdayFa : weekdayEn}</span>
          {showGregorian && (
            <span
              className="ltr-inline"
              style={{ fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)' }}
            >
              {gregorianStr}
            </span>
          )}
        </div>
        <div
          className="tabular-nums ltr-inline"
          style={{
            fontSize: '3.35rem',
            fontWeight: 700,
            letterSpacing: '-0.045em',
            lineHeight: 0.96,
          }}
        >
          {hh}
          <span style={{ color: 'var(--wejet-accent)' }}>:</span>
          {mm}
          {showSeconds && (
            <span style={{ fontSize: '1.35rem', color: 'var(--wejet-text-muted)', marginLeft: 6 }}>
              {ss}
            </span>
          )}
        </div>
        {showPersian && (
          <div style={{ fontSize: 'var(--wejet-font-sm)', color: 'var(--wejet-text-secondary)' }}>
            {persianStr}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        padding: '16px 22px',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div
          className="tabular-nums ltr-inline"
          style={{
            fontSize: 'var(--wejet-font-display)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          {hh}:{mm}
          {showSeconds && (
            <span style={{ fontSize: '1.25rem', color: 'var(--wejet-accent)', marginLeft: 5 }}>
              :{ss}
            </span>
          )}
        </div>
        {ampm && (
          <span style={{ fontSize: 'var(--wejet-font-sm)', color: 'var(--wejet-accent)', fontWeight: 600 }}>
            {ampm}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {showPersian && (
          <span style={{ fontSize: 'var(--wejet-font-sm)', color: 'var(--wejet-text-secondary)', fontWeight: 500 }}>
            {persianStr}
          </span>
        )}
        {showGregorian && (
          <span
            className="ltr-inline"
            style={{
              fontSize: 'var(--wejet-font-xs)',
              color: 'var(--wejet-text-muted)',
              padding: '2px 8px',
              borderRadius: 'var(--wejet-radius-pill)',
              background: 'var(--wejet-surface-hover)',
            }}
          >
            {gregorianStr}
          </span>
        )}
      </div>
    </div>
  );
});

ClockWidget.displayName = 'ClockWidget';
