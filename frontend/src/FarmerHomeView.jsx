// frontend/src/FarmerHomeView.jsx
// Overview: "From Orbit to Field" 3D scroll story.
// The Overview page is ONE full-screen, immersive 3D scroll story and NOTHING else.
// Strictly honest metrics from NASA POWER climatology and live advisory telemetry.

import React, { useEffect, useState } from 'react';

const OrbitToFieldStory = React.lazy(() => import('./overview/OrbitToFieldStory.jsx'));

// ── Story-level ErrorBoundary: if the 3D story crashes, show a still fallback
// and let the rest of the app keep working ────────────────────────────────────
export class StoryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false, errorMsg: '', componentStack: '' };
  }
  static getDerivedStateFromError(error) {
    return { crashed: true, errorMsg: error?.message || String(error) };
  }
  componentDidCatch(error, info) {
    console.error('[StoryErrorBoundary] 3D story crashed:', error?.message, '\nComponent stack:', info?.componentStack);
    this.setState({ componentStack: info?.componentStack || '' });
  }
  render() {
    if (this.state.crashed) {
      const isDev = Boolean(import.meta.env?.DEV);
      return (
        <div style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #04070d 0%, #060f0a 40%, #0d1e10 70%, #111809 100%)',
          color: '#EAF2EC',
          padding: 24,
        }}>
          {/* SVG still background */}
          <svg viewBox="0 0 800 400" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }} preserveAspectRatio="xMidYMid slice">
            <circle cx="600" cy="200" r="140" fill="#1a3a6a" />
            <ellipse cx="200" cy="300" rx="140" ry="80" fill="#1e5c38" opacity="0.7" />
          </svg>
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 1, maxWidth: 500 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🛰️</div>
            <div style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>FieldShift</div>
            <div style={{ fontSize: 14, color: '#9fb3a5', lineHeight: 1.5 }}>
              {this.props.lang === 'bn'
                ? 'থ্রিডি দৃশ্য লোড হতে পারেনি। সাইডবার থেকে যেকোনো পৃষ্ঠায় যান।'
                : '3D story could not load. Navigate to any page from the sidebar.'}
            </div>
            {isDev && (
              <details open style={{ marginTop: 14, textAlign: 'left', background: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 8 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, color: '#F5B04C' }}>DEV: {this.state.errorMsg}</summary>
                {this.state.componentStack && (
                  <pre style={{ fontSize: 10, color: '#fca5a5', marginTop: 8, whiteSpace: 'pre-wrap' }}>
                    {this.state.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function FarmerHomeView({
  activeField,
  userFields = [],
  nasa,
  lang = 'bn',
  onNavigate = () => {},
  onSelectField = () => {},
  onOpenVoice = () => {}
}) {
  const [advisoryData, setAdvisoryData] = useState(null);

  const district = activeField?.district || 'rajshahi';
  const lat = activeField?.latitude;
  const lon = activeField?.longitude;

  useEffect(() => {
    let isMounted = true;
    const fetchAdvisory = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (district) queryParams.append('district', district.toLowerCase());
        if (lat) queryParams.append('latitude', lat);
        if (lon) queryParams.append('longitude', lon);
        const url = `http://127.0.0.1:8000/api/advisory?${queryParams.toString()}`;
        const res = await fetch(url);
        if (res.ok && isMounted) {
          const data = await res.json();
          setAdvisoryData(data);
        }
      } catch (err) {
        console.warn('Advisory fetch fallback:', err);
      }
    };
    fetchAdvisory();
    return () => { isMounted = false; };
  }, [district, lat, lon]);

  return (
    <div className="overview-story-stage" style={{ width: '100%', margin: 0, padding: 0 }}>
      <StoryErrorBoundary lang={lang}>
        <React.Suspense fallback={<div style={{ minHeight: '100vh', background: '#05080F' }} />}>
          <OrbitToFieldStory
            activeField={activeField}
            lang={lang}
            onNavigate={onNavigate}
            advisoryData={advisoryData}
          />
        </React.Suspense>
      </StoryErrorBoundary>
    </div>
  );
}

export default FarmerHomeView;
