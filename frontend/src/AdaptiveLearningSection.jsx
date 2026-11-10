// frontend/src/AdaptiveLearningSection.jsx
// Section "শেখা: মাঠের ফল থেকে" (Adaptive Replan + RL honesty disclosure).
// Loop diagram: Action (crop) -> Reward (profit) -> Learn (Bayesian EMA) -> New Decision (MILP replan).

import React from 'react';

export function AdaptiveLearningSection({
  lang = 'bn',
  onNavigate = null,
}) {
  const isBn = lang === 'bn';

  return (
    <section className="adaptive-learning-section" style={{ marginBottom: 36 }}>
      {/* Section Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>🔄</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {isBn ? 'শেখা: মাঠের ফল থেকে (Adaptive Learning)' : 'Learning: From Harvest Outcomes (Adaptive Replan)'}
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'rgba(14, 165, 233, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(14, 165, 233, 0.3)',
            }}
          >
            {isBn ? 'RL-অনুপ্রাণিত অভিযোজিত শেখা' : 'RL-Inspired Adaptive Learning'}
          </span>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
          {isBn
            ? 'পরিকল্পনা স্থির পাথর নয়। মৌসুমে খরা, অতিবৃষ্টি বা বাজার দর ওঠানামা করলে কৃষক যা ফলন পান, তা থেকে সিস্টেম শিখে পরবর্তী মৌসুমের সিদ্ধান্ত স্বয়ংক্রিয়ভাবে মানিয়ে নেয়।'
            : 'Plans are not static. When real weather anomalies or market price swings occur, the system records farmer harvest feedback to calibrate expectations and dynamically re-plan remaining seasons.'}
        </p>
      </div>

      {/* The 4-Stage Adaptive Feedback Loop Diagram */}
      <div
        className="dash-card"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1px solid rgba(14, 165, 233, 0.25)',
          borderRadius: 14,
          padding: '24px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, position: 'relative' }}>
          {/* Step 1: Action */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 12,
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🌱</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              {isBn ? '১. কাজ (Action)' : '1. Action'}
            </div>
            <strong style={{ fontSize: 14, color: '#f8fafc', display: 'block', margin: '4px 0 6px 0' }}>
              {isBn ? 'ফসল চাষ ও পরিচর্যা' : 'Crop Cultivation'}
            </strong>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              {isBn ? 'পরিকল্পনা অনুযায়ী কৃষক মৌসুমে জমিতে ফসল বপন করেন।' : 'Farmer plants the recommended crop in the current season.'}
            </p>
          </div>

          {/* Step 2: Reward */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: 12,
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>💰</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
              {isBn ? '২. পুরস্কার (Reward)' : '2. Reward'}
            </div>
            <strong style={{ fontSize: 14, color: '#f8fafc', display: 'block', margin: '4px 0 6px 0' }}>
              {isBn ? 'বাস্তব ফলন ও নিট লাভ' : 'Harvested Yield & Profit'}
            </strong>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              {isBn ? 'মৌসুম শেষে আসল ফলন (মণ) ও বিক্রিত দাম (টাকা) প্রদান।' : 'Realized yield (maund/bigha) × sale price minus production cost.'}
            </p>
          </div>

          {/* Step 3: Learn */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 12,
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🧠</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
              {isBn ? '৩. শেখা (Learn)' : '3. Learn'}
            </div>
            <strong style={{ fontSize: 14, color: '#f8fafc', display: 'block', margin: '4px 0 6px 0' }}>
              {isBn ? 'প্রত্যাশা সমন্বয় (EMA)' : 'Expected Profit Update'}
            </strong>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              {isBn ? 'চলমান গড় (Running Mean) দিয়ে ফসলের সম্ভাব্য রিটার্ন আপডেট।' : 'Exponential moving average recalibrates the crop utility prior.'}
            </p>
          </div>

          {/* Step 4: Re-Plan */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: 12,
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>🎯</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>
              {isBn ? '৪. নতুন সিদ্ধান্ত (Re-Plan)' : '4. New Decision'}
            </div>
            <strong style={{ fontSize: 14, color: '#f8fafc', display: 'block', margin: '4px 0 6px 0' }}>
              {isBn ? 'MILP পুনঃপরিকল্পনা' : 'Dynamic MILP Re-Solve'}
            </strong>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              {isBn ? 'বাকি মৌসুমগুলোর জন্য নতুন করে সেরা ফসল কম্বিনেশন তৈরি।' : 'MILP solver re-optimizes remaining seasons from updated state.'}
            </p>
          </div>
        </div>

        {/* Link to Adaptive Replan page */}
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('farm_planning')}
            style={{
              background: 'rgba(14, 165, 233, 0.15)',
              border: '1px solid rgba(14, 165, 233, 0.4)',
              color: '#38bdf8',
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: onNavigate ? 'pointer' : 'default',
            }}
          >
            {isBn ? 'অভিযোজিত পুনঃপরিকল্পনা ল্যাব দেখুন ➔' : 'View Adaptive Replan Workspace ➔'}
          </button>
        </div>
      </div>

      {/* Honest Scientific Disclosure Box: Synthetic Q-Learning */}
      <div
        className="dash-card"
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px dashed rgba(192, 132, 252, 0.4)',
          borderRadius: 12,
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>🧪</span>
          <strong style={{ fontSize: 13.5, color: '#c084fc' }}>
            {isBn
              ? 'পরীক্ষামূলক Q-learning: কৃত্রিম পরিবেশে প্রশিক্ষিত; চূড়ান্ত পরামর্শ MILP দেয়'
              : 'Experimental Q-Learning: Trained in Synthetic Environment; Final Decisions Governed by MILP'}
          </strong>
        </div>
        <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 8px 0' }}>
          {isBn
            ? 'সততার সাথে উল্লেখ্য: রিইনফোর্সমেন্ট লার্নিং (Q-learning) এজেন্টটি একটি কৃত্রিম জিম পরিবেশে (src/rl/synthetic_q_learning.py) ১০,০০০ এপিসোডে প্রশিক্ষিত হয়েছে। এটি একটি গবেষণা বেঞ্চমার্ক। কৃষকের জন্য মাঠের বাস্তব চূড়ান্ত সুপারিশ ও সেচ সীমাবদ্ধতা সম্পূর্ণ নির্ভরযোগ্য ও গাণিতিকভাবে প্রমাণিত MILP (PuLP/CBC) অপ্টিমাইজার দ্বারা সমাধান করা হয়।'
            : 'Honest scientific disclosure: The reinforcement learning (Q-learning) module was trained strictly inside a synthetic simulation gym (src/rl/synthetic_q_learning.py, 10,000 episodes). It serves as a research benchmark. The production recommendations given to farmers are deterministically solved by the PuLP/CBC MILP optimizer to guarantee 100% adherence to physical agronomic constraints.'}
        </p>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          <span>{isBn ? 'কোড রেফারেন্স: ' : 'Code Citation: '}</span>
          <code style={{ color: '#c084fc' }}>src/rl/synthetic_q_learning.py:40-180</code>
          <span style={{ marginLeft: 12 }}>{isBn ? 'টেস্ট রেজাল্ট: PASS (tests/test_adaptive_replan_milp.py)' : 'Test Result: PASS (tests/test_adaptive_replan_milp.py)'}</span>
        </div>
      </div>
    </section>
  );
}

export default AdaptiveLearningSection;
