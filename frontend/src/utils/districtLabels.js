// frontend/src/utils/districtLabels.js
import districtsData from '../bd_districts_choropleth.json';

// Authoritative Barind Tract districts in Northwest Bangladesh
// Hydrologically identified by NASA GRACE-FO with -1.07 cm/yr terrestrial water storage depletion
export const BARIND_DISTRICTS = new Set([
  'rajshahi',
  'chapainawabganj',
  'nawabganj',
  'naogaon',
  'bogura',
  'bogra',
  'joypurhat',
  'dinajpur',
]);

/**
 * Format district name according to locale (BN / EN) with authentic Barind agro-ecological indicator.
 * Returns the Bangla name for all 64 districts in Bangla mode, English in English mode.
 * If unknown, returns the name unchanged without crashing.
 * Appends (বরেন্দ্র) / (Barind) ONLY if the district is in the Barind Tract.
 */
export function formatDistrictLabel(district, lang = 'bn') {
  if (!district) return lang === 'bn' ? 'তথ্য নেই' : 'No data';
  const raw = String(district).trim();
  const k = raw.toLowerCase().replace(/[\s_-]+/g, '');

  const match = districtsData.find(d => {
    const dEn = d.name.toLowerCase().replace(/[\s_-]+/g, '');
    const dBn = (d.bn_name || '').trim();
    if (dEn === k || dBn === raw) return true;
    if (k === 'bogra' && dEn === 'bogura') return true;
    if (k === 'nawabganj' && dEn === 'chapainawabganj') return true;
    if (k === 'barisal' && dEn === 'barishal') return true;
    if (k === 'chittagong' && dEn === 'chattogram') return true;
    if (k === 'jessore' && dEn === 'jashore') return true;
    if (k === 'comilla' && dEn === 'cumilla') return true;
    return false;
  });

  const baseLabel = match
    ? (lang === 'bn' ? match.bn_name : match.name)
    : raw;

  const isBarind = BARIND_DISTRICTS.has(k) || (match && BARIND_DISTRICTS.has(match.name.toLowerCase().replace(/[\s_-]+/g, '')));
  if (isBarind) {
    return lang === 'bn' ? `${baseLabel} (বরেন্দ্র)` : `${baseLabel} (Barind)`;
  }
  return baseLabel;
}

export function formatDistrictBn(district) {
  return formatDistrictLabel(district, 'bn');
}
