import React, { useMemo, useState } from 'react';
import { WidgetInstance, WidgetManifest } from '../types/models';
import { useWejet } from '../context/WejetContext';
import holidaysData from '../data/jalaliHolidays.json';
import {
  dateToJalali,
  JALALI_MONTHS_EN,
  JALALI_MONTHS_FA,
  JALALI_WEEKDAYS_SHORT_EN,
  JALALI_WEEKDAYS_SHORT_FA,
  jalaliFirstWeekdaySaturdayIndex,
  jalaliMonthLength,
  jalaliToGregorian,
} from '../utils/jalali';
import { fmtNum } from '../utils/format';

export const calendarManifest: WidgetManifest = {
  id: 'calendar',
  name: 'Jalali Calendar',
  nameFa: 'تقویم جلالی (شمسی)',
  description: 'Full Persian calendar with Gregorian span, holidays, and personal day events.',
  descriptionFa: 'تقویم کامل شمسی همراه با معادل میلادی، مناسبت‌ها و ثبت رویداد شخصی.',
  category: 'productivity',
  icon: 'calendar',
  defaultSize: { width: 328, height: 312 },
  minSize: { width: 280, height: 272 },
  settingsSchema: [
    {
      key: 'highlightFridays',
      type: 'boolean',
      labelFa: 'متمایزسازی تعطیلات جمعه',
      labelEn: 'Highlight Fridays',
      defaultValue: true,
    },
  ],
};

export const CalendarWidget: React.FC<{ instance: WidgetInstance }> = ({ instance }) => {
  const { settings, updateWidget } = useWejet();
  const isFa = settings.language === 'fa';
  const pd = isFa && settings.usePersianDigits;
  const highlightFridays = Boolean(instance.settings.highlightFridays ?? true);

  const todayJ = useMemo(() => dateToJalali(new Date()), []);
  const [viewYear, setViewYear] = useState(todayJ.jy);
  const [viewMonth, setViewMonth] = useState(todayJ.jm);
  const [selectedDay, setSelectedDay] = useState(todayJ.jd);
  const [eventDraft, setEventDraft] = useState('');

  // Custom day events stored right inside widget settings JSON string map
  const customEvents: Record<string, string> = useMemo(() => {
    try {
      const raw = instance.settings.customEvents;
      return typeof raw === 'string' ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }, [instance.settings.customEvents]);

  const daysInMonth = jalaliMonthLength(viewYear, viewMonth);
  const startOffset = jalaliFirstWeekdaySaturdayIndex(viewYear, viewMonth);

  const startGreg = jalaliToGregorian(viewYear, viewMonth, 1);
  const endGreg = jalaliToGregorian(viewYear, viewMonth, daysInMonth);
  const gregSubtitle = useMemo(() => {
    const d1 = new Date(startGreg.gy, startGreg.gm - 1, startGreg.gd);
    const d2 = new Date(endGreg.gy, endGreg.gm - 1, endGreg.gd);
    const m1 = d1.toLocaleDateString('en-US', { month: 'short' });
    const m2 = d2.toLocaleDateString('en-US', { month: 'short' });
    return m1 === m2 ? `${m1} ${endGreg.gy}` : `${m1} – ${m2} ${endGreg.gy}`;
  }, [startGreg, endGreg]);

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 12) {
      m = 1;
      y++;
    } else if (m < 1) {
      m = 12;
      y--;
    }
    setViewYear(y);
    setViewMonth(m);
    setSelectedDay(1);
  };

  const selectedKey = `${viewYear}-${viewMonth}-${selectedDay}`;
  const selectedHoliday = holidaysData.find(
    (h) => h.month === viewMonth && h.day === selectedDay
  );
  const selectedCustomEvent = customEvents[selectedKey];

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const next = { ...customEvents };
    if (eventDraft.trim()) {
      next[selectedKey] = eventDraft.trim();
    } else {
      delete next[selectedKey];
    }
    void updateWidget(instance.instanceId, {
      settings: { ...instance.settings, customEvents: JSON.stringify(next) },
    });
    setEventDraft('');
  };

  const weekdays = isFa ? JALALI_WEEKDAYS_SHORT_FA : JALALI_WEEKDAYS_SHORT_EN;

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 650, fontSize: 'var(--wejet-font-md)' }}>
            {isFa ? JALALI_MONTHS_FA[viewMonth - 1] : JALALI_MONTHS_EN[viewMonth - 1]}{' '}
            <span className="tabular-nums">{fmtNum(viewYear, pd)}</span>
          </div>
          <div
            className="ltr-inline"
            style={{ fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)' }}
          >
            {gregSubtitle}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            className="wj-icon-btn"
            onClick={() => changeMonth(-1)}
            aria-label={isFa ? 'ماه قبل' : 'Previous month'}
          >
            {isFa ? '›' : '‹'}
          </button>
          <button
            type="button"
            className="wj-btn"
            style={{ padding: '3px 9px', fontSize: 'var(--wejet-font-xs)' }}
            onClick={() => {
              setViewYear(todayJ.jy);
              setViewMonth(todayJ.jm);
              setSelectedDay(todayJ.jd);
            }}
          >
            {isFa ? 'امروز' : 'Today'}
          </button>
          <button
            type="button"
            className="wj-icon-btn"
            onClick={() => changeMonth(1)}
            aria-label={isFa ? 'ماه بعد' : 'Next month'}
          >
            {isFa ? '‹' : '›'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 3,
          textAlign: 'center',
        }}
      >
        {weekdays.map((wd, i) => (
          <div
            key={wd}
            style={{
              fontSize: 'var(--wejet-font-xs)',
              color: i === 6 && highlightFridays ? 'var(--wejet-danger)' : 'var(--wejet-text-muted)',
              fontWeight: 600,
              paddingBottom: 3,
            }}
          >
            {wd}
          </div>
        ))}
        {Array.from({ length: startOffset }).map((_, idx) => (
          <div key={`empty-${idx}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const d = idx + 1;
          const col = (startOffset + idx) % 7;
          const isToday = viewYear === todayJ.jy && viewMonth === todayJ.jm && d === todayJ.jd;
          const isSelected = d === selectedDay;
          const hol = holidaysData.find((h) => h.month === viewMonth && h.day === d);
          const hasCustom = Boolean(customEvents[`${viewYear}-${viewMonth}-${d}`]);
          const isHolidayText = (col === 6 && highlightFridays) || hol?.isHoliday;

          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className="tabular-nums"
              style={{
                position: 'relative',
                height: 28,
                border: isSelected ? '1px solid var(--wejet-accent)' : '1px solid transparent',
                borderRadius: 8,
                background: isToday
                  ? 'var(--wejet-accent)'
                  : isSelected
                    ? 'var(--wejet-surface-hover)'
                    : 'transparent',
                color: isToday
                  ? 'var(--wejet-accent-contrast)'
                  : isHolidayText
                    ? 'var(--wejet-danger)'
                    : 'var(--wejet-text)',
                fontWeight: isToday ? 700 : 500,
                fontSize: 'var(--wejet-font-xs)',
                cursor: 'pointer',
              }}
            >
              {fmtNum(d, pd)}
              {(hol || hasCustom) && !isToday && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: hasCustom ? 'var(--wejet-accent)' : 'var(--wejet-warning)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Occasion & Event Quick-Add */}
      <form
        onSubmit={handleSaveEvent}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          paddingTop: 6,
          borderTop: '1px solid var(--wejet-glass-border)',
          fontSize: 'var(--wejet-font-xs)',
        }}
      >
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedHoliday?.isHoliday ? 'var(--wejet-danger)' : 'var(--wejet-text-secondary)',
            flex: 1,
          }}
        >
          {selectedCustomEvent ||
            (selectedHoliday ? (isFa ? selectedHoliday.titleFa : selectedHoliday.titleEn) : '') ||
            (isFa
              ? `${fmtNum(selectedDay, pd)} ${JALALI_MONTHS_FA[viewMonth - 1]} — بدون رویداد`
              : `${selectedDay} ${JALALI_MONTHS_EN[viewMonth - 1]} — Free day`)}
        </div>
        <input
          value={eventDraft}
          onChange={(e) => setEventDraft(e.target.value)}
          placeholder={isFa ? '+ رویداد...' : '+ Event...'}
          aria-label={isFa ? 'افزودن رویداد روز' : 'Add day event'}
          style={{
            width: 88,
            padding: '3px 7px',
            borderRadius: 7,
            border: '1px solid var(--wejet-glass-border)',
            background: 'var(--wejet-input-bg)',
            fontSize: 'var(--wejet-font-xs)',
          }}
        />
      </form>
    </div>
  );
};
