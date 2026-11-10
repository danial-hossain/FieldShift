import React, { useState, useRef, useEffect, useMemo } from 'react';
import { request } from './apiClient.js';
import { soilLabel } from './i18n.js';

const SUGGESTED_PROMPTS = [
  {
    category: 'Rotation & Strategy',
    items: [
      { label: '🌾 Best Rotation & Why?', text: 'Which crop rotation is best for my selected field, and why?' },
      { label: '💧 Low Irrigation Impact', text: 'Why did the crop rotation recommendation change after I reduced irrigation?' },
      { label: '📊 Simple MILP Explanation', text: 'Explain my MILP optimization result in simple language for a farmer.' },
      { label: '⚖️ MILP vs RL vs Rule Benchmark', text: 'Compare the MILP plan with the RL simulation and rule-based baseline plans.' }
    ]
  },
  {
    category: 'Risks & Feasibility',
    items: [
      { label: '🔥 Hotter & Drier Next Season', text: 'What happens to my crop rotation if next season is hotter and rainfall decreases?' },
      { label: '🚫 Constraint Violations', text: 'Which agricultural and water constraints made some crop choices infeasible in the optimizer?' },
      { label: '💧 Total Water Requirement', text: 'How much water does the recommended crop rotation require across the full planning horizon?' },
      { label: '🌱 Sustainability Score Meaning', text: 'Explain the sustainability score. Is it a real laboratory soil measurement or an empirical proxy?' }
    ]
  },
  {
    category: 'Outcomes & Decisions',
    items: [
      { label: '📈 Actual vs Estimated Comparison', text: 'What actual harvest outcome data do we have logged for this field, and how does it compare with prior optimizer estimates?' },
      { label: '📋 Next-Season Decision Checklist', text: 'What field, weather, and market factors should I check before making the next-season planting decision?' },
      { label: '🇧🇩 Regional Language Advice', text: 'Provide targeted crop rotation and soil health advice suited for this specific agro-ecological zone.' },
      { label: '🏆 Summary for Judges & Farmers', text: 'Give me a concise 1-minute executive summary of this field\'s plan and climate resilience that I can present to a judge or farmer.' }
    ]
  }
];

export default function AiAssistantView({
  activeField,
  nasa,
  summary,
  plan,
  ml,
  rl,
  comparisonLab,
  robustness,
  outcomes,
  user,
  lang = 'bn',
  onBack,
  onNavigateTab,
  initialQuestion = null,
  pageContext = null,
  fromPage = null,
  onReturn = null
}) {
  const [language, setLanguage] = useState(lang || 'bn'); // 'en' | 'bn'
  const [presentationMode, setPresentationMode] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const hasSentInitialRef = useRef(false);

  useEffect(() => {
    if (lang && (lang === 'bn' || lang === 'en')) {
      setLanguage(lang);
    }
  }, [lang]);

  const plannerSuggestedPrompts = useMemo(() => {
    if (!pageContext && fromPage !== 'farm_planning') return null;

    const waterMm = pageContext?.totals?.irrigation_plan_mm ?? plan?.total_water_mm ?? 420;
    const y1Rabi = pageContext?.seasons?.[0]?.crop_bn || 'সরিষা';
    const y1RabiEn = pageContext?.seasons?.[0]?.crop || 'Mustard';

    // 4 dynamic chips from A1:
    const chip1 = language === 'bn' ? 'বোরো বাদ দিলে কেন লাভ বেশি?' : 'Why is profit higher without Boro Rice?';
    const chip2 = language === 'bn' ? `${y1Rabi}-এ কতবার সেচ দেব?` : `How many irrigations for ${y1RabiEn}?`;
    const chip3 = language === 'bn' ? 'খরিপ-১ মৌসুমে তিল কেন বিকল্প?' : 'Why is Sesame an alternative for Kharif-1?';
    const chip4 = language === 'bn' ? 'খরা হলে এই পরিকল্পনা কী হবে?' : 'What happens to this plan during drought?';

    const chipDiff = language === 'bn' ? 'সুষম আর লাভ কৌশলের পার্থক্য কী?' : 'What is the difference between Balanced and Profit strategies?';
    const chipTank = language === 'bn' ? `পানির ট্যাংক ${waterMm} মিমি মানে কী?` : `What does water tank ${waterMm} mm mean?`;
    const chipBare = language === 'bn' ? 'ফাঁকা দিন কমলে কী লাভ?' : 'What is the benefit of reducing bare fallow days?';

    const group1 = {
      category: language === 'bn' ? 'এই পরিকল্পনা নিয়ে প্রশ্ন' : 'Plan Questions',
      items: [
        { label: chip1, text: chip1 },
        { label: chip2, text: chip2 },
        { label: chip3, text: chip3 },
        { label: chip4, text: chip4 },
        { label: chipDiff, text: chipDiff },
        { label: chipTank, text: chipTank },
        { label: chipBare, text: chipBare },
      ]
    };

    const glossaryTerms = [
      { labelBn: 'বাষ্পীভবন (ET0) কী?', textBn: 'বাষ্পীভবন ও প্রস্বেদন (ET0) কী এবং এটি ফসল পরিকল্পনায় কেন গুরুত্বপূর্ণ?', labelEn: 'Evapotranspiration (ET0)?', textEn: 'What is Evapotranspiration (ET0) and why does it matter in crop planning?' },
      { labelBn: 'মাটির আর্দ্রতা (SMAP) কী?', textBn: 'মাটির আর্দ্রতা অ্যানোমালি (SMAP) কী?', labelEn: 'Soil Moisture (SMAP)?', textEn: 'What is Soil-Moisture Anomaly (SMAP)?' },
      { labelBn: 'সবুজায়ন সূচক (NDVI) কী?', textBn: 'উদ্ভিদের সবুজায়ন সূচক (NDVI) কী?', labelEn: 'Vegetation Index (NDVI)?', textEn: 'What is Vegetation Index (NDVI)?' },
      { labelBn: 'তাপপ্রবাহ ঝুঁকি কী?', textBn: 'তাপপ্রবাহ ও তাপীয় ঝুঁকি (Heat Stress) কী?', labelEn: 'Heat Stress?', textEn: 'What is Heat Stress & Thermal Thresholds?' },
      { labelBn: 'পানির ভারসাম্য কী?', textBn: 'পানির ভারসাম্য (Water Balance - FAO-56) কী?', labelEn: 'Water Balance?', textEn: 'What is Water Balance (FAO-56)?' },
      { labelBn: 'স্যাটেলাইট বনাম ভূমি পাঠ কী?', textBn: 'উপগ্রহ বনাম ভূমি পরিমাপ (Satellite vs Ground) এর পার্থক্য কী?', labelEn: 'Satellite vs Ground?', textEn: 'What is Satellite vs Ground measurement?' },
      { labelBn: 'পুনর্বিশ্লেষণ বনাম পর্যবেক্ষণ কী?', textBn: 'পুনর্বিশ্লেষণ বনাম প্রত্যক্ষ পর্যবেক্ষণ (Reanalysis vs Observation) এর পার্থক্য কী?', labelEn: 'Reanalysis vs Observation?', textEn: 'What is Reanalysis vs Observation?' },
      { labelBn: 'অনিশ্চয়তার সীমা (P10–P90) কী?', textBn: 'অনিশ্চয়তার সীমা (Uncertainty P10–P90) কী?', labelEn: 'Uncertainty (P10–P90)?', textEn: 'What are Uncertainty Bounds (P10–P90)?' },
    ];

    const group2 = {
      category: language === 'bn' ? 'শব্দের মানে' : 'Glossary & Terms',
      items: glossaryTerms.map(t => ({
        label: language === 'bn' ? t.labelBn : t.labelEn,
        text: language === 'bn' ? t.textBn : t.textEn
      }))
    };

    return [group1, group2];
  }, [pageContext, fromPage, language, plan]);

  const activePrompts = plannerSuggestedPrompts || SUGGESTED_PROMPTS;
  const currentCat = activeCategory < activePrompts.length ? activeCategory : 0;

  const initialGreeting = language === 'bn'
    ? (activeField
        ? `নমস্কার / আসসালামু আলাইকুম! আমি **FieldShift কৃষি সিদ্ধান্ত সহকারী** (টিম AZOIC | NASA Space Apps Challenge 2026)।\n\nবর্তমানে **${activeField.name}** (${activeField.soil_texture ? soilLabel(activeField.soil_texture, 'bn') : 'দোআঁশ'} মাটি, pH ${activeField.soil_ph != null ? activeField.soil_ph : 'অজ্ঞাত'}, জৈব উপাদান ${activeField.organic_matter != null ? activeField.organic_matter + '%' : 'অজ্ঞাত'}, আয়তন ${activeField.area_ha != null ? activeField.area_ha + ' হেক্টর' : 'অজ্ঞাত'}) এর উপাত্ত সংযুক্ত রয়েছে। ফসল নির্বাচন, সেচ বা সম্ভাব্য লাভ সম্পর্কে যে কোনো প্রশ্ন করুন!`
        : `নমস্কার / আসসালামু আলাইকুম! আমি **FieldShift কৃষি সিদ্ধান্ত সহকারী**।\n\nবর্তমানে কোনো জমি নির্বাচিত নেই। আপনি উপরের মেনু থেকে **বগুড়া ডেমো খামার (১০ হেক্টর)** নির্বাচন করতে পারেন অথবা 'আমার খামার' পাতায় গিয়ে নতুন জমি নিবন্ধন করতে পারেন। আপনার যে কোনো কৃষি প্রশ্ন করুন!`)
    : (activeField
        ? `Hello! I am the **FieldShift Agronomic AI Assistant** (NASA Space Apps Challenge 2026 | Team AZOIC).\n\nSynchronized context for **${activeField.name}** (${activeField.soil_texture ? soilLabel(activeField.soil_texture, 'en') : 'Unknown'}, pH ${activeField.soil_ph != null ? activeField.soil_ph : 'Unknown'}, ${activeField.organic_matter != null ? activeField.organic_matter + '% OM' : 'Unknown OM'}, ${activeField.area_ha != null ? activeField.area_ha + ' ha' : 'Unknown area'}) and NASA POWER agroclimatology telemetry.\n\nAsk me about crop planning, irrigation quotas, or market profit trade-offs!`
        : `Hello! I am the **FieldShift Agronomic AI Assistant**.\n\nNo field parcel is currently selected. You can select the **Bogura Demo Field (10 ha)** or register your field in My Farm. Ask any crop or soil question!`);

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'FieldShift AI Agent',
      isFallback: false,
      text: initialGreeting
    }
  ]);

  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const buildContextPayload = () => {
    const rotationStr = plan?.selected_crop_by_period
      ? Object.entries(plan.selected_crop_by_period).map(([p, c]) => `${p}: ${c}`).join(' -> ')
      : '';

    const payload = {
      language,
      field: {
        name: activeField ? (activeField.is_demo ? `${activeField.name}` : activeField.name) : 'No registered parcel selected',
        is_demo: Boolean(activeField?.is_demo || activeField?.id === 'demo'),
        latitude: activeField?.latitude ?? null,
        longitude: activeField?.longitude ?? null,
        field_size_ha: activeField?.area_ha ?? activeField?.field_size_ha ?? null,
        soil_texture: activeField?.soil_texture || null,
        soil_ph: activeField?.soil_ph ?? null,
        organic_matter_pct: activeField?.organic_matter ?? activeField?.organic_matter_pct ?? null,
        irrigation_capacity_mm: activeField?.irrigation_capacity_mm ?? null,
        previous_crop: activeField?.previous_crop || null
      },
      weather: {
        temperature_c: nasa?.telemetry?.observed_temperature_c ?? null,
        humidity_pct: nasa?.telemetry?.average_humidity_pct ?? null,
        precipitation_mm: nasa?.telemetry?.precipitation_daily_mm ?? null,
        wind_speed_ms: nasa?.telemetry?.wind_speed_ms ?? null,
        source: nasa?.data_status === 'observed'
          ? 'NASA POWER Daily API (Reanalysis / Climatology)'
          : (activeField?.is_demo ? 'NASA POWER Historical Bogura Benchmark' : (nasa?.telemetry ? 'NASA POWER Historical Reanalysis Benchmark' : null))
      },
      plan: {
        rotation_str: rotationStr,
        yield_tons: plan?.objective_value ?? null,
        gross_margin_bdt: plan?.gross_margin_bdt ?? null,
        water_mm: plan?.total_water_mm ?? null,
        solver_status: plan?.solver_status ?? null
      },
      comparison: {
        summary: comparisonLab?.trade_off_analysis?.headline ?? null
      },
      scenarios: {
        robustness_score: robustness?.overall_robustness_score_pct ?? null
      },
      outcomes: {
        recorded_seasons: Array.isArray(outcomes) ? outcomes.length : 0
      }
    };

    if (pageContext) {
      payload.planner = {
        field: pageContext.field?.name || activeField?.name || 'Selected Field',
        field_area_ha: pageContext.field?.area_ha ?? activeField?.area_ha ?? null,
        district: pageContext.field?.district_label || pageContext.field?.district || activeField?.district || null,
        rotation: (pageContext.seasons || []).map(s => s.crop_en || s.crop).join(' -> '),
        current_rotation: pageContext.field?.current_rotation_en || pageContext.field?.current_rotation_bn || 'Boro Rice -> Fallow -> T. Aman Rice',
        seasons: (pageContext.seasons || []).map(s => ({
          season: s.season || s.season_bn || s.season_code,
          crop: s.crop,
          crop_bn: s.crop_bn,
          irrigation_mm: s.irrigation_mm,
          profit_bdt: s.margin_bdt_ha,
          risk: s.risk || (pageContext.risk?.drought?.level === 'high' ? 'Drought stress risk' : 'Normal')
        })),
        baseline_totals: {
          irrigation_mm: pageContext.totals?.irrigation_baseline_mm ?? null,
          profit_bdt: pageContext.totals?.profit_baseline_bdt_ha ?? null
        },
        plan_totals: {
          irrigation_mm: pageContext.totals?.irrigation_plan_mm ?? null,
          profit_bdt: pageContext.totals?.profit_plan_bdt_ha ?? null
        },
        strategy: pageContext.selected_strategy || 'balanced',
        priorities: pageContext.farmer_priorities ? (typeof pageContext.farmer_priorities === 'string' ? pageContext.farmer_priorities : JSON.stringify(pageContext.farmer_priorities)) : 'balanced',
        risk: {
          deficit_stress: pageContext.risk?.drought?.note || pageContext.risk?.drought?.level || 'moderate',
          heat_stress: pageContext.risk?.heat?.note || pageContext.risk?.heat?.level || 'moderate'
        },
        data_sources: ["NASA POWER", "BARC AEZ", "BBS Ag Census"]
      };
    }

    return payload;
  };

  const handleSend = async (textToSend) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: messageContent
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    const contextData = buildContextPayload();
    const historyPayload = messages.map(m => ({ role: m.role, text: m.text }));

    try {
      const resJson = await request('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: messageContent,
          history: historyPayload,
          context: contextData
        })
      });

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: resJson.model || 'gemini-flash-lite-latest',
        isFallback: Boolean(resJson.is_fallback),
        text: resJson.reply,
        actionIntent: resJson.action_intent || null
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const saaoNotice = language === 'bn'
        ? 'এই পরামর্শ সিদ্ধান্তের সহায়ক; স্থানীয় উপসহকারী কৃষি কর্মকর্তা (SAAO)-র সাথে আলোচনা করে চূড়ান্ত সিদ্ধান্ত নিন।'
        : 'This advice provides decision support; please consult your local Sub-Assistant Agriculture Officer (SAAO) before making final farming decisions.';

      const baseTot = pageContext?.totals?.irrigation_baseline_mm != null ? pageContext.totals.irrigation_baseline_mm : 'তথ্য নেই';
      const planTot = pageContext?.totals?.irrigation_plan_mm != null ? pageContext.totals.irrigation_plan_mm : 'তথ্য নেই';
      const baseProfit = pageContext?.totals?.profit_baseline_bdt_ha != null ? `${pageContext.totals.profit_baseline_bdt_ha.toLocaleString()} টাকা` : 'তথ্য নেই';
      const planProfit = pageContext?.totals?.profit_plan_bdt_ha != null ? `${pageContext.totals.profit_plan_bdt_ha.toLocaleString()} টাকা` : 'তথ্য নেই';

      const fallbackText = language === 'bn'
        ? `### ১. সংক্ষিপ্ত উত্তর (SHORT ANSWER)\nআপনার **${activeField?.name || 'নির্বাচিত জমি'}**-র আবর্তন পরিকল্পনা অনুসারে রবি মৌসুমে স্বল্প-সেচের ডাল/তৈলবীজ এবং খরিফে আমন ধান আবর্তনে পানি সাশ্রয় ও অধিক লাভ নিশ্চিত হয়।\n\n### ২. এই জমির প্রমাণাদি (EVIDENCE FROM THIS FIELD)\n- সেচ বাজেট: বেসলাইন **${baseTot} মিমি** বনাম প্রস্তাবিত **${planTot} মিমি**\n- বাৎসরিক লাভ: বেসলাইন **${baseProfit}** বনাম প্রস্তাবিত **${planProfit}**\n- মাটির গঠন: **${activeField?.soil_texture ? soilLabel(activeField.soil_texture, 'bn') : 'তথ্য নেই'}**, pH **${activeField?.soil_ph ?? 'তথ্য নেই'}**\n\n### ৩. প্রস্তাবিত পরবর্তী পদক্ষেপ (RECOMMENDED NEXT STEP)\nপরবর্তী মৌসুমের জন্য জমিতে সঠিক সময়ে বীজ বপন ও সেচ ড্রেনেজ নিশ্চিত করুন।\n\n### ৪. উপাত্তের সীমাবদ্ধতা (DATA LIMITATIONS)\nনেটওয়ার্ক সংযোগ বিচ্ছিন্ন থাকায় স্থানীয় সংরক্ষিত আবর্তন ও নাসার উপাত্ত থেকে হিসাবকৃত।\n\n### ৫. প্রস্তাবিত করণীয় (SUGGESTED FOLLOW-UP ACTION)\n${saaoNotice}`
        : `### 1. SHORT ANSWER\nBased on the rotation plan for **${activeField?.name || 'Selected Field'}**, replacing water-intensive Boro with short-duration pulses or oilseeds significantly reduces irrigation demand while raising net returns.\n\n### 2. EVIDENCE FROM THIS FIELD\n- Irrigation: Baseline **${baseTot} mm** vs Planned **${planTot} mm**\n- Profit: Baseline **${baseProfit}** vs Planned **${planProfit}**\n- Soil Profile: **${activeField?.soil_texture ? soilLabel(activeField.soil_texture, 'en') : 'No data'}**, pH **${activeField?.soil_ph ?? 'No data'}**\n\n### 3. RECOMMENDED NEXT STEP\nEnsure timely sowing and maintain active furrow drainage.\n\n### 4. DATA LIMITATIONS\nComputed from local rotation parameters and NASA agroclimatology under offline operation.\n\n### 5. SUGGESTED FOLLOW-UP ACTION\n${saaoNotice}`;

      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: language === 'bn' ? 'AI অফলাইন — পরিকল্পনার তথ্য থেকে উত্তর' : 'AI Offline — Answer derived from your plan',
        isFallback: true,
        text: fallbackText
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  useEffect(() => {
    if (initialQuestion && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'FieldShift AI Agent',
        isFallback: false,
        text: language === 'bn'
          ? 'কথোপকথন মুছে ফেলা হয়েছে। আপনার পরবর্তী কৃষি প্রশ্নের জন্য প্রস্তুত!'
          : 'Conversation cleared. I am ready for your next agronomic inquiry!'
      }
    ]);
  };

  // Structured Markdown Renderer for 6-Part Agronomic Responses
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    // Presentation mode simplifies headings for quick reading
    const cleanText = presentationMode
      ? rawText.replace(/### \d+\. /g, '### ')
      : rawText;

    const lines = cleanText.split('\n');

    return lines.map((line, lIdx) => {
      const trimmed = line.trim();

      // Heading 3 (e.g. ### 1. Short Answer)
      if (trimmed.startsWith('### ')) {
        const headingText = trimmed.replace(/^###\s+/, '');
        const isShortAnswer = headingText.toLowerCase().includes('short answer') || headingText.includes('সংক্ষিপ্ত উত্তর');
        const isEvidence = headingText.toLowerCase().includes('evidence') || headingText.includes('প্রমাণাদি');
        const isAction = headingText.toLowerCase().includes('step') || headingText.includes('পদক্ষেপ');
        const isRisk = headingText.toLowerCase().includes('risk') || headingText.includes('trade-off') || headingText.includes('ঝুঁকি');
        const isLimit = headingText.toLowerCase().includes('limitation') || headingText.includes('সীমাবদ্ধতা');
        const isFollowup = headingText.toLowerCase().includes('follow-up') || headingText.includes('করণীয়');

        let pillClass = 'ai-section-pill-generic';
        if (isShortAnswer) pillClass = 'ai-section-pill-answer';
        else if (isEvidence) pillClass = 'ai-section-pill-evidence';
        else if (isAction) pillClass = 'ai-section-pill-action';
        else if (isRisk) pillClass = 'ai-section-pill-risk';
        else if (isLimit) pillClass = 'ai-section-pill-limit';
        else if (isFollowup) pillClass = 'ai-section-pill-followup';

        return (
          <div key={lIdx} className="ai-chat-section-heading">
            <span className={`ai-section-pill ${pillClass}`}>{headingText}</span>
          </div>
        );
      }

      // Heading 2 or 1
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        const hText = trimmed.replace(/^#+\s+/, '');
        return (
          <h4 key={lIdx} className="ai-chat-h4">
            {renderInlineMarkdown(hText)}
          </h4>
        );
      }

      // Unordered list
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const itemContent = trimmed.substring(2);
        return (
          <li key={lIdx} className="ai-chat-list-item">
            {renderInlineMarkdown(itemContent)}
          </li>
        );
      }

      // Blank line
      if (!trimmed) {
        return <div key={lIdx} style={{ height: 6 }} />;
      }

      // Regular line
      return (
        <p key={lIdx} className="ai-chat-paragraph">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^\$]+\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="ai-chat-strong">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="ai-chat-code">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="ai-assistant-container">
      {/* Top Header */}
      <div className="view-sub-header ai-view-header">
        <div className="ai-title-group">
          <div className="ai-title-with-badge">
            <h2>AI Agronomist &amp; Decision Intelligence</h2>
            <span className="ai-status-pill online">
              <span className="ai-status-dot" />
              AI Decision Assistant
            </span>
          </div>
          <p className="ai-subtitle">
            Context-grounded agronomic advice for crop rotation, moisture deficits, and climate adaptation in Bangladesh.
          </p>
        </div>

        <div className="ai-header-controls">
          {/* Language Selector */}
          <div className="ai-lang-toggle" role="group" aria-label="Language selection">
            <button
              type="button"
              className={`ai-lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              {lang === 'bn' ? 'ইংরেজি' : 'EN'}
            </button>
            <button
              type="button"
              className={`ai-lang-btn ${language === 'bn' ? 'active' : ''}`}
              onClick={() => setLanguage('bn')}
              title={lang === 'bn' ? 'বাংলা ভাষায় উত্তর পান' : 'Get response in Bangla'}
            >
              {lang === 'bn' ? 'বাংলা' : 'BN'}
            </button>
          </div>

          {/* Presentation Mode Toggle */}
          <button
            type="button"
            className={`ai-mode-toggle-btn ${presentationMode ? 'active' : ''}`}
            onClick={() => setPresentationMode(!presentationMode)}
            title="Toggle executive summary briefing mode for farmers or judges"
          >
            {presentationMode ? '📋 Briefing Mode ON' : '🔬 Scientific Detail'}
          </button>

          {fromPage && (
            <button
              type="button"
              className="btn btn-primary btn-return-planner"
              onClick={() => {
                if (onReturn) onReturn();
                else if (onNavigateTab) onNavigateTab(fromPage);
                else if (onBack) onBack();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                fontSize: 13,
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              {language === 'bn' ? '← আবর্তন পরিকল্পনায় ফিরুন' : '← Back to Rotation Planner'}
            </button>
          )}

          {!fromPage && onBack && (
            <button type="button" className="btn-secondary" onClick={onBack}>
              ← Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Field Telemetry Context Bar */}
      <div className="ai-context-banner">
        <div className="ai-context-badge">
          <span className="live-pulse-dot" />
          ACTIVE CONTEXT
        </div>
        <div className="ai-context-field-name">
          <strong>{activeField?.name || (language === 'bn' ? 'কোনো জমি নির্বাচিত নেই' : 'No parcel selected')}</strong>
          <span className="ai-context-coords">
            {activeField?.latitude != null && activeField?.longitude != null
              ? `(${Number(activeField.latitude).toFixed(2)}°N, ${Number(activeField.longitude).toFixed(2)}°E · ${activeField.area_ha != null ? Number(activeField.area_ha).toFixed(2) : '—'} ha)`
              : (activeField?.area_ha != null ? `(${Number(activeField.area_ha).toFixed(2)} ha)` : '')}
          </span>
        </div>
        <div className="ai-context-metrics">
          <span className="ai-context-tag">
            Soil: <strong>{activeField?.soil_texture || (language === 'bn' ? 'তথ্য নেই' : 'No data')}</strong>
          </span>
          <span className="ai-context-tag">
            pH: <strong>{activeField?.soil_ph != null ? activeField.soil_ph : (language === 'bn' ? 'তথ্য নেই' : 'No data')}</strong>
          </span>
          <span className="ai-context-tag">
            OM: <strong>{(activeField?.organic_matter ?? activeField?.organic_matter_pct) != null ? `${activeField.organic_matter ?? activeField.organic_matter_pct}%` : (language === 'bn' ? 'তথ্য নেই' : 'No data')}</strong>
          </span>
          <span className="ai-context-tag">
            Irrigation: <strong>{activeField?.irrigation_capacity_mm != null ? `${activeField.irrigation_capacity_mm} mm` : (language === 'bn' ? 'তথ্য নেই' : 'No data')}</strong>
          </span>
          <span className="ai-context-tag highlight">
            NASA Temp: <strong>{nasa?.telemetry?.observed_temperature_c != null ? `${nasa.telemetry.observed_temperature_c}°C` : (language === 'bn' ? 'তথ্য নেই' : 'No data')}</strong>
          </span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="ai-chat-card">
        {/* Messages Scroll Area */}
        <div className="ai-chat-body">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-message-row ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="ai-avatar-assistant">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
              )}

              <div className="ai-bubble-container">
                <div className={`ai-message-bubble ${msg.role} ${presentationMode ? 'briefing-card' : ''}`}>
                  {/* Model badge */}
                  {msg.role === 'assistant' && (
                    <div className="ai-bubble-header">
                      <span className={`ai-model-tag ${msg.isFallback ? 'fallback' : 'generative'}`}>
                        {msg.isFallback ? `⚡ ${msg.model || (language === 'bn' ? 'AI অফলাইন — পরিকল্পনার তথ্য থেকে উত্তর' : 'AI Offline — Answer derived from your plan')}` : `🤖 Gemini (${msg.model})`}
                      </span>
                      <span className="ai-message-timestamp">{msg.time}</span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="ai-message-markdown">
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Interactive Action Intent Card */}
                  {msg.actionIntent && (
                    <div className="ai-action-card">
                      <div className="ai-action-icon">🚀</div>
                      <div className="ai-action-content">
                        <strong>{msg.actionIntent.label}</strong>
                        <p>{msg.actionIntent.description}</p>
                      </div>
                      <button
                        type="button"
                        className="ai-action-execute-btn"
                        onClick={() => {
                          if (onNavigateTab && msg.actionIntent.tab) {
                            onNavigateTab(msg.actionIntent.tab);
                          }
                        }}
                      >
                        Execute →
                      </button>
                    </div>
                  )}

                  {/* Dynamic Follow-up Chips for Assistant Replies */}
                  {msg.role === 'assistant' && (
                    <div className="ai-followup-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 6px' }}>
                      <span style={{ fontSize: 11.5, opacity: 0.7, alignSelf: 'center' }}>
                        {language === 'bn' ? '💡 পরবর্তী প্রশ্ন:' : '💡 Next question:'}
                      </span>
                      {[
                        language === 'bn' ? 'খরা হলে কী করব?' : 'What to do in case of drought?',
                        language === 'bn' ? 'সার কত লাগবে?' : 'How much fertilizer is needed?',
                        language === 'bn' ? 'SAAO-র সাথে কী কথা বলব?' : 'What to discuss with SAAO?'
                      ].map((fText, fIdx) => (
                        <button
                          key={fIdx}
                          type="button"
                          className="ai-followup-chip"
                          onClick={() => handleSend(fText)}
                          disabled={loading}
                          style={{
                            background: 'var(--surface-2, rgba(255,255,255,0.06))',
                            border: '1px solid var(--line, rgba(255,255,255,0.15))',
                            borderRadius: 999,
                            padding: '3px 10px',
                            fontSize: 12,
                            color: 'var(--text)',
                            cursor: 'pointer'
                          }}
                        >
                          {fText}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bottom Message Actions */}
                  {msg.role === 'assistant' && (
                    <div className="ai-bubble-footer">
                      <button
                        type="button"
                        className="ai-copy-btn"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy answer to clipboard"
                      >
                        {copiedId === msg.id ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <span className="ai-provenance-tag">
                        Field: {activeField?.name || 'Selected Parcel'} · NASA Telemetry Grounded
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="ai-avatar-user">
                  {user ? (user.name || user.email || 'U').slice(0, 1).toUpperCase() : '👨‍🌾'}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="ai-message-row assistant">
              <div className="ai-avatar-assistant">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z" />
                </svg>
              </div>
              <div className="ai-bubble-container">
                <div className="ai-message-bubble assistant ai-loading-bubble">
                  <span className="ai-typing-text">
                    {language === 'bn' ? 'জমি ও আবহাওয়া উপাত্ত বিশ্লেষণ করা হচ্ছে' : 'Gemini is evaluating field telemetry & agronomic constraints'}
                  </span>
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggestion Chips with Category Tabs */}
        <div className="ai-suggestions-row">
          <div className="ai-suggestion-tabs">
            {activePrompts.map((cat, cIdx) => (
              <button
                key={cIdx}
                type="button"
                className={`ai-suggestion-tab-btn ${currentCat === cIdx ? 'active' : ''}`}
                onClick={() => setActiveCategory(cIdx)}
              >
                {cat.category}
              </button>
            ))}
          </div>

          <div className="ai-suggestions-scroll">
            {(activePrompts[currentCat]?.items || []).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="ai-prompt-chip"
                onClick={() => handleSend(prompt.text)}
                disabled={loading}
              >
                {prompt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="ai-chat-input-bar">
          <button
            type="button"
            className="ai-clear-btn"
            onClick={handleClear}
            title="Clear conversation history"
          >
            Clear
          </button>

          <div className="ai-input-wrapper">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === 'bn' ? "ফসল নির্বাচন, মাটির পুষ্টি, সেচ ঘাটতি বা আবহাওয়ার ঝুঁকি সম্পর্কে জিজ্ঞাসা করুন…" : "Ask FieldShift AI about crop choices, drought stress, soil nutrients, or rotation trade-offs…"}
              className="ai-textarea"
              disabled={loading}
            />
            <button
              type="button"
              className="ai-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !inputText.trim()}
              title="Send message (Enter)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="ai-footer-disclaimer">
          Gemini-powered agronomic decision support · Grounded in active field soil measurements and NASA POWER telemetry · Decision support only; does not replace on-ground laboratory soil testing.
        </div>
      </div>
    </div>
  );
}
