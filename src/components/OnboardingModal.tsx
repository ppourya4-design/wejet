import React, { useState } from 'react';
import { useWejet } from '../context/WejetContext';
import { t } from '../i18n/translations';
import { THEME_PRESETS } from '../themes/themes';
import { ThemeId } from '../types/models';
import { Icon } from './Icons';

export const OnboardingModal: React.FC = () => {
  const { settings, profiles, updateSettings, switchProfile } = useWejet();
  const [chosenProfile, setChosenProfile] = useState(settings.activeProfileId || 'productivity');

  if (settings.firstRunComplete) return null;

  const isFa = settings.language === 'fa';

  const handleFinish = async () => {
    await switchProfile(chosenProfile);
    await updateSettings({ firstRunComplete: true });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(4, 9, 20, 0.56)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="wejet-elevated-glass wj-animate-in"
        style={{
          width: 680,
          maxWidth: '96vw',
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {/* Brand Hero */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/logo.svg" alt="Wejet" width={48} height={48} />
            <div>
              <div style={{ fontSize: '1.55rem', fontWeight: 750, letterSpacing: '0.04em' }}>
                {t(settings.language, 'brand')}
              </div>
              <div style={{ fontSize: 'var(--wejet-font-md)', color: 'var(--wejet-accent)', fontWeight: 550 }}>
                {t(settings.language, 'tagline')}
              </div>
            </div>
          </div>

          {/* Instant Language Toggle */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`wj-btn ${isFa ? 'wj-btn-primary' : ''}`}
              onClick={() => void updateSettings({ language: 'fa' })}
            >
              فارسی
            </button>
            <button
              type="button"
              className={`wj-btn ${!isFa ? 'wj-btn-primary' : ''}`}
              onClick={() => void updateSettings({ language: 'en' })}
            >
              English
            </button>
          </div>
        </div>

        <p style={{ margin: 0, color: 'var(--wejet-text-secondary)', fontSize: 'var(--wejet-font-sm)' }}>
          {t(settings.language, 'onboardingSubtitle')}
        </p>

        {/* Glass Material Selection */}
        <div>
          <div style={{ fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)', marginBottom: 8 }}>
            {t(settings.language, 'selectTheme')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {(
              ['dark-glass', 'frost', 'midnight', 'aurora'] as Exclude<ThemeId, 'system'>[]
            ).map((id) => {
              const p = THEME_PRESETS[id];
              const active = settings.theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => void updateSettings({ theme: id })}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border: active
                      ? '1.5px solid var(--wejet-accent)'
                      : '1px solid var(--wejet-glass-border)',
                    background: 'var(--wejet-surface-hover)',
                    cursor: 'pointer',
                    textAlign: 'start',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      height: 26,
                      borderRadius: 7,
                      background: p.previewGradient,
                      border: '1px solid rgba(255,255,255,0.16)',
                    }}
                  />
                  <span style={{ fontSize: 'var(--wejet-font-xs)', fontWeight: 600 }}>
                    {isFa ? p.nameFa : p.nameEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Starter Space Preset Selection */}
        <div>
          <div style={{ fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)', marginBottom: 8 }}>
            {t(settings.language, 'selectPreset')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {profiles.map((prof) => {
              const selected = chosenProfile === prof.id;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => setChosenProfile(prof.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: selected
                      ? '1.5px solid var(--wejet-accent)'
                      : '1px solid var(--wejet-glass-border)',
                    background: selected ? 'var(--wejet-accent-soft)' : 'var(--wejet-surface-hover)',
                    cursor: 'pointer',
                    textAlign: 'start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                  }}
                >
                  <span style={{ color: 'var(--wejet-accent)' }}>
                    <Icon name={prof.icon} size={17} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--wejet-font-xs)', fontWeight: 650 }}>
                      {isFa ? prof.nameFa : prof.nameEn}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <span style={{ fontSize: 'var(--wejet-font-xs)', color: 'var(--wejet-text-muted)' }}>
            {isFa
              ? 'بدون نیاز به حساب کاربری · کاملاً محلی و خصوصی'
              : 'Zero account required · 100% local & private'}
          </span>
          <button
            type="button"
            className="wj-btn wj-btn-primary"
            style={{ padding: '10px 22px', fontSize: 'var(--wejet-font-md)' }}
            onClick={() => void handleFinish()}
          >
            {t(settings.language, 'onboardingStart')}
          </button>
        </div>
      </div>
    </div>
  );
};
