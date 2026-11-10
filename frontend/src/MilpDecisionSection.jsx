// frontend/src/MilpDecisionSection.jsx
// Section "সিদ্ধান্ত কীভাবে হয় (MILP)": Compact 4-step strip + 4 strategy weights note.
// Matches docs/evidence_layout_reference.html closely.

import React from 'react';

export function MilpDecisionSection({
  lang = 'bn',
  onNavigate = null,
}) {
  const isBn = lang === 'bn';

  const STEPS = [
    {
      numBn: '১ · বিকল্প',
      numEn: '1 · Options',
      descBn: 'প্রতিটা মৌসুমে কোন কোন ফসল সম্ভব (রবি/খরিফ-১/খরিফ-২-এর নিয়ম মেনে)',
      descEn: 'All feasible crop options per season respecting Rabi, Kharif-1, and Kharif-2 agronomic calendars',
    },
    {
      numBn: '২ · স্কোর',
      numEn: '2 · Scores',
      descBn: 'ফলন (FAO-33), পানির চাহিদা (FAO-56), মাটি (ডালে N, খালি দিন), লাভ (দাম)',
      descEn: 'Yield potential (FAO-33), water deficit (FAO-56 PM), soil N credit & bare days, net profit',
    },
    {
      numBn: '৩ · বাছাই',
      numEn: '3 · Selection',
      descBn: 'সব মিলিয়ে সর্বোচ্চ ওজনদার স্কোর: max Σ w·(লাভ, −পানি, মাটি)',
      descEn: 'Multi-objective integer linear programming: max Σ w · (profit, −water, soil)',
    },
    {
      numBn: '৪ · নিয়ম',
      numEn: '4 · Constraints',
      descBn: 'এক মৌসুমে এক ফসল · ডাল ফসলের ফাঁক · একই পরিবার পরপর নয় · সেচ সুবিধার সীমা · বিক্রি-অযোগ্য ফসল বাদ',
      descEn: '1 crop/season · legume interval · family succession break · irrigation capacity limit · unsellable crops excluded',
    },
  ];

  return (
    <section
      className="card"
      style={{
        background: 'var(--surface, #121a17)',
        border: '1px solid var(--line, #243029)',
        borderRadius: 16,
        padding: '12px 18px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <h2
          style={{
            fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--fg, #e7efe8)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>🧮</span>
          <span>{isBn ? 'সিদ্ধান্ত কীভাবে হয় (MILP)' : 'How Decisions Are Made (MILP)'}</span>
        </h2>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('farm_planning')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--lime, #C8F169)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            {isBn ? 'প্ল্যানারে দেখুন ➔' : 'View in Planner ➔'}
          </button>
        )}
      </div>

      <div
        className="muted"
        style={{
          color: 'var(--muted, #93a597)',
          fontSize: 13,
          lineHeight: 1.5,
          marginBottom: 10,
        }}
      >
        {isBn
          ? 'PuLP Mixed-Integer Linear Programming — ৬ মৌসুমের সবচেয়ে ভালো ফসল-সারি একসাথে খোঁজে।'
          : 'PuLP Mixed-Integer Linear Programming — Simultaneously solves the optimal 6-season rotation sequence.'}
      </div>

      {/* 4 Steps in One Row */}
      <div
        className="steps"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
          marginTop: 10,
        }}
      >
        {STEPS.map((s, idx) => (
          <div
            key={idx}
            className="stp"
            style={{
              background: 'var(--surface-2, #18221c)',
              borderRadius: 14,
              padding: '12px 14px',
              border: '1px solid var(--line, #243029)',
            }}
          >
            <div
              className="n"
              style={{
                fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
                color: 'var(--lime, #C8F169)',
                fontWeight: 700,
                fontSize: 13.5,
                marginBottom: 4,
              }}
            >
              {isBn ? s.numBn : s.numEn}
            </div>
            <div style={{ fontSize: 12.5, color: '#e7efe8', lineHeight: 1.45 }}>
              {isBn ? s.descBn : s.descEn}
            </div>
          </div>
        ))}
      </div>

      <p
        className="note"
        style={{
          margin: '10px 0 0',
          fontSize: 12,
          color: 'var(--faint, #7f9186)',
          lineHeight: 1.4,
        }}
      >
        {isBn
          ? '৪ কৌশল = ৪ সেট ওজন (সুষম ৩৪/৩৩/৩৩, লাভ ৬০/২০/২০, পানি সাশ্রয় ২০/৬০/২০, মাটির স্বাস্থ্য ২০/২০/৬০); কোড থেকে সরাসরি প্রযোজ্য।'
          : '4 Strategies = 4 real weight sets (Balanced 34/33/33, Profit 60/20/20, Water Saving 20/60/20, Soil Health 20/20/60); computed directly via src/optimizer/strategies.py.'}
      </p>
    </section>
  );
}

export default MilpDecisionSection;
