// frontend/src/three/farmSceneHelpers.js
// Pure helpers for 3D Farm Scene (G0 / P3D Architecture)

export const FARM_PALETTE = {
  bg_dark: '#0b110f',
  bg_light: '#f1f5f3',
  grass_dark: '#5f8f3c',
  grass_light: '#72a34b',
  crop_rice: '#6ba353',
  crop_wheat: '#d4bc70',
  crop_mustard: '#e5b338',
  crop_pulse: '#7ea45f',
  crop_sunflower: '#eab308',
  crop_jute: '#4d8c48',
  crop_sesame: '#88a85e',
  crop_potato: '#5a8244',
  crop_maize: '#6c9945',
  crop_tomato: '#5c8c4a',
  water: '#72b8ce',
  water_standing: 'rgba(114, 184, 206, 0.65)',
  soil_base: '#8a5a3a',
  soil_drought: '#b8946e',
  soil_wet: '#543825',
  strata_mid: '#7a4628',
  strata_bot: '#574030',
  barn_wall: '#ece4d4',
  barn_roof: '#5f6d74',
  silo: '#e2e2da',
  fence: '#bfa77e',
  wood: '#664a32',
  tree_dark: '#416e2a',
  tree_light: '#548737',
};

export const CROPS_META = {
  boro: { bn: 'বোরো ধান', en: 'Boro Rice', fam: 'Poaceae', water: '১০০০–১২০০ মিমি', soil: 'নিবিড় সেচ', why: 'শীতের সেচনির্ভর ধান। ফলন বেশি, কিন্তু ভূগর্ভস্থ পানি অনেক লাগে।', color: '#7fae3c', type: 'rice' },
  aman: { bn: 'আমন ধান', en: 'T. Aman Rice', fam: 'Poaceae', water: 'প্রায় বৃষ্টিনির্ভর', soil: 'খড় অবশিষ্ট', why: 'বর্ষার ধান। বৃষ্টিই প্রধান পানির উৎস, তাই সেচ খুব কম লাগে।', color: '#5f9e35', type: 'rice' },
  aus: { bn: 'আউশ ধান', en: 'Aus Rice', fam: 'Poaceae', water: '৩০০–৫০০ মিমি', soil: 'মাঝারি সেচ/বৃষ্টি', why: 'প্রাক-বর্ষার ধান। বৃষ্টি ও সীমিত সেচে স্বল্প মেয়াদে উৎপাদিত হয়।', color: '#8dbb45', type: 'rice' },
  mustard: { bn: 'সরিষা', en: 'Mustard', fam: 'Brassicaceae', water: '১৫০–৩০০ মিমি', soil: 'রোগচক্র ভাঙে', why: 'কম পানিতে শীতে হয়, অল্প সময়ে ওঠে, আর ধানের রোগচক্র ভেঙে দেয়।', color: '#f2c318', type: 'mustard' },
  soybean: { bn: 'সয়াবিন', en: 'Soybean', fam: 'Fabaceae', water: 'প্রায় বৃষ্টিনির্ভর', soil: '+ নাইট্রোজেন', why: 'ঘন ঝোপালো ডাল ফসল, চওড়া গাঢ় পাতা আর লোমশ শুঁটি। শিকড়ে বাতাসের নাইট্রোজেন মাটিতে জমা করে।', color: '#2f5f22', type: 'bush' },
  lentil: { bn: 'মসুর ডাল', en: 'Lentil', fam: 'Fabaceae', water: '১০০–২০০ মিমি', soil: '+ নাইট্রোজেন', why: 'মাটির কাছে ঘন নিচু চাদরের মতো, সূক্ষ্ম নীলচে-সবুজ পাতা আর হালকা বেগুনি ফুল। খুব কম পানি লাগে।', color: '#7fa48a', type: 'low' },
  chickpea: { bn: 'ছোলা', en: 'Chickpea', fam: 'Fabaceae', water: '১০০–২০০ মিমি', soil: '+ নাইট্রোজেন', why: 'হাঁটু-সমান ধূসর-সবুজ ঝোপ, গোল ফোলা শুঁটি আর সাদা-গোলাপি ফুল। খরা সহনশীল।', color: '#b9c96a', type: 'low' },
  mungbean: { bn: 'মুগ ডাল', en: 'Mungbean', fam: 'Fabaceae', water: 'প্রায় বৃষ্টিনির্ভর', soil: '+ নাইট্রোজেন', why: 'হালকা সবুজ খাড়া গাছ, লম্বা কালো শুঁটি আর হলুদ ফুল। গ্রীষ্মে অল্প সময়ে ওঠে, পতিত জমি ঢেকে রাখে।', color: '#8fbf3e', type: 'bush' },
  sesame: { bn: 'তিল', en: 'Sesame', fam: 'Pedaliaceae', water: 'প্রায় বৃষ্টিনির্ভর', soil: 'গভীর শিকড়', why: 'খরা সহনশীল তেলবীজ, প্রাক-বর্ষায় কম পানিতে টেকে।', color: '#6aa04a', type: 'tall' },
  jute: { bn: 'পাট', en: 'Jute', fam: 'Malvaceae', water: 'প্রায় বৃষ্টিনির্ভর', soil: 'পাতা ঝরে জৈব পদার্থ', why: 'নগদ আঁশ ফসল, পাতা ঝরে মাটিতে জৈব পদার্থ যোগ করে।', color: '#3d7d34', type: 'jute' },
  wheat: { bn: 'গম', en: 'Wheat', fam: 'Poaceae', water: '২০০–৩৫০ মিমি', soil: 'খড় অবশিষ্ট', why: 'বোরোর চেয়ে অনেক কম পানিতে শীতের খাদ্যশস্য।', color: '#d8b45a', type: 'wheat' },
  potato: { bn: 'আলু', en: 'Potato', fam: 'Solanaceae', water: '৩৫০–৪৫০ মিমি', soil: 'উচ্চ পুষ্টি উত্তোলন', why: 'শীতের উচ্চ ফলনশীল অর্থকরী কন্দ ফসল। দোআঁশ মাটিতে ভালো বাড়ে।', color: '#889944', type: 'potato' },
  maize: { bn: 'ভুট্টা', en: 'Maize', fam: 'Poaceae', water: '৪০০–৬০০ মিমি', soil: 'ভারী পুষ্টিগ্রাহী', why: 'উচ্চ ফলনশীল খাদ্য ও গোখাদ্য শস্য। শীত ও খরিফ উভয় মৌসুমেই উপযোগী।', color: '#d9a738', type: 'maize' },
  tomato: { bn: 'টমেটো', en: 'Tomato', fam: 'Solanaceae', water: '৩০০–৪৫০ মিমি', soil: 'উচ্চ জৈব পদার্থ', why: 'লাভজনক শীতকালীন সবজি। মাচায় বা খুঁটিতে ভালো ফলন হয়।', color: '#d94432', type: 'tomato' },
  sunflower: { bn: 'সূর্যমুখী', en: 'Sunflower', fam: 'Asteraceae', water: '২৫০–৩৫০ মিমি', soil: 'লবণাক্ততা সহনশীল', why: 'উপকূলীয় ও লবণাক্ত অঞ্চলে খরা ও লবণ সহনশীল চমৎকার তেলবীজ ফসল।', color: '#eab308', type: 'sunflower' },
  fallow: { bn: 'পতিত', en: 'Fallow', fam: '—', water: '—', soil: 'মাটি খোলা, ক্ষয় ঝুঁকি', why: 'জমি ফাঁকা থাকে। বৃষ্টিতে মাটির ক্ষয় হয় আর আগাছা বাড়ে।', color: '#8a6a4a', type: 'fallow' },
  generic: { bn: 'সাধারণ ফসল', en: 'Crop Plant', fam: 'Plantae', water: 'প্রয়োজনীয় সেচ', soil: 'স্বাভাবিক', why: 'অনুমোদিত ফসল পর্যায়ক্রম।', color: '#4d8236', type: 'generic' },
};

export function mapCropToGeoKey(cropName, seasonKind = 'rabi') {
  if (!cropName) return 'fallow';
  const c = String(cropName).toLowerCase().trim();
  if (c === 'fallow' || c.includes('পতিত')) return 'fallow';
  if (c.includes('boro') || (c.includes('rice') && seasonKind === 'rabi') || (c.includes('ধান') && seasonKind === 'rabi')) return 'riceRipe';
  if (c.includes('aus')) return 'aus';
  if (c.includes('aman') || c.includes('rice') || c.includes('ধান')) return 'rice';
  if (c.includes('mustard') || c.includes('সরিষা')) return 'mustard';
  if (c.includes('soybean') || c.includes('সয়াবিন')) return 'soybean';
  if (c.includes('mung') || c.includes('মুগ')) return 'mungbean';
  if (c.includes('lentil') || c.includes('মসুর')) return 'lentil';
  if (c.includes('chickpea') || c.includes('ছোলা')) return 'chickpea';
  if (c.includes('sesame') || c.includes('তিল')) return 'sesame';
  if (c.includes('jute') || c.includes('পাট')) return 'jute';
  if (c.includes('wheat') || c.includes('গম')) return 'wheat';
  if (c.includes('maize') || c.includes('ভুট্টা')) return 'maize';
  if (c.includes('potato') || c.includes('আলু')) return 'potato';
  if (c.includes('tomato') || c.includes('টমেটো')) return 'tomato';
  if (c.includes('sunflower') || c.includes('সূর্যমুখী')) return 'sunflower';
  if (c.includes('pulse') || c.includes('ডাল') || c.includes('blackgram') || c.includes('mashkalai') || c.includes('khesari') || c.includes('grass pea') || c.includes('cowpea')) return 'lentil';

  console.warn(`[FarmScene3D] Unknown crop "${cropName}", using generic plant`);
  return 'generic';
}

export function getCropCategory(cropName) {
  if (!cropName) return 'fallow';
  const c = String(cropName).toLowerCase().trim();
  if (c.includes('fallow') || c.includes('পতিত')) return 'fallow';
  if (c.includes('rice') || c.includes('ধান') || c.includes('boro') || c.includes('aman') || c.includes('aus')) return 'rice';
  if (c.includes('mustard') || c.includes('সরিষা')) return 'mustard';
  if (c.includes('wheat') || c.includes('গম')) return 'wheat';
  if (c.includes('sunflower') || c.includes('সূর্যমুখী')) return 'sunflower';
  if (c.includes('jute') || c.includes('পাট')) return 'jute';
  if (c.includes('sesame') || c.includes('তিল')) return 'sesame';
  if (c.includes('potato') || c.includes('আলু')) return 'potato';
  if (c.includes('maize') || c.includes('ভুট্টা')) return 'maize';
  if (c.includes('tomato') || c.includes('টমেটো')) return 'tomato';
  if (c.includes('lentil') || c.includes('mung') || c.includes('pulse') || c.includes('chickpea') || c.includes('ডাল') || c.includes('ছোলা')) return 'pulse';
  return 'general';
}

export function haToBigha(ha) {
  if (ha == null || isNaN(ha)) return null;
  return (Number(ha) * 7.4749).toFixed(1);
}

export function isWebGLAvailable() {
  try {
    if (typeof window === 'undefined' || !window.WebGLRenderingContext) return false;
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    );
  } catch (e) {
    return false;
  }
}
