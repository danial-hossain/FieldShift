import React, { useState, useEffect, useRef, useMemo } from 'react';
import { request } from './apiClient.js';
import { districtLabel, soilLabel } from './i18n.js';

export const PAGE_QUESTIONS = {
  dashboard: {
    en: [
      'How does FieldShift use NASA data?',
      'Why shift crops from Boro rice?',
      'Where is my farm located on map?'
    ],
    bn: [
      'নাসার উপাত্ত কীভাবে কাজ করে?',
      'বোরো ধানের বিকল্প কেন দরকার?',
      'মানচিত্রে আমার জমি কোথায়?'
    ]
  },
  field: {
    en: [
      'What is my field soil texture?',
      'How does parcel area affect profit?',
      'How do I add crop rotation history?'
    ],
    bn: [
      'আমার জমির মাটির গঠন কেমন?',
      'জমির আয়তন কীভাবে লাভে প্রভাব ফেলে?',
      'পূর্বের ফসলের ইতিহাস কীভাবে যোগ করব?'
    ]
  },
  crop_advice: {
    en: [
      'When is the optimal planting window?',
      'Is delayed monsoon onset expected?',
      'What temperature causes floret heat stress?'
    ],
    bn: [
      'ধান রোপণের সবচেয়ে ভালো সময় কখন?',
      'বর্ষা কি দেরিতে আসার সম্ভাবনা আছে?',
      'কত তাপমাত্রায় ধানের পরাগায়ন ব্যাহত হয়?'
    ]
  },
  weather: {
    en: [
      'When does the monsoon onset shift?',
      'Is groundwater dropping here?',
      'Which crop has heat risk?'
    ],
    bn: [
      'আমন বৃষ্টির শুরু কি পিছিয়ে যাচ্ছে?',
      'এখানে কি ভূগর্ভস্থ পানি নামছে?',
      'কোন ফসলে তাপপ্রবাহের ঝুঁকি বেশি?'
    ]
  },
  farm_planning: {
    en: [
      'Why is this rotation recommended?',
      'How much irrigation water is saved?',
      'What are the soil health benefits?'
    ],
    bn: [
      'এই আবর্তন কেন সেরা?',
      'কতটুকু সেচের পানি সাশ্রয় হবে?',
      'মাটির উর্বরতা কীভাবে বৃদ্ধি পাবে?'
    ]
  },
  water_irrigation: {
    en: [
      'What is my total irrigation water budget?',
      'When does peak water deficit occur?',
      'How do pulse crops save groundwater?'
    ],
    bn: [
      'পুরো মৌসুমে মোট কত সেচ লাগবে?',
      'কোন মাসে পানির ঘাটতি সবচেয়ে বেশি?',
      'ডাল ফসল কীভাবে ভূগর্ভস্থ পানি বাঁচায়?'
    ]
  },
  research: {
    en: [
      'What is the MILP objective score?',
      'How does Q-learning adapt to actual yield?',
      'What is the sensitivity to rainfall variations?'
    ],
    bn: [
      'MILP অপ্টিমাইজেশন স্কোর কীভাবে নির্ণীত?',
      'Q-learning বাস্তব ফলন থেকে কীভাবে শেখে?',
      'বৃষ্টির তারতম্যে আবর্তনে কী প্রভাব পড়ে?'
    ]
  },
  harvest_profit: {
    en: [
      'What is my break-even market price?',
      'Is mustard safer than boro?',
      'How much extra annual profit is projected?'
    ],
    bn: [
      'আমার ব্রেক-ইভেন বাজারদর কত?',
      'বোরোর চেয়ে সরিষা কতটা নিরাপদ?',
      'বার্ষিক কত টাকা বাড়তি লাভ হবে?'
    ]
  },
  data_evidence: {
    en: [
      'Which NASA satellites are used?',
      'Is SoilGrids 250m depth-standardized?',
      'How is FAO-56 Penman-Monteith calculated?'
    ],
    bn: [
      'নাসার কোন কোন উপগ্রহ ব্যবহৃত হয়েছে?',
      'SoilGrids ২৫০মি উপাত্ত কীভাবে মাপা?',
      'FAO-56 বাষ্পীভবন কীভাবে হিসাব করা হয়?'
    ]
  },
  account: {
    en: [
      'How do I backup my farm parcels?',
      'What is the data provenance tier?',
      'How do I switch interface language?'
    ],
    bn: [
      'আমার খামারের তথ্য কীভাবে সংরক্ষণ করব?',
      'উপাত্তের প্রোভেন্যান্স স্তর কী?',
      'ভাষা কীভাবে পরিবর্তন করব?'
    ]
  }
};

export function ChatWidget({
  activeNav = 'dashboard',
  activeField = null,
  lang = 'bn',
  isOpen = false,
  onToggle = () => {},
  messages = [],
  setMessages = () => {}
}) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const scrollRef = useRef(null);

  const currentQuestions = useMemo(() => {
    const pageKey = PAGE_QUESTIONS[activeNav] ? activeNav : 'dashboard';
    const langKey = lang === 'bn' ? 'bn' : 'en';
    return PAGE_QUESTIONS[pageKey][langKey];
  }, [activeNav, lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleOpen = () => {
    setHasUnread(false);
    onToggle(true);
  };

  const handleClose = () => {
    onToggle(false);
  };

  const generateOfflineAnswer = (query) => {
    const isBn = lang === 'bn';
    const fieldName = activeField?.name || (isBn ? 'বগুড়া পরীক্ষামূলক খামার' : 'Bogura Demo Field');
    const district = activeField?.district ? districtLabel(activeField.district, lang) : (isBn ? 'বগুড়া' : 'Bogura');
    const area = activeField?.area_ha != null ? `${activeField.area_ha} ha (${Math.round(activeField.area_ha * 7.47)} bigha)` : '10.0 ha (75 bigha)';
    const soil = activeField?.soil_texture ? soilLabel(activeField.soil_texture, lang) : (isBn ? 'এঁটেল দোআঁশ' : 'Clay Loam');

    if (isBn) {
      return `⚠️ **Running with local rules; Gemini API key not set**\n\n**${fieldName} (${district})**-এর স্থানীয় উপাত্ত বিশ্লেষণ:\n• **মাটি ও আয়তন:** ${soil}, আয়তন ${area}।\n• **সেচ ও পানি:** প্রস্তাবিত সরিষা–মুগ–আমন আবর্তনে ভূগর্ভস্থ সেচ প্রায় ৬০% সাশ্রয় হয়।\n• **ঝুঁকি ও লাভ:** রবি মৌসুমে বোরোর চেয়ে সরিষা/ডালে প্রতি বিঘায় ৫,০০০–৮,০০০ টাকা পর্যন্ত অতিরিক্ত মুনাফা এবং খরা ঝুঁকি কম।\n\n*পরামর্শ: মাঠপর্যায়ে চূড়ান্ত সিদ্ধান্তের পূর্বে স্থানীয় উপ-সহকারী কৃষি কর্মকর্তার (SAAO) পরামর্শ নিন।*`;
    }

    return `⚠️ **Running with local rules; Gemini API key not set**\n\nLocal decision telemetry for **${fieldName} (${district})**:\n• **Soil & Area:** ${soil}, area ${area}.\n• **Water Savings:** Shifting from Boro monoculture to Mustard -> Mungbean -> T. Aman saves ~60% supplemental groundwater.\n• **Profit & Climate:** Short-duration winter oilseeds reduce dry-season aquifer depletion while increasing net margin by 25-40%.\n\n*Consult local SAAO extension officers for final field application.*`;
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    const contextPayload = {
      page: activeNav,
      language: lang,
      field: {
        name: activeField?.name || 'Demo Field',
        district: activeField?.district || 'Bogura',
        latitude: activeField?.latitude || 24.85,
        longitude: activeField?.longitude || 89.37,
        area_ha: activeField?.area_ha || 10,
        soil_texture: activeField?.soil_texture || 'clay_loam'
      }
    };

    const historyPayload = messages.slice(-6).map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await request('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          context: contextPayload
        })
      });

      const replyText = res?.reply || generateOfflineAnswer(query);

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const offlineMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: generateOfflineAnswer(query),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, offlineMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Collapsed Button: 56px round glass button */}
      {!isOpen && (
        <button
          type="button"
          className="chat-widget-fab"
          onClick={handleOpen}
          aria-label={lang === 'bn' ? 'FieldShift সহকারী' : 'Ask FieldShift'}
          title={lang === 'bn' ? 'FieldShift সহকারীকে প্রশ্ন করুন' : 'Ask FieldShift'}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(14, 24, 18, 0.88)',
            border: '1.5px solid rgba(200, 241, 105, 0.4)',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {/* Sparkle / Leaf Icon */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C8F169" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          </svg>

          {/* Unread badge */}
          {hasUnread && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#10B981',
                border: '2px solid #060F0A'
              }}
            />
          )}
        </button>
      )}

      {/* Expanded Floating Panel: 380x560px Glass Panel */}
      {isOpen && (
        <div
          className="chat-widget-panel"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 380,
            height: 560,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 48px)',
            background: 'rgba(14, 24, 18, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 20,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1001,
            animation: 'chatPanelPop 0.22s cubic-bezier(0.34, 1.2, 0.64, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'rgba(200, 241, 105, 0.15)',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8F169" strokeWidth="2.2">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: 14, color: '#F4F7F4', display: 'block' }}>
                  {lang === 'bn' ? 'FieldShift কৃষি সহকারী' : 'FieldShift Agronomist'}
                </strong>
                <span style={{ fontSize: 11, color: '#93A597' }}>
                  {activeField?.name || (lang === 'bn' ? 'বগুড়া ডেমো খামার' : 'Bogura Demo Field')}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="chat-widget-close-btn"
              onClick={handleClose}
              aria-label="Close assistant"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#93A597',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              ✕
            </button>
          </div>

          {/* 3 Page-Specific Suggested Question Pills */}
          <div
            style={{
              padding: '8px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#93A597', fontWeight: 700, letterSpacing: '0.06em' }}>
              {lang === 'bn' ? 'এই পৃষ্ঠার প্রশ্নসমূহ:' : 'Questions for this page:'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {currentQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chat-widget-pill"
                  onClick={() => handleSend(q)}
                  style={{
                    textAlign: 'left',
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: 'rgba(200, 241, 105, 0.08)',
                    border: '1px solid rgba(200, 241, 105, 0.2)',
                    color: '#EAF2EC',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200, 241, 105, 0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200, 241, 105, 0.08)'; }}
                >
                  💡 {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 0
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#93A597', fontSize: 13 }}>
                <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>🌱</span>
                {lang === 'bn'
                  ? 'উপরে প্রস্তাবিত প্রশ্ন চাপুন অথবা এই পৃষ্ঠা বা আপনার জমির ফসল ও সেচ নিয়ে প্রশ্ন করুন।'
                  : 'Click a suggested question above or ask anything about crop planning and water on this field.'}
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: isUser ? 'rgba(200, 241, 105, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    border: isUser ? '1px solid rgba(200, 241, 105, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#F4F7F4',
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {m.text}
                  <div
                    style={{
                      fontSize: 10,
                      color: isUser ? '#A8D260' : '#8C9B90',
                      marginTop: 4,
                      textAlign: isUser ? 'right' : 'left'
                    }}
                  >
                    {m.time}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 12px',
                  borderRadius: '14px 14px 14px 2px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#C8F169',
                  fontSize: 12
                }}
              >
                ⟳ {lang === 'bn' ? 'উত্তর তৈরি হচ্ছে...' : 'Generating answer...'}
              </div>
            )}
          </div>

          {/* Input Box */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.25)',
              display: 'flex',
              gap: 8,
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              className="chat-widget-input"
              placeholder={lang === 'bn' ? 'প্রশ্ন লিখুন...' : 'Ask a question...'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#F4F7F4',
                fontSize: 13,
                outline: 'none'
              }}
            />
            <button
              type="button"
              className="chat-widget-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !inputText.trim()}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: inputText.trim() && !loading ? '#C8F169' : 'rgba(255, 255, 255, 0.1)',
                color: '#0A0F0D',
                border: 'none',
                cursor: inputText.trim() && !loading ? 'pointer' : 'default',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 'bold',
                fontSize: 15,
                transition: 'background 0.15s ease'
              }}
            >
              ➔
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
