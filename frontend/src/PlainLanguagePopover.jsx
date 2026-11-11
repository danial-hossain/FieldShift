// frontend/src/PlainLanguagePopover.jsx
// Plain-language agronomic and scientific popovers ("এর মানে কী? / What does this mean?")
// Explains complex satellite data and mathematical concepts for farmers, field workers, and judges.

import React, { useState, useRef, useEffect } from 'react';
import { Lightbulb, Satellite, Landmark } from 'lucide-react';
import {
  PLAIN_LANGUAGE_TERMS,
  SAAO_ADVISORY_NOTICE_BN,
  SAAO_ADVISORY_NOTICE_EN
} from './plainLanguageTerms.js';

export {
  PLAIN_LANGUAGE_TERMS,
  SAAO_ADVISORY_NOTICE_BN,
  SAAO_ADVISORY_NOTICE_EN
};

export function PlainLanguagePopover({ termKey, lang = 'bn', inline = true, label = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const data = PLAIN_LANGUAGE_TERMS[termKey];

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!data) return null;

  const buttonLabel = label || (lang === 'bn' ? 'এর মানে কী?' : 'What does this mean?');

  return (
    <span
      ref={popoverRef}
      style={{
        position: 'relative',
        display: inline ? 'inline-flex' : 'flex',
        alignItems: 'center',
        marginLeft: 6,
        verticalAlign: 'middle',
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={lang === 'bn' ? `${data.termBn} এর মানে কী?` : `What does ${data.termEn} mean?`}
        style={{
          background: isOpen ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          color: 'var(--water, #0284c7)',
          fontSize: 10.5,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 999,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          lineHeight: 1.2,
          transition: 'all 0.15s ease',
        }}
      >
        <Lightbulb size={12} strokeWidth={1.75} color="var(--amber, #f5b04c)" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 295,
            maxWidth: '85vw',
            background: 'var(--surface, #0f172a)',
            border: '1px solid #38bdf8',
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.2)',
            zIndex: 9999,
            color: 'var(--text, #f1f5f9)',
            fontSize: 12,
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <strong style={{ color: 'var(--water, #0284c7)', fontSize: 12.5, display: 'block' }}>
                {lang === 'bn' ? data.termBn : data.termEn}
              </strong>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted, #94a3b8)' }}>
                {lang === 'bn' ? data.shortBn : data.shortEn}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '0 2px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ margin: '6px 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--text-2, #cbd5e1)' }}>
            {lang === 'bn' ? data.explanationBn : data.explanationEn}
          </p>

          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: 10.5, color: 'var(--leaf, #86efac)', fontStyle: 'italic' }}>
            <Satellite size={14} strokeWidth={1.75} color="var(--cyan, #5be3ff)" style={{ verticalAlign: 'middle', marginRight: 4 }} />{lang === 'bn' ? data.satelliteNoteBn : data.satelliteNoteEn}
          </div>
        </div>
      )}
    </span>
  );
}

export function SaaoNotice({ lang = 'bn', compact = false }) {
  return (
    <div
      style={{
        marginTop: compact ? 8 : 14,
        padding: compact ? '8px 12px' : '10px 14px',
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 8,
        fontSize: compact ? 11 : 12,
        fontWeight: 600,
        color: 'var(--water, #38bdf8)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Landmark size={14} strokeWidth={1.75} />
      <span>
        {lang === 'bn' ? SAAO_ADVISORY_NOTICE_BN : SAAO_ADVISORY_NOTICE_EN}
      </span>
    </div>
  );
}
