// frontend/src/MarketProfitView.jsx
import React from 'react';

export function MarketProfitView({ activeField, lang = 'bn', onNavigateTab }) {
  return (
    <div className="market-profit-view" style={{ padding: '16px 20px', maxWidth: 1320, margin: '0 auto' }}>
      <h1>{lang === 'bn' ? 'বাজার ও লাভ' : 'Market & Profit'}</h1>
    </div>
  );
}

export default MarketProfitView;
