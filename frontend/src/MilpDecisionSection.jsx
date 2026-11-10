// frontend/src/MilpDecisionSection.jsx
// Section "সিদ্ধান্ত কীভাবে হয়": Plain-words explanation of the 6-Season MILP Rotation Optimizer.
// 4-step strip, objective formula, mathematical weights, agronomic rules list, and link to Planner.

import React from 'react';

export function MilpDecisionSection({
  lang = 'bn',
  onNavigate = null,
}) {
  const isBn = lang === 'bn';

  const STRATEGIES = [
    {
      id: 'balanced',
      nameBn: 'ভারসাম্য',
      nameEn: 'Balanced',
      weightsBn: { profit: '৩৪%', water: '৩৩%', soil: '৩৩%' },
      weightsEn: { profit: '34%', water: '33%', soil: '33%' },
      rawWeights: '(0.34, 0.33, 0.33)',
      descBn: 'লাভ, পানি সাশ্রয় ও মাটির নাইট্রোজেনের সমান অগ্রাধিকার।',
      descEn: 'Equal trade-off across profit, water savings, and soil nitrogen preservation.',
      color: '#10b981',
    },
    {
      id: 'profit',
      nameBn: 'সর্বোচ্চ লাভ',
      nameEn: 'Maximum Profit',
      weightsBn: { profit: '৬০%', water: '২০%', soil: '২০%' },
      weightsEn: { profit: '60%', water: '20%', soil: '20%' },
      rawWeights: '(0.60, 0.20, 0.20)',
      descBn: 'বাজারমূল্য ও নিট আয়ের সর্বোচ্চকরণ (উচ্চমূল্যের তেলবীজ ও ডাল)।',
      descEn: 'Maximizes net financial margin using high-value oilseeds and pulses.',
      color: '#eab308',
    },
    {
      id: 'water',
      nameBn: 'পানি সাশ্রয়',
      nameEn: 'Water Saving',
      weightsBn: { profit: '২০%', water: '৬০%', soil: '২০%' },
      weightsEn: { profit: '20%', water: '60%', soil: '20%' },
      rawWeights: '(0.20, 0.60, 0.20)',
      descBn: 'সেচ পানির সর্বনিম্ন ব্যবহার (বোরো কমিয়ে রবিতে সরিষা ও খরিফে মুগডাল)।',
      descEn: 'Minimizes seasonal irrigation pumping; eliminates groundwater-intensive monoculture.',
      color: '#06b6d4',
    },
    {
      id: 'soil',
      nameBn: 'মাটির স্বাস্থ্য',
      nameEn: 'Soil Health',
      weightsBn: { profit: '২০%', water: '২০%', soil: '৬০%' },
      weightsEn: { profit: '20%', water: '20%', soil: '60%' },
      rawWeights: '(0.20, 0.20, 0.60)',
      descBn: 'জৈব নাইট্রোজেন সংযোজন ও কম পতিত দিন নিশ্চিতকরণ।',
      descEn: 'Maximizes biological nitrogen fixation and minimizes bare fallow exposure days.',
      color: '#8b5cf6',
    },
  ];

  const RULES = [
    {
      numBn: '১',
      numEn: '1',
      titleBn: 'প্রতি মৌসুমে সর্বোচ্চ ১টি ফসল',
      titleEn: '1 Crop per Season',
      ruleBn: 'বছরের ৩টি মৌলিক মৌসুমে (রবি, খরিফ-১, খরিফ-২) জমিতে হয় ১টি ফসল থাকবে নতুবা জমি ফাঁকা (পতিত) থাকবে। একই জমিতে একসাথে দুটো প্রধান ফসল বসানো যাবে না।',
      ruleEn: 'Exactly one crop or planned fallow per seasonal window; no overlapping double cropping on the same parcel.',
    },
    {
      numBn: '২',
      numEn: '2',
      titleBn: 'একই বোটানিক্যাল পরিবারের পুনরাবৃত্তি নিষিদ্ধ',
      titleEn: 'No Same Family in Succession',
      ruleBn: 'একই পরিবারের ফসল (যেমন ধান ➔ ধান, কিংবা সরিষা ➔ সরিষা) পর পর দুই মৌসুমে চাষ করা যাবে না। এতে মাটিতে ক্ষতিকারক পোকা ও রোগজীবাণুর বিস্তার বন্ধ হয়।',
      ruleEn: 'Consecutive planting of the same botanical family (e.g., Poaceae ➔ Poaceae) is strictly prohibited to break pest cycles.',
    },
    {
      numBn: '৩',
      numEn: '3',
      titleBn: 'ডালজাতীয় ফসলের আবশ্যিক বিরতি (Legume Interval)',
      titleEn: 'Legume Interval Requirement',
      ruleBn: 'মাটিতে প্রাকৃতিক নাইট্রোজেন সংযোজন ও মাটির স্বাস্থ্য রক্ষায় বছরে অন্তত একবার বা চক্রে ন্যূনতম বিরতিতে ডালজাতীয় ফসল (মুগ, ছোলা, মসুর) অন্তর্ভুক্ত করা বাধ্যতামূলক।',
      ruleEn: 'Leguminous nitrogen-fixing crops (Mungbean, Chickpea, Lentil) must be rotated at mandatory intervals.',
    },
    {
      numBn: '৪',
      numEn: '4',
      titleBn: 'খামারের সেচ সুবিধার সীমার মধ্যে সেচ সীমাবদ্ধ',
      titleEn: 'Irrigation Capacity Envelope',
      ruleBn: 'কৃষকের সেচ সুবিধা "সীমিত" বা "নেই" হলে কোনো মৌসুমেই ফসলের পানির চাহিদা খামারের সর্বোচ্চ সেচ সক্ষমতা (মিমি) অতিক্রম করতে পারবে না।',
      ruleEn: 'Total seasonal irrigation demand cannot exceed the field\'s designated pumping capacity (adequate, limited, none).',
    },
    {
      numBn: '৫',
      numEn: '5',
      titleBn: 'বিক্রি করতে পারি না এমন ফসল স্বয়ংক্রিয়ভাবে বাদ',
      titleEn: 'Non-Marketable Crops Excluded',
      ruleBn: 'যেসব ফসল কৃষক বাজারে বিক্রি করতে পারেন না বা চাষে অপারগ (যেমন এলাকায় কোল্ড স্টোরেজ না থাকলে আলু), তা MILP অপ্টিমাইজার আগেই বাদ দিয়ে সমাধান খোঁজে।',
      ruleEn: 'Crops marked as unmarketable or excluded by the farmer are pruned from the decision space prior to solving.',
    },
    {
      numBn: '৬',
      numEn: '6',
      titleBn: 'পাওয়ার টিলার না থাকলে আলু বাদ (Manual Labor)',
      titleEn: 'No Power Tiller Exclusion',
      ruleBn: 'কৃষকের পাওয়ার টিলার বা আধুনিক চাষযন্ত্র না থাকলে অতিরিক্ত মাটি খনন প্রয়োজন এমন ফসল (যেমন আলু) স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়।',
      ruleEn: 'If mechanization (power tiller) is unavailable, labor-intensive root crops like Potato are automatically excluded.',
    },
  ];

  return (
    <section className="milp-decision-section" style={{ marginBottom: 36 }}>
      {/* Section Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>🧠</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {isBn ? 'সিদ্ধান্ত কীভাবে হয়: MILP অ্যালগরিদম' : 'How Decisions Are Made: The MILP Optimization Engine'}
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            PuLP / CBC Solver
          </span>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
          {isBn
            ? 'ফিল্ডশিফট কৃত্রিম আন্দাজ বা স্থির কোনো তালিকা চাপিয়ে দেয় না। মিক্সড ইন্টিজার লিনিয়ার প্রোগ্রামিং (MILP) গাণিতিকভাবে প্রতিটি নিয়মের ভেতরে থেকে সেরা ৬ মৌসুম বেছে নেয়।'
            : 'FieldShift imposes no arbitrary guesses. A deterministic Mixed Integer Linear Programming (MILP) solver evaluates millions of combinations to find the exact global optimum.'}
        </p>
      </div>

      {/* 4-Step Process Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="dash-card" style={{ padding: '16px', background: 'var(--glass-strong)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 18, color: '#38bdf8', fontWeight: 800, marginBottom: 4 }}>
            {isBn ? 'ধাপ ১' : 'Step 1'}
          </div>
          <strong style={{ fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 4 }}>
            {isBn ? 'ফসল ও মৌসুম ম্যাট্রিক্স' : 'Crop × Season Options'}
          </strong>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
            {isBn ? 'প্রতি মৌসুমে অনুমোদিত ফসলের তালিকা তৈরি (রবি, খরিফ-১, খরিফ-২)।' : 'Generates valid candidate crops for each seasonal climatic window.'}
          </p>
        </div>

        <div className="dash-card" style={{ padding: '16px', background: 'var(--glass-strong)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 18, color: '#06b6d4', fontWeight: 800, marginBottom: 4 }}>
            {isBn ? 'ধাপ ২' : 'Step 2'}
          </div>
          <strong style={{ fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 4 }}>
            {isBn ? '৪টি মানদণ্ডে স্কোর নির্ণয়' : 'Multi-Metric Scoring'}
          </strong>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
            {isBn ? 'ফলন (FAO-33), সেচ চাহিদা (FAO-56), মাটির নাইট্রোজেন ও লাভ।' : 'Yield (FAO-33), net irrigation (FAO-56), soil N, and revenue/cost.'}
          </p>
        </div>

        <div className="dash-card" style={{ padding: '16px', background: 'var(--glass-strong)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 18, color: '#10b981', fontWeight: 800, marginBottom: 4 }}>
            {isBn ? 'ধাপ ৩' : 'Step 3'}
          </div>
          <strong style={{ fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 4 }}>
            {isBn ? 'MILP সমাধান ও নির্বাচন' : 'Global Score Optimization'}
          </strong>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
            {isBn ? '৬টি মৌসুমের সেরা ফসলের কম্বিনেশন গাণিতিকভাবে খুঁজে বের করা।' : 'Branch-and-cut CBC solver picks 6 seasons maximizing weighted utility.'}
          </p>
        </div>

        <div className="dash-card" style={{ padding: '16px', background: 'var(--glass-strong)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 18, color: '#f59e0b', fontWeight: 800, marginBottom: 4 }}>
            {isBn ? 'ধাপ ৪' : 'Step 4'}
          </div>
          <strong style={{ fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 4 }}>
            {isBn ? 'বাধ্যতামূলক নিয়ম যাচাই' : 'Strict Agronomic Constraints'}
          </strong>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
            {isBn ? 'পরিবার পুনরাবৃত্তি না হওয়া, ডাল বিরতি ও সেচ সীমার শতভাগ রক্ষা।' : 'Guarantees rotation intervals, legume biological N, and water limits.'}
          </p>
        </div>
      </div>

      {/* Objective Formula in Plain Words */}
      <div
        className="dash-card"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>📐</span>
          <strong style={{ fontSize: 14.5, color: '#34d399' }}>
            {isBn ? 'MILP অবজেক্টিভ ফাংশন (গাণিতিক সূত্র ও অর্থ)' : 'MILP Objective Function & Mathematical Formulation'}
          </strong>
        </div>

        {/* Formula Box */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            padding: '12px 16px',
            fontFamily: 'monospace',
            fontSize: 13.5,
            color: '#f8fafc',
            marginBottom: 12,
            overflowX: 'auto',
          }}
        >
          <code>Maximize Z = ∑ (Season s=1..6) ∑ (Crop c) [ x_{'{c,s}'} × ( w_profit × Profit_c + w_water × (1 - Water_c) + w_soil × Soil_c ) ]</code>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
          {isBn
            ? 'সহজ কথায়: সিদ্ধান্ত চলক x_{c,s} এর মান হয় ১ (ফসল লাগানো হবে) নতুবা ০। অ্যালগরিদম এমন একটি ৬ মৌসুমের ধারা নির্বাচন করে যাতে কৃষকের বাছাই করা গুরুত্বের (Weights) ভিত্তিতে মোট লাভ, পানি সাশ্রয় ও মাটির স্কোর সর্বোচ্চ হয়, কিন্তু কোনো বৈজ্ঞানিক বা পারিবারিক নিয়ম ভঙ্গ না হয়।'
            : 'Plain English: Decision variable x_{c,s} is binary {0, 1}. The solver picks a 6-season sequence that maximizes weighted normalized profit, water efficiency (1 - water requirement), and soil organic residue, strictly bounded by the physical and agronomic constraint envelope.'}
        </p>
      </div>

      {/* 4 Strategy Weight Sets */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          {isBn ? '৪টি কৌশল = ৪টি সুনির্দিষ্ট গাণিতিক ওজনের সেট (কোড থেকে সরাসরি)' : 'The 4 Strategies = 4 Exact Mathematical Weight Vectors (src/optimizer/milp.py)'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {STRATEGIES.map((s) => (
            <div
              key={s.id}
              className="dash-card"
              style={{
                background: 'var(--glass-strong)',
                border: `1px solid ${s.color}35`,
                borderRadius: 12,
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 14, color: s.color }}>{isBn ? s.nameBn : s.nameEn}</strong>
                <code style={{ fontSize: 11, color: '#94a3b8' }}>{s.rawWeights}</code>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 11.5 }}>
                <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', padding: '2px 6px', borderRadius: 4 }}>
                  {isBn ? 'লাভ:' : 'Profit:'} {isBn ? s.weightsBn.profit : s.weightsEn.profit}
                </span>
                <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', padding: '2px 6px', borderRadius: 4 }}>
                  {isBn ? 'পানি:' : 'Water:'} {isBn ? s.weightsBn.water : s.weightsEn.water}
                </span>
                <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '2px 6px', borderRadius: 4 }}>
                  {isBn ? 'মাটি:' : 'Soil:'} {isBn ? s.weightsBn.soil : s.weightsEn.soil}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
                {isBn ? s.descBn : s.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Rules List in Plain Bangla */}
      <div
        className="dash-card"
        style={{
          background: 'var(--glass-strong)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {isBn ? 'MILP অপ্টিমাইজার যে ৬টি নিয়ম মানতে বাধ্য' : '6 Invariable Agronomic Constraints Enforced by MILP'}
          </h3>
          <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
            {isBn ? '✓ কোডে বাস্তবায়িত ও পরীক্ষিত' : '✓ Implemented & Pytested'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {RULES.map((r) => (
            <div
              key={r.numEn}
              style={{
                display: 'flex',
                gap: 12,
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {isBn ? r.numBn : r.numEn}
              </div>
              <div>
                <strong style={{ fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 3 }}>
                  {isBn ? r.titleBn : r.titleEn}
                </strong>
                <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.45 }}>
                  {isBn ? r.ruleBn : r.ruleEn}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Link to Planner */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('farm_planning')}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: onNavigate ? 'pointer' : 'default',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            <span>{isBn ? 'প্ল্যানারে এই কৌশলগুলো দেখুন ➔' : 'View These Strategies in the Planner ➔'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default MilpDecisionSection;
