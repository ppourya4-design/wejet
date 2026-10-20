import React, { useState } from 'react';
import { NoteItem, WidgetInstance, WidgetManifest } from '../types/models';
import { useWejet } from '../context/WejetContext';
import { Icon } from '../components/Icons';

export const notesManifest: WidgetManifest = {
  id: 'notes',
  name: 'Notes & Checklist',
  nameFa: 'یادداشت و فهرست کارها',
  description: 'Local atomic-saved notes and interactive todo items with instant pin & sync.',
  descriptionFa: 'یادداشت‌های چندگانه و چک‌لیست روزانه با ذخیره‌سازی اتمیک محلی بدون دیتابیس.',
  category: 'productivity',
  icon: 'notes',
  defaultSize: { width: 320, height: 288 },
  minSize: { width: 256, height: 220 },
  settingsSchema: [
    {
      key: 'showTodos',
      type: 'boolean',
      labelFa: 'نمایش بخش چک‌لیست کارها',
      labelEn: 'Show Todo Checklist',
      defaultValue: true,
    },
  ],
};

export const NotesWidget: React.FC<{ instance: WidgetInstance }> = ({ instance }) => {
  const { settings, notes, saveNotesList } = useWejet();
  const [activeIndex, setActiveIndex] = useState(0);
  const [newTodo, setNewTodo] = useState('');

  const isFa = settings.language === 'fa';
  const showTodos = Boolean(instance.settings.showTodos ?? true);

  const sortedNotes = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const current: NoteItem | undefined = sortedNotes[activeIndex] ?? sortedNotes[0];

  const handleAddNote = () => {
    const now = Math.floor(Date.now() / 1000);
    const created: NoteItem = {
      id: `note-${Date.now()}`,
      title: isFa ? 'یادداشت جدید' : 'New Note',
      body: '',
      todos: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    void saveNotesList([created, ...notes]);
    setActiveIndex(0);
  };

  const patchCurrent = (patch: Partial<NoteItem>) => {
    if (!current) return;
    const now = Math.floor(Date.now() / 1000);
    const next = notes.map((n) => (n.id === current.id ? { ...n, ...patch, updatedAt: now } : n));
    void saveNotesList(next);
  };

  const handleDeleteCurrent = () => {
    if (!current || notes.length <= 1) return;
    void saveNotesList(notes.filter((n) => n.id !== current.id));
    setActiveIndex(0);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !newTodo.trim()) return;
    patchCurrent({
      todos: [
        ...current.todos,
        { id: `td-${Date.now()}`, text: newTodo.trim(), completed: false },
      ],
    });
    setNewTodo('');
  };

  if (!current) {
    return (
      <div style={{ padding: 18 }}>
        <button type="button" className="wj-btn wj-btn-primary" onClick={handleAddNote}>
          <Icon name="plus" size={14} />
          {isFa ? 'ایجاد اولین یادداشت' : 'Create Note'}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '13px 16px',
        gap: 8,
      }}
    >
      {/* Top Note Switcher Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', flex: 1 }}>
          {sortedNotes.map((n, idx) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              style={{
                padding: '3px 9px',
                borderRadius: 'var(--wejet-radius-pill)',
                border: '1px solid var(--wejet-glass-border)',
                background:
                  n.id === current.id ? 'var(--wejet-accent-soft)' : 'transparent',
                color: n.id === current.id ? 'var(--wejet-accent)' : 'var(--wejet-text-muted)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                maxWidth: 96,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {n.pinned ? '📌 ' : ''}
              {n.title || (isFa ? 'یادداشت' : 'Note')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          <button
            type="button"
            className="wj-icon-btn"
            style={{ width: 25, height: 25, color: current.pinned ? 'var(--wejet-accent)' : undefined }}
            onClick={() => patchCurrent({ pinned: !current.pinned })}
            title={isFa ? 'پین کردن' : 'Pin note'}
          >
            <Icon name="pin" size={13} />
          </button>
          <button
            type="button"
            className="wj-icon-btn"
            style={{ width: 25, height: 25 }}
            onClick={handleAddNote}
            title={isFa ? 'یادداشت جدید' : 'New note'}
          >
            <Icon name="plus" size={14} />
          </button>
          {notes.length > 1 && (
            <button
              type="button"
              className="wj-icon-btn"
              style={{ width: 25, height: 25 }}
              onClick={handleDeleteCurrent}
              title={isFa ? 'حذف یادداشت' : 'Delete note'}
            >
              <Icon name="trash" size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Editable Title & Body */}
      <input
        value={current.title}
        onChange={(e) => patchCurrent({ title: e.target.value })}
        aria-label={isFa ? 'عنوان یادداشت' : 'Note title'}
        style={{
          background: 'transparent',
          border: 'none',
          fontWeight: 650,
          fontSize: 'var(--wejet-font-sm)',
          padding: '2px 0',
          outline: 'none',
        }}
      />

      <textarea
        value={current.body}
        onChange={(e) => patchCurrent({ body: e.target.value })}
        placeholder={isFa ? 'متن یادداشت خود را بنویسید...' : 'Write a note...'}
        style={{
          flex: 1,
          resize: 'none',
          background: 'var(--wejet-surface-hover)',
          border: '1px solid var(--wejet-glass-border)',
          borderRadius: 10,
          padding: '8px 10px',
          fontSize: 'var(--wejet-font-xs)',
          lineHeight: 1.55,
          outline: 'none',
          minHeight: 54,
        }}
      />

      {/* Checklist */}
      {showTodos && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            paddingTop: 2,
            maxHeight: 96,
            overflowY: 'auto',
          }}
        >
          {current.todos.map((td) => (
            <label
              key={td.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 'var(--wejet-font-xs)',
                cursor: 'pointer',
                color: td.completed ? 'var(--wejet-text-muted)' : 'var(--wejet-text-secondary)',
                opacity: td.completed ? 0.65 : 1,
                textDecorationLine: td.completed ? 'line-through' : 'none',
                textDecorationThickness: '1px',
              }}
            >
              <input
                type="checkbox"
                checked={td.completed}
                onChange={() =>
                  patchCurrent({
                    todos: current.todos.map((item) =>
                      item.id === td.id ? { ...item, completed: !item.completed } : item
                    ),
                  })
                }
                style={{ accentColor: 'var(--wejet-accent)' }}
              />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {td.text}
              </span>
            </label>
          ))}
          <form onSubmit={handleAddTodo}>
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder={isFa ? '+ افزودن مورد به لیست کارها...' : '+ Add todo item...'}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderTop: '1px solid var(--wejet-glass-border)',
                paddingTop: 5,
                fontSize: 'var(--wejet-font-xs)',
                outline: 'none',
              }}
            />
          </form>
        </div>
      )}
    </div>
  );
};
