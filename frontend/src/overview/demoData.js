// DEMO ONLY — the shape of the data the story needs. In the app, build this object from the
// existing APIs/stores for the ACTIVE field (planner, water, climate field-summary, stress, adaptive).
// Remove any key you cannot fill: the story hides that number instead of inventing it.
export const demoData = {
  lang: 'en',
  field: { name: 'রহিম মিয়ার জমি', district: 'Chapainawabganj', areaLabel: '5 bigha', lat: 24.62, lon: 88.55 },
  years: { power: 45, powerRange: '1981–2025', imerg: 24, imergRange: '2001–2024' },
  regions: [
    { name: 'Barind', color: '#C8F169', rotation: 'Boro rice → fallow → Aman rice' },
    { name: 'Haor', color: '#5BE3FF', rotation: 'Boro rice → flooded fallow' },
    { name: 'Coast', color: '#F5B04C', rotation: 'Fallow → fallow → Aman rice' },
  ],
  grace: { barind: -1.07, haor: 0.44, coast: -0.15, cell: -0.81 },
  current: { rotation: ['Boro rice', 'Fallow', 'Aman rice'], irrigationMm: 1530, bareDays: 115, profit: 37831 },
  best: 'profit',
  strategyOrder: ['balanced', 'profit', 'water_saving', 'soil_health'],
  strategies: {
    balanced: { label: 'Balanced', sequence: ['Mustard', 'Mungbean', 'Aman rice', 'Chickpea', 'Sesame', 'Aman rice'], irrigationMm: 688, bareDays: 60, nitrogenKgHa: 35, profit: 85616 },
    profit: { label: 'Profit', sequence: ['Tomato', 'Soybean', 'Aman rice', 'Sunflower', 'Mungbean', 'Aman rice'], irrigationMm: 910, bareDays: 60, nitrogenKgHa: 35, profit: 126548 },
    water_saving: { label: 'Water saving', sequence: ['Mustard', 'Mungbean', 'Aman rice', 'Chickpea', 'Sesame', 'Aman rice'], irrigationMm: 688, bareDays: 60, nitrogenKgHa: 35, profit: 85616 },
    soil_health: { label: 'Soil health', sequence: ['Mustard', 'Mungbean', 'Aman rice', 'Chickpea', 'Sesame', 'Aman rice'], irrigationMm: 688, bareDays: 60, nitrogenKgHa: 35, profit: 85616 },
  },
  monthLabels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
  risk: { // % of years (Nov..Oct) from the climate risk calendar
    heat: [0, 0, 0, 0, 100, 100, 96, 75, 8, 0, 0, 0],
    dry: [100, 100, 100, 92, 96, 71, 25, 4, 4, 0, 0, 88],
    rain: [0, 0, 0, 0, 4, 8, 12, 50, 54, 29, 29, 25],
    cold: [4, 71, 96, 33, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // from POST /api/planning/stress for the shown hazard (DEMO values — replace)
  stress: { label: 'Example: Drought (moderate) on the Profit plan', droughtBeds: [0, 3], floodBeds: [], tags: [{ bed: 0, text: 'Tomato −x %' }, { bed: 3, text: 'Sunflower −x %' }] },
  // from the adaptive replan records (the Rahim field has: 2025 Rabi Mustard 5.2 maund/bigha)
  learning: { harvestBed: 0, harvestText: 'Mustard · 5.2 maund/bigha', changedBed: 3 },
  team: ['Danial Hossain (Lead)', 'Md. Fazle Elahi Mahi', 'Nusrat Jahan Tuli', 'Noman Ahmed Tonmoy', 'Mustakim Musa', 'Abrar Ahmed Chy'],
  datasetsUsed: ['NASA POWER', 'GPM IMERG', 'GRACE-FO', 'ISRIC SoilGrids'],
};
export default demoData;
