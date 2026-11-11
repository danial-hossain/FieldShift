/**
 * FieldShift Demo Mode Annotations Catalog
 * Bilingual (EN / BN) for all application views and sub-tabs.
 * Strictly adheres to verified datasets: NASA POWER, GPM IMERG, GRACE-FO, BARC/SRDI, DAM, FAO-56, MILP.
 */

export const DEMO_ANNOTATIONS = {
  // 1. Overview Page
  overview: [
    {
      id: 'earth_view',
      selector: '[data-demo="earth_view"]',
      chip: 'NASA',
      title: {
        en: 'NASA Earth Observations',
        bn: 'নাসা ভূ-উপগ্রহ পর্যবেক্ষণ'
      },
      desc: {
        en: 'Interactive satellite view tracking seasonal telemetry across the Bengal Basin.',
        bn: 'বেঙ্গল বেসিনের স্যাটেলাইট টেলিমেট্রি ও মৌসুমি উপাত্ত পর্যবেক্ষণ।'
      }
    },
    {
      id: 'story_cards',
      selector: '[data-demo="story_cards"]',
      chip: 'GRACE-FO',
      title: {
        en: 'The Barind Story',
        bn: 'বরেন্দ্র অঞ্চলের কাহিনী'
      },
      desc: {
        en: 'Groundwater depletion, climate trends, and sustainable crop shifts explained step-by-step.',
        bn: 'ভূগর্ভস্থ পানির হ্রাস ও টেকসই ফসল আবর্তনের তথ্যভিত্তিক বিবরণ।'
      }
    },
    {
      id: 'progress_dots',
      selector: '[data-demo="progress_dots"]',
      chip: null,
      title: {
        en: 'Story Chapters',
        bn: 'অধ্যায়ের পরিক্রমা'
      },
      desc: {
        en: 'From satellite orbit down to field-level micro-decisions and economic resilience.',
        bn: 'মহাকাশ পর্যবেক্ষণ থেকে কৃষকের মাঠ পর্যায় পর্যন্ত বাস্তব সিদ্ধান্ত।'
      }
    },
    {
      id: 'play_button',
      selector: '[data-demo="play_button"]',
      chip: null,
      title: {
        en: 'Auto-Scroll Walkthrough',
        bn: 'স্বয়ংক্রিয় বর্ণনা প্লে'
      },
      desc: {
        en: 'Sit back as FieldShift smoothly guides you through the full visual Barind narrative.',
        bn: 'এক ক্লিকেই স্বয়ংক্রিয়ভাবে পুরো বরেন্দ্র অঞ্চলের বিশ্লেষণ দেখে নিন।'
      }
    }
  ],

  // 2. My Fields Page
  myfields: [
    {
      id: 'sat_map',
      selector: '[data-demo="sat_map"]',
      chip: 'ESRI',
      title: {
        en: 'Satellite Field Map',
        bn: 'স্যাটেলাইট জমির ম্যাপ'
      },
      desc: {
        en: 'High-resolution field boundary overlay with GPS coordinate pinning.',
        bn: 'উচ্চ রেজুলিউশনের স্যাটেলাইট ম্যাপে আপনার জমির সুনির্দিষ্ট অবস্থান নির্ধারণ।'
      }
    },
    {
      id: 'add_field',
      selector: '[data-demo="add_field"]',
      chip: null,
      title: {
        en: 'Register Field',
        bn: 'নতুন জমি যোগ করুন'
      },
      desc: {
        en: 'Drop a pin or draw polygons to register your land with GPS coordinates.',
        bn: 'ম্যাপে পিন ফেলে বা বহুভুজ সীমানা এঁকে তাৎক্ষণিক জমি নিবন্ধন করুন।'
      }
    },
    {
      id: 'field_list',
      selector: '[data-demo="field_list"]',
      chip: null,
      title: {
        en: 'Registered Fields',
        bn: 'সংরক্ষিত জমি তালিকা'
      },
      desc: {
        en: 'Manage individual parcels with verified area in bigha and hectares.',
        bn: 'বিঘা ও হেক্টরে জমির সঠিক আয়তন ও অতীতের ফসলের রেকর্ড দেখুন।'
      }
    },
    {
      id: 'soil_card',
      selector: '[data-demo="soil_card"]',
      chip: 'BARC / SRDI',
      title: {
        en: 'Soil Composition',
        bn: 'মৃত্তিকা বৈশিষ্ট্য'
      },
      desc: {
        en: 'Calibrated soil texture, pH, and organic matter from national soil registries.',
        bn: 'মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট (SRDI) ভিত্তিক মাটির গঠন ও উর্বরতা।'
      }
    }
  ],

  // 3. Rotation Planner: MILP Sub-Tab
  planner_milp: [
    {
      id: 'farm_3d',
      selector: '[data-demo="farm_3d"]',
      chip: null,
      title: {
        en: '3D Farm & Timeline',
        bn: '৩ডি খামার ও টাইমলাইন'
      },
      desc: {
        en: 'Interactive 2-year season timeline player (Nov–Oct) animating crop life cycles.',
        bn: '৩ডি খামারে ২ বছরের ফসল চক্র ও বৃদ্ধির পর্যায় সিমুলেশন।'
      }
    },
    {
      id: 'strategy_picker',
      selector: '[data-demo="strategy_picker"]',
      chip: 'MILP',
      title: {
        en: '5 Optimization Strategies',
        bn: '৫টি অপ্টিমাইজড কৌশল'
      },
      desc: {
        en: 'Choose Balanced, Profit, Water saving, or Soil health mathematical plans.',
        bn: 'ভারসাম্যপূর্ণ, সর্বোচ্চ লাভ, পানি সাশ্রয় কিংবা মাটির পুষ্টি সুরক্ষার পরিকল্পনা।'
      }
    },
    {
      id: 'six_season_sequence',
      selector: '[data-demo="six_season_sequence"]',
      chip: null,
      title: {
        en: '6-Season Sequence',
        bn: '৬-মৌসুমের ফসল চক্র'
      },
      desc: {
        en: 'Crop sequencing across Rabi, Kharif-1, and Kharif-2 preventing pest buildup.',
        bn: 'রবি, খরিপ-১ এবং খরিপ-২ মৌসুমে বিজ্ঞানসম্মত ফসলের ধারাবাহিকতা।'
      }
    },
    {
      id: 'financial_summary',
      selector: '[data-demo="financial_summary"]',
      chip: 'FAO-56',
      title: {
        en: 'Projected Metrics',
        bn: 'প্রত্যাশিত আয় ও পানি'
      },
      desc: {
        en: 'Annual net profit (BDT), irrigation demand (mm), and organic matter trend.',
        bn: 'প্রত্যাশিত বাৎসরিক নিট লাভ (টাকা), মোট সেচ চাহিদা (মিমি) ও পুষ্টি ধারা।'
      }
    },
    {
      id: 'compare_button',
      selector: '[data-demo="compare_button"]',
      chip: null,
      title: {
        en: 'Compare Farming Baseline',
        bn: 'বর্তমান চাষের সাথে তুলনা'
      },
      desc: {
        en: 'Direct side-by-side verification against conventional Boro rice monoculture.',
        bn: 'সনাতন বোরো ধান চাষের সাথে সরাসরি লাভ ও পানি সাশ্রয়ের তুলনা।'
      }
    }
  ],

  // 4. Rotation Planner: Adaptive Replan Sub-Tab
  planner_replan: [
    {
      id: 'harvest_card',
      selector: '[data-demo="harvest_card"]',
      chip: null,
      title: {
        en: 'Record Harvest Yield',
        bn: 'আসল ফলন লিপিবদ্ধ করুন'
      },
      desc: {
        en: 'Enter actual maunds harvested or mark early termination due to market or weather.',
        bn: 'মাঠের প্রকৃত ফলন (মণ/বিঘা) বা আগাম তোলার তথ্য প্রবেশ করান।'
      }
    },
    {
      id: 'replan_trigger',
      selector: '[data-demo="replan_trigger"]',
      chip: 'MILP',
      title: {
        en: 'Adaptive Replan',
        bn: 'অভিযোজিত পুনঃপরিকল্পনা'
      },
      desc: {
        en: 'Re-runs MILP solver to re-optimize remaining seasons and protect farm income.',
        bn: 'পূর্ববর্তী মৌসুমের লাভ-ক্ষতি সমন্বয় করে অবশিষ্ট মৌসুমগুলোর নতুন সমাধান।'
      }
    },
    {
      id: 'changed_seasons',
      selector: '[data-demo="changed_seasons"]',
      chip: null,
      title: {
        en: 'Adapted Crop Plan',
        bn: 'সংশোধিত ফসল সূচি'
      },
      desc: {
        en: 'Shows exact crop shifts, adjusted sowing dates, and updated net margin projections.',
        bn: 'কোন ফসলে পরিবর্তন হলো, রোপণের নতুন তারিখ এবং পরিবর্তিত আয়ের বিবরণ।'
      }
    }
  ],

  // 5. Rotation Planner: Stress Test Sub-Tab
  planner_stress: [
    {
      id: 'drought_slider',
      selector: '[data-demo="drought_slider"]',
      chip: null,
      title: {
        en: 'Drought Severity',
        bn: 'খরা তীব্রতা নির্ধারণ'
      },
      desc: {
        en: 'Simulate severe dry winter Rabi or 30-50% monsoon rainfall deficits.',
        bn: 'শুকনো শীতকাল কিংবা ৩০-৫০% কম বৃষ্টির কৃত্রিম খরা সিমুলেশন।'
      }
    },
    {
      id: 'delay_slider',
      selector: '[data-demo="delay_slider"]',
      chip: null,
      title: {
        en: 'Monsoon Delay',
        bn: 'বর্ষা বিলম্বের মাত্রা'
      },
      desc: {
        en: 'Stress-test late Kharif-2 monsoon onset up to 30 days past normal historical window.',
        bn: 'স্বাভাবিক সময়ের চেয়ে ১০ থেকে ৩০ দিন দেরিতে বর্ষা আসার ঝুঁকি পরীক্ষা।'
      }
    },
    {
      id: 'robustness_score',
      selector: '[data-demo="robustness_score"]',
      chip: 'GPM IMERG',
      title: {
        en: 'Climate Robustness',
        bn: 'পরিকল্পনার টেকসই স্কোর'
      },
      desc: {
        en: 'Empirical survival rate across 100 historical climate scenarios.',
        bn: '১০০টি ঐতিহাসিক জলবায়ু পরিস্থিতিতে প্রস্তাবিত পরিকল্পনার টিকে থাকার হার।'
      }
    }
  ],

  // 6. Rotation Planner: Compare Sub-Tab
  planner_compare: [
    {
      id: 'strategy_cards',
      selector: '[data-demo="strategy_cards"]',
      chip: 'MILP',
      title: {
        en: '5 Strategies Compared',
        bn: '৫টি কৌশলের তুলনা'
      },
      desc: {
        en: 'Compare all MILP optimization variants against farmer baseline simultaneously.',
        bn: 'এক নজরে ৫টি ভিন্ন কৌশলের ফসল তালিকা ও ফলাফলের তুলনা।'
      }
    },
    {
      id: 'net_profit_delta',
      selector: '[data-demo="net_profit_delta"]',
      chip: 'DAM',
      title: {
        en: 'Net Profit Advantage',
        bn: 'অতিরিক্ত নিট মুনাফা'
      },
      desc: {
        en: 'Additional income earned over conventional Boro rice cultivation.',
        bn: 'সনাতন চাষের তুলনায় অতিরিক্ত কত টাকা বেশি ঘরে আসবে।'
      }
    },
    {
      id: 'water_saving_delta',
      selector: '[data-demo="water_saving_delta"]',
      chip: 'FAO-56',
      title: {
        en: 'Water Savings (Litres)',
        bn: 'পানি সাশ্রয়ের পরিমাণ'
      },
      desc: {
        en: 'Groundwater litres saved per bigha by eliminating continuous flooding.',
        bn: 'অবিরাম জলাবদ্ধতা বাদ দিয়ে প্রতি বিঘায় কত লক্ষ লিটার পানি বাঁচবে।'
      }
    }
  ],

  // 7. Climate & Risk Page (DS3 strict order & facts)
  climate: [
    {
      id: 'risk_calendar',
      selector: '[data-demo="risk_calendar"]',
      chip: 'GPM IMERG · NASA POWER',
      title: {
        en: 'Risk by month',
        bn: 'মাসভিত্তিক ঝুঁকি'
      },
      desc: {
        en: 'How often each risk hit your field in each month, over 24 years. Darker = more often.',
        bn: '২৪ বছরে প্রতি মাসে আপনার জমিতে দুর্যোগ আসার হার। গাঢ় রঙ = বেশি ঘন ঘন।'
      }
    },
    {
      id: 'risk_action_row',
      selector: '[data-demo="risk_action_row"]',
      chip: null,
      title: {
        en: 'What to do',
        bn: 'কী করণীয়'
      },
      desc: {
        en: 'The crop, the risky month and one action, e.g. irrigate at flowering.',
        bn: 'কোন ফসলের কোন মাসে ঝুঁকি এবং মাঠপর্যায়ে কী পদক্ষেপ নিতে হবে (যেমন ফুলে সেচ)।'
      }
    },
    {
      id: 'climate_trends',
      selector: '[data-demo="climate_trends"]',
      chip: 'NASA POWER · GPM IMERG',
      title: {
        en: 'Is it changing?',
        bn: 'পরিবর্তন কি নিশ্চিত?'
      },
      desc: {
        en: '24+ years of NASA data for your point. "Not significant" means the change could be chance (p > 0.05).',
        bn: 'আপনার জমির ২৪+ বছরের নাসা উপাত্ত। "নিশ্চিত নয়" মানে পরিবর্তনটি কাকতালীয় হতে পারে (p > ০.০৫)।'
      }
    },
    {
      id: 'water_storage_trend',
      selector: '[data-demo="water_storage_trend"]',
      chip: 'GRACE-FO',
      title: {
        en: 'Water under the ground',
        bn: 'মাটির নিচের পানি'
      },
      desc: {
        en: 'GRACE-FO satellites: regional groundwater trend for your area and −1.07 cm/yr for the Barind region.',
        bn: 'নাসা গ্রেস-এফও স্যাটেলাইট: আপনার এলাকার ভূগর্ভস্থ পানি সঞ্চয় ধারা ও বরেন্দ্রে −১.০৭ সেমি/বছর।'
      }
    },
    {
      id: 'recent_weather',
      selector: '[data-demo="recent_weather"]',
      chip: 'NASA POWER',
      title: {
        en: 'Last 30 days',
        bn: 'গত ৩০ দিন'
      },
      desc: {
        en: 'This month vs the normal for your field over the 24-year baseline.',
        bn: '২৪ বছরের গড়ের তুলনায় আপনার জমিতে চলতি মাসের আবহাওয়া।'
      }
    }
  ],

  // 8. Water & Irrigation Page
  water: [
    {
      id: 'water_storage_trend',
      selector: '[data-demo="water_storage_trend"]',
      chip: 'GRACE-FO',
      title: {
        en: 'Groundwater Storage Trend',
        bn: 'ভূগর্ভস্থ পানি হ্রাস'
      },
      desc: {
        en: 'NASA GRACE-FO measurement showing Barind groundwater storage falling −1.07 cm/year.',
        bn: 'নাসা গ্রেস স্যাটেলাইট পরিমাপে বরেন্দ্র অঞ্চলের ভূগর্ভস্থ পানি প্রতি বছর ১.০৭ সেমি নিচে নামার প্রমাণ।'
      }
    },
    {
      id: 'irrigation_table',
      selector: '[data-demo="irrigation_table"]',
      chip: 'FAO-56 · GPM IMERG',
      title: {
        en: 'Seasonal Water Balance',
        bn: 'মৌসুমি পানি ভারসাম্য'
      },
      desc: {
        en: 'Itemized balance terms: rain, effective rain, ETc, deep percolation, and irrigation demand.',
        bn: 'বৃষ্টি, কার্যকর বৃষ্টি, ফসলের বাষ্পীভবন ও চুইয়ে পড়ার সুনির্দিষ্ট হিসাব।'
      }
    },
    {
      id: 'pump_helper',
      selector: '[data-demo="pump_helper"]',
      chip: null,
      title: {
        en: 'Pump Runtime Helper',
        bn: 'পাম্প চালানোর সময়'
      },
      desc: {
        en: 'Calculates exact pump runtime in hours based on your tube-well capacity (litres/hr).',
        bn: 'আপনার পাম্পের ধারণক্ষমতা অনুযায়ী কত ঘণ্টা পাম্প চালাতে হবে তার হিসাব।'
      }
    },
    {
      id: 'water_balance_details',
      selector: '[data-demo="water_balance_details"]',
      chip: 'FAO-56',
      title: {
        en: 'AWD Irrigation Method',
        bn: 'এডব্লিউডি সেচ পদ্ধতি'
      },
      desc: {
        en: 'Alternate Wetting & Drying reduces water use by up to 35% without yield penalty.',
        bn: 'পর্যায়ক্রমে ভেজানো ও শুকানো পদ্ধতিতে ৩৫% কম পানিতে সমান ফলন।'
      }
    }
  ],

  // 9. Market & Profit Page
  market: [
    {
      id: 'wholesale_prices',
      selector: '[data-demo="wholesale_prices"]',
      chip: 'DAM',
      title: {
        en: 'Wholesale Market Rates',
        bn: 'পাইকারি বাজার দর'
      },
      desc: {
        en: 'Live wholesale rates from the Department of Agricultural Marketing (DAM).',
        bn: 'সরকারি কৃষি বিপণন অধিদপ্তর (DAM) থেকে সরাসরি পাইকারি বাজার দর।'
      }
    },
    {
      id: 'price_forecast',
      selector: '[data-demo="price_forecast"]',
      chip: 'DAM',
      title: {
        en: 'Seasonal Price Forecast',
        bn: 'মৌসুমি দর পূর্বাভাস'
      },
      desc: {
        en: 'Historical price volatility bands predicting harvest-time returns to secure peak margins.',
        bn: 'ফসল তোলার সময় বাজার দর কেমন থাকবে তার পূর্বাভাস ও সর্বোচ্চ মুনাফার সময়।'
      }
    },
    {
      id: 'buyer_contacts',
      selector: '[data-demo="buyer_contacts"]',
      chip: null,
      title: {
        en: 'Verified Local Buyers',
        bn: 'স্থানীয় পাইকার ও মিলার'
      },
      desc: {
        en: 'Direct contact phone numbers for local aggregators, dal mills, and oil processors.',
        bn: 'সরাসরি তেলকল, ডালকল ও স্থানীয় পাইকারদের সাথে যোগাযোগের নম্বর।'
      }
    }
  ],

  // 10. Evidence & Methodology Page
  evidence: [
    {
      id: 'satellite_methodology',
      selector: '[data-demo="satellite_methodology"]',
      chip: 'NASA',
      title: {
        en: 'Satellite Data Architecture',
        bn: 'স্যাটেলাইট ডেটা আর্কিটেকচার'
      },
      desc: {
        en: 'Integration pipeline for NASA POWER, GPM IMERG, GRACE-FO, and ISRIC SoilGrids.',
        bn: 'নাসা পাওয়ার, আইমার্জ ও মৃত্তিকা তথ্য কীভাবে একত্রে সমন্বয় করা হয়।'
      }
    },
    {
      id: 'math_formulation',
      selector: '[data-demo="math_formulation"]',
      chip: 'MILP',
      title: {
        en: 'MILP Optimization Model',
        bn: 'গাণিতিক অপ্টিমাইজেশন মডেল'
      },
      desc: {
        en: 'Mixed-Integer Linear Programming balancing gross margin, water limits, and rotational rules.',
        bn: 'মিশ্র-পূর্ণসংখ্যা রৈখিক প্রোগ্রামিং (MILP) সমীকরণ ও ফসল নির্বাচনের গাণিতিক শর্ত।'
      }
    },
    {
      id: 'model_benchmarks',
      selector: '[data-demo="model_benchmarks"]',
      chip: 'FAO-56',
      title: {
        en: 'Model Benchmarks',
        bn: 'মডেল বেঞ্চমার্ক'
      },
      desc: {
        en: 'Empirical yield, revenue, and water savings validation across 3 agro-ecological zones.',
        bn: '৩টি কৃষি-পরিবেশ অঞ্চলে সনাতন চাষের তুলনায় ফিল্ডশিফটের ফলন ও লাভ যাচাই।'
      }
    }
  ],

  // 11. Floating Assistant
  floating_chat: [
    {
      id: 'ai_assistant',
      selector: '[data-demo="ai_assistant"]',
      chip: null,
      title: {
        en: 'Ask the AI',
        bn: 'এআই সহকারীকে প্রশ্ন করুন'
      },
      desc: {
        en: 'Questions about this page, in Bangla or English.',
        bn: 'এই পৃষ্ঠার তথ্য সম্পর্কে যে কোনো প্রশ্ন করুন, বাংলায় অথবা ইংরেজিতে।'
      }
    }
  ]
};
