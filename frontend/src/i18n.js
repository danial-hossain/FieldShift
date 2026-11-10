// frontend/src/i18n.js
// Centralized translation dictionary for FieldShift — Bangla-first agricultural platform

export const TRANSLATIONS = {
  bn: {
    // Brand & Header
    brand_name: 'FieldShift',
    brand_tagline: 'কৃষকের সহজ ডিজিটাল বন্ধু',
    switch_lang: 'English-এ দেখুন',
    active_field_label: 'নির্বাচিত জমি:',
    select_field_placeholder: 'জমি বেছে নিন',
    weather_live_badge: '🛰️ নাসা আবহাওয়া পর্যবেক্ষণ',
    weather_cache_badge: '💾 সংরক্ষিত আবহাওয়া',
    
    // Main Navigation
    nav_home: 'হোম',
    nav_farm: 'আমার জমি',
    nav_crop_advice: 'ফসলের পরামর্শ',
    nav_market: 'বাজারদর',
    nav_weather: 'আবহাওয়া',
    nav_harvest_profit: 'ফসলের হিসাব',
    nav_assistant: 'AI সহকারী',
    nav_advanced: 'উন্নত গবেষণা',
    nav_advanced_desc: 'গবেষক ও বিজ্ঞানীদের জন্য সিমুলেশন ও গাণিতিক মডেল',
    
    // Advanced research tabs
    tab_milp: 'ফসল আবর্তন অপ্টিমাইজেশন (MILP)',
    tab_comparison: 'পদ্ধতি তুলনা (MILP vs RL vs Rules)',
    tab_sensitivity: 'সংবেদনশীলতা পরীক্ষা (Sensitivity)',
    tab_synthetic_lab: 'সিন্থেটিক ডাটা ল্যাব ও প্রোভেন্যান্স',
    tab_stress: 'জলবায়ু চাপ ও খরা পরীক্ষা',
    tab_recovery: 'ফসল ক্ষতি ও পুনরুদ্ধার সিমুলেশন',
    tab_replan: 'পরবর্তী মৌসুমের অভিযোজন পরিকল্পনা',
    tab_sustainability: 'মাটির স্বাস্থ্য ও নাইট্রোজেন ট্র্যাকার',
    tab_satellite: 'স্যাটেলাইট সেন্সর প্রস্তুতি',
    tab_catalog: 'বাংলাদেশ শস্য ভাণ্ডার (BARI/BRRI)',
    tab_outcomes: 'আসল বনাম সম্ভাব্য ফলন তুলনা',

    // Home Screen
    welcome_greeting: 'আসসালামু আলাইকুম!',
    welcome_sub: 'আজ আপনার জমিতে কী সাহায্য করতে পারি?',
    welcome_desc: 'সহজ ভাষায় আপনার জমির আবহাওয়া, সেরা ফসল ও সম্ভাব্য লাভের হিসাব জেনে নিন।',
    
    // My Farm Card
    my_farm_title: 'আমার নির্বাচিত জমি',
    view_my_farm_btn: 'আমার জমি দেখুন ➔',
    field_name: 'জমির নাম:',
    field_location: 'অবস্থান:',
    field_area: 'আয়তন:',
    field_soil: 'মাটির ধরন:',
    field_ph: 'মাটির পিএইচ (pH):',
    field_om: 'জৈব পদার্থ:',
    field_water: 'সেচ সুবিধা:',
    no_field_selected: 'কোনো জমি নির্বাচন করা হয়নি। একটি জমি যোগ করুন বা বেছে নিন।',
    
    // Today Weather Card
    today_weather_title: 'আজকের আবহাওয়া ও কৃষি পরামর্শ',
    view_weather_details_btn: 'আবহাওয়ার বিস্তারিত দেখুন ➔',
    temp_label: 'তাপমাত্রা',
    rain_label: 'বৃষ্টিপাত',
    humidity_label: 'আর্দ্রতা',
    wind_label: 'বাতাস',
    weather_advice_good: '✅ আজ সেচ ও সার দেওয়ার উপযোগী অনুকূল আবহাওয়া রয়েছে।',
    weather_advice_rain: '🌧️ আজ বৃষ্টির সম্ভাবনা রয়েছে; জমিতে বাড়তি সেচ দেবেন না।',
    weather_advice_heat: '☀️ তীব্র রোদের সতর্কতা; বিকেলে হালকা সেচ দেওয়া ভালো।',
    weather_source_note: 'উপাত্ত সূত্র: নাসা (NASA POWER) উপগ্রহ ভিত্তিক পর্যবেক্ষণ।',

    // Main Quick Action Cards
    quick_actions_title: 'প্রধান কাজগুলো',
    action_crop_advice_title: 'কোন ফসল চাষ করব?',
    action_crop_advice_desc: 'মাটি ও আবহাওয়ার সাথে মিল রেখে সবচেয়ে লাভজনক ফসলের সহজ পরামর্শ।',
    action_weather_title: 'আজকের আবহাওয়া',
    action_weather_desc: 'বৃষ্টি, খরা ও তাপমাত্রা দেখে জমিতে সেচ ও সার দেওয়ার সঠিক সময় জানুন।',
    action_market_title: 'বাজারদর দেখুন',
    action_market_desc: 'ধান, গম, আলু, ডাল ও তেলের নির্ভরযোগ্য বর্তমান পাইকারি ও খামার দর।',
    action_profit_title: 'লাভের হিসাব করুন',
    action_profit_desc: 'বীজ, সার ও সেচ খরচ বাদ দিয়ে ফসল শেষে আপনার কত টাকা লাভ হতে পারে।',
    action_assistant_title: 'AI-কে মুখে প্রশ্ন করুন',
    action_assistant_desc: 'মাইক্রোফোনে বাংলায় প্রশ্ন করুন; সহকারী সাথে সাথে উত্তর বুঝিয়ে দেবে।',

    // Suggested Next Step
    suggested_step_title: 'পরামর্শিত পরবর্তী পদক্ষেপ',
    suggested_step_desc: 'আপনার জমির মাটির পিএইচ ও সেচের পরিমাণ হালনাগাদ করুন, তাহলে ফসলের ফলন ও লাভের হিসাব আরও নির্ভুল হবে।',
    suggested_step_btn: 'মাটির তথ্য পরীক্ষা করুন',

    // Voice Assistant
    voice_btn_title: 'মুখে বাংলায় বলুন',
    voice_modal_title: 'FieldShift ভয়েস সহকারী',
    voice_ready: 'মাইক্রোফোনে চাপ দিয়ে কথা বলুন',
    voice_listening: 'শুনছি... আপনার কথা বলুন...',
    voice_processing: 'উত্তর প্রস্তুত করছি...',
    voice_error: 'দুঃখিত, কথাটি স্পষ্ট বোঝা যায়নি। আবার বলুন বা লিখে প্রশ্ন করুন।',
    voice_speak_btn: 'পড়ে শোনান 🔊',
    voice_stop_speak_btn: 'থামুন ⏹️',
    voice_confirm_action: 'এই কাজটি করতে চান?',
    voice_suggested_queries: 'এই কথাগুলো মুখে বলতে পারেন:',
    q_best_crop: 'আমার জমির জন্য কোন ফসল ভালো?',
    q_today_weather: 'আজকের আবহাওয়া বলো',
    q_paddy_cost: 'ধান চাষে আনুমানিক কত খরচ হতে পারে?',
    q_market_price: 'বাজারে ধানের দাম কত?',
    q_my_farm: 'আমার জমির তথ্য দেখাও',

    // Crop Advice
    crop_advice_heading: 'আপনার জমির জন্য সেরা ফসলের পরামর্শ',
    crop_advice_sub: 'নির্বাচিত জমির মাটি, সেচের সীমাবদ্ধতা ও বর্তমান ঋতুর সাথে মিল রেখে তৈরি করা হয়েছে।',
    why_suitable_label: 'কেন এই ফসল উপযুক্ত?',
    cost_label: 'আনুমানিক উৎপাদন খরচ:',
    yield_label: 'সম্ভাব্য গড় ফলন:',
    price_label: 'সম্ভাব্য বিক্রয়মূল্য:',
    profit_label: 'সম্ভাব্য নিট লাভ:',
    risks_label: 'সতর্কতা ও ঝুঁকি:',
    next_step_label: 'পরবর্তী করণীয়:',
    data_limitation_label: 'উপাত্তের সীমাবদ্ধতা:',
    bigha_unit: 'বিঘা প্রতি',
    ha_unit: 'হেক্টর প্রতি',
    view_profit_calc_btn: 'লাভের বিস্তারিত হিসাব দেখুন ➔',
    ask_ai_about_crop: 'এই ফসল সম্পর্কে AI-কে প্রশ্ন করুন',
    advanced_milp_btn: 'উন্নত গাণিতিক মডেল ও বৈজ্ঞানিক বিশ্লেষণ দেখুন ➔',

    // Harvest & Profit
    profit_calculator_heading: 'ফসলের লাভ-ক্ষতির সহজ হিসাব',
    profit_calculator_sub: 'আপনার জমির পরিমাপে বীজ, সার, সেচ ও শ্রম খরচ বাদ দিয়ে সম্ভাব্য নিট লাভ জানুন।',
    land_area_input: 'আপনার জমির পরিমাণ:',
    area_unit_select: 'একক:',
    unit_bigha_option: 'বিঘা (৩৩ শতক)',
    unit_ha_option: 'হেক্টর (৭.৫ বিঘা)',
    select_crop_label: 'ফসল নির্বাচন করুন:',
    sales_revenue_label: 'সম্ভাব্য মোট বিক্রয়মূল্য:',
    total_costs_label: 'মোট উৎপাদন ও বাজার খরচ:',
    net_profit_label: 'আনুমানিক নিট লাভ:',
    breakeven_label: 'ব্রেক-ইভেন ন্যূনতম দাম:',
    log_actual_harvest_heading: 'আসল ফসল তোলার তথ্য সংরক্ষণ',
    log_actual_harvest_sub: 'ফসল কাটার পর কত মণ বা কেজি ফলন পেয়েছেন তা লিখে রাখুন।',
    actual_yield_input: 'আসল মোট ফলন (মণ বা কেজি):',
    actual_price_input: 'আসল যে দামে বিক্রি করেছেন (টাকা):',
    save_harvest_btn: 'ফসল রেকর্ড সংরক্ষণ করুন',
    confirm_save_title: 'তথ্য সংরক্ষণের নিশ্চিতকরণ',
    confirm_save_desc: 'আপনি কি এই তথ্য স্থায়ীভাবে সংরক্ষণ করতে চান?',
    confirm_yes: 'হ্যাঁ, সংরক্ষণ করুন',
    confirm_no: 'না, বাতিল করুন',

    // Common
    loading: 'লোড হচ্ছে...',
    not_available: 'তথ্য পাওয়া যায়নি',
    save_success: 'সফলভাবে সংরক্ষিত হয়েছে!',
    error_occurred: 'একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    back_to_home: 'হোমে ফিরে যান',
    close: 'বন্ধ করুন'
  },
  en: {
    // Brand & Header
    brand_name: 'FieldShift',
    brand_tagline: "Farmer's Friendly Companion",
    switch_lang: 'বাংলায় দেখুন',
    active_field_label: 'Active Field:',
    select_field_placeholder: 'Choose parcel',
    weather_live_badge: '🛰️ NASA Weather Observation',
    weather_cache_badge: '💾 Cached Weather',
    
    // Main Navigation
    nav_home: 'Home',
    nav_farm: 'My Farm',
    nav_crop_advice: 'Crop Advice',
    nav_market: 'Market Prices',
    nav_weather: 'Weather',
    nav_harvest_profit: 'Harvest & Profit',
    nav_assistant: 'AI Assistant',
    nav_advanced: 'Advanced Research',
    nav_advanced_desc: 'Simulations & mathematical optimization for researchers',
    
    // Advanced research tabs
    tab_milp: 'Crop Rotation MILP',
    tab_comparison: 'Strategy Benchmark (MILP vs RL vs Rule)',
    tab_sensitivity: 'Sensitivity Sweeps',
    tab_synthetic_lab: 'Synthetic Data Lab & Provenance',
    tab_stress: 'Climate Stress Scenarios',
    tab_recovery: 'Crop Failure & Recovery',
    tab_replan: 'Next-Season Adaptive Replan',
    tab_sustainability: 'Soil Health & Nitrogen Tracker',
    tab_satellite: 'Satellite Sensor Readiness',
    tab_catalog: 'Bangladesh Crop Database',
    tab_outcomes: 'Actual vs Estimated Outcomes',

    // Home Screen
    welcome_greeting: 'Welcome!',
    welcome_sub: 'How can we help your farm today?',
    welcome_desc: 'Get plain-language information on weather, recommended crops, and expected profits.',
    
    // My Farm Card
    my_farm_title: 'My Selected Farm',
    view_my_farm_btn: 'View My Farm ➔',
    field_name: 'Field Name:',
    field_location: 'Location:',
    field_area: 'Area:',
    field_soil: 'Soil Texture:',
    field_ph: 'Soil pH:',
    field_om: 'Organic Matter:',
    field_water: 'Irrigation Capacity:',
    no_field_selected: 'No field selected. Please choose or add a farm parcel.',
    
    // Today Weather Card
    today_weather_title: "Today's Weather & Farm Guidance",
    view_weather_details_btn: 'View Weather Details ➔',
    temp_label: 'Temperature',
    rain_label: 'Precipitation',
    humidity_label: 'Humidity',
    wind_label: 'Wind Speed',
    weather_advice_good: '✅ Favorable weather for irrigation and fertilizer application today.',
    weather_advice_rain: '🌧️ Rain expected today; hold off on heavy irrigation.',
    weather_advice_heat: '☀️ High temperature alert; light evening irrigation recommended.',
    weather_source_note: 'Source: NASA POWER agroclimatology satellite observation.',

    // Main Quick Action Cards
    quick_actions_title: 'Main Actions',
    action_crop_advice_title: 'Which Crop to Plant?',
    action_crop_advice_desc: 'Simple recommendations for highest profitability matching your soil and weather.',
    action_weather_title: "Today's Weather",
    action_weather_desc: 'Check temperature and rain forecasts to plan irrigation and fertilization.',
    action_market_title: 'Market Prices',
    action_market_desc: 'Reliable farmgate and wholesale benchmarks for rice, pulses, wheat, and oilseeds.',
    action_profit_title: 'Calculate Profit',
    action_profit_desc: 'Estimate net profit after deducting seeds, fertilizer, and irrigation costs.',
    action_assistant_title: 'Ask AI by Voice',
    action_assistant_desc: 'Speak naturally in Bangla or English; get simple, structured advice.',

    // Suggested Next Step
    suggested_step_title: 'Suggested Next Step',
    suggested_step_desc: 'Update your parcel soil pH and irrigation limit to get higher precision crop recommendations.',
    suggested_step_btn: 'Update Soil Information',

    // Voice Assistant
    voice_btn_title: 'Speak with Voice',
    voice_modal_title: 'FieldShift Voice Assistant',
    voice_ready: 'Tap the microphone to speak',
    voice_listening: 'Listening... speak clearly now...',
    voice_processing: 'Preparing your answer...',
    voice_error: 'Sorry, speech was unclear. Please try again or type your question.',
    voice_speak_btn: 'Listen 🔊',
    voice_stop_speak_btn: 'Stop ⏹️',
    voice_confirm_action: 'Do you want to perform this action?',
    voice_suggested_queries: 'You can say things like:',
    q_best_crop: 'Which crop is best for my land?',
    q_today_weather: "Tell me today's weather",
    q_paddy_cost: 'What is the estimated cost to grow rice?',
    q_market_price: 'What is the current market price for rice?',
    q_my_farm: 'Show my farm details',

    // Crop Advice
    crop_advice_heading: 'Recommended Crops for Your Field',
    crop_advice_sub: 'Matched against your soil properties, irrigation capacity, and current season.',
    why_suitable_label: 'Why is this crop suitable?',
    cost_label: 'Estimated Production Cost:',
    yield_label: 'Expected Average Yield:',
    price_label: 'Possible Selling Price:',
    profit_label: 'Estimated Net Return:',
    risks_label: 'Risks & Precautions:',
    next_step_label: 'Next Actionable Step:',
    data_limitation_label: 'Data Limitations:',
    bigha_unit: 'Per Bigha',
    ha_unit: 'Per Hectare',
    view_profit_calc_btn: 'Open Profit Calculator ➔',
    ask_ai_about_crop: 'Ask AI about this crop',
    advanced_milp_btn: 'View Advanced Mathematical Optimizer (MILP) ➔',

    // Harvest & Profit
    profit_calculator_heading: 'Simple Harvest & Profit Calculator',
    profit_calculator_sub: 'Estimate net return by deducting seed, fertilizer, irrigation, and labor costs for your land.',
    land_area_input: 'Your Land Area:',
    area_unit_select: 'Unit:',
    unit_bigha_option: 'Bigha (33 decimals)',
    unit_ha_option: 'Hectare (7.5 bighas)',
    select_crop_label: 'Select Crop:',
    sales_revenue_label: 'Gross Sales Revenue:',
    total_costs_label: 'Total Production & Marketing Costs:',
    net_profit_label: 'Estimated Net Return:',
    breakeven_label: 'Break-Even Selling Price:',
    log_actual_harvest_heading: 'Record Actual Harvest Outcome',
    log_actual_harvest_sub: 'Log the actual yield and price received after harvesting.',
    actual_yield_input: 'Actual Yield (Maund or kg):',
    actual_price_input: 'Actual Price Received (BDT):',
    save_harvest_btn: 'Save Harvest Record',
    confirm_save_title: 'Confirm Save',
    confirm_save_desc: 'Are you sure you want to permanently save this harvest record?',
    confirm_yes: 'Yes, Save',
    confirm_no: 'Cancel',

    // Common
    loading: 'Loading...',
    not_available: 'Not available',
    save_success: 'Saved successfully!',
    error_occurred: 'An error occurred. Please try again.',
    back_to_home: 'Back to Home',
    close: 'Close'
  }
};

export const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num) {
  if (num === null || num === undefined || num === '') return 'অপ্রাপ্য';
  const str = String(num);
  return str.replace(/[0-9]/g, d => BENGALI_DIGITS[Number(d)]);
}

export function toEnglishNumber(str) {
  if (str === null || str === undefined || str === '') return '';
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  return String(str).replace(/[০-৯]/g, d => bnToEnMap[d] || d);
}

export function formatArea(areaHa, lang = 'bn') {
  if (!areaHa || isNaN(Number(areaHa))) return lang === 'bn' ? 'অপ্রাপ্য' : 'Not available';
  const ha = Number(areaHa);
  const bigha = ha * 7.47; // 1 ha ≈ 7.47 standard Bangladesh bighas (33 decimal)
  if (lang === 'bn') {
    return `${toBengaliNumber(bigha.toFixed(1))} বিঘা (${toBengaliNumber(ha.toFixed(2))} হেক্টর)`;
  }
  return `${bigha.toFixed(1)} Bigha (${ha.toFixed(2)} ha)`;
}

export function formatCurrency(amount, lang = 'bn') {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return lang === 'bn' ? 'অপ্রাপ্য' : 'Not available';
  }
  const rounded = Math.round(Number(amount));
  const formatted = rounded.toLocaleString('en-US');
  if (lang === 'bn') {
    return `${toBengaliNumber(formatted)} টাকা`;
  }
  return `${formatted} BDT`;
}

export function useTranslation(lang = 'bn') {
  const currentLang = lang === 'en' ? 'en' : 'bn';
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.bn;

  const t = (key, fallback = '') => {
    return dict[key] !== undefined ? dict[key] : (TRANSLATIONS.en[key] || fallback || key);
  };

  return { t, lang: currentLang, toBn: toBengaliNumber, formatArea, formatCurrency, formatMoney, formatUnit, formatNumber, cropLabel, seasonLabel, monthLabel, districtLabel, soilLabel, unitLabel };
}

// ---------------------------------------------------------------------------
// UNIFIED LOCALIZED FORMATTERS (L1)
// ---------------------------------------------------------------------------

import { formatDistrictLabel } from './utils/districtLabels.js';

export function districtLabel(district, lang = 'bn') {
  return formatDistrictLabel(district, lang);
}

export function formatNumber(val, lang = 'bn', options = {}) {
  if (val === null || val === undefined || val === '') return lang === 'bn' ? 'তথ্য নেই' : 'No data';
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  const decimals = typeof options === 'number' ? options : (options?.decimals ?? null);
  const str = decimals !== null ? num.toFixed(decimals) : num.toLocaleString('en-US');
  if (lang === 'bn') {
    return str.replace(/[0-9]/g, d => BENGALI_DIGITS[Number(d)]);
  }
  return str;
}

export const CROP_LABELS = {
  'boro rice': { bn: 'বোরো ধান', en: 'Boro Rice' },
  'boro': { bn: 'বোরো ধান', en: 'Boro Rice' },
  't. aman rice': { bn: 'আমন ধান', en: 'T. Aman Rice' },
  't. aman': { bn: 'আমন ধান', en: 'T. Aman' },
  'aman rice': { bn: 'আমন ধান', en: 'Aman Rice' },
  'aman': { bn: 'আমন ধান', en: 'Aman' },
  'aus rice': { bn: 'আউশ ধান', en: 'Aus Rice' },
  'aus': { bn: 'আউশ ধান', en: 'Aus' },
  'rice': { bn: 'ধান', en: 'Rice' },
  'dhan': { bn: 'ধান', en: 'Rice' },
  'mustard': { bn: 'সরিষা', en: 'Mustard' },
  'mungbean': { bn: 'মুগডাল', en: 'Mungbean' },
  'lentil': { bn: 'মসুর ডাল', en: 'Lentil' },
  'chickpea': { bn: 'ছোলা', en: 'Chickpea' },
  'wheat': { bn: 'গম', en: 'Wheat' },
  'maize': { bn: 'ভুট্টা', en: 'Maize' },
  'potato': { bn: 'আলু', en: 'Potato' },
  'sesame': { bn: 'তিল', en: 'Sesame' },
  'soybean': { bn: 'সয়াবিন', en: 'Soybean' },
  'sunflower': { bn: 'সূর্যমুখী', en: 'Sunflower' },
  'jute': { bn: 'পাট', en: 'Jute' },
  'groundnut': { bn: 'চীনাবাদাম', en: 'Groundnut' },
  'tomato': { bn: 'টমেটো', en: 'Tomato' },
  'blackgram': { bn: 'মাষকলাই', en: 'Blackgram' },
  'grasspea': { bn: 'খেসারি', en: 'Grasspea' },
  'cowpea': { bn: 'বরবটি', en: 'Cowpea' },
  'onion': { bn: 'পেঁয়াজ', en: 'Onion' },
  'garlic': { bn: 'রসুন', en: 'Garlic' },
  'chilli': { bn: 'মরিচ', en: 'Chilli' },
  'fallow': { bn: 'পতিত', en: 'Fallow' },
  'unknown': { bn: 'তথ্য নেই', en: 'Unknown' }
};

export function cropLabel(crop, lang = 'bn', seasonCode = null) {
  if (!crop) return lang === 'bn' ? 'তথ্য নেই' : 'No data';
  const raw = String(crop).trim();
  const k = raw.toLowerCase();

  if (k === 'rice' || k === 'dhan' || k === 'ধান') {
    if (seasonCode) {
      const sLower = String(seasonCode).toLowerCase();
      if (sLower.includes('s1') || sLower.includes('rabi')) {
        return lang === 'bn' ? 'বোরো ধান' : 'Boro Rice';
      }
      if (sLower.includes('s2') || sLower.includes('kharif1') || sLower.includes('kharif-1')) {
        return lang === 'bn' ? 'আউশ ধান' : 'Aus Rice';
      }
      if (sLower.includes('s3') || sLower.includes('kharif2') || sLower.includes('kharif-2')) {
        return lang === 'bn' ? 'আমন ধান' : 'T. Aman Rice';
      }
    }
    return lang === 'bn' ? 'আমন ধান' : 'Rice';
  }

  const match = CROP_LABELS[k];
  if (match) return lang === 'bn' ? match.bn : match.en;
  return raw;
}

export const SEASON_LABELS = {
  rabi: { bn: 'রবি', en: 'Rabi' },
  kharif1: { bn: 'খরিফ-১', en: 'Kharif-1' },
  kharif2: { bn: 'খরিফ-২', en: 'Kharif-2' },
  kharif_1: { bn: 'খরিফ-১', en: 'Kharif-1' },
  kharif_2: { bn: 'খরিফ-২', en: 'Kharif-2' },
  'kharif-1': { bn: 'খরিফ-১', en: 'Kharif-1' },
  'kharif-2': { bn: 'খরিফ-২', en: 'Kharif-2' },
  y1_s1: { bn: '১ম বছর রবি', en: 'Year 1 Rabi' },
  y1_s2: { bn: '১ম বছর খরিফ-১', en: 'Year 1 Kharif-1' },
  y1_s3: { bn: '১ম বছর খরিফ-২', en: 'Year 1 Kharif-2' },
  y2_s1: { bn: '২য় বছর রবি', en: 'Year 2 Rabi' },
  y2_s2: { bn: '২য় বছর খরিফ-১', en: 'Year 2 Kharif-1' },
  y2_s3: { bn: '২য় বছর খরিফ-২', en: 'Year 2 Kharif-2' },
};

export function seasonLabel(seasonId, lang = 'bn') {
  if (!seasonId) return lang === 'bn' ? 'তথ্য নেই' : 'No data';
  const k = String(seasonId).toLowerCase().trim().replace(/[\s-]+/g, '_');
  const direct = SEASON_LABELS[k] || SEASON_LABELS[String(seasonId).toLowerCase().trim()];
  if (direct) return lang === 'bn' ? direct.bn : direct.en;
  return String(seasonId);
}

export const MONTH_LABELS = {
  jan: { bn: 'জানুয়ারি', en: 'January' },
  feb: { bn: 'ফেব্রুয়ারি', en: 'February' },
  mar: { bn: 'মার্চ', en: 'March' },
  apr: { bn: 'এপ্রিল', en: 'April' },
  may: { bn: 'মে', en: 'May' },
  jun: { bn: 'জুন', en: 'June' },
  jul: { bn: 'জুলাই', en: 'July' },
  aug: { bn: 'আগস্ট', en: 'August' },
  sep: { bn: 'সেপ্টেম্বর', en: 'September' },
  oct: { bn: 'অক্টোবর', en: 'October' },
  nov: { bn: 'নভেম্বর', en: 'November' },
  dec: { bn: 'ডিসেম্বর', en: 'December' },
  'nov–apr': { bn: 'নভে–এপ্রি', en: 'Nov–Apr' },
  'nov-apr': { bn: 'নভে–এপ্রি', en: 'Nov–Apr' },
  'apr–jun': { bn: 'এপ্রি–জুন', en: 'Apr–Jun' },
  'apr-jun': { bn: 'এপ্রি–জুন', en: 'Apr–Jun' },
  'jul–oct': { bn: 'জুলাই–অক্টো', en: 'Jul–Oct' },
  'jul-oct': { bn: 'জুলাই–অক্টো', en: 'Jul–Oct' }
};

export function monthLabel(month, lang = 'bn') {
  if (!month) return lang === 'bn' ? 'তথ্য নেই' : 'No data';
  const k = String(month).toLowerCase().trim();
  const match = MONTH_LABELS[k];
  if (match) return lang === 'bn' ? match.bn : match.en;
  return String(month);
}

export const SOIL_TRANSLATIONS = {
  clay_loam: { bn: 'এঁটেল দোআঁশ', en: 'Clay Loam' },
  loam: { bn: 'দোআঁশ', en: 'Loam' },
  silty_loam: { bn: 'পলি দোআঁশ', en: 'Silty Loam' },
  sandy_loam: { bn: 'বেলে দোআঁশ', en: 'Sandy Loam' },
  clay: { bn: 'এঁটেল', en: 'Clay' },
  silty_clay: { bn: 'পলি এঁটেল', en: 'Silty Clay' },
  sand: { bn: 'বেলে', en: 'Sand' },
  sandy_clay: { bn: 'বেলে এঁটেল', en: 'Sandy Clay' },
  unknown: { bn: 'অজানা মাটি', en: 'Unknown Soil' }
};

export function soilLabel(texture, lang = 'bn') {
  if (!texture) return lang === 'bn' ? 'তথ্য নেই' : 'Unknown';
  const k = String(texture).toLowerCase().trim().replace(/[\s-]+/g, '_');
  const match = SOIL_TRANSLATIONS[k];
  if (match) return lang === 'bn' ? match.bn : match.en;
  return String(texture);
}

export const UNIT_LABELS = {
  mm: { bn: 'মিমি', en: 'mm' },
  bigha: { bn: 'বিঘা', en: 'bigha' },
  ha: { bn: 'হেক্টর', en: 'ha' },
  hectare: { bn: 'হেক্টর', en: 'ha' },
  'maund/bigha': { bn: 'মণ/বিঘা', en: 'maund/bigha' },
  'mound/bigha': { bn: 'মণ/বিঘা', en: 'maund/bigha' },
  maund: { bn: 'মণ', en: 'maund' },
  mound: { bn: 'মণ', en: 'maund' },
  bdt: { bn: 'টাকা', en: 'BDT' },
  taka: { bn: 'টাকা', en: 'BDT' },
  kg: { bn: 'কেজি', en: 'kg' },
  'kg/ha': { bn: 'কেজি/হেক্টর', en: 'kg/ha' },
  'kg n/ha': { bn: 'কেজি N/হেক্টর', en: 'kg N/ha' },
  'kg n': { bn: 'কেজি N', en: 'kg N' },
  'bdt/ha': { bn: 'টাকা/হেক্টর', en: 'BDT/ha' },
  'bdt/bigha': { bn: 'টাকা/বিঘা', en: 'BDT/bigha' },
  't/ha': { bn: 'টন/হেক্টর', en: 't/ha' },
  ton: { bn: 'টন', en: 'ton' },
  'ton/ha': { bn: 'টন/হেক্টর', en: 'ton/ha' },
  days: { bn: 'দিন', en: 'days' },
  day: { bn: 'দিন', en: 'days' },
  c: { bn: '°সে', en: '°C' },
  '°c': { bn: '°সে', en: '°C' },
  'mm/day': { bn: 'মিমি/দিন', en: 'mm/day' },
  'mm/yr': { bn: 'মিমি/বছর', en: 'mm/yr' },
  'mm/season': { bn: 'মিমি/মৌসুম', en: 'mm/season' },
  percent: { bn: '%', en: '%' },
  '%': { bn: '%', en: '%' }
};

export function unitLabel(unit, lang = 'bn') {
  if (!unit) return '';
  const k = String(unit).toLowerCase().trim();
  const match = UNIT_LABELS[k];
  if (match) return lang === 'bn' ? match.bn : match.en;
  return String(unit);
}

export function formatMoney(amount, lang = 'bn', perUnit = null) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return lang === 'bn' ? 'তথ্য নেই' : 'No data';
  }
  const val = Math.round(Number(amount));
  const numStr = formatNumber(val, lang);
  if (lang === 'bn') {
    const unitSuffix = perUnit ? ` / ${unitLabel(perUnit, lang)}` : '';
    return `৳ ${numStr}${unitSuffix}`;
  } else {
    const unitSuffix = perUnit ? ` / ${unitLabel(perUnit, lang)}` : '';
    return `BDT ${numStr}${unitSuffix}`;
  }
}

export function formatUnit(value, unit, lang = 'bn', options = {}) {
  if (value === null || value === undefined || value === '') {
    return lang === 'bn' ? 'তথ্য নেই' : 'No data';
  }
  const num = Number(value);
  if (Number.isNaN(num)) return `${value} ${unitLabel(unit, lang)}`.trim();
  const lowerUnit = String(unit || '').toLowerCase();
  let defaultDecimals = 0;
  if (lowerUnit.includes('t/ha') || lowerUnit.includes('ton') || lowerUnit.includes('ratio')) {
    defaultDecimals = 1;
  }
  const decimals = options.decimals !== undefined ? options.decimals : defaultDecimals;
  const numStr = formatNumber(num, lang, { decimals });
  const u = unitLabel(unit, lang);
  return u ? `${numStr} ${u}` : numStr;
}
