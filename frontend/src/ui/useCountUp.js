import React, { useState, useEffect, useRef } from 'react';
import { toBengaliNumber, toEnglishNumber } from '../i18n.js';

/**
 * useCountUp: Eases a number from 0 to value over duration (default 600ms ease-out).
 * Respects prefers-reduced-motion and SSR.
 */
export function useCountUp(value, duration = 600) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setDisplayValue(value);
      return;
    }

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    if (value == null || value === '' || value === '—' || value === 'তথ্য নেই' || value === 'No data') {
      setDisplayValue(value);
      return;
    }

    const strVal = String(value);
    const isBengali = /[০-৯]/.test(strVal);
    const normalized = isBengali ? toEnglishNumber(strVal) : strVal;

    // Extract leading non-numeric (e.g. "+", "৳", "$"), digits, decimal, and trailing non-numeric
    const match = normalized.match(/^([^0-9.-]*)([0-9,.]+)([^0-9]*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const prefix = match[1] || '';
    const rawNumberStr = match[2].replace(/,/g, '');
    const suffix = match[3] || '';
    const targetNum = parseFloat(rawNumberStr);

    if (isNaN(targetNum)) {
      setDisplayValue(value);
      return;
    }

    // Determine decimal precision
    const decimalParts = rawNumberStr.split('.');
    const decimals = decimalParts.length > 1 ? decimalParts[1].length : 0;
    const hasCommas = match[2].includes(',');

    const startTime = performance.now();
    const startNum = 0;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startNum + (targetNum - startNum) * ease;

      let formattedNum = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();
      if (hasCommas) {
        const parts = formattedNum.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        formattedNum = parts.join('.');
      }

      const formatted = prefix + (isBengali ? toBengaliNumber(formattedNum) : formattedNum) + suffix;
      setDisplayValue(formatted);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [value, duration]);

  return displayValue;
}

export function AnimatedNumber({ value, duration = 600, className = '', style = {} }) {
  const animated = useCountUp(value, duration);
  return React.createElement('span', { className, style }, animated);
}

export default useCountUp;
