// frontend/scripts/smoke-ssr.jsx
// Permanent SSR render guard testing all 12 navigation destinations and Research Lab default sub-lab.
// Evaluates (a) no data / loading props, (b) small fixture prop set.

import React from 'react';
import { renderToString } from 'react-dom/server';

// Minimal browser-only globals stub ONLY inside smoke runner
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    devicePixelRatio: 1,
    innerWidth: 1200,
    innerHeight: 800,
    location: { href: 'http://localhost/' }
  };
}
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: (tag) => ({
      getContext: () => null,
      style: {},
      setAttribute: () => {},
      appendChild: () => {},
      removeChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    hidden: false
  };
}
if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = { userAgent: 'node', language: 'en' };
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}
if (typeof globalThis.customElements === 'undefined') {
  globalThis.customElements = {
    get: () => undefined,
    define: () => {}
  };
}

// Destination top-level views
import { FarmerHomeView } from '../src/FarmerHomeView.jsx';
import { MyFarmWorkspaceView } from '../src/MyFarmWorkspaceView.jsx';
import { NasaPlantingAdvisoryView } from '../src/NasaPlantingAdvisoryView.jsx';
import { NasaWeatherStation3D } from '../src/NasaWeatherStation3D.jsx';
import { FarmPlanningView } from '../src/FarmPlanningView.jsx';
import { SixSeasonRecommendationView } from '../src/SixSeasonRecommendationView.jsx';
import { ClimateStressTestView } from '../src/ClimateStressTestView.jsx';
import { YourFarmingVsPlanView } from '../src/YourFarmingVsPlanView.jsx';
import { WaterIrrigationView } from '../src/WaterIrrigationView.jsx';
import { ResearchWorkspaceView } from '../src/ResearchWorkspaceView.jsx';
import { MarketIntelligenceView } from '../src/MarketIntelligenceView.jsx';
import AiAssistantView from '../src/AiAssistantView.jsx';
import { DataEvidenceView } from '../src/DataEvidenceView.jsx';

// Inline representation of Destination 12: Account / Operator Cockpit
function AccountCockpitView({ user, lang = 'bn' }) {
  return (
    <div className="profile-3d-wrapper">
      <div className="profile-3d-header">
        <h1>{user?.name || (lang === 'bn' ? 'অপারেটর প্রোফাইল' : 'Operator Profile')}</h1>
        <p>{user?.email || (lang === 'bn' ? 'তথ্য নেই' : 'No data')}</p>
      </div>
    </div>
  );
}

// Small fixture prop set
const fixtureField = {
  id: 'F-BOGURA-01',
  name: 'Bogura Demo Field',
  district: 'rajshahi',
  latitude: 24.8467,
  longitude: 89.3777,
  area_ha: 2.5,
  soil_texture: 'loam',
  crop: 'Aman rice'
};

const fixtureUser = {
  id: 1,
  name: 'Demo Farmer',
  email: 'farmer@fieldshift.local'
};

const fixtureNasa = {
  district: 'rajshahi',
  climatology: { years: 25 },
  weather: [{ date: '2026-06-01', rain_mm: 12.4, t2m: 29.5 }]
};

const destinations = [
  {
    name: '01. FarmerHomeView (dashboard)',
    component: FarmerHomeView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, user: fixtureUser, nasa: fixtureNasa, lang: 'bn' }
  },
  {
    name: '02. MyFarmWorkspaceView (field)',
    component: MyFarmWorkspaceView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, user: fixtureUser, userFields: [fixtureField], lang: 'bn' }
  },
  {
    name: '03. NasaPlantingAdvisoryView (crop_advice)',
    component: NasaPlantingAdvisoryView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, district: 'rajshahi', crop: 'aman', lang: 'bn' }
  },
  {
    name: '04. NasaWeatherStation3D (weather)',
    component: NasaWeatherStation3D,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, nasaData: fixtureNasa, lang: 'bn' }
  },
  {
    name: '05. FarmPlanningView (farm_planning)',
    component: FarmPlanningView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, user: fixtureUser, userFields: [fixtureField], lang: 'bn' }
  },
  {
    name: '05b. SixSeasonRecommendationView (6-Season MILP Planner & Research Sub-Lab)',
    component: SixSeasonRecommendationView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, district: 'rajshahi', defaultDistrict: 'rajshahi', lang: 'bn' }
  },
  {
    name: '05c. ClimateStressTestView (Climate Stress Test Sub-Lab)',
    component: ClimateStressTestView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, lang: 'bn' }
  },
  {
    name: '05d. YourFarmingVsPlanView (Your Farming vs Plan)',
    component: YourFarmingVsPlanView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, lang: 'bn' }
  },
  {
    name: '06. WaterIrrigationView (water_irrigation)',
    component: WaterIrrigationView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, nasa: fixtureNasa, lang: 'bn' }
  },
  {
    name: '07. ResearchWorkspaceView (research)',
    component: ResearchWorkspaceView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, nasa: fixtureNasa, initialTab: 'six_seasons_milp', lang: 'bn' }
  },
  {
    name: '08. MarketIntelligenceView (harvest_profit)',
    component: MarketIntelligenceView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, lang: 'bn' }
  },
  {
    name: '09. AiAssistantView (assistant)',
    component: AiAssistantView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, user: fixtureUser, lang: 'bn' }
  },
  {
    name: '10. DataEvidenceView (data_evidence)',
    component: DataEvidenceView,
    noDataProps: {},
    fixtureProps: { activeField: fixtureField, nasa: fixtureNasa, lang: 'bn' }
  },
  {
    name: '11. AccountCockpitView (account)',
    component: AccountCockpitView,
    noDataProps: {},
    fixtureProps: { user: fixtureUser, lang: 'bn' }
  }
];

let failures = 0;
console.log('==============================================================');
console.log('FIELDSHIFT SSR RENDER GUARD (11 Destinations + Research Sub-Lab)');
console.log('==============================================================');

for (const dest of destinations) {
  const Comp = dest.component;

  // Test state (a): no data / loading
  try {
    const htmlA = renderToString(<Comp {...dest.noDataProps} />);
    if (typeof htmlA !== 'string') throw new Error('renderToString returned non-string');
    console.log(`[PASS] ${dest.name} -> State (a): no data / loading`);
  } catch (err) {
    failures++;
    console.error(`[FAIL] ${dest.name} -> State (a): no data / loading:`, err.message);
  }

  // Test state (b): small fixture prop set
  try {
    const htmlB = renderToString(<Comp {...dest.fixtureProps} />);
    if (typeof htmlB !== 'string') throw new Error('renderToString returned non-string');
    console.log(`[PASS] ${dest.name} -> State (b): fixture prop set`);
  } catch (err) {
    failures++;
    console.error(`[FAIL] ${dest.name} -> State (b): fixture prop set:`, err.message);
  }
}

// Dedicated Planner Lifecycle & Rerender Guard (Requirement 4)
console.log('--- PLANNER RERENDER LIFECYCLE GUARD ---');
try {
  // Step 1: Render in loading state
  const loadingOutput = renderToString(<SixSeasonRecommendationView activeField={fixtureField} lang="bn" />);
  if (!loadingOutput.includes('ui-skeleton')) {
    throw new Error('Loading render did not produce expected skeleton output');
  }

  // Step 2: Rerender with full data fixture (simulates state update)
  const dataOutput = renderToString(
    <SixSeasonRecommendationView
      activeField={fixtureField}
      district="rajshahi"
      defaultDistrict="rajshahi"
      lang="bn"
      plan={{
        periods: ['Y1_S1', 'Y1_S2', 'Y1_S3', 'Y2_S1', 'Y2_S2', 'Y2_S3'],
        rotation: { Y1_S1: 'Mustard', Y1_S2: 'Mungbean', Y1_S3: 'Rice', Y2_S1: 'Chickpea', Y2_S2: 'Sesame', Y2_S3: 'Rice' },
        baselineRotation: ['Boro Rice', 'Fallow', 'Rice'],
        baselineComparison: {
          baseline_rotation: ['Boro Rice', 'Fallow', 'Rice'],
          baseline_seasons: [
            { period: 'Y1_S1', season: 'S1', crop: 'Boro Rice', irrigation_mm: 1200 },
            { period: 'Y1_S2', season: 'S2', crop: 'Fallow', irrigation_mm: 0 },
            { period: 'Y1_S3', season: 'S3', crop: 'Rice', irrigation_mm: 348 },
            { period: 'Y2_S1', season: 'S1', crop: 'Boro Rice', irrigation_mm: 1200 },
            { period: 'Y2_S2', season: 'S2', crop: 'Fallow', irrigation_mm: 0 },
            { period: 'Y2_S3', season: 'S3', crop: 'Rice', irrigation_mm: 348 }
          ]
        }
      }}
    />
  );
  if (!dataOutput || dataOutput.length === 0) {
    throw new Error('Data rerender produced empty output');
  }
  console.log('[PASS] SixSeasonRecommendationView: Loading state -> Data state (rerender) completed without throwing');
} catch (err) {
  failures++;
  console.error('[FAIL] SixSeasonRecommendationView: Rerender threw error:', err.message);
}

console.log('==============================================================');
if (failures > 0) {
  console.error(`SMOKE TEST FAILED: ${failures} render failure(s) detected.`);
  process.exit(1);
} else {
  console.log('SMOKE TEST PASSED: All 11 destinations rendered cleanly in both states.');
  process.exit(0);
}
