import React, { useState } from 'react';
import { useWejet } from '../context/WejetContext';
import { t } from '../i18n/translations';
import { Icon } from './Icons';

export const QuickNoteOverlay: React.FC = () => {
  const { settings, quickNoteOpen, setQuickNoteOpen, createQuickNote } = useWejet();
  const [text, setText] = useState('');

  if (!quickNoteOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await createQuickNote(text.trim());
    setText('');
    setQuickNoteOpen(false);
  };

  return (
    <div
      onClick={() => setQuickNoteOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1450,
        background: 'rgba(3, 8, 18, 0.36)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <form
        onSubmit={(e) => void submit(e)}
        onClick={(e) => e.stopPropagation()}
        className="wejet-elevated-glass wj-animate-in"
        style={{ width: 460, maxWidth: '94vw', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 650 }}>
            <span style={{ color: 'var(--wejet-accent)' }}>
              <Icon name="notes" size={17} />
            </span>
            <span>{t(settings.language, 'quickNote')}</span>
          </div>
          <span className="wj-badge ltr-inline">Ctrl + Alt + N</span>
        </div>

        <input
          autoFocus
          className="wj-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(settings.language, 'quickNotePlaceholder')}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="wj-btn" onClick={() => setQuickNoteOpen(false)}>
            {t(settings.language, 'cancel')}
          </button>
          <button type="submit" className="wj-btn wj-btn-primary">
            {t(settings.language, 'saveNote')}
          </button>
        </div>
      </form>
    </div>
  );
};
