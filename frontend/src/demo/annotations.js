/**
 * FieldShift Demo Mode Annotations Catalog
 * Bilingual (EN / BN) for all application views and sub-tabs.
 */

export const DEMO_ANNOTATIONS = {
  // 1. Overview Page
  overview: [
    {
      id: 'earth_view',
      selector: '[data-demo="earth_view"]',
      title: {
        en: 'NASA Earth Observations',
        bn: 'নাসা ভূ-উপগ্রহ পর্যবেক্ষণ'
      },
      desc: {
        en: '3D interactive globe and satellite orbit tracking daily telemetry across the Bengal Basin.',
        bn: 'বেঙ্গল বেসিনের ৩ডি গ্লোব ও প্রতিদিনের স্যাটেলাইট টেলিমেট্রি পর্যবেক্ষণ।'
      }
    },
    {
      id: 'story_cards',
      selector: '[data-demo="story_cards"]',
      title: {
        en: 'The Barind Story',
        bn: 'বরেন্দ্র অঞ্চলের কাহিনী'
      },
      desc: {
        en: 'Groundwater depletion, climate shocks, and optimal crop transitions explained step-by-step.',
        bn: 'ভূগর্ভস্থ পানির সংকট, আবহাওয়ার প্রভাব ও লাভজনক ফসল আবর্তনের তথ্যভিত্তিক বর্ণনা।'
      }
    },
    {
      id: 'progress_dots',
      selector: '[data-demo="progress_dots"]',
      title: {
        en: '10 Chapter Journey',
        bn: '১০ অধ্যায়ের পরিক্রমা'
      },
      desc: {
        en: 'From satellite orbit to field-level micro-decisions and economic resilience.',
        bn: 'মহাকাশ কক্ষপথ থেকে কৃষকের মাঠ পর্যায় পর্যন্ত বাস্তবসম্মত সিদ্ধান্ত রূপরেখা।'
      }
    },
    {
      id: 'play_button',
      selector: '[data-demo="play_button"]',
      title: {
        en: 'Auto-Scroll Walkthrough',
        bn: 'স্বয়ংক্রিয় বর্ণনা প্লে'
      },
      desc: {
        en: 'Sit back as FieldShift smoothly guides you through the full visual Barind narrative.',
        bn: 'এক ক্লিকেই স্বয়ংক্রিয়ভাবে পুরো বরেন্দ্র বিশ্লেষণ দেখে নিন।'
      }
    }
  ],

  // 2. My Fields Page
  myfields: [
    {
      id: 'sat_map',
      selector: '[data-demo="sat_map"]',
      title: {
        en: 'ESRI Satellite Imagery',
        bn: 'ইএসআরআই স্যাটেলাইট ম্যাপ'
      },
      desc: {
        en: 'High-resolution field boundary overlay with interactive GPS pin dropping.',
        bn: 'উচ্চ রেজুলিউশনের স্যাটেলাইট ম্যাপে আপনার জমির সুনির্দিষ্ট সীমানা নির্ধারণ।'
      }
    },
    {
      id: 'field_list',
      selector: '[data-demo="field_list"]',
      title: {
        en: 'Stored Parcels',
        bn: 'সংরক্ষিত জমি তালিকা'
      },
      desc: {
        en: 'Manage individual land plots with precise area (bigha/ha) and crop histories.',
        bn: 'জমির সঠিক আয়তন (বিঘা/হেক্টর) ও অতীতের ফসল ইতিহাস সংরক্ষণ করুন।'
      }
    },
    {
      id: 'add_field',
      selector: '[data-demo="add_field"]',
      title: {
        en: 'Add Field Boundary',
        bn: 'নতুন জমি যোগ করুন'
      },
      desc: {
        en: 'Click on satellite map to drop a pin or draw polygons for instant soil analysis.',
        bn: 'ম্যাপে পিন ফেলে বা বহুভুজ সীমানা এঁকে তাৎক্ষণিক মাটি পরীক্ষা করুন।'
      }
    },
    {
      id: 'soil_card',
      selector: '[data-demo="soil_card"]',
      title: {
        en: 'BARC / SRDI Soil Data',
        bn: 'মৃত্তিকা সম্পদ তথ্য'
      },
      desc: {
        en: 'Calibrated soil texture, pH, and organic matter from Bangladesh national registries.',
        bn: 'বাংলাদেশ মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট (SRDI) ভিত্তিক মাটির গঠন ও উর্বরতা।'
      }
    }
  ],

  // 3. Rotation Planner: MILP Sub-Tab
  planner_milp: [
    {
      id: 'farm_3d',
      selector: '[data-demo="farm_3d"]',
      title: {
        en: '3D Farm & Timeline',
        bn: '৩ডি খামার ও টাইমলাইন'
      },
      desc: {
        en: 'Visual crop beds and interactive 2-year season timeline player (Nov–Oct).',
        bn: '৩ডি খামারে ২ বছরের ফসল চক্র ও বৃদ্ধির পর্যায় সিমুলেশন।'
      }
    },
    {
      id: 'strategy_picker',
      selector: '[data-demo="strategy_picker"]',
      title: {
        en: '5 MILP Strategies',
        bn: '৫টি অপ্টিমাইজড কৌশল'
      },
      desc: {
        en: 'Choose Balanced, Profit, Water Saving, or Soil Health multi-objective optimizations.',
        bn: 'ভারসাম্যপূর্ণ, সর্বোচ্চ লাভ, পানি সাশ্রয় কিংবা মাটির পুষ্টি সুরক্ষার গাণিতিক পরিকল্পনা।'
      }
    },
    {
      id: 'six_season_sequence',
      selector: '[data-demo="six_season_sequence"]',
      title: {
        en: '6-Season Sequence',
        bn: '৬-মৌসুমের ফসল চক্র'
      },
      desc: {
        en: 'Optimized crop choices across Rabi, Kharif-1, and Kharif-2 preventing pest cycles.',
        bn: 'রবি, খরিপ-১ এবং খরিপ-২ মৌসুমে বিজ্ঞানসম্মত ফসলের ধারাবাহিকতা।'
      }
    },
    {
      id: 'financial_summary',
      selector: '[data-demo="financial_summary"]',
      title: {
        en: 'Financial & Resource KPIs',
        bn: 'আয়-ব্যয় ও পানি সারসংক্ষেপ'
      },
      desc: {
        en: 'Projected net profit (BDT), irrigation demand (mm), and organic matter trend.',
        bn: 'প্রত্যাশিত নিট লাভ (টাকা), মোট সেচ চাহিদা (মিমি) ও মাটির জৈব পদার্থের পরিবর্তন।'
      }
    },
    {
      id: 'compare_button',
      selector: '[data-demo="compare_button"]',
      title: {
        en: 'Compare Farming Baseline',
        bn: 'বর্তমান চাষের সাথে তুলনা'
      },
      desc: {
        en: 'Direct side-by-side verification against conventional Boro-Rice monoculture.',
        bn: 'সনাতন বোরো ধান চাষের সাথে সরাসরি লাভ ও পানি সাশ্রয়ের তুলনা।'
      }
    }
  ],

  // 4. Rotation Planner: Adaptive Replan Sub-Tab
  planner_replan: [
    {
      id: 'harvest_card',
      selector: '[data-demo="harvest_card"]',
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
      title: {
        en: 'Adaptive Replan',
        bn: 'অভিযোজিত পুনঃপরিকল্পনা'
      },
      desc: {
        en: 'Re-runs MILP solver to dynamically re-optimize remaining seasons to recoup losses.',
        bn: 'পূর্ববর্তী মৌসুমের লাভ-ক্ষতি সমন্বয় করে অবশিষ্ট মৌসুমগুলোর নতুন সমাধান।'
      }
    },
    {
      id: 'changed_seasons',
      selector: '[data-demo="changed_seasons"]',
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
      title: {
        en: 'Drought Severity Slider',
        bn: 'খরা তীব্রতা নির্ধারণ'
      },
      desc: {
        en: 'Simulate extreme dry Rabi winter or 30-50% monsoon rainfall deficits.',
        bn: 'শুকনো শীতকাল কিংবা ৩০-৫০% কম বৃষ্টির কৃত্রিম খরা সিমুলেশন।'
      }
    },
    {
      id: 'delay_slider',
      selector: '[data-demo="delay_slider"]',
      title: {
        en: 'Monsoon Delay Slider',
        bn: 'বর্ষা বিলম্বের মাত্রা'
      },
      desc: {
        en: 'Stress-test late Kharif-2 onset up to 30 days past normal historical window.',
        bn: 'স্বাভাবিক সময়ের চেয়ে ১০ থেকে ৩০ দিন দেরিতে বর্ষা আসার ঝুঁকি পরীক্ষা।'
      }
    },
    {
      id: 'robustness_score',
      selector: '[data-demo="robustness_score"]',
      title: {
        en: 'Robustness Score',
        bn: 'পরিকল্পনার টেকসই স্কোর'
      },
      desc: {
        en: 'Empirical survival rate across 100 Monte Carlo climate simulations.',
        bn: '১০০টি জলবায়ু সিমুলেশনে প্রস্তাবিত পরিকল্পনার টিকে থাকার শতকরা হার।'
      }
    }
  ],

  // 6. Rotation Planner: Compare Sub-Tab
  planner_compare: [
    {
      id: 'strategy_cards',
      selector: '[data-demo="strategy_cards"]',
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
      title: {
        en: 'Net Profit Delta',
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
      title: {
        en: 'Water Savings (Litres)',
        bn: 'পানি সাশ্রয়ের পরিমাণ'
      },
      desc: {
        en: 'Groundwater litres saved per bigha by eliminating continuous flooding.',
        bn: 'অবিরাম জলাবদ্ধতা বাদ দিয়ে প্রতি বিঘায় কত লক্ষ লিটার ভূগর্ভস্থ পানি বাঁচবে।'
      }
    }
  ],

  // 7. Climate Page
  climate: [
    {
      id: 'nasa_power_chart',
      selector: '[data-demo="nasa_power_chart"]',
      title: {
        en: 'NASA POWER Climatology',
        bn: 'নাসা পাওয়ার জলবায়ু গ্রাফ'
      },
      desc: {
        en: '40-year daily temperature, solar radiation, humidity, and rainfall series.',
        bn: '১৯৮১-২০২৪ সালের প্রতিদিনের তাপমাত্রা, সৌর বিকিরণ ও বৃষ্টিপাতের সঠিক রেকর্ড।'
      }
    },
    {
      id: 'monsoon_onset',
      selector: '[data-demo="monsoon_onset"]',
      title: {
        en: 'Monsoon Onset Window',
        bn: 'বর্ষা আগমনের পূর্বাভাস'
      },
      desc: {
        en: 'CHIRPS and IMERG calibrated probabilistic rainfall onset timing for Kharif-2.',
        bn: 'আমন ধান রোপণের জন্য বর্ষা কখন শুরু হবে তার সম্ভাব্য ক্যালেন্ডার।'
      }
    },
    {
      id: 'risk_cards',
      selector: '[data-demo="risk_cards"]',
      title: {
        en: 'Monthly Risk Alerts',
        bn: 'মাসিক আবহাওয়া ঝুঁকি'
      },
      desc: {
        en: 'Heatwaves in April, early frost in January, and flood risks in August mapped by crop stage.',
        bn: 'এপ্রিলে তাপদাহ, জানুয়ারিতে কুয়াশা ও আগস্টের বন্যা ঝুঁকির আগাম সংকেত।'
      }
    }
  ],

  // 8. Water Page
  water: [
    {
      id: 'water_storage_trend',
      selector: '[data-demo="water_storage_trend"]',
      title: {
        en: 'NASA GRACE Storage Trend',
        bn: 'গ্রাউন্ডওয়াটার হ্রাস (নাসা গ্রেস)'
      },
      desc: {
        en: 'GRACE-FO satellite measurement showing Barind groundwater falling -1.07 cm/year.',
        bn: 'বরেন্দ্র অঞ্চলের ভূগর্ভস্থ পানি প্রতি বছর ১.০৭ সেমি নিচে নামার স্যাটেলাইট প্রমাণ।'
      }
    },
    {
      id: 'irrigation_table',
      selector: '[data-demo="irrigation_table"]',
      title: {
        en: 'AWD Irrigation Schedule',
        bn: 'এডব্লিউডি সেচ সময়সূচি'
      },
      desc: {
        en: 'Alternate Wetting & Drying reduces water use by 35% without yield penalty.',
        bn: 'পর্যায়ক্রমে ভেজানো ও শুকানো পদ্ধতিতে ৩৫% কম পানিতে সমান ফলন।'
      }
    },
    {
      id: 'pump_helper',
      selector: '[data-demo="pump_helper"]',
      title: {
        en: 'Pump Runtime Helper',
        bn: 'পাম্প চালানোর হিসাব'
      },
      desc: {
        en: 'Calculates exact pumping hours needed per irrigation event based on your tube-well.',
        bn: 'আপনার পাম্পের ধারণক্ষমতা অনুযায়ী কত ঘণ্টা পাম্প চালাতে হবে তার হিসাব।'
      }
    },
    {
      id: 'water_balance_details',
      selector: '[data-demo="water_balance_details"]',
      title: {
        en: 'Water Balance Details',
        bn: 'পানি ভারসাম্যের হিসাব'
      },
      desc: {
        en: 'Itemized seasonal breakdown: rain, effective rain, irrigation, ETc, and deep percolation.',
        bn: 'বৃষ্টি, কার্যকর বৃষ্টি, সেচ, ফসলের বাষ্পীভবন ও চুইয়ে পড়ার সুনির্দিষ্ট হিসাব।'
      }
    }
  ],

  // 9. Market Page
  market: [
    {
      id: 'wholesale_prices',
      selector: '[data-demo="wholesale_prices"]',
      title: {
        en: 'DAM Daily Wholesale Prices',
        bn: 'কৃষি বিপণন পাইকারি দর'
      },
      desc: {
        en: 'Live bazaar market rates from Bangladesh Department of Agricultural Marketing.',
        bn: 'সরকারি কৃষি বিপণন অধিদপ্তর (DAM) থেকে প্রতিদিনের বাজার পাইকারি দর।'
      }
    },
    {
      id: 'price_forecast',
      selector: '[data-demo="price_forecast"]',
      title: {
        en: 'Seasonal Price Forecast',
        bn: 'মৌসুমি দর পূর্বাভাস'
      },
      desc: {
        en: 'Statistical price bands predicting harvest-time prices to secure peak margins.',
        bn: 'ফসল তোলার সময় বাজার দর কেমন থাকবে তার পূর্বাভাস ও সর্বোচ্চ মুনাফার সময়।'
      }
    },
    {
      id: 'buyer_contacts',
      selector: '[data-demo="buyer_contacts"]',
      title: {
        en: 'Verified Local Buyers',
        bn: 'স্থানীয় পাইকার ও মিলার'
      },
      desc: {
        en: 'Direct contact phone numbers for local aggregators, dal mills, and mustard oil processors.',
        bn: 'সরাসরি তেলকল, ডালকল ও স্থানীয় পাইকারদের সাথে যোগাযোগের নম্বর।'
      }
    }
  ],

  // 10. Evidence Page
  evidence: [
    {
      id: 'satellite_methodology',
      selector: '[data-demo="satellite_methodology"]',
      title: {
        en: 'Satellite Data Architecture',
        bn: 'স্যাটেলাইট ডেটা আর্কিটেকচার'
      },
      desc: {
        en: 'Integration workflow for NASA POWER, GPM IMERG, GRACE-FO, and ISRIC SoilGrids.',
        bn: 'নাসা পাওয়ার, আইমার্জ ও মৃত্তিকা তথ্য কীভাবে একত্রে সমন্বয় করা হয়।'
      }
    },
    {
      id: 'math_formulation',
      selector: '[data-demo="math_formulation"]',
      title: {
        en: 'MILP Optimization Engine',
        bn: 'গাণিতিক অপ্টিমাইজেশন মডেল'
      },
      desc: {
        en: 'Mixed-Integer Linear Programming objective equations, water budgets, and agronomic constraints.',
        bn: 'মিশ্র-পূর্ণসংখ্যা রৈখিক প্রোগ্রামিং (MILP) সমীকরণ ও ফসল নির্বাচনের গাণিতিক শর্ত।'
      }
    },
    {
      id: 'model_benchmarks',
      selector: '[data-demo="model_benchmarks"]',
      title: {
        en: 'FieldShift Model Benchmarks',
        bn: 'মাঠ গবেষণা বেঞ্চমার্ক'
      },
      desc: {
        en: 'Comparative yield, revenue, and water savings validation across 3 agro-ecological zones.',
        bn: '৩টি কৃষি-পরিবেশ অঞ্চলে সনাতন চাষের তুলনায় ফিল্ডশিফটের ফলন ও লাভ যাচাই।'
      }
    }
  ],

  // 11. Floating Assistant
  floating_chat: [
    {
      id: 'ai_assistant',
      selector: '[data-demo="ai_assistant"]',
      title: {
        en: 'Agronomist AI Assistant',
        bn: 'কৃষি বিশেষজ্ঞ এআই সহকারী'
      },
      desc: {
        en: 'Chat with FieldShift agronomist in Bangla or English for tailored advice on your soil & crop.',
        bn: 'আপনার জমির ফসল, রোগবালাই ও সেচ বিষয়ে বাংলায় কথা বলে সমাধান নিন।'
      }
    }
  ]
};
