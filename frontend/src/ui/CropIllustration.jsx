// frontend/src/ui/CropIllustration.jsx
// Lightweight, clean vector illustrations for Bangladeshi crops (G1 requirement)
// Zero external network calls or hotlinking; pure embedded SVGs.

import React from 'react';
import { getCropCategory } from '../three/farmSceneHelpers.js';

export function CropIllustration({ cropName, size = 64, className = '' }) {
  const cat = getCropCategory(cropName);

  // SVG Artwork per crop category
  const renderSvg = () => {
    switch (cat) {
      case 'rice':
        return (
          <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#e8f5e9" stroke="#81c784" strokeWidth="2" />
            <path d="M32 50V20" stroke="#388e3c" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M32 38C26 34 22 28 24 22C28 22 31 28 32 32" fill="#81c784" />
            <path d="M32 32C38 28 42 22 40 16C36 16 33 22 32 26" fill="#81c784" />
            <path d="M32 24C28 18 25 14 28 10C32 12 33 16 32 20" fill="#a5d6a7" />
            <path d="M32 18C36 14 38 10 36 6C32 8 31 12 32 16" fill="#a5d6a7" />
            <path d="M14 54C22 51 42 51 50 54" stroke="#4fc3f7" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'mustard':
        return (
          <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#fffde7" stroke="#fff176" strokeWidth="2" />
            <path d="M32 52V24" stroke="#558b2f" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M32 40C26 36 24 30 27 28C30 30 31 34 32 37" fill="#8bc34a" />
            <path d="M32 34C38 30 40 24 37 22C34 24 33 28 32 31" fill="#8bc34a" />
            {/* Bright yellow flower cluster */}
            <circle cx="32" cy="18" r="4" fill="#fbc02d" />
            <circle cx="26" cy="19" r="3.5" fill="#fdd835" />
            <circle cx="38" cy="19" r="3.5" fill="#fdd835" />
            <circle cx="29" cy="13" r="3" fill="#ffee58" />
            <circle cx="35" cy="13" r="3" fill="#ffee58" />
            <circle cx="32" cy="15" r="2" fill="#fff59d" />
          </svg>
        );

      case 'wheat':
        return (
          <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#fff8e1" stroke="#ffe082" strokeWidth="2" />
            <path d="M32 52V28" stroke="#d4a343" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M32 30C28 26 26 22 28 20C31 21 32 24 32 27" fill="#f0c365" />
            <path d="M32 25C36 21 38 17 36 15C33 16 32 19 32 22" fill="#f0c365" />
            <path d="M32 20C28 16 26 12 28 10C31 11 32 14 32 17" fill="#f6d389" />
            <path d="M32 15C36 11 38 7 36 5C33 6 32 9 32 12" fill="#f6d389" />
            <path d="M32 10V4" stroke="#d4a343" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'sunflower':
        return (
          <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#fffde7" stroke="#fbc02d" strokeWidth="2" />
            <path d="M32 52V30" stroke="#33691e" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 42C24 38 22 30 26 28C29 32 31 36 32 39" fill="#558b2f" />
            {/* Sunflower petals */}
            <circle cx="32" cy="22" r="14" fill="#fbc02d" />
            <circle cx="32" cy="22" r="8" fill="#5d4037" />
            <circle cx="32" cy="22" r="6" fill="#3e2723" />
          </svg>
        );

      case 'pulse':
        return (
          <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#f1f8e9" stroke="#aed581" strokeWidth="2" />
            <path d="M32 50V32" stroke="#558b2f" strokeWidth="2.5" strokeLinecap="round" />
            {/* Tri-foliate legume leaves */}
            <ellipse cx="24" cy="28" rx="6" ry="4" transform="rotate(-30 24 28)" fill="#7cb342" />
            <ellipse cx="40" cy="28" rx="6" ry="4" transform="rotate(30 40 28)" fill="#7cb342" />
            <ellipse cx="32" cy="20" rx="5" ry="6" fill="#8bc34a" />
            {/* Legume pod */}
            <path d="M32 30C36 33 42 34 44 32C42 36 36 38 32 35" fill="#689f38" />
          </svg>
        );

      case 'potato':
        return (
          <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#efebe9" stroke="#bcaaa4" strokeWidth="2" />
            {/* Foliage */}
            <path d="M32 34V18" stroke="#33691e" strokeWidth="2.5" />
            <circle cx="32" cy="18" r="6" fill="#689f38" />
            <circle cx="26" cy="22" r="5" fill="#558b2f" />
            <circle cx="38" cy="22" r="5" fill="#558b2f" />
            {/* Earthy mound & tuber */}
            <ellipse cx="32" cy="46" rx="16" ry="6" fill="#8d6e63" />
            <ellipse cx="28" cy="45" rx="5" ry="3.5" fill="#d7ccc8" stroke="#8d6e63" strokeWidth="1" />
            <ellipse cx="37" cy="47" rx="4" ry="3" fill="#d7ccc8" stroke="#8d6e63" strokeWidth="1" />
          </svg>
        );

      case 'jute':
        return (
          <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#e8f5e9" stroke="#a5d6a7" strokeWidth="2" />
            <path d="M32 54V12" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 36C24 33 22 26 26 24C28 27 30 31 32 33" fill="#4caf50" />
            <path d="M32 28C40 25 42 18 38 16C36 19 34 23 32 25" fill="#4caf50" />
            <path d="M32 20C26 17 24 11 28 9C30 12 31 15 32 17" fill="#66bb6a" />
          </svg>
        );

      case 'maize':
        return (
          <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#fffde7" stroke="#ffe082" strokeWidth="2" />
            <path d="M32 52V20" stroke="#33691e" strokeWidth="3" />
            <path d="M32 38C22 34 18 24 22 22C26 26 29 32 32 35" fill="#558b2f" />
            <path d="M32 32C42 28 46 18 42 16C38 20 35 26 32 29" fill="#558b2f" />
            {/* Corn ear */}
            <ellipse cx="32" cy="22" rx="4.5" ry="9" fill="#fbc02d" stroke="#f57f17" strokeWidth="1" />
          </svg>
        );

      case 'fallow':
      default:
        return (
          <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#efebe9" stroke="#d7ccc8" strokeWidth="2" />
            <path d="M16 36C22 32 42 32 48 36" stroke="#8d6e63" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 42C20 38 44 38 50 42" stroke="#8d6e63" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M18 48C24 44 40 44 46 48" stroke="#8d6e63" strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="24" r="2.5" fill="#bcaaa4" />
          </svg>
        );
    }
  };

  return <div className={`crop-illustration ${className}`} style={{ display: 'inline-flex' }}>{renderSvg()}</div>;
}

export default CropIllustration;
