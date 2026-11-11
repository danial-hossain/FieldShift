import React, { useEffect, useRef } from 'react';
import { mountOverviewStory } from './overviewStory.js';
import './overviewStory.css';

export class OverviewStoryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[OverviewStory] Crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isBn = this.props.lang === 'bn';
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div
            className="dash-card ui-card-hud"
            style={{
              maxWidth: 460,
              width: '100%',
              padding: '32px 28px',
              borderRadius: 20,
              background: 'rgba(8, 16, 12, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              color: '#EAF6E6',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
            <h3 style={{ margin: '0 0 10px', fontSize: 19, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
              {isBn ? 'স্টোরি লোড করা সম্ভব হয়নি' : 'Story could not load'}
            </h3>
            <p style={{ margin: '0 0 22px', fontSize: 13.5, color: '#9bb3a2', lineHeight: 1.55 }}>
              {isBn
                ? 'দৃশ্যপট লোড করতে সমস্যা হয়েছে। সরাসরি আপনার জমিতে যেতে পারেন।'
                : 'A problem occurred while rendering the illustrated story. Open My Fields directly to continue.'}
            </p>
            <button
              type="button"
              className="fsx-btn p"
              onClick={() => this.props.onNavigate?.('myfields')}
              style={{
                background: 'var(--lime, #C8F169)',
                color: '#08140B',
                fontWeight: 700,
                border: 'none',
                padding: '11px 24px',
                borderRadius: 999,
                cursor: 'pointer',
                fontSize: 14,
                boxShadow: '0 0 20px rgba(200, 241, 105, 0.35)',
              }}
            >
              {isBn ? 'আমার জমিতে যান' : 'Open My Fields'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function OverviewStoryInner({ data, lang = 'en', onNavigate }) {
  const ref = useRef(null);
  const api = useRef(null);
  const nav = useRef(onNavigate);
  nav.current = onNavigate;
  const hasData = Boolean(data);

  useEffect(() => {
    if (!ref.current || !data) return undefined;
    api.current = mountOverviewStory(ref.current, data, {
      assetBase: import.meta.env.BASE_URL || '/',
      lang,
      onNavigate: (p) => nav.current?.(p),
    });
    return () => {
      api.current?.destroy();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, hasData]);

  useEffect(() => {
    if (api.current && data) api.current.update(data);
  }, [data]);

  if (!data) return null;

  return <div ref={ref} />;
}

/**
 * <OverviewStory data={storyData} lang="en" onNavigate={(page) => ...} />
 * storyData: same shape as demoData.js, built from the app's stores/APIs for the active field.
 */
export default function OverviewStory({ data, lang = 'en', onNavigate }) {
  return (
    <OverviewStoryErrorBoundary lang={lang} onNavigate={onNavigate}>
      <OverviewStoryInner data={data} lang={lang} onNavigate={onNavigate} />
    </OverviewStoryErrorBoundary>
  );
}
