import React from 'react';
import { Skeleton } from './Skeleton.jsx';

export function LoadingState({
  message = 'তথ্য লোড হচ্ছে...',
  subtext = 'NASA POWER ও ISRIC SoilGrids উপগ্রহ তথ্য যাচাই করা হচ্ছে',
  height = '200px',
  className = '',
  style = {}
}) {
  return (
    <div
      className={`ui-loading-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: height,
        padding: '24px 16px',
        textAlign: 'center',
        background: 'transparent',
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        gap: 12,
        ...style
      }}
    >
      {/* Shimmer skeleton mock cards instead of mid-page spinner */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton width="48px" height="48px" borderRadius="12px" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width="40%" height="18px" borderRadius="6px" />
            <Skeleton width="65%" height="13px" borderRadius="4px" />
          </div>
        </div>
        <Skeleton width="100%" height="32px" borderRadius="8px" />
        <Skeleton width="88%" height="24px" borderRadius="6px" />
      </div>

      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main, #e8ece9)', marginBottom: 3 }}>
          {message}
        </div>
        {subtext && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #9aa5a0)' }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingState;
