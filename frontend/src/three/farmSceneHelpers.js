// frontend/src/three/farmSceneHelpers.js
// Pure helpers for 3D Farm Scene (G0)

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

