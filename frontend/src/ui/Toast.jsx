import React, { useEffect } from 'react';
import { CheckIcon, AlertCircleIcon, InfoIcon, CloseIcon } from './Icons.jsx';

export function Toast({
  type = 'info', // 'success' | 'error' | 'info'
  message,
  onClose,
  duration = 2500, // 2.5s per LB4 spec
  className = '',
  style = {}
}) {
  useEffect(() => {
    if (!duration || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyle = () => {
    if (type === 'success') {
      return {
        bg: 'rgba(12, 28, 18, 0.96)',
        border: '1.5px solid #00df81',
        icon: <CheckIcon size={18} className="text-emerald-400" />,
        color: '#00df81',
      };
    }
    if (type === 'error') {
      return {
        bg: 'rgba(32, 16, 16, 0.96)',
        border: '1.5px solid #ef4444',
        icon: <AlertCircleIcon size={18} className="text-red-400" />,
        color: '#ef4444',
      };
    }
    return {
      bg: 'rgba(16, 24, 32, 0.96)',
      border: '1.5px solid #38bdf8',
      icon: <InfoIcon size={18} className="text-sky-400" />,
      color: '#38bdf8',
    };
  };

  const t = getStyle();

  return (
    <div
      className={`ui-toast ${className}`}
      role="alert"
      data-testid="bottom-toast"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 20px',
        background: t.bg,
        border: t.border,
        borderRadius: '9999px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.65), 0 0 16px rgba(0, 223, 129, 0.2)',
        color: 'var(--text-main, #e8ece9)',
        fontSize: '13.5px',
        fontWeight: 700,
        maxWidth: '90vw',
        animation: 'slideUpFade 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(8px)',
        ...style
      }}
    >
      <span>{t.icon}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close notification"
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}

export default Toast;
