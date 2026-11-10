// frontend/src/AdaptiveLearningSection.jsx
// Section "মাঠ থেকে শেখা": Compact 4-step loop + honest synthetic Q-learning box.
// Matches docs/evidence_layout_reference.html closely.

import React from 'react';

export function AdaptiveLearningSection({
  lang = 'bn',
}) {
  const isBn = lang === 'bn';

  return (
    <section
      className="card"
      style={{
        background: 'var(--surface, #121a17)',
        border: '1px solid var(--line, #243029)',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--fg, #e7efe8)',
            margin: '0 0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>🔁</span>
          <span>{isBn ? 'মাঠ থেকে শেখা' : 'Learning from Harvest'}</span>
        </h2>
        <div
          className="muted"
          style={{
            color: 'var(--muted, #93a597)',
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 10,
          }}
        >
          {isBn ? 'RL-অনুপ্রাণিত অভিযোজিত শেখা' : 'RL-Inspired Adaptive Feedback Learning'}
        </div>

        {/* 4-Step Loop Strip */}
        <div
          className="loop"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
            marginTop: 10,
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <span
            style={{
              background: 'var(--surface-2, #18221c)',
              border: '1px solid var(--line, #243029)',
              borderRadius: 99,
              padding: '5px 11px',
              color: '#e7efe8',
            }}
          >
            {isBn ? 'কাজ: কী লাগালেন' : 'Action: Crop Planted'}
          </span>
          <em style={{ fontStyle: 'normal', color: 'var(--lime, #C8F169)', fontWeight: 700 }}>→</em>
          <span
            style={{
              background: 'var(--surface-2, #18221c)',
              border: '1px solid var(--line, #243029)',
              borderRadius: 99,
              padding: '5px 11px',
              color: '#e7efe8',
            }}
          >
            {isBn ? 'পুরস্কার: আসল ফলন × দাম' : 'Reward: Harvest Yield × Price'}
          </span>
          <em style={{ fontStyle: 'normal', color: 'var(--lime, #C8F169)', fontWeight: 700 }}>→</em>
          <span
            style={{
              background: 'var(--surface-2, #18221c)',
              border: '1px solid var(--line, #243029)',
              borderRadius: 99,
              padding: '5px 11px',
              color: '#e7efe8',
            }}
          >
            {isBn ? 'শেখা: ফসলের প্রত্যাশিত লাভ আপডেট' : 'Learn: Expected Margin Prior Updated'}
          </span>
          <em style={{ fontStyle: 'normal', color: 'var(--lime, #C8F169)', fontWeight: 700 }}>→</em>
          <span
            style={{
              background: 'var(--surface-2, #18221c)',
              border: '1px solid var(--line, #243029)',
              borderRadius: 99,
              padding: '5px 11px',
              color: '#e7efe8',
            }}
          >
            {isBn ? 'নতুন সিদ্ধান্ত: MILP বাকি মৌসুম' : 'New Plan: MILP Re-optimizes Future Seasons'}
          </span>
        </div>
      </div>

      {/* Honest Synthetic Q-Learning Box */}
      <div
        className="q"
        style={{
          marginTop: 14,
          border: '1px dashed rgba(180, 156, 255, 0.5)',
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 12.5,
          color: '#d6ccff',
          lineHeight: 1.45,
          background: 'rgba(180, 156, 255, 0.05)',
        }}
      >
        <span>🧪 </span>
        <span>
          {isBn
            ? 'পরীক্ষামূলক Q-learning: কৃত্রিম পরিবেশে প্রশিক্ষিত ('
            : 'Experimental Q-learning: Trained in synthetic simulation ('}
        </span>
        <code style={{ color: '#9fd8ff', fontSize: 11.5 }}>src/rl/synthetic_q_learning.py</code>
        <span>
          {isBn
            ? ')। চূড়ান্ত পরামর্শ MILP দেয়।'
            : '). Production farm decisions are solved by MILP.'}
        </span>
      </div>
    </section>
  );
}

export default AdaptiveLearningSection;
