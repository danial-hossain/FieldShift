// frontend/src/overview/regionalRotationsConfig.js
// Documented typical current rotations for Bangladesh agro-ecological benchmark zones.
// Sourced from FieldShift demo fields & AEZ agricultural survey data.

export const REGIONAL_ROTATIONS = {
  barind: {
    key: 'barind',
    regionEn: 'Barind',
    regionBn: 'বরেন্দ্র',
    color: '#C8F169',
    rotationEn: 'Boro → Fallow → Aman',
    rotationBn: 'বোরো ধান → পতিত → আমন ধান',
    crops: ['Boro Rice', 'Fallow', 'T. Aman Rice'],
    seasons: ['winter', 'summer', 'monsoon'],
    beds: [
      { crop: 'Boro Rice', season: 'Rabi', kind: 'ripe', wet: true },
      { crop: 'Fallow', season: 'Kharif-1', kind: 'stub', wet: false },
      { crop: 'T. Aman Rice', season: 'Kharif-2', kind: 'rice', wet: true },
    ],
  },
  haor: {
    key: 'haor',
    regionEn: 'Haor',
    regionBn: 'হাওর',
    color: '#38D9F5',
    rotationEn: 'Boro → Flood → Flood',
    rotationBn: 'বোরো ধান → প্লাবন → প্লাবন',
    crops: ['Boro Rice', 'Flood', 'Flood'],
    seasons: ['winter', 'summer', 'monsoon'],
    beds: [
      { crop: 'Boro Rice', season: 'Rabi', kind: 'ripe', wet: true },
      { crop: 'Flood', season: 'Kharif-1', kind: 'flood', wet: true },
      { crop: 'Flood', season: 'Kharif-2', kind: 'flood', wet: true },
    ],
  },
  coast: {
    key: 'coast',
    regionEn: 'Coast',
    regionBn: 'উপকূল',
    color: '#F5B04C',
    rotationEn: 'Fallow → Fallow → Aman',
    rotationBn: 'পতিত → পতিত → আমন ধান',
    crops: ['Fallow', 'Fallow', 'T. Aman Rice'],
    seasons: ['winter', 'summer', 'monsoon'],
    beds: [
      { crop: 'Fallow', season: 'Rabi', kind: 'stub', wet: false },
      { crop: 'Fallow', season: 'Kharif-1', kind: 'stub', wet: false },
      { crop: 'T. Aman Rice', season: 'Kharif-2', kind: 'rice', wet: true },
    ],
  },
};

export default REGIONAL_ROTATIONS;
