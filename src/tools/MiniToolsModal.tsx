import React, { useEffect, useState } from 'react';
import { useWejet } from '../context/WejetContext';
import { MiniToolTab } from '../types/models';
import { evaluateSafeMath, fmtNum } from '../utils/format';
import { Icon } from '../components/Icons';

export const MiniToolsModal: React.FC = () => {
  const {
    settings,
    miniToolOpen,
    initialTimerSeconds,
    openMiniTool,
    updateSettings,
    copyClipboardItem,
  } = useWejet();

  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;

  // Calculator state
  const [expr, setExpr] = useState('145 * 1.09');
  // Timer state
  const [timerRemaining, setTimerRemaining] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  // Stopwatch state
  const [swElapsedMs, setSwElapsedMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  // Converter state
  const [convVal, setConvVal] = useState('10');
  const [convKind, setConvKind] = useState<'km_mi' | 'kg_lb' | 'c_f' | 'gb_mb'>('km_mi');
  // Color picker state
  const [pickedHex, setPickedHex] = useState(settings.accentColor);

  useEffect(() => {
    if (initialTimerSeconds && initialTimerSeconds > 0) {
      setTimerRemaining(initialTimerSeconds);
      setTimerRunning(true);
    }
  }, [initialTimerSeconds]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (!swRunning) return;
    const id = window.setInterval(() => setSwElapsedMs((p) => p + 100), 100);
    return () => window.clearInterval(id);
  }, [swRunning]);

  if (!miniToolOpen) return null;

  const tabs: { id: MiniToolTab; label: string }[] = [
    { id: 'calculator', label: isFa ? 'ماشین‌حساب' : 'Calculator' },
    { id: 'timer', label: isFa ? 'تایمر' : 'Timer' },
    { id: 'stopwatch', label: isFa ? 'کرنومتر' : 'Stopwatch' },
    { id: 'converter', label: isFa ? 'مبدل واحد' : 'Converter' },
    { id: 'color', label: isFa ? 'انتخاب رنگ' : 'Color Picker' },
  ];

  const calcResult = evaluateSafeMath(expr);

  const numInput = Number(convVal) || 0;
  const convertedSummary = (() => {
    switch (convKind) {
      case 'km_mi':
        return `${(numInput * 0.621371).toFixed(3)} mi  ·  ${(numInput * 1000).toFixed(0)} m`;
      case 'kg_lb':
        return `${(numInput * 2.20462).toFixed(2)} lb  ·  ${(numInput * 1000).toFixed(0)} g`;
      case 'c_f':
        return `${((numInput * 9) / 5 + 32).toFixed(1)} °F  ·  ${(numInput + 273.15).toFixed(1)} K`;
      case 'gb_mb':
        return `${(numInput * 1024).toFixed(0)} MB  ·  ${(numInput / 1024).toFixed(3)} TB`;
    }
  })();

  const fmtClock = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${fmtNum(String(m).padStart(2, '0'), pd)}:${fmtNum(String(s).padStart(2, '0'), pd)}`;
  };

  return (
    <div
      onClick={() => openMiniTool(null)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'rgba(3, 8, 18, 0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="wejet-elevated-glass wj-animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 440, maxWidth: '94vw', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong>{isFa ? 'ابزارک‌های سریع Wejet' : 'Wejet Mini Tools'}</strong>
          <button type="button" className="wj-icon-btn" onClick={() => openMiniTool(null)}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              className={`wj-btn ${miniToolOpen === tb.id ? 'wj-btn-primary' : ''}`}
              style={{ padding: '5px 10px', fontSize: 'var(--wejet-font-xs)' }}
              onClick={() => openMiniTool(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {miniToolOpen === 'calculator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              className="wj-input ltr-inline tabular-nums"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder="e.g. (240 + 85) * 1.15"
            />
            <div
              className="tabular-nums ltr-inline"
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'var(--wejet-surface-hover)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
              }}
            >
              <span>{calcResult !== null ? fmtNum(calcResult, pd) : '—'}</span>
              {calcResult !== null && (
                <button
                  type="button"
                  className="wj-btn"
                  onClick={() => void copyClipboardItem(String(calcResult))}
                >
                  <Icon name="copy" size={14} />
                  {isFa ? 'کپی' : 'Copy'}
                </button>
              )}
            </div>
          </div>
        )}

        {miniToolOpen === 'timer' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="tabular-nums ltr-inline" style={{ fontSize: '2.8rem', fontWeight: 700 }}>
              {fmtClock(timerRemaining)}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[5, 15, 25, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  className="wj-btn"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerRemaining(m * 60);
                  }}
                >
                  {fmtNum(m, pd)} {isFa ? 'دقیقه' : 'min'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="wj-btn wj-btn-primary"
                onClick={() => setTimerRunning((r) => !r)}
              >
                {timerRunning ? (isFa ? 'توقف موقت' : 'Pause') : isFa ? 'شروع' : 'Start'}
              </button>
              <button
                type="button"
                className="wj-btn"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerRemaining(25 * 60);
                }}
              >
                {isFa ? 'بازنشانی' : 'Reset'}
              </button>
            </div>
          </div>
        )}

        {miniToolOpen === 'stopwatch' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="tabular-nums ltr-inline" style={{ fontSize: '2.6rem', fontWeight: 700 }}>
              {fmtNum((swElapsedMs / 1000).toFixed(1), pd)}s
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="wj-btn wj-btn-primary"
                onClick={() => setSwRunning((r) => !r)}
              >
                {swRunning ? (isFa ? 'توقف' : 'Stop') : isFa ? 'شروع' : 'Start'}
              </button>
              <button
                type="button"
                className="wj-btn"
                onClick={() => setLaps((l) => [swElapsedMs, ...l.slice(0, 4)])}
              >
                {isFa ? 'ثبت دور (Lap)' : 'Lap'}
              </button>
              <button
                type="button"
                className="wj-btn"
                onClick={() => {
                  setSwRunning(false);
                  setSwElapsedMs(0);
                  setLaps([]);
                }}
              >
                {isFa ? 'صفر' : 'Reset'}
              </button>
            </div>
            {laps.length > 0 && (
              <div style={{ width: '100%', fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)' }}>
                {laps.map((lp, idx) => (
                  <div key={idx} className="tabular-nums ltr-inline">
                    #{laps.length - idx} — {(lp / 1000).toFixed(1)}s
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {miniToolOpen === 'converter' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select
              className="wj-input"
              value={convKind}
              onChange={(e) => setConvKind(e.target.value as typeof convKind)}
            >
              <option value="km_mi" style={{ background: '#111827', color: '#fff' }}>
                {isFa ? 'کیلومتر به مایل و متر (km → mi / m)' : 'Kilometers → Miles & Meters'}
              </option>
              <option value="kg_lb" style={{ background: '#111827', color: '#fff' }}>
                {isFa ? 'کیلوگرم به پوند و گرم (kg → lb / g)' : 'Kilograms → Pounds & Grams'}
              </option>
              <option value="c_f" style={{ background: '#111827', color: '#fff' }}>
                {isFa ? 'سلسیوس به فارنهایت و کلوین (°C → °F / K)' : 'Celsius → Fahrenheit & Kelvin'}
              </option>
              <option value="gb_mb" style={{ background: '#111827', color: '#fff' }}>
                {isFa ? 'گیگابایت به مگابایت و ترابایت (GB → MB / TB)' : 'Gigabytes → MB & TB'}
              </option>
            </select>
            <input
              type="number"
              className="wj-input ltr-inline tabular-nums"
              value={convVal}
              onChange={(e) => setConvVal(e.target.value)}
            />
            <div
              className="ltr-inline tabular-nums"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--wejet-surface-hover)',
                fontWeight: 650,
              }}
            >
              {convertedSummary}
            </div>
          </div>
        )}

        {miniToolOpen === 'color' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="color"
                value={pickedHex}
                onChange={(e) => setPickedHex(e.target.value)}
                style={{ width: 52, height: 42, border: 'none', background: 'none', cursor: 'pointer' }}
              />
              <code className="ltr-inline" style={{ fontSize: '1.1rem', fontWeight: 650 }}>
                {pickedHex.toUpperCase()}
              </code>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="wj-btn"
                onClick={() => void copyClipboardItem(pickedHex.toUpperCase())}
              >
                <Icon name="copy" size={14} />
                {isFa ? 'کپی کد رنگ' : 'Copy HEX'}
              </button>
              <button
                type="button"
                className="wj-btn wj-btn-primary"
                onClick={() => void updateSettings({ accentColor: pickedHex })}
              >
                {isFa ? 'اعمال به عنوان رنگ Accent ویجت‌ها' : 'Set as Wejet Accent'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
