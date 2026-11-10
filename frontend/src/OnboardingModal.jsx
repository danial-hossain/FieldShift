// frontend/src/OnboardingModal.jsx
// First-Run 3-Screen Onboarding Wizard for FieldShift 2026
// P6.1: What FieldShift does -> Select/Add Field -> See Advice.
// Remembers completion in localStorage with try/catch; skippable at any time.

import React, { useState } from 'react';
import {
  HomeIcon,
  FieldIcon,
  RotationIcon,
  CheckIcon,
  CloseIcon,
  ChevronRightIcon
} from './ui/index.js';

export function OnboardingModal({
  isOpen,
  onClose,
  lang = 'bn',
  onSelectDemoField = () => {},
  onNavigate = () => {}
}) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleFinish = () => {
    try {
      localStorage.setItem('fieldshift_onboarding_completed', 'true');
    } catch (_) {}
    onClose();
  };

  const steps = [
    {
      titleBn: '১. ফিল্ডশিফ্ট কীভাবে কাজ করে?',
      titleEn: '1. What FieldShift Does',
      subtitleBn: 'নাসার উপগ্রহ তথ্য ও বৈজ্ঞানিক কৃষি আবর্তন',
      subtitleEn: 'NASA Earth Observations & Agronomic Crop Planning',
      icon: <RotationIcon size={36} className="text-emerald-400" />,
      contentBn: (
        <div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main, #e8ece9)', marginBottom: 16 }}>
            জলবায়ু পরিবর্তনের কারণে বাংলাদেশে বর্ষার বৃষ্টিপাতের সময় পরিবর্তিত হচ্ছে। ফিল্ডশিফ্ট নাসার <strong>POWER</strong>, <strong>GPM IMERG</strong>, <strong>SMAP</strong> এবং <strong>GRACE</strong> উপগ্রহ তথ্যের ২৫ বছরের ঐতিহাসিক বিশ্লেষণের মাধ্যমে আপনার জমির জন্য লাভজনক ও টেকসই শস্য আবর্তন পরিকল্পনা তৈরি করে।
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>সত্যিকারের উপগ্রহ তথ্য</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>কোনো কাল্পনিক সংখ্যা নয়, ৬৪ জেলার বাস্তব বৃষ্টি ও অনসেট শিফট।</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#38bdf8' }}>সেচ ও ভূগর্ভস্থ পানি সাশ্রয়</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>অতিরিক্ত ভূগর্ভস্থ পানি উত্তোলন কমিয়ে বিকল্প লাভজনক ফসল।</div>
            </div>
          </div>
        </div>
      ),
      contentEn: (
        <div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main, #e8ece9)', marginBottom: 16 }}>
            Monsoon onset and climate patterns are shifting across Bangladesh. FieldShift uses 25 years of NASA <strong>POWER</strong>, <strong>GPM IMERG</strong>, <strong>SMAP</strong>, and <strong>GRACE</strong> Earth observations to generate resilient, multi-season crop rotation plans tailored to your exact plot.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>Honest NASA Telemetry</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Calibrated precipitation and onset shifts across all 64 districts.</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#38bdf8' }}>Water Conservation</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Preserve aquifers with FAO-56 dual crop coefficient water budgets.</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      titleBn: '২. আপনার জমি নির্বাচন করুন',
      titleEn: '2. Select or Add Your Field',
      subtitleBn: 'বাংলাদেশের যে-কোনো অঞ্চল নির্বাচন করুন',
      subtitleEn: 'Choose from 4 benchmark regions or add your parcel',
      icon: <FieldIcon size={36} className="text-sky-400" />,
      contentBn: (
        <div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main, #e8ece9)', marginBottom: 16 }}>
            ফিল্ডশিফ্ট বাংলাদেশের মাটির গঠন ও আঞ্চলিক জলবায়ুর বৈচিত্র্য অনুযায়ী স্বয়ংক্রিয়ভাবে খাপ খাইয়ে নেয়। শুরু করতে নিচের যে-কোনো একটি পরীক্ষিত অঞ্চল বেছে নিন:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <button
              type="button"
              onClick={() => { onSelectDemoField('rajshahi'); handleFinish(); }}
              style={{ background: 'rgba(0, 223, 129, 0.08)', border: '1.5px solid var(--primary)', borderRadius: 8, padding: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              <strong style={{ color: 'var(--primary)', fontSize: 13, display: 'block' }}>রাজশাহী বরেন্দ্র অঞ্চল</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>খরাপ্রবণ, গ্রেস ভূগর্ভস্থ পানি হ্রাস, সরিষা-ডাল আবর্তন</span>
            </button>
            <button
              type="button"
              onClick={() => { onSelectDemoField('sunamganj'); handleFinish(); }}
              style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1.5px solid #38bdf8', borderRadius: 8, padding: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              <strong style={{ color: '#38bdf8', fontSize: 13, display: 'block' }}>সুনামগঞ্জ হাওর অববাহিকা</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>মৌসুমি বন্যা, খরিফ পতিত, লাভজনক বোরো ধান চাষ</span>
            </button>
            <button
              type="button"
              onClick={() => { onSelectDemoField('satkhira'); handleFinish(); }}
              style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1.5px solid #eab308', borderRadius: 8, padding: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              <strong style={{ color: '#eab308', fontSize: 13, display: 'block' }}>সাতক্ষীরা উপকূলীয় অঞ্চল</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>শীতকালীন লবণাক্ততা, লবণ-সহনশীল সূর্যমুখী ও সয়াবিন</span>
            </button>
            <button
              type="button"
              onClick={() => { onSelectDemoField('dinajpur'); handleFinish(); }}
              style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1.5px solid #a855f7', borderRadius: 8, padding: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              <strong style={{ color: '#a855f7', fontSize: 13, display: 'block' }}>দিনাজপুর পাদদেশীয় সমভূমি</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>শীতল শীতকাল, উচ্চ ফলনশীল গম ও ভুট্টা আবর্তন</span>
            </button>
          </div>
        </div>
      ),
      contentEn: (
        <div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main, #e8ece9)', marginBottom: 16 }}>
            FieldShift dynamically adapts its recommendations to regional soil texture and hydrology. Click any test region below to explore:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <button
              type="button"
              onClick={() => { onSelectDemoField('rajshahi'); handleFinish(); }}
              style={{ background: 'rgba(0, 223, 129, 0.08)', border: '1.5px solid var(--primary)', borderRadius: 8, padding: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              <strong style={{ color: 'var(--primary)', fontSize: 13, display: 'block' }}>Rajshahi Barind Terrace</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Drought-prone terrace, GRACE depletion, Mustard rotation</span>
            </button>
            <button
              type="button"
              onClick={() => { onSelectDemoField('sunamganj'); handleFinish(); }}
              style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1.5px solid #38bdf8', borderRadius: 8, padding: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              <strong style={{ color: '#38bdf8', fontSize: 13, display: 'block' }}>Sunamganj Haor Basin</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Deep monsoon flooding, flood-fallow, high-margin Boro</span>
            </button>
            <button
              type="button"
              onClick={() => { onSelectDemoField('satkhira'); handleFinish(); }}
              style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1.5px solid #eab308', borderRadius: 8, padding: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              <strong style={{ color: '#eab308', fontSize: 13, display: 'block' }}>Satkhira Coastal Belt</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Dry-season soil salinity, salt-tolerant Sunflower & Soybean</span>
            </button>
            <button
              type="button"
              onClick={() => { onSelectDemoField('dinajpur'); handleFinish(); }}
              style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1.5px solid #a855f7', borderRadius: 8, padding: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              <strong style={{ color: '#a855f7', fontSize: 13, display: 'block' }}>Dinajpur Piedmont Plain</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cold winter spells, high-yielding Wheat & Maize rotation</span>
            </button>
          </div>
        </div>
      ),
    },
    {
      titleBn: '৩. পরামর্শ বুঝুন ও বাস্তবায়ন করুন',
      titleEn: '3. Understand & Implement Your Advice',
      subtitleBn: 'কৃষক ও বিচারকদের জন্য সহজে বোধগম্য ফলাফল',
      subtitleEn: 'Plain-language answer, key KPI tiles, and AI decision support',
      icon: <HomeIcon size={36} className="text-amber-400" />,
      contentBn: (
        <div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main, #e8ece9)', marginBottom: 14 }}>
            ফিল্ডশিফ্ট প্রতিটি পেজে প্রথমেই সিদ্ধান্ত জানিয়ে দেয়:
          </p>
          <div style={{ background: 'rgba(0, 223, 129, 0.08)', border: '1px solid rgba(0, 223, 129, 0.25)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary)', marginBottom: 4 }}>সিদ্ধান্ত বাক্য (Answer-First Header)</div>
            <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.5 }}>
              "আপনার জমিতে বর্তমান বোরো-পতিত-আমন এর বদলে সরিষা-বোরো-আমন করলে বছরে ~৩২০ মিমি সেচ সাশ্রয় ও অতিরিক্ত লাভ হবে।"
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            আপনি সরাসরি <strong>AI কৃষি পরামর্শক</strong> এর সাথে কথা বলে যেকোনো বিশ্লেষণ যাচাই করতে পারেন এবং স্থানীয় SAAO-র পরামর্শ নিয়ে প্রয়োগ করতে পারেন।
          </p>
        </div>
      ),
      contentEn: (
        <div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main, #e8ece9)', marginBottom: 14 }}>
            FieldShift leads with the recommendation on every page:
          </p>
          <div style={{ background: 'rgba(0, 223, 129, 0.08)', border: '1px solid rgba(0, 223, 129, 0.25)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary)', marginBottom: 4 }}>Answer-First Headline</div>
            <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.5 }}>
              "Switching from conventional rotation to Mustard-Boro-Aman saves ~320 mm irrigation water and increases annual profit."
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            You can interact with the <strong>AI Agronomist Assistant</strong> to evaluate recommendations and verify implementation details with your local SAAO.
          </p>
        </div>
      ),
    }
  ];

  const current = steps[currentStep];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 11, 16, 0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleFinish(); }}
    >
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: 'var(--bg-card, #161d23)',
        border: '1.5px solid var(--border-medium, #2a3742)',
        borderRadius: 'var(--radius-lg, 16px)',
        boxShadow: 'var(--shadow-elevation-2, 0 16px 40px rgba(0,0,0,0.65))',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with step indicator & close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: idx === currentStep ? 'var(--primary, #00df81)' : (idx < currentStep ? '#059669' : 'rgba(255,255,255,0.15)'),
                  transition: 'all 200ms ease'
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="modal-close-btn"
            aria-label="Skip onboarding"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Step Body */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
            {current.icon}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main, #e8ece9)' }}>
              {lang === 'bn' ? current.titleBn : current.titleEn}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #9aa5a0)' }}>
              {lang === 'bn' ? current.subtitleBn : current.subtitleEn}
            </span>
          </div>
        </div>

        <div style={{ minHeight: '220px', marginBottom: 24 }}>
          {lang === 'bn' ? current.contentBn : current.contentEn}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light, #222c36)', paddingTop: 16 }}>
          <button
            type="button"
            onClick={handleFinish}
            className="ui-btn ui-btn-ghost ui-btn-sm"
          >
            {lang === 'bn' ? 'বাদ দিন' : 'Skip Tour'}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="ui-btn ui-btn-secondary ui-btn-md"
              >
                {lang === 'bn' ? 'পূর্ববর্তী' : 'Back'}
              </button>
            )}

            {currentStep < 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="ui-btn ui-btn-primary ui-btn-md"
              >
                <span>{lang === 'bn' ? 'পরবর্তী' : 'Next'}</span>
                <ChevronRightIcon size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="ui-btn ui-btn-primary ui-btn-md"
              >
                <CheckIcon size={16} />
                <span>{lang === 'bn' ? 'শুরু করুন' : 'Get Started'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
