import React, { useState } from 'react';

export function AskAiBar({
  page = 'farm_planning',
  context = {},
  suggestions = [],
  onSubmit,
  onNavigate,
  lang = 'bn',
  placeholder,
}) {
  const [query, setQuery] = useState('');

  const defaultPlaceholder = lang === 'bn'
    ? '✨ এই পরিকল্পনা নিয়ে AI-কে জিজ্ঞেস করুন…'
    : '✨ Ask AI about this plan…';

  const handleTrigger = (text) => {
    const q = (text ?? query).trim();
    if (!q) return;
    if (onSubmit) {
      onSubmit(q, context);
    }
    if (onNavigate) {
      onNavigate('assistant', {
        question: q,
        context,
        fromPage: page,
      });
    }
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTrigger();
    }
  };

  return (
    <div
      className="ask-ai-bar-card"
      style={{
        background: 'var(--surface, #1e293b)',
        border: '1px solid var(--line, #334155)',
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}
    >
      {/* Input container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface-2, rgba(255,255,255,0.05))',
          border: '1px solid var(--line, rgba(255,255,255,0.15))',
          borderRadius: 999,
          padding: '4px 6px 4px 16px',
        }}
      >
        <span style={{ fontSize: 16, userSelect: 'none', opacity: 0.8 }}>✨</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          aria-label={placeholder || defaultPlaceholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text, #f8fafc)',
            fontSize: 14,
            padding: '6px 0',
          }}
        />
        <button
          type="button"
          onClick={() => handleTrigger()}
          disabled={!query.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: query.trim() ? 'var(--accent, #2c8a4b)' : 'var(--surface, rgba(255,255,255,0.1))',
            color: '#ffffff',
            border: 'none',
            borderRadius: 999,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: query.trim() ? 'pointer' : 'default',
            opacity: query.trim() ? 1 : 0.6,
            transition: 'all 0.15s ease',
          }}
        >
          <span>{lang === 'bn' ? 'জিজ্ঞেস করুন' : 'Ask'}</span>
          <span>→</span>
        </button>
      </div>

      {/* Suggestion Chips */}
      {suggestions && suggestions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted, #94a3b8)', fontWeight: 600, marginRight: 2 }}>
            {lang === 'bn' ? 'পরামর্শ:' : 'Suggestions:'}
          </span>
          {suggestions.map((s, idx) => {
            const chipText = typeof s === 'string' ? s : s.text || s.label;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleTrigger(chipText)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--surface-2, rgba(255,255,255,0.04))',
                  border: '1px solid var(--line, rgba(255,255,255,0.1))',
                  borderRadius: 999,
                  padding: '4px 11px',
                  fontSize: 12,
                  color: 'var(--text, #f1f5f9)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent, #2c8a4b)';
                  e.currentTarget.style.background = 'rgba(44, 138, 75, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line, rgba(255,255,255,0.1))';
                  e.currentTarget.style.background = 'var(--surface-2, rgba(255,255,255,0.04))';
                }}
              >
                <span>💬</span>
                <span>{chipText}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AskAiBar;
