/**
 * Shared Bangladesh Agricultural Soil Texture Classification & Standard Mechanical Composition
 * Shared between MyFarmWorkspaceView, FieldParcelManagerView, and Crop Advisory
 */

export const SOIL_TEXTURE_DATA = {
  clay_loam: {
    key: 'clay_loam',
    nameEn: 'Clay Loam',
    nameBn: 'এঁটেল দোআঁশ',
    label: 'Clay Loam (এঁটেল দোআঁশ)',
    sand: 32,
    silt: 34,
    clay: 34,
    fc: '32%',
    pwp: '18%',
    cond: '0.8 cm/hr'
  },
  loam: {
    key: 'loam',
    nameEn: 'Loam',
    nameBn: 'দোআঁশ',
    label: 'Loam (দোআঁশ)',
    sand: 40,
    silt: 40,
    clay: 20,
    fc: '28%',
    pwp: '14%',
    cond: '1.5 cm/hr'
  },
  silty_loam: {
    key: 'silty_loam',
    nameEn: 'Silty Loam',
    nameBn: 'পলি দোআঁশ',
    label: 'Silty Loam (পলি দোআঁশ)',
    sand: 20,
    silt: 65,
    clay: 15,
    fc: '31%',
    pwp: '15%',
    cond: '1.2 cm/hr'
  },
  sandy_loam: {
    key: 'sandy_loam',
    nameEn: 'Sandy Loam',
    nameBn: 'বেলে দোআঁশ',
    label: 'Sandy Loam (বেলে দোআঁশ)',
    sand: 65,
    silt: 25,
    clay: 10,
    fc: '21%',
    pwp: '9%',
    cond: '3.2 cm/hr'
  },
  clay: {
    key: 'clay',
    nameEn: 'Clay',
    nameBn: 'এঁটেল',
    label: 'Clay (এঁটেল)',
    sand: 15,
    silt: 25,
    clay: 60,
    fc: '36%',
    pwp: '22%',
    cond: '0.2 cm/hr'
  },
  silty_clay: {
    key: 'silty_clay',
    nameEn: 'Silty Clay',
    nameBn: 'পলি এঁটেল',
    label: 'Silty Clay (পলি এঁটেল)',
    sand: 10,
    silt: 45,
    clay: 45,
    fc: '34%',
    pwp: '20%',
    cond: '0.5 cm/hr'
  }
};

export function getSoilClassData(textureKey) {
  if (!textureKey) return SOIL_TEXTURE_DATA.loam;
  const k = String(textureKey).toLowerCase().replace(/[\s-]+/g, '_');
  return SOIL_TEXTURE_DATA[k] || SOIL_TEXTURE_DATA.loam;
}
