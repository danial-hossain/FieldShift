import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleFieldMapPicker } from './GoogleFieldMapPicker.jsx';
import { GoogleFieldMapThumbnail } from './GoogleFieldMapThumbnail.jsx';
import { AdaptiveRlExperiment } from './AdaptiveRlExperiment.jsx';
import { NasaWeatherStation3D } from './NasaWeatherStation3D.jsx';
import { FieldParcelManagerView } from './FieldParcelManagerView.jsx';
import AiAssistantView from './AiAssistantView.jsx';
import { CropFailureRecoveryView } from './CropFailureRecoveryView.jsx';
import { AdaptiveReplanningView } from './AdaptiveReplanningView.jsx';
import { CropCatalogView } from './CropCatalogView.jsx';
import { MarketProfitView } from './MarketProfitView.jsx';
import { SyntheticDataLabView } from './SyntheticDataLabView.jsx';
import { SensitivityAnalysisView } from './SensitivityAnalysisView.jsx';
import { FarmerHomeView } from './FarmerHomeView.jsx';
import { FarmerCropAdviceView } from './FarmerCropAdviceView.jsx';
import { ResearchWorkspaceView } from './ResearchWorkspaceView.jsx';
import { NasaPlantingAdvisoryView } from './NasaPlantingAdvisoryView.jsx';
import { MyFarmWorkspaceView } from './MyFarmWorkspaceView.jsx';
import { FarmPlanningView } from './FarmPlanningView.jsx';
import { WaterIrrigationView } from './WaterIrrigationView.jsx';
import { DataEvidenceView } from './DataEvidenceView.jsx';
import { useTranslation, formatArea, soilLabel, districtLabel, unitLabel, formatNumber as formatI18nNumber } from './i18n.js';
import {
  buildCounterfactualPayload,
  runCounterfactualRequest,
} from './counterfactual.js';
import './styles.css';
import { Toast, Modal } from './ui/index.js';
import { OnboardingModal } from './OnboardingModal.jsx';
import { HelpModal } from './HelpModal.jsx';
import {
  HomeIcon,
  FieldIcon,
  RotationIcon,
  WeatherIcon,
  WaterIcon,
  MarketIcon,
  CubeIcon,
  EvidenceIcon,
  SunIcon,
  MoonIcon,
  HelpIcon,
  BotIcon,
  GlobeIcon,
  BellIcon,
} from './ui/index.js';

const API = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new Error(`Could not reach the FastAPI backend at ${API || 'the /api proxy'} (${err.message}). Is uvicorn running on port 8000?`);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Backend returned a non-JSON response (HTTP ${response.status}). Is the FastAPI backend running on port 8000?`);
  }
  if (!response.ok) {
    const detail = Array.isArray(body.detail)
      ? body.detail.map(item => item.msg || item.loc?.join('.') || 'Invalid request').join('; ')
      : body.detail;
    throw new Error(detail || body.message || `Request failed (${response.status})`);
  }
  return body;
}

export function formatNumber(val, digits = 2, fallback = 'Not available') {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return n.toFixed(digits);
}

const value = (item, fallback = 'Not available') =>
  item === null || item === undefined || item === '' ? fallback : typeof item === 'object' ? JSON.stringify(item) : String(item);
const number = (item, digits = 2, fallback = 'Not available') => formatNumber(item, digits, fallback);
const rotationText = rotation =>
  rotation && typeof rotation === 'object' && Object.keys(rotation).length
    ? Object.entries(rotation).map(([period, crop]) => `${period}: ${crop}`).join('  →  ')
    : 'No rotation returned';

const CROP_META = {
  Mungbean: { family: 'Fabaceae', is_legume: true, water_mm: 350, duration: 75, icon: '🌱', bnf: true, desc: 'Biological N-Fixer, short duration dry pulse' },
  Lentil: { family: 'Fabaceae', is_legume: true, water_mm: 300, duration: 110, icon: '🌱', bnf: true, desc: 'High market pulse, soil enrichment' },
  Maize: { family: 'Poaceae', is_legume: false, water_mm: 600, duration: 110, icon: '🌽', bnf: false, desc: 'High biomass grain, strong market demand' },
  Rice: { family: 'Poaceae', is_legume: false, water_mm: 1200, duration: 130, icon: '🌾', bnf: false, desc: 'Staple cereal grain, wet season adapted' },
  Wheat: { family: 'Poaceae', is_legume: false, water_mm: 450, duration: 120, icon: '🌾', bnf: false, desc: 'Cool season cereal, moderate residue' },
  Mustard: { family: 'Brassicaceae', is_legume: false, water_mm: 350, duration: 100, icon: '🌼', bnf: false, desc: 'Oilseed crop, deep taproot, bio-fumigant' },
  Potato: { family: 'Solanaceae', is_legume: false, water_mm: 500, duration: 100, icon: '🥔', bnf: false, desc: 'High cash return tuber, intensive nutrient user' },
  Chickpea: { family: 'Fabaceae', is_legume: true, water_mm: 280, duration: 95, icon: '🌱', bnf: true, desc: 'Drought-tolerant winter pulse, BNF N-fixer' },
  Soybean: { family: 'Fabaceae', is_legume: true, water_mm: 480, duration: 105, icon: '🌱', bnf: true, desc: 'High protein legume, strong residual biomass' },
  Sorghum: { family: 'Poaceae', is_legume: false, water_mm: 250, duration: 90, icon: '🌾', bnf: false, desc: 'Ultra drought-tolerant C4 cereal, deep rooting' },
  Sesame: { family: 'Pedaliaceae', is_legume: false, water_mm: 280, duration: 85, icon: '🌿', bnf: false, desc: 'High-value oilseed, low moisture requirement' },
  Groundnut: { family: 'Fabaceae', is_legume: true, water_mm: 450, duration: 120, icon: '🥜', bnf: true, desc: 'Cash oilseed pulse, BNF soil fertility boost' },
  Sunflower: { family: 'Asteraceae', is_legume: false, water_mm: 420, duration: 95, icon: '🌻', bnf: false, desc: 'Deep taproot scavenger, subsoil nutrient mobilizer' },
  Tomato: { family: 'Solanaceae', is_legume: false, water_mm: 550, duration: 105, icon: '🍅', bnf: false, desc: 'High economic cash margin vegetable crop' },
  Jute: { family: 'Malvaceae', is_legume: false, water_mm: 650, duration: 120, icon: '🎋', bnf: false, desc: 'Commercial fiber crop, substantial leaf litter residue' },
};

const STRATEGY_META = {
  profit_focused: {
    title: 'Profit Focused',
    icon: '💰',
    badgeClass: 'profit',
    summary: 'Maximizes net agricultural margin and economic return across 6 multi-season periods.',
    primaryColor: '#2e7d32',
    accentBg: 'rgba(46, 125, 50, 0.08)',
    borderColor: '#81c784',
    priorityKey: 'profit'
  },
  water_focused: {
    title: 'Water Efficiency',
    icon: '💧',
    badgeClass: 'water',
    summary: 'Minimizes irrigation consumption and mitigates dry-season drought risk and aquifer stress.',
    primaryColor: '#0288d1',
    accentBg: 'rgba(2, 136, 209, 0.08)',
    borderColor: '#4fc3f7',
    priorityKey: 'water_efficiency'
  },
  water_efficiency: {
    title: 'Water Efficiency',
    icon: '💧',
    badgeClass: 'water',
    summary: 'Minimizes irrigation consumption and mitigates dry-season drought risk and aquifer stress.',
    primaryColor: '#0288d1',
    accentBg: 'rgba(2, 136, 209, 0.08)',
    borderColor: '#4fc3f7',
    priorityKey: 'water_efficiency'
  },
  soil_focused: {
    title: 'Soil Health & Regeneration',
    icon: '🌱',
    badgeClass: 'soil',
    summary: 'Maximizes biological nitrogen fixation (BNF), organic carbon residues, and soil microbiology.',
    primaryColor: '#e67e22',
    accentBg: 'rgba(230, 126, 34, 0.08)',
    borderColor: '#ffb74d',
    priorityKey: 'soil_health'
  },
  soil_health: {
    title: 'Soil Health & Regeneration',
    icon: '🌱',
    badgeClass: 'soil',
    summary: 'Maximizes biological nitrogen fixation (BNF), organic carbon residues, and soil microbiology.',
    primaryColor: '#e67e22',
    accentBg: 'rgba(230, 126, 34, 0.08)',
    borderColor: '#ffb74d',
    priorityKey: 'soil_health'
  },
  balanced: {
    title: 'Balanced Multi-Objective',
    icon: '⚖️',
    badgeClass: 'balanced',
    summary: 'Alternative multi-objective MILP trade-off balancing commercial profitability, water conservation, and soil fertility.',
    primaryColor: '#673ab7',
    accentBg: 'rgba(103, 58, 183, 0.08)',
    borderColor: '#b39ddb',
    priorityKey: 'balanced'
  },
  balanced_multi_objective: {
    title: 'Balanced Multi-Objective',
    icon: '⚖️',
    badgeClass: 'balanced',
    summary: 'Alternative multi-objective MILP trade-off balancing commercial profitability, water conservation, and soil fertility.',
    primaryColor: '#673ab7',
    accentBg: 'rgba(103, 58, 183, 0.08)',
    borderColor: '#b39ddb',
    priorityKey: 'balanced'
  }
};

const STRATEGY_PRIORITY_DESC = {
  profit_focused: {
    name: 'Profit Focused',
    mainPriority: 'Higher economic return',
    legend: 'prioritizes economic return',
    icon: '💰'
  },
  water_focused: {
    name: 'Water Efficiency',
    mainPriority: 'Better water efficiency',
    legend: 'prioritizes water efficiency',
    icon: '💧'
  },
  water_efficiency: {
    name: 'Water Efficiency',
    mainPriority: 'Better water efficiency',
    legend: 'prioritizes water efficiency',
    icon: '💧'
  },
  soil_focused: {
    name: 'Soil Health & Regeneration',
    mainPriority: 'Better soil health',
    legend: 'prioritizes soil health',
    icon: '🌱'
  },
  soil_health: {
    name: 'Soil Health & Regeneration',
    mainPriority: 'Better soil health',
    legend: 'prioritizes soil health',
    icon: '🌱'
  },
  balanced: {
    name: 'Balanced Multi-Objective',
    mainPriority: 'Balanced objectives',
    legend: 'balances the configured objectives',
    icon: '⚖️'
  },
  balanced_multi_objective: {
    name: 'Balanced Multi-Objective',
    mainPriority: 'Balanced objectives',
    legend: 'balances the configured objectives',
    icon: '⚖️'
  }
};

export function toCanonicalStrategyKey(key) {
  if (!key) return 'balanced';
  const k = String(key).toLowerCase().trim();
  if (k === 'profit' || k === 'profit_focused') return 'profit_focused';
  if (k === 'water' || k === 'water_focused' || k === 'water_efficiency') return 'water_efficiency';
  if (k === 'soil' || k === 'soil_focused' || k === 'soil_health') return 'soil_health';
  if (k === 'balanced' || k === 'balanced_multi_objective') return 'balanced';
  return k;
}

export const STRATEGY_PROFILES = {
  profit_focused: { name: 'Profit Focused', icon: '💰', weights: { profit: 0.70, water: 0.20, soil: 0.10 } },
  water_efficiency: { name: 'Water Efficiency', icon: '💧', weights: { profit: 0.20, water: 0.60, soil: 0.20 } },
  soil_health: { name: 'Soil Health & Regeneration', icon: '🌱', weights: { profit: 0.20, water: 0.20, soil: 0.60 } },
  balanced: { name: 'Balanced Multi-Objective', icon: '⚖️', weights: { profit: 0.34, water: 0.33, soil: 0.33 } }
};

export const BENCHMARK_SCENARIOS = {
  scenario_A: {
    id: "scenario_A",
    scen_key: "A",
    name: "A. Profit-Dominant",
    water_mm: 800,
    temperature_c: 28,
    ph: 6.5,
    icon: "💰",
    color: "#2e7d32",
    desc: "800 mm, 28°C, pH 6.5"
  },
  scenario_B: {
    id: "scenario_B",
    scen_key: "B",
    name: "B. Water-Constrained",
    water_mm: 320,
    temperature_c: 30,
    ph: 6.8,
    icon: "🌵",
    color: "#0288d1",
    desc: "320 mm, 30°C, pH 6.8"
  },
  scenario_C: {
    id: "scenario_C",
    scen_key: "C",
    name: "C. Cool-Season Rabi",
    water_mm: 600,
    temperature_c: 18,
    ph: 6.5,
    icon: "❄️",
    color: "#00897b",
    desc: "600 mm, 18°C, pH 6.5"
  },
  scenario_D: {
    id: "scenario_D",
    scen_key: "D",
    name: "D. Hot-Season Kharif",
    water_mm: 950,
    temperature_c: 34,
    ph: 6.8,
    icon: "☀️",
    color: "#e65100",
    desc: "950 mm, 34°C, pH 6.8"
  },
  scenario_E: {
    id: "scenario_E",
    scen_key: "E",
    name: "E. Acidic & Depleted",
    water_mm: 500,
    temperature_c: 26,
    ph: 4.8,
    icon: "🧪",
    color: "#c2185b",
    desc: "500 mm, 26°C, pH 4.8"
  },
  scenario_F: {
    id: "scenario_F",
    scen_key: "F",
    name: "F. Balanced Diverse",
    water_mm: 700,
    temperature_c: 25,
    ph: 6.5,
    icon: "⚖️",
    color: "#673ab7",
    desc: "700 mm, 25°C, pH 6.5"
  }
};

export const BENCHMARK_CONTEXTS = {
  operational: {
    id: "operational",
    name: "Operational Field",
    type: "field",
    icon: "📍",
    color: "#15803d",
    desc: "Active Registered Parcel"
  },
  ...BENCHMARK_SCENARIOS
};

export const DEFAULT_PRIORITY_PROFILES = {
  profit_focused: { profit: 0.70, water: 0.20, soil: 0.10 },
  water_efficiency: { profit: 0.20, water: 0.60, soil: 0.20 },
  soil_health: { profit: 0.20, water: 0.20, soil: 0.60 },
  balanced: { profit: 0.34, water: 0.33, soil: 0.33 }
};

export function getStrategyWeights(item, key) {
  const cKey = toCanonicalStrategyKey(key);
  const def = DEFAULT_PRIORITY_PROFILES[cKey] || { profit: 0.34, water: 0.33, soil: 0.33 };
  if (!item) return def;
  const w = item.weights || item.requested_weights || null;
  if (!w) return def;
  return {
    profit: w.profit != null ? Number(w.profit) : def.profit,
    water: w.water != null ? Number(w.water) : def.water,
    soil: w.soil != null ? Number(w.soil) : def.soil,
  };
}

const formatDate = d => {
  if (!d) return 'Ready';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Ready';
  }
};

export function checkGeographicConsistency(name, lat, lon) {
  if (!name || lat == null || lon == null) return null;
  const n = String(name).toLowerCase();
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const isDhakaCoords = latitude >= 23.5 && latitude <= 24.1 && longitude >= 90.0 && longitude <= 90.7;
  const isRajshahiCoords = latitude >= 24.1 && latitude <= 24.8 && longitude >= 88.0 && longitude <= 89.2;
  const isBarisalCoords = latitude >= 22.2 && latitude <= 23.1 && longitude >= 90.0 && longitude <= 90.8;

  if (n.includes('rajshahi') && !isRajshahiCoords) {
    return 'Field name and coordinates may represent different geographic areas. Verify the registered field location.';
  }
  if (n.includes('dhaka') && !isDhakaCoords) {
    return 'Field name and coordinates may represent different geographic areas. Verify the registered field location.';
  }
  if (n.includes('barisal') && !isBarisalCoords) {
    return 'Field name and coordinates may represent different geographic areas. Verify the registered field location.';
  }
  return null;
}

export function ResearchProvenancePanel({ fieldName, fieldId, mode, nasaStatus }) {
  return (
    <div className="research-provenance-panel" style={{
      background: 'var(--bg-card-subtle, #f8fafc)',
      border: '1px solid var(--border-light, #e2e8f0)',
      borderRadius: '12px',
      padding: '12px 16px',
      margin: '14px 0',
      fontSize: '12px',
      color: 'var(--text-muted, #475569)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <strong style={{ fontSize: '12.5px', color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🛡️</span> Research Provenance &amp; System Registry
        </strong>
        <span style={{ fontSize: '10.5px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
          {fieldId && fieldId !== 'demo' ? 'PostgreSQL Registered Field' : 'Research Benchmark'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '6px' }}>
        <div><strong>Field Source:</strong> PostgreSQL DB {fieldId ? `(#${fieldId})` : ''}</div>
        <div><strong>Environment:</strong> NASA POWER Daily Point API</div>
        <div><strong>ML Model:</strong> Synthetic benchmark</div>
        <div><strong>RL Policy:</strong> Simulation-trained policy</div>
        <div><strong>MILP Solver:</strong> PuLP / CBC Branch &amp; Bound</div>
        <div><strong>Scenarios:</strong> Synthetic hypothetical perturbation</div>
        <div><strong>Validation:</strong> Not field validated</div>
      </div>
    </div>
  );
}

// Global Error Boundary
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("FieldShift Application Runtime Error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
      return (
        <div
          role="alert"
          data-testid="global-error-boundary"
          style={{
            padding: '28px 24px',
            maxWidth: 680,
            margin: '40px auto',
            background: 'var(--surface, #121A15)',
            borderRadius: 'var(--r-lg, 16px)',
            border: '1px solid var(--border-glass, rgba(255,255,255,0.12))',
            boxShadow: 'var(--shadow-glass-elevated, 0 16px 40px rgba(0,0,0,0.35))',
            color: 'var(--text, #E8ECE9)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text, #E8ECE9)' }}>
            Something went wrong / একটি সমস্যা দেখা দিয়েছে
          </h3>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted, #9AA5A0)', lineHeight: 1.5 }}>
            An unexpected error occurred while rendering this section. You can retry loading or refresh the application.
          </p>
          {isDev && this.state.error && (
            <details open style={{ textAlign: 'left', marginBottom: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: '#F5B04C', marginBottom: 6 }}>
                DEV: {this.state.error.message}
              </summary>
              <pre data-error-detail style={{ fontSize: 10, overflowX: 'auto', background: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 8, color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200 }}>
                {this.state.error.stack}
                {this.state.errorInfo ? '\n\nComponent Stack:\n' + this.state.errorInfo.componentStack : ''}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="ui-btn ui-btn-primary ui-btn-md"
            >
              Try Again / পুনরায় চেষ্টা করুন
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="ui-btn ui-btn-secondary ui-btn-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Result Error boundary
class ResultBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidUpdate(prev) {
    if (prev.summary !== this.props.summary && this.state.error) {
      this.setState({ error: null });
    }
  }
  render() {
    return this.state.error ? (
      <div className="dash-card boundary-banner" style={{ gridColumn: 'span 12' }}>
        <strong>Render Notice</strong>
        <p>{String(this.state.error.message || this.state.error)}</p>
      </div>
    ) : (
      this.props.children
    );
  }
}

export function App() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedStress, setSelectedStress] = useState('normal');
  const [theme, setTheme] = useState(() => localStorage.getItem('fieldshift_theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('fieldshift_lang') || 'bn');
  const [dashboardMode, setDashboardMode] = useState('farmer');
  const { t } = useTranslation(lang);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fieldshift_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fieldshift_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
    }
  }, [lang]);

  // Sub-navigation state for 12 unified destinations
  const [cropSubTab, setCropSubTab] = useState('advisory'); // 'advisory' | 'advice' | 'catalog'
  const [harvestSubTab, setHarvestSubTab] = useState('calculator'); // 'calculator' | 'market' | 'outcomes' | 'sustainability'
  const [assistantParams, setAssistantParams] = useState(null); // { question, context, fromPage }
  const [farmPlanningSubTab, setFarmPlanningSubTab] = useState('milp'); // 'milp' | 'replan' | 'comparison'
  const [waterSubTab, setWaterSubTab] = useState('balance'); // 'balance' | 'optimization' | 'profile' | 'stress'
  const [dataEvidenceSubTab, setDataEvidenceSubTab] = useState('sources'); // 'sources' | 'provenance' | 'reports' | 'methodology'
  const [myFarmSubTab, setMyFarmSubTab] = useState('overview'); // 'overview' | 'parcels' | 'map' | 'soil' | 'history'
  const [backendHealth, setBackendHealth] = useState({ database: 'sqlite', status: 'connected' });

  useEffect(() => {
    request('/api/health').then(d => { if (d) setBackendHealth(d); }).catch(() => {});
  }, []);

  const handleNavigate = (nav, tab = null) => {
    setMobileNavOpen(false);

    // AI Assistant routing with parameter support: handleNavigate('assistant', { question, context, fromPage })
    if (nav === 'assistant') {
      if (tab && typeof tab === 'object') {
        setAssistantParams(tab);
      } else {
        setAssistantParams(null);
      }
      setActiveNav('assistant');
      return;
    }

    // Redirect removed 3D Farm / Digital Twin routes to Rotation Planner
    if (
      nav === 'digital_twin' ||
      nav === '3d_farm' ||
      nav === 'farm_3d' ||
      nav === 'plan_viewer' ||
      nav === 'crop_growth' ||
      nav === 'climate_stress' ||
      nav === 'scenario_comparison'
    ) {
      setActiveNav('farm_planning');
      setFarmPlanningSubTab('milp');
      return;
    }

    // Backward-compatible mapping for legacy analytics tab calls
    if (nav === 'analytics') {
      if (tab === 'optimization' || tab === 'milp') {
        setActiveNav('farm_planning');
        setFarmPlanningSubTab('milp');
        return;
      }
      if (tab === 'comparison_lab' || tab === 'lab') {
        setActiveNav('farm_planning');
        setFarmPlanningSubTab('comparison');
        return;
      }
      if (tab === 'replan') {
        setActiveNav('farm_planning');
        setFarmPlanningSubTab('replan');
        return;
      }
      if (tab === 'water' || tab === 'irrigation') {
        setActiveNav('water_irrigation');
        setWaterSubTab('optimization');
        return;
      }
      if (
        tab === 'canvas_3d' ||
        tab === '3d' ||
        tab === 'digital_twin' ||
        tab === 'plan_viewer' ||
        tab === 'crop_growth' ||
        tab === 'climate_stress' ||
        tab === 'scenario_comparison'
      ) {
        setActiveNav('farm_planning');
        setFarmPlanningSubTab('milp');
        return;
      }
      if (tab === 'sources' || tab === 'evidence') {
        setActiveNav('data_evidence');
        setDataEvidenceSubTab('sources');
        return;
      }
      if (tab === 'synthetic_lab' || tab === 'provenance') {
        setActiveNav('data_evidence');
        setDataEvidenceSubTab('provenance');
        return;
      }
      if (tab === 'market' || tab === 'outcomes' || tab === 'sustainability') {
        setActiveNav('harvest_profit');
        return;
      }
      if (tab === 'crops' || tab === 'crop_catalog') {
        setActiveNav('crop_advice');
        setCropSubTab('catalog');
        return;
      }
      if (tab === 'weather' || tab === 'uncertainty') {
        setActiveNav('weather');
        return;
      }
      if (tab === 'satellites') {
        setActiveNav('data_evidence');
        setDataEvidenceSubTab('satellites');
        return;
      }
      if (tab === 'field' || tab === 'field_map') {
        setActiveNav('field');
        if (tab === 'field_map') setMyFarmSubTab('map');
        return;
      }
      if (tab === 'assistant') {
        setActiveNav('assistant');
        return;
      }
      if (tab === 'account') {
        setActiveNav('account');
        return;
      }
      if (tab === 'dashboard') {
        setActiveNav('dashboard');
        return;
      }
      // Route any other research sub-tabs cleanly to the 20-module research lab
      setActiveNav('research');
      if (tab) setAnalysisTab(tab);
      return;
    }

    if (nav === 'market' || nav === 'harvest_profit') {
      setActiveNav('harvest_profit');
      return;
    }
    if (nav === 'synthetic_lab') {
      setActiveNav('data_evidence');
      setDataEvidenceSubTab('provenance');
      return;
    }
    if (nav === 'sensitivity') {
      setActiveNav('research');
      setAnalysisTab('sensitivity');
      return;
    }
    if (nav === 'field_map') {
      setActiveNav('field');
      setMyFarmSubTab('map');
      return;
    }

    // Direct routing for the 12 primary keys with sub-tab support
    if (tab) {
      if (nav === 'crop_advice') setCropSubTab(tab);
      else if (nav === 'harvest_profit') setHarvestSubTab(tab);
      else if (nav === 'farm_planning') setFarmPlanningSubTab(tab);
      else if (nav === 'water_irrigation') setWaterSubTab(tab);
      else if (nav === 'data_evidence') setDataEvidenceSubTab(tab);
      else if (nav === 'field') setMyFarmSubTab(tab);
      else if (nav === 'research') setAnalysisTab(tab);
    }
    setActiveNav(nav);
  };

  // User & Account state
  const [user, setUser] = useState(null);
  const [userFarms, setUserFarms] = useState([]);
  const [userFields, setUserFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(() => {
    try {
      const saved = localStorage.getItem('fs_selected_field_id');
      if (saved) return saved;
    } catch {}
    return null;
  });
  const [fieldsLoaded, setFieldsLoaded] = useState(false);
  const [fieldsError, setFieldsError] = useState('');
  const [userAnalyses, setUserAnalyses] = useState([]);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authMsg, setAuthMsg] = useState('');
  const [authError, setAuthError] = useState('');
    const [onboardingOpen, setOnboardingOpen] = useState(() => {
    try {
      return !localStorage.getItem('fieldshift_onboarding_completed');
    } catch (_) {
      return false;
    }
  });
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [saveFieldMsg, setSaveFieldMsg] = useState('');
  const [profileTab, setProfileTab] = useState('parcels');
  const [analysisTab, setAnalysisTab] = useState('optimization');
  const [selectedStrategyId, setSelectedStrategyId] = useState('balanced');
  const [selectedMlSeasonKey, setSelectedMlSeasonKey] = useState('Y1_S1');
  const [selectedRlSeasonKey, setSelectedRlSeasonKey] = useState('Y1_S1');
  const [selectedStressScenarioKey, setSelectedStressScenarioKey] = useState('normal');
  const [selectedBenchmarkContext, setSelectedBenchmarkContext] = useState('operational');
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState('');
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [benchmarkSuiteResults, setBenchmarkSuiteResults] = useState({});
  const [provenanceExpanded, setProvenanceExpanded] = useState(false);
  const [matrixViewMode, setMatrixViewMode] = useState('matrix'); // 'matrix' | 'tradeoffs' | 'timeline'
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [defaultsMsg, setDefaultsMsg] = useState('');
  const [newParcel, setNewParcel] = useState({
    name: '',
    latitude: '',
    longitude: '',
    area_ha: '',
    soil_texture: 'unknown',
    soil_ph: '',
    organic_matter: '',
    irrigation_capacity_mm: ''
  });

  // Dark Theme Dashboard UI States
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [cropCategoryFilter, setCropCategoryFilter] = useState('All');
  const [selectedCropItem, setSelectedCropItem] = useState('Sorghum');
  const [isPlayingCamera, setIsPlayingCamera] = useState(true);
  const [cameraScrubberPct, setCameraScrubberPct] = useState(65);

  // Dedicated Field Management State for Profile
  const [fieldModal, setFieldModal] = useState(null); // 'add' | 'edit' | null
  const [fieldModalError, setFieldModalError] = useState('');
  const [fieldModalLoading, setFieldModalLoading] = useState(false);
  const [viewingField, setViewingField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    id: null,
    name: '',
    latitude: '',
    longitude: '',
    area_ha: '',
    soil_texture: 'unknown',
    soil_ph: '',
    organic_matter: '',
    irrigation_capacity_mm: '',
    crop: '',
    previous_crop_year: ''
  });

  // The selected PostgreSQL field is held once in selectedFieldId. The form
  // contains only analysis controls and is hydrated from that row at submit.
  const [form, setForm] = useState(() => ({
    start_date: '2026-08-31',
    end_date: '2026-09-29',
    mode: 'live',
    season: 'dry',
    include_history: true,
    counterfactual_rainfall_delta_mm: ''
  }));

  const demoField = useMemo(() => ({
    id: 'demo',
    is_demo: true,
    name: lang === 'bn' ? 'বগুড়া ডেমো খামার [DEMO]' : 'Demo Field (Bogura 10 ha) [DEMO]',
    full_name: lang === 'bn' ? 'বগুড়া কৃষি গবেষণা প্লট [DEMO]' : 'Bogura Agricultural Research Plot (10 ha) [DEMO]',
    latitude: 24.8500,
    longitude: 89.3700,
    district: 'bogura',
    area_ha: 10.0,
    soil_texture: 'loam',
    soil_ph: 6.5,
    organic_matter: 2.5,
    irrigation_capacity_mm: 90,
    crop: 'Maize',
    previous_crop: 'Maize',
    previous_crop_year: 2024,
    source_label: 'Offline Research Benchmark'
  }), [lang]);

  // Registered fields always resolve by the shared selectedFieldId.
  // Explicit demo option maps consistently to demoField across all views.
  const activeField = useMemo(() => {
    if (selectedFieldId === 'demo') return demoField;
    if (selectedFieldId == null) return null;
    return userFields.find(field => String(field.id) === String(selectedFieldId)) || null;
  }, [userFields, selectedFieldId, demoField]);

  const workflowPayload = (controls = form, field = activeField) => {
    const payload = {
      ...controls,
      priority: STRATEGY_META[selectedStrategyId]?.priorityKey || 'balanced'
    };
    delete payload.field_id;
    delete payload.area_ha;
    delete payload.field_size_ha;
    delete payload.latitude;
    delete payload.longitude;
    delete payload.soil_texture;
    delete payload.soil_ph;
    delete payload.organic_matter;
    delete payload.irrigation_capacity_mm;
    delete payload.previous_crop;
    delete payload.previous_crop_year;
    if (field?.id === 'demo') {
      return {
        ...payload,
        field_id: 'demo',
        mode: 'offline',
        district: field.district || undefined,
        field_size_ha: field.area_ha || 10.0,
        area_ha: field.area_ha || 10.0,
        latitude: field.latitude,
        longitude: field.longitude,
        soil_texture: field.soil_texture,
        organic_matter: field.organic_matter,
        irrigation_capacity_mm: field.irrigation_capacity_mm,
        previous_crop: field.previous_crop,
        previous_crop_year: field.previous_crop_year,
      };
    }
    if (field) {
      return {
        ...payload,
        field_id: field.id,
        district: field.district || undefined,
        seasonally_flooded: field.seasonally_flooded,
        field_size_ha: field.area_ha,
        area_ha: field.area_ha,
        latitude: field.latitude,
        longitude: field.longitude,
        soil_texture: field.soil_texture || 'unknown',
        organic_matter: field.organic_matter,
        irrigation_capacity_mm: field.irrigation_capacity_mm,
      };
    }
    return payload;
  };

  // Active Field Selection & Two-Way Synchronization with Planner & Dashboard
  const handleSelectActiveField = (fld, navigateToDashboard = false, ownerId = user?.id) => {
    if (!fld) return;
    setSelectedFieldId(fld.id);
    setCounterfactualSimulation({ running: false, result: null, error: '' });
    try {
      localStorage.setItem('fs_selected_field_id', String(fld.id));
      if (ownerId != null && fld.id !== 'demo') {
        localStorage.setItem(`fs_selected_field_id_${ownerId}`, String(fld.id));
      } else if (fld.id === 'demo') {
        localStorage.setItem('fs_selected_field_id_demo', 'demo');
      }
    } catch {}
    const history = Array.isArray(fld.history) ? fld.history : [];
    const prevCrop = fld.previous_crop || fld.current_crop || (history[0] ? history[0].crop : '') || '';
    const prevYear = fld.previous_crop_year ?? (history[0] ? history[0].year : '') ?? '';

    const nextForm = { ...form, mode: fld.id === 'demo' ? 'offline' : form.mode };
    setForm(nextForm);
    setResult(null);

    if (navigateToDashboard) {
      setActiveNav('dashboard');
    }

    if (fld.id !== 'demo' && (fld.latitude == null || fld.longitude == null || !Number.isFinite(Number(fld.latitude)) || !Number.isFinite(Number(fld.longitude)))) {
      setError('Selected field does not have geographic coordinates configured. Please edit the field to set latitude and longitude.');
      setRunning(false);
      return;
    }

    // Always trigger workflow analysis for the newly selected active field
    const requestSequence = ++analysisRequestSequence.current;
    (async () => {
      setRunning(true);
      setError('');
      try {
        const body = await request('/api/workflow', {
          method: 'POST',
          body: JSON.stringify(workflowPayload(nextForm, fld))
        });
        if (requestSequence === analysisRequestSequence.current && body && body.summary && Object.keys(body.summary).length > 0) {
          setResult(body);
        }
      } catch (err) {
        if (requestSequence === analysisRequestSequence.current) setError(err.message);
      } finally {
        if (requestSequence === analysisRequestSequence.current) setRunning(false);
      }
    })();
  };

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__fs_navigate = (nav, tab = null) => {
        handleNavigate(nav, tab);
      };
      window.__fs_setLang = (newLang) => {
        setLang(newLang);
      };
      window.__fs_setTheme = (newTheme) => {
        setTheme(newTheme);
      };
      window.__fs_selectField = (fieldId) => {
        if (fieldId === 'demo' || String(fieldId) === '304') {
          const found = userFields.find(f => String(f.id) === String(fieldId));
          if (found) {
            handleSelectActiveField(found, false);
            return true;
          }
          if (demoField) {
            handleSelectActiveField(demoField, false);
            return true;
          }
        }
        const found = userFields.find(f => String(f.id) === String(fieldId));
        if (found) {
          handleSelectActiveField(found, false);
          return true;
        }
        return false;
      };
    }
  }, [userFields, demoField, handleNavigate]);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [counterfactualSimulation, setCounterfactualSimulation] = useState({
    running: false,
    result: null,
    error: '',
  });
  const hasAutoRun = useRef(false);
  const analysisRequestSequence = useRef(0);

  // Form field changes
  const change = event => {
    const { name, type, checked, value: val } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : val
    }));
  };

  const handlePrioritySelect = prio => {
    setSelectedStrategyId(toCanonicalStrategyKey(prio));
    setCounterfactualSimulation({ running: false, result: null, error: '' });
  };

  const runCounterfactual = async event => {
    event.preventDefault();
    let payload;
    try {
      payload = buildCounterfactualPayload(form, activeField, selectedStrategyId);
    } catch (validationError) {
      setCounterfactualSimulation({
        running: false,
        result: null,
        error: validationError.message,
      });
      return;
    }

    await runCounterfactualRequest({
      payload,
      request,
      setRunning: isRunning => setCounterfactualSimulation(previous => ({
        ...previous,
        running: isRunning,
      })),
      setResult: simulationResult => setCounterfactualSimulation(previous => ({
        ...previous,
        result: simulationResult,
      })),
      setError: simulationError => setCounterfactualSimulation(previous => ({
        ...previous,
        error: simulationError || '',
      })),
      development: import.meta.env.DEV,
    });
  };

  const handleRunBenchmark = async contextId => {
    const targetContext = contextId || selectedBenchmarkContext || 'scenario_A';
    setSelectedBenchmarkContext(targetContext);
    setBenchmarkError('');
    if (targetContext === 'operational') return;

    const scenMeta = BENCHMARK_SCENARIOS[targetContext];
    const targetScenId = scenMeta ? scenMeta.scen_key : targetContext.replace('scenario_', '');

    const cachedScenario = benchmarkSuiteResults[targetScenId] || benchmarkSuiteResults[targetContext];
    if (cachedScenario) {
      setBenchmarkResult(cachedScenario);
      return;
    }

    setBenchmarkLoading(true);
    try {
      const res = await request('/api/scenarios/benchmark/run', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: targetScenId, strategy_id: selectedStrategyId })
      });
      const resultMap = res?.results || (res?.result ? { [targetScenId]: res.result } : null);
      if (!resultMap) {
        throw new Error('Benchmark service returned no scenario results.');
      }
      setBenchmarkSuiteResults(prev => ({ ...prev, ...resultMap }));
      const scenarioResult = resultMap[targetScenId] || resultMap[targetContext];
      if (scenarioResult) setBenchmarkResult(scenarioResult);
      else throw new Error(`Benchmark service returned no results for scenario ${targetScenId}.`);
    } catch (err) {
      setBenchmarkError(err.message || 'Failed to load benchmark results.');
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleApplyStrategy = strategyName => {
    setSelectedStrategyId(toCanonicalStrategyKey(strategyName));
  };

  // Run analysis pipeline
  const runAnalysis = async e => {
    if (e) e.preventDefault();
    if (!activeField) {
      setError(user ? 'Select a registered PostgreSQL field or explicitly choose the offline research demo.' : 'Sign in to load your PostgreSQL fields, or explicitly choose the offline research demo.');
      return;
    }
    setRunning(true);
    setError('');
    const requestSequence = ++analysisRequestSequence.current;
    try {
      const body = await request('/api/workflow', {
        method: 'POST',
        body: JSON.stringify(workflowPayload())
      });
      if (!body || !body.summary || Object.keys(body.summary).length === 0) {
        throw new Error('FastAPI returned an empty analysis summary.');
      }
      if (requestSequence === analysisRequestSequence.current) setResult(body);
    } catch (err) {
      if (requestSequence === analysisRequestSequence.current) setError(err.message);
    } finally {
      if (requestSequence === analysisRequestSequence.current) setRunning(false);
    }
  };

  // Auth & Session Loader
  const loadUserSession = async () => {
    try {
      const res = await request('/api/auth/me');
      if (res.status === 'ok' && res.user) {
        setUser(res.user);
        await loadUserData(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const loadUserData = async (account = user, preferredFieldId = null) => {
    setFieldsLoaded(false);
    setFieldsError('');
    try {
      const farmsRes = await request('/api/farms');
      if (farmsRes.status === 'ok' && farmsRes.farms) {
        setUserFarms(farmsRes.farms);
      }
      const fieldsRes = await request('/api/fields');
      if (fieldsRes.status !== 'ok' || !Array.isArray(fieldsRes.fields)) {
        throw new Error('PostgreSQL did not return a registered field list.');
      }
      const fields = fieldsRes.fields;
      setUserFields(fields);
      setFieldsLoaded(true);
      let targetId = preferredFieldId;
      if (!targetId) {
        try {
          targetId = account?.id != null ? localStorage.getItem(`fs_selected_field_id_${account.id}`) : null;
          if (!targetId) {
            targetId = localStorage.getItem('fs_selected_field_id');
          }
        } catch {}
      }
      let active = (targetId ? fields.find(field => String(field.id) === String(targetId)) : null);
      if (!active && fields.length > 0) {
        active = fields[0];
      }
      if (active) {
        try {
          localStorage.setItem('fs_selected_field_id', String(active.id));
          if (account?.id != null) localStorage.setItem(`fs_selected_field_id_${account.id}`, String(active.id));
        } catch {}
        handleSelectActiveField(active, false, account?.id);
      } else {
        setSelectedFieldId('demo');
        handleSelectActiveField(demoField, false);
      }
      const analRes = await request('/api/analyses');
      if (analRes.status === 'ok') {
        setUserAnalyses(analRes.analyses || []);
      }
    } catch (err) {
      console.error('Failed loading user data:', err);
      setUserFields([]);
      setSelectedFieldId('demo');
      handleSelectActiveField(demoField, false);
      setFieldsError(err.message || 'Could not load registered fields from PostgreSQL.');
      setFieldsLoaded(true);
    }
  };

  // Handle Login / Register
  const handleAuthSubmit = async e => {
    e.preventDefault();
    setAuthError('');
    setAuthMsg('');
    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    try {
      const res = await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(authForm)
      });
      if (res.user) {
        setUser(res.user);
        setAuthMsg(authMode === 'register' ? 'Account created successfully!' : 'Signed in successfully!');
        loadUserData(res.user);
        setTimeout(() => setAuthModal(false), 500);
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Quick Demo Login for Reviewers & Testing
  const handleQuickDemoLogin = async () => {
    setAuthError('');
    setAuthMsg('Signing in with demo research session…');
    try {
      try {
        const res = await request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'demo@fieldshift.nasa', password: 'DemoPassword2026!' })
        });
        if (res.user) {
          setUser(res.user);
          setAuthMsg('Signed in as Demo Agronomist');
          loadUserData(res.user);
          setAuthModal(false);
          return;
        }
      } catch (loginErr) {
        const regRes = await request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: 'Demo Agronomist', email: 'demo@fieldshift.nasa', password: 'DemoPassword2026!' })
        });
        if (regRes.user) {
          setUser(regRes.user);
          setAuthMsg('Created and signed into Demo Agronomist session');
          loadUserData(regRes.user);
          setAuthModal(false);
          return;
        }
        throw loginErr;
      }
    } catch (err) {
      setAuthError(err.message || 'Demo session unavailable');
    }
  };

  const handleSignOut = async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      localStorage.removeItem('fs_selected_field_id');
    } catch {}
    setUser(null);
    setUserFarms([]);
    setUserFields([]);
    setSelectedFieldId(null);
    setUserAnalyses([]);
    setFieldsLoaded(false);
    setFieldsError('');
    setAuthMsg('');
  };

  // Register New Field Parcel
  const handleRegisterParcel = async e => {
    e.preventDefault();
    if (!userFarms.length) {
      setSaveFieldMsg('Create or select an active farm first.');
      return;
    }
    try {
      const payload = {
        farm_id: userFarms[0].id,
        name: newParcel.name.trim() || `Parcel ${new Date().toLocaleDateString()}`,
        latitude: parseFloat(newParcel.latitude),
        longitude: parseFloat(newParcel.longitude),
        area_ha: newParcel.area_ha === '' ? null : parseFloat(newParcel.area_ha),
        soil_texture: newParcel.soil_texture,
        soil_ph: newParcel.soil_ph === '' || newParcel.soil_ph == null ? null : parseFloat(newParcel.soil_ph),
        organic_matter: newParcel.organic_matter === '' ? null : parseFloat(newParcel.organic_matter),
        irrigation_capacity_mm: newParcel.irrigation_capacity_mm === '' ? null : parseFloat(newParcel.irrigation_capacity_mm)
      };
      const res = await request('/api/fields', { method: 'POST', body: JSON.stringify(payload) });
      if (res.status === 'created') {
        setSaveFieldMsg(`Parcel "${res.field.name}" successfully registered in PostgreSQL!`);
        setNewParcel(prev => ({ ...prev, name: '' }));
        loadUserData();
      }
    } catch (err) {
      setSaveFieldMsg(`Registration failed: ${err.message}`);
    }
  };

  const applyPresetCoords = (presetName, lat, lon, texture, om, irrig) => {
    setNewParcel(prev => ({
      ...prev,
      name: `${presetName} Demo Parcel`,
      latitude: String(lat),
      longitude: String(lon),
      soil_texture: texture,
      organic_matter: String(om),
      irrigation_capacity_mm: String(irrig)
    }));
  };

  const handleSaveDefaults = e => {
    e.preventDefault();
    setDefaultsMsg('Research telemetry & optimization priority defaults updated!');
    setTimeout(() => setDefaultsMsg(''), 4000);
  };

  // Load Saved Field into Planner
  const loadSavedFieldIntoForm = fld => {
    handleSelectActiveField(fld, true);
  };

  // Profile Information Edit Modal State
  const [profileModal, setProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileFarmName, setProfileFarmName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const openEditProfile = () => {
    setProfileName(user ? user.name : '');
    setProfileFarmName(userFarms.length > 0 && userFarms[0].name ? userFarms[0].name : 'Primary Research Station');
    setProfileError('');
    setProfileSuccess('');
    setProfileModal(true);
  };

  const handleProfileUpdate = async e => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      if (profileName.trim()) {
        const uRes = await request('/api/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ name: profileName.trim() })
        });
        if (uRes.user) {
          setUser(uRes.user);
        }
      }
      if (userFarms.length > 0 && profileFarmName.trim()) {
        await request(`/api/farms/${userFarms[0].id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: profileFarmName.trim() })
        });
        await loadUserData();
      }
      setProfileSuccess('Profile and station updated successfully!');
      setTimeout(() => {
        setProfileModal(false);
      }, 900);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // Dedicated Field Management Handlers
  const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const openAddFieldModal = (initialCoords = null) => {
    setFieldModal('add');
    setFieldModalError('');
    const defaultLat = initialCoords?.latitude != null ? String(initialCoords.latitude) : '';
    const defaultLon = initialCoords?.longitude != null ? String(initialCoords.longitude) : '';

    setFieldForm({
      id: null,
      name: '',
      latitude: defaultLat,
      longitude: defaultLon,
      area_input: '',
      area_unit: 'bigha',
      area_ha: '',
      soil_texture: 'unknown',
      soil_ph: '',
      organic_matter: '',
      irrigation_tier: 'ample',
      irrigation_capacity_mm: '1200',
      show_custom_irrigation: false,
      crop: '',
      season: 'rabi',
      rotation_rabi: 'Boro',
      rotation_kharif1: 'Fallow',
      rotation_kharif2: 'Aman',
      rabi_yield: '',
      rabi_price: '',
      k1_yield: '',
      k1_price: '',
      k2_yield: '',
      k2_price: '',
      previous_crop_year: String(new Date().getFullYear()),
      seasonally_flooded: false
    });
  };

  const openEditFieldModal = fld => {
    setFieldModal('edit');
    setFieldModalError('');
    const irrVal = fld.irrigation_capacity_mm != null ? String(fld.irrigation_capacity_mm) : '1200';
    let tier = 'custom';
    if (irrVal === '1200') tier = 'ample';
    else if (irrVal === '400') tier = 'limited';
    else if (irrVal === '0') tier = 'rainfed';

    const bighaArea = fld.area_ha != null ? String(Number((fld.area_ha / 0.13378).toFixed(1))) : '';

    setFieldForm({
      id: fld.id,
      farm_id: fld.farm_id,
      name: fld.name || '',
      latitude: fld.latitude != null ? String(fld.latitude) : '',
      longitude: fld.longitude != null ? String(fld.longitude) : '',
      area_input: bighaArea,
      area_unit: 'bigha',
      area_ha: fld.area_ha != null ? String(fld.area_ha) : '',
      soil_texture: fld.soil_texture || 'unknown',
      soil_ph: fld.soil_ph != null ? String(fld.soil_ph) : '',
      organic_matter: fld.organic_matter != null ? String(fld.organic_matter) : '',
      irrigation_tier: tier,
      irrigation_capacity_mm: irrVal,
      show_custom_irrigation: tier === 'custom',
      crop: fld.existing_rotation?.rabi || fld.previous_crop || fld.current_crop || (fld.history && fld.history[0]?.crop) || 'Boro',
      season: (fld.history && fld.history[0]?.season) || 'rabi',
      rotation_rabi: fld.existing_rotation?.rabi || fld.previous_crop || 'Boro',
      rotation_kharif1: fld.existing_rotation?.kharif1 || 'Fallow',
      rotation_kharif2: fld.existing_rotation?.kharif2 || 'Aman',
      rabi_yield: '',
      rabi_price: '',
      k1_yield: '',
      k1_price: '',
      k2_yield: '',
      k2_price: '',
      previous_crop_year: fld.previous_crop_year != null ? String(fld.previous_crop_year) : (fld.history && fld.history[0]?.year ? String(fld.history[0]?.year) : String(new Date().getFullYear())),
      seasonally_flooded: Boolean(fld.seasonally_flooded)
    });
  };

  const handleFieldFormSubmit = async e => {
    e.preventDefault();
    setFieldModalLoading(true);
    setFieldModalError('');
    try {
      const trimmedName = (fieldForm.name || '').trim();
      if (!trimmedName) {
        throw new Error(lang === 'bn' ? 'জমির নাম আবশ্যক।' : 'Field name is required.');
      }
      const latVal = fieldForm.latitude === '' || fieldForm.latitude == null ? null : parseFloat(fieldForm.latitude);
      const lonVal = fieldForm.longitude === '' || fieldForm.longitude == null ? null : parseFloat(fieldForm.longitude);
      if (latVal == null || lonVal == null || !Number.isFinite(latVal) || !Number.isFinite(lonVal)) {
        throw new Error(lang === 'bn' ? 'ম্যাপ বা জিপিএস থেকে স্থানাঙ্ক নির্বাচন করা আবশ্যক।' : 'Coordinates must be set via map pin or GPS.');
      }
      const areaVal = fieldForm.area_ha === '' || fieldForm.area_ha == null ? null : parseFloat(fieldForm.area_ha);
      const phVal = fieldForm.soil_ph === '' || fieldForm.soil_ph == null ? null : parseFloat(fieldForm.soil_ph);
      const omVal = fieldForm.organic_matter === '' || fieldForm.organic_matter == null ? null : parseFloat(fieldForm.organic_matter);
      const irrVal = fieldForm.irrigation_capacity_mm === '' || fieldForm.irrigation_capacity_mm == null ? null : parseFloat(fieldForm.irrigation_capacity_mm);
      const yrVal = fieldForm.previous_crop_year === '' || fieldForm.previous_crop_year == null ? null : parseInt(fieldForm.previous_crop_year, 10);

      // Duplicate validation against registered user fields
      const sameName = userFields.find(f => String(f.id) !== String(fieldForm.id) && (f.name || '').trim().toLowerCase() === trimmedName.toLowerCase());
      if (sameName) {
        throw new Error(lang === 'bn' ? `"${trimmedName}" নামের জমি ইতিমধ্যে বিদ্যমান। ভিন্ন নাম নির্বাচন করুন।` : `A field named "${trimmedName}" already exists. Please choose a different name.`);
      }
      const tooClose = userFields.find(f => {
        if (String(f.id) === String(fieldForm.id)) return false;
        if (f.latitude == null || f.longitude == null) return false;
        return haversineMeters(latVal, lonVal, Number(f.latitude), Number(f.longitude)) < 50;
      });
      if (tooClose) {
        throw new Error(lang === 'bn' ? `এই স্থানাঙ্কের ৫০ মিটারের মধ্যে "${tooClose.name}" জমিটি ইতিমধ্যে বিদ্যমান।` : `A field ("${tooClose.name}") already exists within 50 meters of these coordinates.`);
      }

      const formRot = {
        rabi: fieldForm.rotation_rabi || 'Boro',
        kharif1: fieldForm.rotation_kharif1 || 'Fallow',
        kharif2: fieldForm.rotation_kharif2 || 'Aman'
      };

      const payload = {
        name: trimmedName,
        latitude: latVal,
        longitude: lonVal,
        area_ha: Number.isFinite(areaVal) ? areaVal : 1.0,
        soil_texture: fieldForm.soil_texture === 'unknown' ? null : fieldForm.soil_texture,
        soil_ph: Number.isFinite(phVal) ? phVal : null,
        organic_matter: Number.isFinite(omVal) ? omVal : null,
        irrigation_capacity_mm: Number.isFinite(irrVal) ? irrVal : null,
        crop: formRot.rabi,
        previous_crop: formRot.rabi,
        previous_crop_year: Number.isFinite(yrVal) ? yrVal : new Date().getFullYear(),
        seasonally_flooded: Boolean(fieldForm.seasonally_flooded),
        existing_rotation: formRot
      };
      if (userFarms.length) {
        payload.farm_id = userFarms[0].id;
      }
      let res;
      if (fieldModal === 'edit' && fieldForm.id) {
        res = await request(`/api/fields/${fieldForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await request('/api/fields', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      const newFieldId = res?.field?.id || (fieldModal === 'edit' ? fieldForm.id : null);
      if (newFieldId) {
        // Save farmer economics records into field history if provided (MF9)
        const econSlots = [
          { crop: formRot.rabi, season: 'rabi', yieldVal: fieldForm.rabi_yield, priceVal: fieldForm.rabi_price },
          { crop: formRot.kharif1, season: 'kharif1', yieldVal: fieldForm.k1_yield, priceVal: fieldForm.k1_price },
          { crop: formRot.kharif2, season: 'kharif2', yieldVal: fieldForm.k2_yield, priceVal: fieldForm.k2_price }
        ];
        for (const slot of econSlots) {
          if (slot.crop && slot.crop !== 'Fallow' && (slot.yieldVal || slot.priceVal)) {
            const yNum = parseFloat(slot.yieldVal);
            const pNum = parseFloat(slot.priceVal);
            const tonHa = Number.isFinite(yNum) ? Number((yNum * 0.278965).toFixed(3)) : null;
            try {
              await request(`/api/fields/${newFieldId}/history`, {
                method: 'POST',
                body: JSON.stringify({
                  crop: slot.crop,
                  season: slot.season,
                  year: 2025,
                  yield_ton_per_ha: tonHa,
                  price_bdt_per_maund: Number.isFinite(pNum) ? pNum : null,
                  notes: 'Farmer baseline economics from rotation input'
                })
              });
            } catch (hErr) {
              console.warn('History entry saving:', hErr);
            }
          }
        }
      }
      if (newFieldId && fieldModal !== 'edit') {
        if (fieldForm.crop && fieldForm.crop.trim() && !fieldForm.rabi_yield && !fieldForm.rabi_price) {
          try {
            await request(`/api/fields/${newFieldId}/history`, {
              method: 'POST',
              body: JSON.stringify({
                crop: fieldForm.crop.trim(),
                season: fieldForm.season || 'rabi',
                year: Number.isFinite(yrVal) ? yrVal : new Date().getFullYear(),
                notes: 'Initial rotation entry'
              })
            });
          } catch (hErr) {
            console.warn('Field history setup:', hErr);
          }
        }
        try {
          await request(`/api/fields/${newFieldId}/enrich`, {
            method: 'POST',
            body: JSON.stringify({
              latitude: latVal,
              longitude: lonVal,
              area_ha: Number.isFinite(areaVal) ? areaVal : 1.0,
              soil_ph: Number.isFinite(phVal) ? phVal : undefined,
              organic_matter: Number.isFinite(omVal) ? omVal : undefined,
              soil_texture: fieldForm.soil_texture === 'unknown' ? undefined : fieldForm.soil_texture
            })
          });
        } catch (eErr) {
          console.warn('Enrichment failed:', eErr);
        }
      }
      await loadUserData(user, newFieldId);
      setFieldModal(null);
      setToastMessage({
        type: 'success',
        message: lang === 'bn'
          ? (fieldModal === 'edit' ? `"${payload.name}" সফলভাবে আপডেট করা হয়েছে।` : `"${payload.name}" নতুন জমি সফলভাবে তৈরি ও সমৃদ্ধ করা হয়েছে।`)
          : (fieldModal === 'edit' ? `Field "${payload.name}" updated successfully.` : `Field "${payload.name}" added and enriched successfully.`)
      });
    } catch (err) {
      setFieldModalError(err.message);
    } finally {
      setFieldModalLoading(false);
    }
  };

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handleArchiveField = fld => {
    if (!fld) return;
    setDeleteConfirmTarget(fld);
  };

  const executeDeleteFields = async (target) => {
    const targets = Array.isArray(target) ? target : [target];
    setDeleteConfirmTarget(null);
    try {
      for (const t of targets) {
        if (t?.id && t.id !== 'demo') {
          await request(`/api/fields/${t.id}`, { method: 'DELETE' });
        }
      }
      const deletedIdSet = new Set(targets.map(t => String(t.id)));
      const remaining = userFields.filter(f => !deletedIdSet.has(String(f.id)));
      setUserFields(remaining);
      if (deletedIdSet.has(String(activeField?.id))) {
        if (remaining.length > 0) {
          handleSelectActiveField(remaining[0], false);
        } else {
          handleSelectActiveField(null, false);
        }
      }
      if (viewingField && deletedIdSet.has(String(viewingField.id))) {
        setViewingField(null);
      }
      setToastMessage({
        type: 'success',
        message: lang === 'bn'
          ? (targets.length > 1 ? `${targets.length}টি জমি সফলভাবে মুছে ফেলা হয়েছে।` : `"${targets[0]?.name}" জমিটি সফলভাবে মুছে ফেলা হয়েছে।`)
          : (targets.length > 1 ? `${targets.length} fields deleted successfully.` : `Field "${targets[0]?.name}" deleted successfully.`)
      });
    } catch (err) {
      setToastMessage({
        type: 'error',
        message: lang === 'bn' ? `মুছে ফেলা সম্ভব হয়নি: ${err.message}` : `Could not delete: ${err.message}`
      });
    }
  };

  const selectFieldForAnalysis = fld => {
    handleSelectActiveField(fld, false);
  };

  // Load Past Analysis Result
  const loadPastAnalysisResult = anal => {
    if (anal.summary_json && anal.summary_json.result) {
      setResult(anal.summary_json.result);
      setActiveNav('dashboard');
    } else if (anal.summary_json && anal.summary_json.workflow_payload) {
      setForm(prev => ({ ...prev, ...anal.summary_json.workflow_payload }));
      setActiveNav('dashboard');
      runAnalysis();
    }
  };

  // Auto-run once on initial load
  useEffect(() => {
    if (!hasAutoRun.current) {
      hasAutoRun.current = true;
      loadUserSession();
    }
  }, []);

  // U7 Keyboard Accessibility: Esc closes open modals and overlays
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (helpModalOpen) { setHelpModalOpen(false); return; }
        if (showNotifications) { setShowNotifications(false); return; }
        if (fieldModal) { setFieldModal(null); return; }
        if (viewingField) { setViewingField(null); return; }
        if (profileModal) { setProfileModal(false); return; }
        if (authModal) { setAuthModal(false); return; }
        if (mobileNavOpen) { setMobileNavOpen(false); return; }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [helpModalOpen, showNotifications, fieldModal, viewingField, profileModal, authModal, mobileNavOpen]);

  const summary = result?.summary || {};
  const ml = summary.ml || {};
  const planning = summary.planning || {};
  const counterfactualResult = counterfactualSimulation.result;
  const field = summary.field_state || {};
  const nasa = summary.nasa_power || {};
  const rl = summary.rl || {};
  const rlPolicy = summary.rl_policy || {};
  const rlVsMilp = summary.rl_vs_milp || {};
  const xai = summary.xai || {};
  const stress = summary.stress_test || {};
  const scenarios = stress.scenarios || {};
  const cf = summary.counterfactual;
  const strategies = planning.strategy_comparison || {};
  const sim = rl.simulation_trained_policy || {};
  const mlContributors = xai.ml_explanation?.top_contributors || [];
  const comparisonLab = summary.comparison_lab || summary.lab_compare || summary.comparison || null;
  const robustness = summary.robustness_analysis || summary.weather_uncertainty?.robustness_analysis || summary.stress_test?.robustness || null;
  const outcomes = summary.actual_outcomes || summary.outcomes || [];

  const allStrategiesMap = useMemo(() => {
    const rawAll = planning.all_strategies || {};
    const rawComp = planning.strategy_comparison || {};
    const canonicalKeys = ['profit_focused', 'water_efficiency', 'soil_health', 'balanced'];

    const result = {};
    canonicalKeys.forEach(ck => {
      let compItem = null;
      let allItem = null;

      for (const [k, v] of Object.entries(rawComp)) {
        if (toCanonicalStrategyKey(k) === ck) {
          compItem = v;
          break;
        }
      }
      for (const [k, v] of Object.entries(rawAll)) {
        if (toCanonicalStrategyKey(k) === ck) {
          allItem = v;
          break;
        }
      }

      const mergedComp = compItem || {};
      const mergedAll = allItem || {};

      if (!compItem && !allItem) return;

      result[ck] = {
        ...mergedAll,
        ...mergedComp,
        strategy_id: ck,
        scenario_id: 'operational',
        strategy_name: STRATEGY_PROFILES[ck]?.name || ck,
        weights: mergedAll.requested_weights || mergedComp.weights || mergedAll.weights?.requested || mergedComp.weights?.requested || null,
        effective_weights: mergedAll.effective_weights || mergedAll.weights?.effective || mergedComp.effective_weights || null,
        rotation: mergedAll.selected_crop_by_period || mergedComp.rotation || mergedAll.rotation || null,
        selected_crop_by_period: mergedAll.selected_crop_by_period || mergedComp.rotation || mergedAll.rotation || null,
        gross_margin_bdt_per_ha: mergedAll.gross_margin_bdt_per_ha ?? mergedComp.gross_margin_bdt_per_ha ?? mergedAll.profit_bdt_ha ?? mergedComp.profit_bdt_ha ?? mergedAll.profit_component ?? mergedComp.profit_component ?? null,
        profit_component: mergedAll.gross_margin_bdt_per_ha ?? mergedComp.gross_margin_bdt_per_ha ?? mergedAll.profit_bdt_ha ?? mergedComp.profit_bdt_ha ?? mergedAll.profit_component ?? mergedComp.profit_component ?? null,
        water_score: mergedAll.water_score ?? mergedComp.water_score ?? mergedAll.water_component ?? mergedComp.water_component ?? null,
        water_component: mergedAll.water_score ?? mergedComp.water_score ?? mergedAll.water_component ?? mergedComp.water_component ?? null,
        soil_score: mergedAll.soil_score ?? mergedComp.soil_score ?? mergedAll.soil_component ?? mergedComp.soil_component ?? null,
        soil_component: mergedAll.soil_score ?? mergedComp.soil_score ?? mergedAll.soil_component ?? mergedComp.soil_component ?? null,
        composite_score: mergedAll.composite_score ?? mergedComp.composite_score ?? mergedAll.objective_value ?? mergedComp.objective_value ?? null,
        objective_value: mergedAll.composite_score ?? mergedComp.composite_score ?? mergedAll.objective_value ?? mergedComp.objective_value ?? null,
        solver_status: mergedAll.solver_status || mergedComp.solver_status || 'Optimal',
        status: mergedAll.status || mergedComp.status || 'optimal',
        normalized_components: mergedAll.normalized_components || null,
        constraint_summary: mergedAll.constraint_summary || null,
        same_rotation_as: mergedAll.same_rotation_as || null,
        decision_explanation: mergedAll.decision_explanation || mergedComp.decision_explanation || null
      };
    });

    return result;
  }, [planning]);

  const currentStrategyResults = useMemo(() => {
    const canonicalKeys = ['profit_focused', 'water_efficiency', 'soil_health', 'balanced'];

    if (selectedBenchmarkContext === 'operational') {
      const map = {};
      canonicalKeys.forEach(ck => {
        const item = allStrategiesMap[ck] || {};
        if (!allStrategiesMap[ck]) return;
        map[ck] = {
          ...item,
          strategy_id: ck,
          strategy_name: STRATEGY_PROFILES[ck]?.name || ck,
          scenario_id: 'operational',
          weights: getStrategyWeights(item, ck)
        };
      });
      return map;
    }

    const scenMeta = BENCHMARK_SCENARIOS[selectedBenchmarkContext];
    const scenKey = scenMeta ? scenMeta.scen_key : (selectedBenchmarkContext ? selectedBenchmarkContext.replace('scenario_', '') : 'A');
    const activeBenchmarkData = benchmarkSuiteResults[selectedBenchmarkContext] || benchmarkSuiteResults[scenKey];

    if (activeBenchmarkData && activeBenchmarkData.strategies) {
      const map = {};
      canonicalKeys.forEach(ck => {
        let found = null;
        for (const [k, v] of Object.entries(activeBenchmarkData.strategies)) {
          if (toCanonicalStrategyKey(k) === ck || k === ck) {
            found = v;
            break;
          }
        }
        if (found) {
          const grossMargin = found.gross_margin_bdt_per_ha ?? found.gross_margin_ha ?? found.profit_bdt_ha ?? found.profit_component ?? (found.total_profit_bdt != null ? found.total_profit_bdt / (activeBenchmarkData.inputs?.field_size_ha || 1) : null);
          const rotation = found.rotation || found.selected_crop_by_period || {};
          map[ck] = {
            ...found,
            strategy_id: ck,
            strategy_name: STRATEGY_PROFILES[ck]?.name || ck,
            scenario_id: selectedBenchmarkContext,
            weights: getStrategyWeights(found, ck),
            gross_margin_bdt_per_ha: grossMargin,
            profit_component: grossMargin,
            total_profit_bdt: found.total_profit_bdt,
            water_score: found.water_score ?? found.water_component,
            water_component: found.water_score ?? found.water_component,
            soil_score: found.soil_score ?? found.soil_component,
            soil_component: found.soil_score ?? found.soil_component,
            composite_score: found.composite_score ?? found.score ?? found.objective_value,
            objective_value: found.composite_score ?? found.score ?? found.objective_value,
            rotation,
            selected_crop_by_period: rotation,
            solver_status: found.solver_status || activeBenchmarkData.solver_status || 'Not Available',
            decision_explanation: found.decision_explanation
          };
        }
      });
      return map;
    }

    return {};
  }, [selectedBenchmarkContext, benchmarkSuiteResults, allStrategiesMap]);

  const activeMilpResult = useMemo(() => {
    if (selectedBenchmarkContext === 'operational') {
      return allStrategiesMap?.[selectedStrategyId] ?? null;
    }
    return currentStrategyResults?.[selectedStrategyId] ?? null;
  }, [selectedBenchmarkContext, selectedStrategyId, currentStrategyResults, allStrategiesMap]);

  const selectedStrategyName = activeMilpResult?.strategy_name || STRATEGY_PROFILES[selectedStrategyId]?.name || 'No strategy selected';
  const displayedScenarioId = activeMilpResult?.scenario_id;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (activeMilpResult) {
      console.assert(
        activeMilpResult.strategy_id === selectedStrategyId,
        'Active MILP result strategy mismatch'
      );
      console.assert(
        displayedScenarioId === selectedBenchmarkContext,
        'Displayed scenario mismatch'
      );
    }
  }, [activeMilpResult, selectedStrategyId, displayedScenarioId, selectedBenchmarkContext]);

  const plan = activeMilpResult || {};

  // Weather observations
  const env = field.environment || summary.stress_test?.scenarios?.normal?.baseline_state_values || summary.stress_test?.scenarios?.drought?.baseline_state_values || field;
  const tempVal = env.temperature != null ? number(env.temperature, 1) : 'Not available';
  const windVal = env.wind_speed != null ? number(env.wind_speed, 1) : 'Not available';
  const humidVal = env.humidity != null ? number(env.humidity, 1) : 'Not available';
  const rainVal = env.rainfall != null ? number(env.rainfall, 2) : 'Not available';
  const moistureVal = env.soil_moisture != null ? number(env.soil_moisture, 2) : 'Not available';

  // Rotation data
  const rotationPeriods = activeMilpResult?.rotation || {};

  const activeScenario = scenarios[selectedStress] || scenarios.normal || {};

  const fieldReadiness = useMemo(() => {
    if (!activeField) {
      return {
        isReady: false,
        missingCount: 8,
        missingText: 'No field selected',
        validCount: 0
      };
    }
    const checks = [
      { key: 'latitude', label: 'Latitude', valid: activeField.latitude != null && activeField.latitude !== '' && Number.isFinite(Number(activeField.latitude)) },
      { key: 'longitude', label: 'Longitude', valid: activeField.longitude != null && activeField.longitude !== '' && Number.isFinite(Number(activeField.longitude)) },
      { key: 'area_ha', label: 'Area', valid: activeField.area_ha != null && activeField.area_ha !== '' && Number.isFinite(Number(activeField.area_ha)) },
      { key: 'soil_texture', label: 'Soil Texture', valid: activeField.soil_texture != null && activeField.soil_texture !== '' && activeField.soil_texture !== 'unknown' },
      { key: 'organic_matter', label: 'Organic Matter', valid: activeField.organic_matter != null && activeField.organic_matter !== '' && Number.isFinite(Number(activeField.organic_matter)) },
      { key: 'irrigation_capacity_mm', label: 'Irrigation Capacity', valid: activeField.irrigation_capacity_mm != null && activeField.irrigation_capacity_mm !== '' && Number.isFinite(Number(activeField.irrigation_capacity_mm)) },
      { key: 'previous_crop', label: 'Previous Crop', valid: Boolean(activeField.previous_crop || activeField.current_crop || (activeField.history && activeField.history[0]?.crop)) },
      { key: 'previous_crop_year', label: 'Crop Year', valid: Boolean(activeField.previous_crop_year || (activeField.history && activeField.history[0]?.year)) },
    ];
    const validCount = checks.filter(c => c.valid).length;
    const missing = checks.filter(c => !c.valid).map(c => c.label);
    const hasCoords = checks[0].valid && checks[1].valid;
    const isReady = hasCoords && validCount >= 6;
    return {
      isReady,
      missingCount: checks.length - validCount,
      missingText: missing.length ? missing.join(', ') : 'None',
      validCount
    };
  }, [activeField]);

  const analysisFreshness = useMemo(() => {
    if (!summary || !summary.field_state) {
      return {
        status: 'required',
        badgeLabel: 'Analysis Required',
        titleLabel: 'Analysis Required',
        subLabel: 'Run analysis to compute field metrics'
      };
    }
    const sf = summary.field_state;
    const fieldMatch = String(sf.field_id || sf.id) === String(activeField?.id);
    const latMatch = formatNumber(sf.latitude, 3) === formatNumber(activeField?.latitude, 3);
    const lonMatch = formatNumber(sf.longitude, 3) === formatNumber(activeField?.longitude, 3);
    const areaMatch = formatNumber(sf.field_size_ha || sf.area_ha, 1) === formatNumber(activeField?.area_ha, 1);

    if (!fieldMatch || !latMatch || !lonMatch || !areaMatch) {
      return {
        status: 'outdated',
        badgeLabel: 'Analysis Outdated',
        titleLabel: 'Analysis Outdated',
        subLabel: 'Field data or coordinates changed'
      };
    }
    return {
      status: 'up_to_date',
      badgeLabel: 'Up to Date',
      titleLabel: 'Analysis Up to Date',
      subLabel: `${activeField?.name || 'Active Field'} • NASA POWER + MILP + ML`
    };
  }, [summary, activeField]);

  const optimizationDecision = useMemo(() => {
    if (!activeMilpResult) {
      return {
        status: 'failed',
        badgeLabel: 'Unavailable',
        sequenceLabel: 'Optimization Unavailable',
        metricLabel: 'No MILP result available for this strategy/context.',
        strategyTitle: STRATEGY_PROFILES[selectedStrategyId]?.name || 'No strategy selected'
      };
    }
    const status = activeMilpResult.solver_status || 'Optimal';
    const isOptimal = String(status).toLowerCase() === 'optimal';
    const isFeasible = String(status).toLowerCase() === 'feasible';

    const stratKey = selectedStrategyId;
    const stratMeta = STRATEGY_META[stratKey] || STRATEGY_META.balanced;
    const seq = rotationPeriods.Y1_S1 && rotationPeriods.Y1_S2
      ? `${rotationPeriods.Y1_S1} → ${rotationPeriods.Y1_S2} ...`
      : 'Rotation sequence calculated';
    const profitVal = activeMilpResult?.gross_margin_bdt_per_ha;
    const metricText = profitVal != null ? `৳${Math.round(Number(profitVal)).toLocaleString()} BDT/ha` : 'Metrics unavailable';

    if (isOptimal) {
      return {
        status: 'optimal',
        badgeLabel: 'MILP Optimal',
        sequenceLabel: seq,
        metricLabel: metricText,
        strategyTitle: activeMilpResult.strategy_name
      };
    } else if (isFeasible) {
      return {
        status: 'feasible',
        badgeLabel: 'Feasible Solution',
        sequenceLabel: seq,
        metricLabel: metricText,
        strategyTitle: activeMilpResult.strategy_name
      };
    } else {
      return {
        status: 'failed',
        badgeLabel: 'Unavailable',
        sequenceLabel: 'Optimization Unavailable',
        metricLabel: 'Check field inputs / constraints',
        strategyTitle: activeMilpResult.strategy_name
      };
    }
  }, [plan, selectedStrategyId, activeMilpResult, rotationPeriods]);

  const researchInsight = useMemo(() => {
    if (!fieldReadiness.isReady) {
      return {
        priority: 1,
        text: 'Complete missing field data before interpreting results.',
        ctaText: 'Review Field',
        action: () => setActiveNav('account')
      };
    }
    if (nasa.error || nasa.data_status === 'error') {
      return {
        priority: 2,
        text: 'Environmental observation data is unavailable. Retry before using weather-dependent interpretation.',
        ctaText: 'Retry NASA POWER',
        action: () => runAnalysis()
      };
    }
    if (analysisFreshness.status !== 'up_to_date') {
      return {
        priority: 3,
        text: 'Field state changed. Re-run analysis to refresh the optimization.',
        ctaText: 'Run Analysis',
        action: () => runAnalysis()
      };
    }
    if (scenarios && scenarios.warning) {
      return {
        priority: 4,
        text: `Stress scenario warning: ${scenarios.warning}`,
        ctaText: 'View Scenarios',
        action: () => {
          setActiveNav('analytics');
          setAnalysisTab('optimization');
        }
      };
    }
    if (scenarios && scenarios.normal && scenarios.normal.is_inconsistent) {
      return {
        priority: 5,
        text: 'Normal stress scenario differs from baseline state. Verify baseline input synchronization.',
        ctaText: 'View Scenarios',
        action: () => {
          setActiveNav('analytics');
          setAnalysisTab('optimization');
        }
      };
    }
    return {
      priority: 6,
      text: 'Current analysis is synchronized. Compare Balanced vs Profit Focused strategies before interpreting the baseline.',
      ctaText: 'Compare Strategies',
      action: () => {
        setActiveNav('analytics');
        setAnalysisTab('optimization');
      }
    };
  }, [fieldReadiness.isReady, nasa, analysisFreshness.status, scenarios]);

  const isResearchMode = ['research', 'water_irrigation', 'data_evidence'].includes(activeNav);
  const currentMode = isResearchMode ? 'research' : 'farmer';

  return (
    <div className="app-shell" data-mode={currentMode} data-nav={activeNav}>
      {/* Fixed NASA VIIRS Background Layer */}
      <div className="nasa-bg-layer" aria-hidden="true">
        <div className="nasa-bg-image" />
        <div className="nasa-bg-vignette" />
      </div>
      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Left Vertical Navigation Rail (Mobile Drawer on phone screens) */}
      <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo" title="FieldShift Decision Support" data-nav="dashboard" onClick={() => handleNavigate('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="sidebar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">FieldShift</span>
            <span className="sidebar-logo-tagline">AI Decision Support</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={(e) => { e.stopPropagation(); setMobileNavOpen(false); }}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary Navigation">
          {/* Canonical 8-Item Navigation Architecture (P1 Consolidation) */}
          <div className="nav-section-heading">{lang === 'bn' ? 'প্ল্যাটফর্ম মেনু' : 'Platform Menu'}</div>

          {/* 1. Overview */}
          <button
            type="button"
            data-nav="dashboard"
            className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
            title={lang === 'bn' ? '১. হোম - আজকের সারসংক্ষেপ ও পরামর্শ' : '1. Overview - Today\'s Summary & Answer'}
          >
            <span className="nav-item-icon"><HomeIcon size={20} /></span>
            <span className="nav-item-label">{lang === 'bn' ? 'হোম' : 'Overview'}</span>
          </button>

          {/* 2. My Fields */}
          <button
            type="button"
            className={`nav-item ${activeNav === 'field' || activeNav === 'field_map' ? 'active' : ''}`}
            data-nav="field" onClick={() => handleNavigate('field')}
            title={lang === 'bn' ? '২. আমার জমি - সীমানা, স্যাটেলাইট ম্যাপ ও মাটি' : '2. My Fields - Parcels, Map & Soil'}
          >
            <span className="nav-item-icon"><FieldIcon size={20} /></span>
            <span className="nav-item-label">{lang === 'bn' ? 'আমার জমি' : 'My Fields'}</span>
          </button>

          {/* 3. Rotation Planner (THE HERO PAGE) */}
          <button
            type="button"
            className={`nav-item ${activeNav === 'farm_planning' || activeNav === 'crop_advice' ? 'active' : ''}`}
            data-nav="farm_planning" onClick={() => handleNavigate('farm_planning')}
            title={lang === 'bn' ? '৩. আবর্তন পরিকল্পনা - বর্তমান বনাম ৩ বিকল্প কৌশল' : '3. Rotation Planner - Existing vs 3 Strategies'}
          >
            <span className="nav-item-icon"><RotationIcon size={20} /></span>
            <span className="nav-item-label">{lang === 'bn' ? 'আবর্তন পরিকল্পনা' : 'Rotation Planner'}</span>
          </button>

          {/* 4. Climate & Risk */}
          <button
            type="button"
            className={`nav-item ${activeNav === 'weather' ? 'active' : ''}`}
            data-nav="weather" onClick={() => handleNavigate('weather')}
            title={lang === 'bn' ? '৪. আবহাওয়া ও ঝুঁকি - নাসা বৃষ্টি, অনসেট ও খরা ঝুঁকি' : '4. Climate & Risk - NASA Rain, Onset & Heat'}
          >
            <span className="nav-item-icon"><WeatherIcon size={20} /></span>
            <span className="nav-item-label">{lang === 'bn' ? 'আবহাওয়া ও ঝুঁকি' : 'Climate & Risk'}</span>
          </button>

          {/* 5. Water & Irrigation */}
          <button
            type="button"
            className={`nav-item ${activeNav === 'water_irrigation' ? 'active' : ''}`}
            data-nav="water_irrigation" onClick={() => handleNavigate('water_irrigation')}
            title={lang === 'bn' ? '৫. পানি ও সেচ - সেচ ক্যালেন্ডার ও মাটির স্তর' : '5. Water - Irrigation Calendar & Soil Column'}
          >
            <span className="nav-item-icon"><WaterIcon size={20} /></span>
            <span className="nav-item-label">{lang === 'bn' ? 'পানি ও সেচ' : 'Water'}</span>
          </button>

          {/* 6. Market & Profit */}
          <button
            type="button"
            className={`nav-item ${activeNav === 'harvest_profit' || activeNav === 'market' ? 'active' : ''}`}
            data-nav="harvest_profit" onClick={() => handleNavigate('harvest_profit')}
            title={lang === 'bn' ? '৬. বাজার ও লাভ - বাজারদর, আয় ও জাতীয় চাহিদা' : '6. Market & Profit - Prices, Revenue & National Need'}
          >
            <span className="nav-item-icon"><MarketIcon size={20} /></span>
            <span className="nav-item-label">{lang === 'bn' ? 'বাজার ও লাভ' : 'Market & Profit'}</span>
          </button>

          {/* 7. Evidence & Method */}
          <button
            type="button"
            className={`nav-item ${activeNav === 'data_evidence' || activeNav === 'research' ? 'active' : ''}`}
            data-nav="data_evidence" onClick={() => handleNavigate('data_evidence')}
            title={lang === 'bn' ? '৭. প্রমাণ ও পদ্ধতি - নাসা উপাত্ত, পদ্ধতি ও ল্যাব আর্কাইভ' : '7. Evidence & Method - Datasets, Methods & Research'}
          >
            <span className="nav-item-icon"><EvidenceIcon size={20} /></span>
            <span className="nav-item-label">{lang === 'bn' ? 'প্রমাণ ও পদ্ধতি' : 'Evidence & Method'}</span>
          </button>

          {/* 8. AI Assistant */}
          <button
            type="button"
            className={`nav-item ${activeNav === 'assistant' ? 'active' : ''}`}
            data-nav="assistant" onClick={() => handleNavigate('assistant')}
            title={lang === 'bn' ? '৮. AI সহকারী - শস্য আবর্তন ও কৃষি পরামর্শ' : '8. AI Assistant - Crop Rotation & Agricultural Advice'}
          >
            <span className="nav-item-icon"><BotIcon size={20} /></span>
            <span className="nav-item-label">{lang === 'bn' ? 'AI সহকারী' : 'AI Assistant'}</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className={`sidebar-user-mini ${activeNav === 'account' ? 'active' : ''}`} onClick={() => setActiveNav('account')} role="button" tabIndex={0} title="Profile &amp; Settings">
            <div className="sidebar-user-avatar">
              {user ? (user.name || user.email || 'U').slice(0, 1).toUpperCase() : 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || user?.email?.split('@')[0] || 'Demo User'}</span>
              <span className="sidebar-user-role">{lang === 'bn' ? 'কৃষিবিদ' : 'Agronomist'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Content */}
      <div className="main-wrapper">
        {/* Global Persistent Top Bar */}
        <header className="global-top-bar">
          <div className="global-top-bar-left">
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileNavOpen(prev => !prev)}
              aria-label="Toggle navigation drawer"
              title="Open Navigation Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="global-search-pill" style={{ position: 'relative' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'জমি বা ফসল মডেল খুঁজুন...' : 'Search parcels, crop models...'}
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setGlobalSearchQuery('')}
                  aria-label={lang === 'bn' ? 'অনুসন্ধান মুছুন' : 'Clear search'}
                >✕</button>
              )}

              {globalSearchQuery.trim() && (
                <div className="global-search-dropdown" style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: 320,
                  maxHeight: 360,
                  overflowY: 'auto',
                  background: 'var(--bg-card, #111827)',
                  border: '1px solid var(--border-medium, #374151)',
                  borderRadius: 10,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                  padding: 8,
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  {(() => {
                    const q = globalSearchQuery.trim().toLowerCase();
                    const matchedParcels = (userFields || []).filter(f =>
                      f.name?.toLowerCase().includes(q) ||
                      f.district?.toLowerCase().includes(q) ||
                      f.soil_texture?.toLowerCase().includes(q)
                    );
                    const cropList = [
                      { id: 'boro_rice', en: 'Boro Rice', bn: 'বোরো ধান', season: 'Rabi' },
                      { id: 'aman_rice', en: 'Aman Rice', bn: 'আমন ধান', season: 'Kharif-2' },
                      { id: 'aus_rice', en: 'Aus Rice', bn: 'আউশ ধান', season: 'Kharif-1' },
                      { id: 'mustard', en: 'Mustard', bn: 'সরিষা', season: 'Rabi' },
                      { id: 'potato', en: 'Potato', bn: 'আলু', season: 'Rabi' },
                      { id: 'wheat', en: 'Wheat', bn: 'গম', season: 'Rabi' },
                      { id: 'maize', en: 'Maize', bn: 'ভুট্টা', season: 'Rabi/Kharif' },
                      { id: 'lentil', en: 'Lentil', bn: 'মসুর ডাল', season: 'Rabi' },
                      { id: 'mungbean', en: 'Mungbean', bn: 'মুগ ডাল', season: 'Kharif-1' },
                      { id: 'blackgram', en: 'Blackgram', bn: 'মাসকলাই', season: 'Kharif-2' },
                      { id: 'chickpea', en: 'Chickpea', bn: 'ছোলা', season: 'Rabi' },
                      { id: 'sesame', en: 'Sesame', bn: 'তিল', season: 'Kharif-1' },
                      { id: 'jute', en: 'Jute', bn: 'পাট', season: 'Kharif-1' },
                      { id: 'onion', en: 'Onion', bn: 'পেঁয়াজ', season: 'Rabi' },
                      { id: 'groundnut', en: 'Groundnut', bn: 'চীনাবাদাম', season: 'Rabi' }
                    ];
                    const matchedCrops = cropList.filter(c =>
                      c.en.toLowerCase().includes(q) || c.bn.includes(q) || c.season.toLowerCase().includes(q)
                    );

                    if (matchedParcels.length === 0 && matchedCrops.length === 0) {
                      return (
                        <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted, #9ca3af)', textAlign: 'center' }}>
                          {lang === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No matching parcels or crops'}
                        </div>
                      );
                    }

                    return (
                      <>
                        {matchedParcels.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #9ca3af)', padding: '4px 8px' }}>
                              {lang === 'bn' ? 'জমির পার্সেল' : 'Field Parcels'}
                            </div>
                            {matchedParcels.map(f => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                  setSelectedFieldId(f.id);
                                  setGlobalSearchQuery('');
                                  setActiveNav('field');
                                  setToastMessage({ message: lang === 'bn' ? `${f.name} নির্বাচিত হয়েছে` : `Selected ${f.name}`, type: 'info' });
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  padding: '8px 10px',
                                  background: selectedFieldId === f.id ? 'rgba(0, 223, 129, 0.15)' : 'transparent',
                                  border: 'none',
                                  borderRadius: 6,
                                  color: 'var(--text-main, #f3f4f6)',
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  textAlign: 'left'
                                }}
                              >
                                <span>🌾 <strong>{f.name}</strong> ({f.district})</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted, #9ca3af)' }}>{f.area_ha || f.area_hectares} ha</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {matchedCrops.length > 0 && (
                          <div style={{ marginTop: matchedParcels.length > 0 ? 6 : 0, borderTop: matchedParcels.length > 0 ? '1px solid var(--border-light, #2d3748)' : 'none', paddingTop: matchedParcels.length > 0 ? 6 : 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted, #9ca3af)', padding: '4px 8px' }}>
                              {lang === 'bn' ? 'ফসল ও ক্রপ মডেল' : 'Crop Models'}
                            </div>
                            {matchedCrops.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setGlobalSearchQuery('');
                                  setActiveNav('crops');
                                  setToastMessage({ message: lang === 'bn' ? `${c.bn} ক্রপ মডেল দেখানো হচ্ছে` : `Showing ${c.en} model`, type: 'info' });
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  padding: '8px 10px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderRadius: 6,
                                  color: 'var(--text-main, #f3f4f6)',
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  textAlign: 'left'
                                }}
                              >
                                <span>🌱 {lang === 'bn' ? c.bn : c.en} <span style={{ fontSize: 11, color: 'var(--text-muted, #9ca3af)' }}>({lang === 'bn' ? c.en : c.bn})</span></span>
                                <span style={{ fontSize: 11, color: '#38bdf8' }}>{c.season}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="global-top-bar-right">
            {/* Header Field Selector for Instant Context Switching Across Any View */}
            <div className="header-field-selector" title="Active Field Parcel">
              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent)' }}><FieldIcon size={16} /></span>
              <select
                aria-label="Active field parcel"
                value={selectedFieldId == null ? '' : String(selectedFieldId)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedFieldId(null);
                    return;
                  }
                  if (val === '__add_new__') {
                    openAddFieldModal();
                    return;
                  }
                  if (val === 'demo') {
                    handleSelectActiveField(demoField, false);
                    return;
                  }
                  const found = userFields.find(f => String(f.id) === String(val));
                  if (found) handleSelectActiveField(found, false);
                }}
              >
                <option value="" disabled>{lang === 'bn' ? 'সক্রিয় জমি নির্বাচন করুন...' : 'Select active field...'}</option>
                <option value="__add_new__" style={{ fontWeight: 600, color: 'var(--leaf)' }}>
                  {lang === 'bn' ? '+ নতুন জমি যোগ করুন' : '+ Add New Field'}
                </option>
                {Array.from(new Map(userFields.map(f => [String(f.id), f])).values()).map(f => (
                  <option key={f.id} value={String(f.id)}>
                    {f.name} ({f.district ? `${f.district}, ` : ''}{f.area_ha || 1} ha)
                  </option>
                ))}
                <option value="demo">{lang === 'bn' ? 'বগুড়া ডেমো খামার (১০ হেক্টর) [DEMO]' : 'Demo Field (Bogura 10 ha) [DEMO]'}</option>
              </select>
            </div>

            {/* NASA Status Telemetry Badge (Collapses cleanly on mobile) */}
            <div className="top-bar-pill-badge" title="NASA POWER agro-climatic observation feed">
              <span className="live-pulse-dot" />
              <span className="nasa-badge-full-text">
                {activeField
                  ? (activeField.is_demo || activeField.id === 'demo'
                      ? `NASA POWER: Demo Benchmark (${activeField.latitude?.toFixed(2)}°N, ${activeField.longitude?.toFixed(2)}°E)`
                      : `NASA POWER: Observed (${activeField.latitude?.toFixed(2)}°N, ${activeField.longitude?.toFixed(2)}°E)`)
                  : (nasa?.data_status === 'observed' ? 'NASA POWER: Observed' : 'NASA POWER: Standby')}
              </span>
              <span className="nasa-badge-short-text">
                NASA
              </span>
            </div>

            {/* Header Language Switcher (Bangla / English) */}
            <button
              type="button"
              className="top-bar-icon-btn lang-toggle-btn"
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              onClick={() => setLang(prev => prev === 'bn' ? 'en' : 'bn')}
              aria-label={lang === 'bn' ? 'ভাষা পরিবর্তন করুন (ইংরেজি)' : 'Switch language to Bangla'}
              style={{
                width: 'auto',
                padding: '0 14px',
                height: 36,
                fontWeight: 800,
                fontSize: 13,
                background: lang === 'bn' ? 'var(--accent)' : 'var(--bg-card-subtle)',
                color: lang === 'bn' ? 'var(--accent-ink)' : 'var(--text-main)',
                border: '1px solid var(--border-medium)',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <GlobeIcon size={16} />
              <span>{lang === 'bn' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Theme Toggle Button (☀️ / 🌙) */}
            <button
              type="button"
              className="top-bar-icon-btn theme-toggle-btn"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              aria-label={lang === 'bn' ? (theme === 'dark' ? 'হালকা থিম চালু করুন' : 'ডার্ক থিম চালু করুন') : `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

                        {/* In-App Help & Guide Button (P6.3) */}
            <button
              type="button"
              className="top-bar-icon-btn help-guide-btn"
              title={lang === 'bn' ? 'ব্যবহারকারী নির্দেশিকা ও সহায়তা (?)' : 'User Guide & Help (?)'}
              onClick={() => setHelpModalOpen(true)}
              aria-label={lang === 'bn' ? 'ব্যবহারকারী নির্দেশিকা ও সহায়তা' : 'User guide and help'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <HelpIcon size={18} />
            </button>

            {/* System Alerts */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="top-bar-icon-btn notification-bell-btn hide-on-mobile"
                title="System Alerts & Analysis Notifications"
                onClick={() => setShowNotifications(prev => !prev)}
                aria-label={lang === 'bn' ? 'সিস্টেম বিজ্ঞপ্তি' : 'System notifications'}
              >
                <BellIcon size={18} />
                <span className="notification-badge-count">2</span>
              </button>

              {showNotifications && (
                <div className="notification-popover-panel" style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 320,
                  background: 'var(--bg-card, #111827)',
                  border: '1px solid var(--border-medium, #374151)',
                  borderRadius: 10,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  padding: '12px 14px',
                  zIndex: 2000,
                  color: 'var(--text-main, #f3f4f6)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid var(--border-light, #2d3748)', paddingBottom: 6 }}>
                    <strong style={{ fontSize: 13 }}>{lang === 'bn' ? 'সিস্টেম নোটিফিকেশন' : 'System Notifications'}</strong>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setShowNotifications(false)}
                      aria-label={lang === 'bn' ? 'বিজ্ঞপ্তি বন্ধ করুন' : 'Close notifications'}
                    >✕</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(0, 223, 129, 0.08)', borderLeft: '3px solid #00df81' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main, #f3f4f6)' }}>NASA Agro-Climatology Live</div>
                      <div style={{ color: 'var(--text-muted, #9ca3af)', fontSize: 11, marginTop: 2 }}>POWER & IMERG 2001–2024 daily records active for {activeField?.name || 'active parcel'}.</div>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.08)', borderLeft: '3px solid #38bdf8' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main, #f3f4f6)' }}>Agronomic Optimization Ready</div>
                      <div style={{ color: 'var(--text-muted, #9ca3af)', fontSize: 11, marginTop: 2 }}>BRRI sowing calendar & FAO-56 moisture stress models active.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Login */}
            <div
              className="top-bar-user-profile"
              onClick={() => {
                if (user) {
                  setActiveNav('account');
                } else {
                  setAuthMode('login');
                  setAuthModal(true);
                }
              }}
              title={user ? `${user.name} Profile & Settings` : 'Sign In or Register'}
            >
              <div className="user-profile-avatar">
                <span>{user ? (user.name || user.email || 'U').slice(0, 1).toUpperCase() : 'G'}</span>
              </div>
              <div className="user-profile-meta hide-on-mobile">
                <strong className="user-profile-name">{user ? user.name : 'Sign In'}</strong>
                <span className="user-profile-title">{user ? (user.role || user.email || 'Farmer') : (lang === 'bn' ? 'অতিথি ব্যবহারকারী' : 'Guest')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Active Field Context Strip on Every Page (P1 Architecture) */}
        <div className="active-field-context-strip" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 24px',
          background: 'var(--bg-card, rgba(16, 28, 22, 0.86))',
          borderBottom: '1px solid var(--border-medium, rgba(255,255,255,0.08))',
          fontSize: '13px',
          color: 'var(--text-2, #94a3b8)',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <strong style={{ color: 'var(--text, #f8fafc)', fontSize: 14 }}>
              {activeField?.name || (lang === 'bn' ? 'বগুড়া পরীক্ষামূলক খামার' : 'Bogura Demo Field')}
            </strong>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span>{activeField?.district ? districtLabel(activeField.district, lang) : (lang === 'bn' ? 'বগুড়া' : 'Bogura')}{lang === 'bn' ? ', বাংলাদেশ' : ', Bangladesh'}</span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span style={{ fontFamily: 'monospace' }}>
              {formatI18nNumber(Number(activeField?.latitude || 24.85), lang, 4)}°{lang === 'bn' ? 'উ' : 'N'}, {formatI18nNumber(Number(activeField?.longitude || 89.37), lang, 4)}°{lang === 'bn' ? 'পূ' : 'E'}
            </span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span>{formatI18nNumber(Number(activeField?.area_ha || 10), lang, 1)} {unitLabel('ha', lang)} ({formatI18nNumber((Number(activeField?.area_ha || 10)) * 7.47, lang, 1)} {unitLabel('bigha', lang)})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span>{lang === 'bn' ? 'মাটি:' : 'Soil:'} <strong style={{ color: 'var(--text, #f8fafc)' }}>{soilLabel(activeField?.soil_texture, lang)}</strong></span>
            <span>{lang === 'bn' ? 'সেচ ধারণক্ষমতা:' : 'Irrigation:'} <strong style={{ color: 'var(--text, #f8fafc)' }}>{formatI18nNumber(activeField?.irrigation_capacity_mm || 90, lang)} {unitLabel('mm', lang)}</strong></span>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <span className="live-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              NASA POWER + IMERG {lang === 'bn' ? 'সংযুক্ত' : 'Connected'}
            </span>
          </div>
        </div>

        {/* Workflow Alert Banner (suppressed for honest inline notifications) */}

        {/* -------------------- VIEW: CROP ADVICE (FARMER FRIENDLY) -------------------- */}
        {activeNav === 'crop_advice' && (
          <div>
            <div className="subnav-pills-bar" style={{ display: 'flex', gap: 8, padding: '10px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-medium)', marginBottom: 16, overflowX: 'auto' }}>
              <button
                type="button"
                className={`btn ${cropSubTab === 'advisory' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCropSubTab('advisory')}
                style={{ fontSize: 13, padding: '6px 14px', borderRadius: 9999 }}
              >
                🌾 {lang === 'bn' ? 'নাসা ধান রোপণ উপদেষ্টা' : 'NASA Rice Advisory'}
              </button>
              <button
                type="button"
                className={`btn ${cropSubTab === 'advice' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCropSubTab('advice')}
                style={{ fontSize: 13, padding: '6px 14px', borderRadius: 9999 }}
              >
                🌱 {lang === 'bn' ? 'ফসলের পরামর্শ ও মিল' : 'Crop Advice & Matching'}
              </button>
              <button
                type="button"
                className={`btn ${cropSubTab === 'catalog' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCropSubTab('catalog')}
                style={{ fontSize: 13, padding: '6px 14px', borderRadius: 9999 }}
              >
                📖 {lang === 'bn' ? '১৫ ফসলের ক্যাটালগ' : '15-Crop Catalog'}
              </button>
            </div>
            {cropSubTab === 'advisory' && (
              <NasaPlantingAdvisoryView
                defaultDistrict={activeField?.district?.toLowerCase() || 'rajshahi'}
                defaultCrop="aman"
                lang={lang}
                onNavigate={handleNavigate}
                activeField={activeField}
              />
            )}
            {cropSubTab === 'advice' && (
              <FarmerCropAdviceView
                activeField={activeField}
                plan={plan}
                nasa={nasa}
                lang={lang}
                onNavigate={handleNavigate}
                onAskAi={(q) => handleNavigate('assistant')}
              />
            )}
            {cropSubTab === 'catalog' && (
              <CropCatalogView
                onNavigateTab={(tab) => handleNavigate('analytics', tab)}
              />
            )}
          </div>
        )}

        {/* -------------------- VIEW: MARKET & PROFIT -------------------- */}
        {(activeNav === 'harvest_profit' || activeNav === 'market') && (
          <MarketProfitView
            activeField={activeField}
            lang={lang}
            onNavigateTab={handleNavigate}
          />
        )}

        {/* -------------------- VIEW: ADVANCED RESEARCH WORKSPACE -------------------- */}
        {activeNav === 'research' && (
          <ResearchWorkspaceView
            activeField={activeField}
            nasa={nasa}
            summary={summary}
            plan={plan}
            ml={ml}
            rl={rl}
            comparisonLab={comparisonLab}
            robustness={robustness}
            outcomes={outcomes}
            user={user}
            userFields={userFields}
            onNavigate={handleNavigate}
            onRunWorkflow={runAnalysis}
            lang={lang}
            request={request}
            formatNumber={formatNumber}
            strategyProfiles={STRATEGY_PROFILES}
          />
        )}

        {/* -------------------- VIEW 1: FARMER HOME DASHBOARD (DEFAULT) -------------------- */}
        {activeNav === 'dashboard' && dashboardMode === 'farmer' && (
          <div>
            <FarmerHomeView
              activeField={activeField}
              userFields={userFields}
              nasa={nasa}
              lang={lang}
              onNavigate={handleNavigate}
              onSelectField={handleSelectActiveField}
              onOpenVoice={() => {
                const fab = document.querySelector('.farmer-voice-fab');
                if (fab) fab.click();
              }}
            />
            <div style={{ textAlign: 'center', padding: '16px 0 32px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDashboardMode('advanced')}
                style={{ fontSize: 13, padding: '8px 20px', borderRadius: 9999, cursor: 'pointer', background: 'var(--bg-card-subtle)', border: '1px dashed var(--border-medium)', color: 'var(--text-muted)' }}
              >
                🔬 {lang === 'bn' ? 'গবেষকদের জন্য জটিল বৈজ্ঞানিক ড্যাশবোর্ড দেখুন' : 'Switch to Advanced Research Dashboard'}
              </button>
            </div>
          </div>
        )}

        {/* -------------------- VIEW 1: ADVANCED OVERVIEW DASHBOARD -------------------- */}
        {activeNav === 'dashboard' && dashboardMode === 'advanced' && (
          <>
            <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-medium)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 16px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                🔬 {lang === 'bn' ? 'উন্নত গবেষক মোড সক্রিয় রয়েছে' : 'Advanced Research Dashboard Active'}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setDashboardMode('farmer')}
                style={{ fontSize: 12.5, padding: '6px 16px', borderRadius: 9999, cursor: 'pointer' }}
              >
                🏠 {lang === 'bn' ? 'সহজ কৃষক মোডে ফিরুন' : 'Return to Simple Farmer View'}
              </button>
            </div>
            <header className="dashboard-page-header">
              <div className="dashboard-header-title-wrap">
                <span className="dashboard-breadcrumb">Dashboard</span>
                <span className="dashboard-breadcrumb-separator">/</span>
                <div className="dashboard-field-selector-wrap">
                  <select
                    className="dashboard-field-select"
                    value={selectedFieldId == null ? '' : String(selectedFieldId)}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'demo') {
                        handleSelectActiveField(demoField, false);
                        return;
                      }
                      const chosenId = parseInt(val, 10);
                      const found = userFields.find(f => f.id === chosenId);
                      if (found) {
                        handleSelectActiveField(found, false);
                      }
                    }}
                    title="Select Active Field for Dashboard"
                  >
                    {userFields.length > 0 ? (
                      <>
                        <optgroup label="Registered Farm Fields">
                          {userFields.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.name} {formatNumber(f.latitude, 4, null) != null && formatNumber(f.longitude, 4, null) != null ? `(${formatNumber(f.latitude, 4)}°, ${formatNumber(f.longitude, 4)}°)` : '(Coordinates not set)'}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Research Benchmarks">
                          <option value="demo">Explicit offline research demo (not a registered field)</option>
                        </optgroup>
                      </>
                    ) : (
                      <option value="demo">Explicit offline research demo (not a registered field)</option>
                    )}
                    <option value="">Select a registered field or explicit demo</option>
                  </select>
                </div>
              </div>

              <div className="dashboard-header-actions">
                <div className="dashboard-analysis-status">
                  <span className="status-indicator-dot" />
                  <span className="status-text">
                    {running ? 'Running Pipeline…' : (activeField?.last_analysis_date ? 'Last Analysis: Recent' : 'Last Analysis: None')}
                  </span>
                </div>

                <button
                  type="button"
                  className="dashboard-primary-run-btn"
                  onClick={runAnalysis}
                  disabled={running}
                  title="Run analysis pipeline for currently active field"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <span>{running ? 'Running Workflow…' : 'Run Analysis'}</span>
                </button>
              </div>
            </header>

            <ResultBoundary summary={summary}>
              <div className="dashboard-clean-grid">
                {/* Dynamic Decision Support Status Tiles */}
                <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 4 }}>
                  {/* Tile 1: Field Readiness */}
                  <div className="dash-card" style={{ padding: '14px 16px', borderLeft: fieldReadiness.isReady ? '4px solid #2e7d32' : '4px solid #d97706', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Field Readiness</span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: fieldReadiness.isReady ? '#e8f5e9' : '#fef3c7', color: fieldReadiness.isReady ? '#2e7d32' : '#b45309' }}>
                          {fieldReadiness.isReady ? 'Inputs Complete' : 'Needs Attention'}
                        </span>
                      </div>
                      <strong style={{ fontSize: 14.5, display: 'block', color: 'var(--text-main)', marginBottom: 3 }}>
                        {fieldReadiness.isReady ? `${fieldReadiness.validCount}/8 Required Inputs` : `${fieldReadiness.missingCount} Inputs Missing`}
                      </strong>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.35 }}>
                        {fieldReadiness.isReady ? `Active: ${activeField?.name || 'Selected Field'}` : `Missing: ${fieldReadiness.missingText}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-text-link"
                      onClick={() => setActiveNav('account')}
                    >
                      Review Field  →
                    </button>
                  </div>

                  {/* Tile 2: Analysis Status */}
                  <div className="dash-card" style={{ padding: '14px 16px', borderLeft: analysisFreshness.status === 'up_to_date' ? '4px solid #2e7d32' : '4px solid #d97706', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Analysis Status</span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: analysisFreshness.status === 'up_to_date' ? '#e8f5e9' : '#fef3c7', color: analysisFreshness.status === 'up_to_date' ? '#2e7d32' : '#b45309' }}>
                          {analysisFreshness.badgeLabel}
                        </span>
                      </div>
                      <strong style={{ fontSize: 14.5, display: 'block', color: 'var(--text-main)', marginBottom: 3 }}>
                        {analysisFreshness.titleLabel}
                      </strong>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.35 }}>
                        {analysisFreshness.subLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-text-link"
                      onClick={runAnalysis}
                      disabled={running}
                    >
                      {running ? 'Running…' : 'Run Analysis  → '}
                    </button>
                  </div>

                  {/* Tile 3: Recommended Rotation */}
                  <div className="dash-card" style={{ padding: '14px 16px', borderLeft: optimizationDecision.status === 'optimal' ? '4px solid #2e7d32' : optimizationDecision.status === 'feasible' ? '4px solid #d97706' : '4px solid #dc2626', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Recommended Rotation</span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: optimizationDecision.status === 'optimal' ? '#e8f5e9' : optimizationDecision.status === 'feasible' ? '#fef3c7' : '#fee2e2', color: optimizationDecision.status === 'optimal' ? '#2e7d32' : optimizationDecision.status === 'feasible' ? '#b45309' : '#991b1b' }}>
                          {optimizationDecision.badgeLabel}
                        </span>
                      </div>
                      <strong style={{ fontSize: 13.5, display: 'block', color: 'var(--text-main)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {optimizationDecision.sequenceLabel}
                      </strong>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.35 }}>
                        {optimizationDecision.metricLabel} ({optimizationDecision.strategyTitle})
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-text-link"
                      onClick={() => {
                        setActiveNav('analytics');
                        setAnalysisTab('optimization');
                      }}
                    >
                      {optimizationDecision.status === 'failed' ? 'Review MILP Strategy  → ' : 'View Strategy  → '}
                    </button>
                  </div>

                  {/* Tile 4: Research Insight */}
                  <div className="dash-card" style={{ padding: '14px 16px', borderLeft: '4px solid #0288d1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Research Insight</span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#e0f2fe', color: '#0369a1' }}>
                          Priority {researchInsight.priority}
                        </span>
                      </div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-main)', margin: '0 0 10px 0', lineHeight: 1.35, fontWeight: 500 }}>
                        {researchInsight.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-text-link"
                      onClick={researchInsight.action}
                    >
                      {researchInsight.ctaText}  →
                    </button>
                  </div>
                </div>

                {/* "What should I do next?" Compact Action Card */}
                <div className="dash-card" style={{ gridColumn: 'span 12', padding: '12px 18px', background: 'linear-gradient(90deg, #161e25 0%, #1a232c 100%)', border: '1px solid var(--border-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>💡</span>
                    <div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)' }}>What should I do next?</span>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginTop: 1 }}>
                        {researchInsight.text}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dashboard-primary-run-btn"
                    onClick={researchInsight.action}
                  >
                    <span>{researchInsight.ctaText}</span>
                  </button>
                </div>

                {/* Quick Operational Actions Deck (Phase 2.2) */}
                <div className="dash-card" style={{ gridColumn: 'span 12', padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>⚡</span>
                      <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                        Quick Operational Actions
                      </strong>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Direct FieldShift Workflow Shortcuts</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                    <button
                      type="button"
                      className="btn-outline-action"
                      onClick={runAnalysis}
                      disabled={running}
                    >
                      <span style={{ fontSize: 16 }}>▶️</span>
                      <div>
                        <div>Analyze Field</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>Run analysis pipeline</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-action"
                      onClick={() => handleNavigate('analytics', 'optimization')}
                    >
                      <span style={{ fontSize: 16 }}>🌱</span>
                      <div>
                        <div>Generate Rotation</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>MILP solver</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-action"
                      onClick={() => handleNavigate('analytics', 'comparison_lab')}
                    >
                      <span style={{ fontSize: 16 }}>🧪</span>
                      <div>
                        <div>Compare Strategies</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>MILP vs RL vs Rule</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-action"
                      onClick={() => handleNavigate('analytics', 'recovery')}
                    >
                      <span style={{ fontSize: 16 }}>🛡️</span>
                      <div>
                        <div>Test Drought Shock</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>Failure &amp; recovery</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-action"
                      onClick={() => handleNavigate('analytics', 'outcomes')}
                    >
                      <span style={{ fontSize: 16 }}>⚖️</span>
                      <div>
                        <div>Record Harvest</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>Ground truth yields</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-action"
                      onClick={() => handleNavigate('market')}
                    >
                      <span style={{ fontSize: 16 }}>💰</span>
                      <div>
                        <div>Market Intelligence</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>Prices &amp; Profit</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-action"
                      onClick={() => handleNavigate('sensitivity')}
                    >
                      <span style={{ fontSize: 16 }}>📐</span>
                      <div>
                        <div>Sensitivity Sweeps</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>Elasticity testing</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-action"
                      onClick={() => handleNavigate('synthetic_lab')}
                    >
                      <span style={{ fontSize: 16 }}>🧪</span>
                      <div>
                        <div>Synthetic Data Lab</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>Benchmark scenarios</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-action btn-outline-action-accent"
                      onClick={() => handleNavigate('assistant')}
                    >
                      <span style={{ fontSize: 16 }}>🤖</span>
                      <div>
                        <div>Ask AI Agronomist</div>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>Decision support</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* =========================================================================
                    OBSIDIAN MODERN DASHBOARD SUITE (TARGET THEME DESIGN)
                    ========================================================================= */}
                <div style={{ gridColumn: 'span 12', display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* ----------------- TOP ROW: 3 CARDS ----------------- */}
                  <div className="theme-grid-row-top">
                    {/* CARD 1: SATELLITE PARCEL MAP */}
                    <div className="dash-card theme-satellite-card">
                      <div className="theme-card-header">
                        <div className="theme-card-title-group">
                          <span className="theme-card-eyebrow">PARCEL GIS & SATELLITE</span>
                          <h3 className="theme-card-title">{activeField?.name || 'Active Farm Parcel'}</h3>
                        </div>
                        <span className="source-tag live">GPS SYNCED</span>
                      </div>

                      <div className="theme-satellite-viewport">
                        <div className="theme-satellite-overlay-tags">
                          <span className="theme-overlay-tag mint">HYBRID 2026</span>
                          <span className="theme-overlay-tag">
                            {formatNumber(activeField?.latitude, 4, null) != null && formatNumber(activeField?.longitude, 4, null) != null
                              ? `${formatNumber(activeField.latitude, 4)}° N, ${formatNumber(activeField.longitude, 4)}° E`
                              : '24.3677° N, 88.6077° E'}
                          </span>
                        </div>
                        <GoogleFieldMapThumbnail
                          latitude={activeField?.latitude ?? 24.3677}
                          longitude={activeField?.longitude ?? 88.6077}
                          name={activeField?.name || 'Active Farm Field'}
                          height="190px"
                          onClick={() => {
                            if (activeField) setViewingField(activeField);
                            setActiveNav('field');
                          }}
                        />
                      </div>

                      <div className="theme-satellite-footer">
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>{lang === 'bn' ? 'আয়তন:' : 'Area:'} <strong>{formatI18nNumber(activeField?.area_ha ?? 1.0, lang, 1)} {unitLabel('ha', lang)}</strong></span>
                          <span>{lang === 'bn' ? 'মাটি:' : 'Soil:'} <strong>{soilLabel(activeField?.soil_texture, lang)}</strong></span>
                          <span>{lang === 'bn' ? 'জৈব পদার্থ:' : 'OM:'} <strong>{formatI18nNumber(activeField?.organic_matter ?? 2.4, lang, 1)}%</strong></span>
                        </div>
                        <button
                          type="button"
                          className="btn-text-link"
                          onClick={() => setActiveNav('field')}
                          style={{ fontSize: 11.5, fontWeight: 700 }}
                        >
                          {lang === 'bn' ? 'সম্পূর্ণ জিআইএস দেখুন →' : 'Full GIS View →'}
                        </button>
                      </div>
                    </div>

                    {/* CARD 2: REAL NASA POWER CLIMATE & WEATHER TELEMETRY */}
                    <div className="dash-card theme-camera-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div className="theme-card-header">
                        <div className="theme-card-title-group">
                          <span className="theme-card-eyebrow">NASA POWER SATELLITE ASSIMILATION</span>
                          <h3 className="theme-card-title">Agro-Climatic Station Telemetry</h3>
                        </div>
                        <div className="top-bar-pill-badge" style={{ fontSize: 10 }}>
                          <span className="live-pulse-dot" />
                          <span>{nasa?.data_status === 'observed' ? 'Live Point API' : 'Cached Benchmark'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, margin: '14px 0' }}>
                        <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Observed Ambient Temp</span>
                          <strong style={{ fontSize: 18, color: '#38bdf8' }}>{tempVal} °C</strong>
                          <span style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginTop: 2 }}>
                            {tempVal > 32 ? '⚠️ High Thermal Stress' : 'Optimal range for C3/C4'}
                          </span>
                        </div>

                        <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Daily Precipitation</span>
                          <strong style={{ fontSize: 18, color: '#00df81' }}>{nasa?.telemetry?.precipitation_daily_mm ?? '3.8'} mm</strong>
                          <span style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginTop: 2 }}>
                            PRECTOTCORR precipitation gauge
                          </span>
                        </div>

                        <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Relative Humidity (RH2M)</span>
                          <strong style={{ fontSize: 18, color: '#a78bfa' }}>{nasa?.telemetry?.average_humidity_pct ?? '72.4'} %</strong>
                          <span style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginTop: 2 }}>
                            Surface atmospheric moisture
                          </span>
                        </div>

                        <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Solar Radiation (ALLSKY)</span>
                          <strong style={{ fontSize: 18, color: '#fbbf24' }}>{nasa?.telemetry?.solar_radiation_mj ?? '18.4'} MJ/m²</strong>
                          <span style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginTop: 2 }}>
                            Insolation on horizontal surface
                          </span>
                        </div>
                      </div>

                      {/* Station Metadata & Quick Link */}
                      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          Grid: 0.5° × 0.5° · Lat {formatNumber(activeField?.latitude != null ? activeField.latitude : 24.8500, 3)}°, Lon {formatNumber(activeField?.longitude != null ? activeField.longitude : 89.3700, 3)}°
                        </span>
                        <button
                          type="button"
                          className="btn-text-link"
                          onClick={() => handleNavigate('weather')}
                          style={{ fontSize: 11.5, fontWeight: 700 }}
                        >
                          Open 3D Weather Station →
                        </button>
                      </div>
                    </div>

                    {/* CARD 3: CROP ROTATION PORTFOLIO DECK */}
                    <div className="dash-card theme-crop-deck-card">
                      <div className="theme-card-header">
                        <div className="theme-card-title-group">
                          <span className="theme-card-eyebrow">CROP SELECTION DECK</span>
                          <h3 className="theme-card-title">Rotation Portfolio</h3>
                        </div>
                        <span className="label-badge">MILP Eligible</span>
                      </div>

                      {/* Filter category pills */}
                      <div className="crop-deck-filter-pills">
                        {['All', 'Cereals', 'Vegetables', 'Legumes'].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            className={`crop-deck-pill ${cropCategoryFilter === cat ? 'active' : ''}`}
                            onClick={() => setCropCategoryFilter(cat)}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Filterable crop list */}
                      <div className="crop-deck-cards-list">
                        {[
                          { name: 'Sorghum', category: 'Cereals', icon: '🌾', trait: '80% Moisture', yield: '2.19 t/ha' },
                          { name: 'Sesame', category: 'Cereals', icon: '🌱', trait: '92% Efficiency', yield: '0.97 t/ha' },
                          { name: 'Chickpea', category: 'Legumes', icon: '🫘', trait: 'High N-Fixation', yield: '0.78 t/ha' },
                          { name: 'Lentil', category: 'Legumes', icon: '🍃', trait: 'Soil Biota+', yield: '1.10 t/ha' },
                          { name: 'Tomato', category: 'Vegetables', icon: '🍅', trait: 'High Biomass', yield: '2.45 t/ha' },
                          { name: 'Wheat', category: 'Cereals', icon: '🌾', trait: 'Balanced Yield', yield: '2.85 t/ha' }
                        ]
                          .filter(c => cropCategoryFilter === 'All' || c.category === cropCategoryFilter)
                          .map(c => (
                            <div
                              key={c.name}
                              className={`crop-portfolio-item ${selectedCropItem === c.name ? 'selected' : ''}`}
                              onClick={() => setSelectedCropItem(c.name)}
                            >
                              <div className="crop-item-left">
                                <div className="crop-item-icon">{c.icon}</div>
                                <div>
                                  <div className="crop-item-name">{c.name}</div>
                                  <div className="crop-item-sub">{c.category} • Dynamic: {c.yield}</div>
                                </div>
                              </div>
                              <span className="crop-item-tag">{c.trait}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* ----------------- MIDDLE ROW: AREA CHART & STRESS STAGES ----------------- */}
                  <div className="theme-grid-row-mid">
                    {/* CARD 4: AGRONOMIC TELEMETRY & YIELD ARCHITECTURE */}
                    <div className="dash-card theme-area-chart-card">
                      <div className="theme-card-header">
                        <div className="theme-card-title-group">
                          <span className="theme-card-eyebrow">YIELD MODEL & TELEMETRY ARCHITECTURE</span>
                          <h3 className="theme-card-title">Agronomic Trajectory & Crop Biomass</h3>
                        </div>
                        <button
                          type="button"
                          className="btn-outline-action"
                          onClick={() => setActiveNav('analytics')}
                        >
                          Explore MILP Models  →
                        </button>
                      </div>

                      {/* Top Metric Callouts */}
                      <div className="chart-header-stat-row">
                        <div className="chart-stat-chip">
                          <span className="chart-stat-label">Total Rotation Yield</span>
                          <span className="chart-stat-val mint">332.4 tons</span>
                        </div>
                        <div className="chart-stat-chip">
                          <span className="chart-stat-label">Optimized Water Demand</span>
                          <span className="chart-stat-val">1,688 mm</span>
                        </div>
                        <div className="chart-stat-chip">
                          <span className="chart-stat-label">Thermal Adaptation</span>
                          <span className="chart-stat-val">+14.2%</span>
                        </div>
                        <div className="chart-stat-chip">
                          <span className="chart-stat-label">Soil Health Score</span>
                          <span className="chart-stat-val">3.78 / 6.0</span>
                        </div>
                      </div>

                      {/* Smooth SVG Spline Area Chart */}
                      <div className="theme-spline-svg-wrap">
                        <svg viewBox="0 0 800 220" width="100%" height="100%" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="mintSplineGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00df81" stopOpacity="0.38" />
                              <stop offset="60%" stopColor="#00df81" stopOpacity="0.08" />
                              <stop offset="100%" stopColor="#00df81" stopOpacity="0.0" />
                            </linearGradient>
                            <filter id="mintGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          {/* Horizontal Grid lines */}
                          <line x1="0" y1="40" x2="800" y2="40" stroke="#1f2830" strokeWidth="1" strokeDasharray="3 3"/>
                          <line x1="0" y1="90" x2="800" y2="90" stroke="#1f2830" strokeWidth="1" strokeDasharray="3 3"/>
                          <line x1="0" y1="140" x2="800" y2="140" stroke="#1f2830" strokeWidth="1" strokeDasharray="3 3"/>
                          <line x1="0" y1="190" x2="800" y2="190" stroke="#1f2830" strokeWidth="1"/>

                          {/* Shaded Area */}
                          <path
                            d="M 0 160 C 70 140, 110 90, 180 100 C 250 110, 310 40, 380 45 C 450 50, 500 130, 580 85 C 650 45, 710 70, 780 30 L 780 190 L 0 190 Z"
                            fill="url(#mintSplineGrad)"
                          />

                          {/* Glowing Neon Line */}
                          <path
                            d="M 0 160 C 70 140, 110 90, 180 100 C 250 110, 310 40, 380 45 C 450 50, 500 130, 580 85 C 650 45, 710 70, 780 30"
                            fill="none"
                            stroke="#00df81"
                            strokeWidth="3.5"
                            filter="url(#mintGlow)"
                          />

                          {/* Anchor Points */}
                          {[
                            { cx: 0, cy: 160 },
                            { cx: 180, cy: 100 },
                            { cx: 380, cy: 45 },
                            { cx: 580, cy: 85 },
                            { cx: 780, cy: 30 }
                          ].map((pt, i) => (
                            <circle key={i} cx={pt.cx} cy={pt.cy} r="4.5" fill="#0e1318" stroke="#00df81" strokeWidth="2.5" />
                          ))}
                        </svg>

                        {/* Month labels along bottom */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px 0', fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600 }}>
                          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                          <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 5: SEQUENCED STRESS & ROTATIONAL STAGES */}
                    <div className="dash-card theme-stress-card">
                      <div className="theme-card-header">
                        <div className="theme-card-title-group">
                          <span className="theme-card-eyebrow">STRESS & INTERVENTIONS</span>
                          <h3 className="theme-card-title">Sequenced Agronomic Stages</h3>
                        </div>
                        <span className="label-badge">Dynamic</span>
                      </div>

                      <div className="stress-stages-list">
                        <div className="stress-stage-item" onClick={() => { setActiveNav('analytics'); setAnalysisTab('stress'); }}>
                          <div className="stress-stage-left">
                            <span className="stress-stage-dot warn" />
                            <div>
                              <div className="stress-stage-title">Severe Water Deficit (S1–S2)</div>
                              <div className="stress-stage-desc">Water factor: 0.680 • Critical irrigation triggered</div>
                            </div>
                          </div>
                          <span className="stress-stage-chevron">›</span>
                        </div>

                        <div className="stress-stage-item" onClick={() => { setActiveNav('analytics'); setAnalysisTab('stress'); }}>
                          <div className="stress-stage-left">
                            <span className="stress-stage-dot info" />
                            <div>
                              <div className="stress-stage-title">Thermal Shock Threshold (S2)</div>
                              <div className="stress-stage-desc">Thermal factor: 0.998 • Heat buffer compensated</div>
                            </div>
                          </div>
                          <span className="stress-stage-chevron">›</span>
                        </div>

                        <div className="stress-stage-item" onClick={() => { setActiveNav('analytics'); setAnalysisTab('stress'); }}>
                          <div className="stress-stage-left">
                            <span className="stress-stage-dot mint" />
                            <div>
                              <div className="stress-stage-title">Nitrogen Depletion Zone (S3)</div>
                              <div className="stress-stage-desc">Soil factor: 1.009 • Legume biological N-fixation</div>
                            </div>
                          </div>
                          <span className="stress-stage-chevron">›</span>
                        </div>

                        <div className="stress-stage-item" onClick={() => { setActiveNav('analytics'); setAnalysisTab('stress'); }}>
                          <div className="stress-stage-left">
                            <span className="stress-stage-dot mint" />
                            <div>
                              <div className="stress-stage-title">Soil Biota Recovery (S4–S6)</div>
                              <div className="stress-stage-desc">Organic matter: 2.4% • Soil organic carbon equilibrium stable</div>
                            </div>
                          </div>
                          <span className="stress-stage-chevron">›</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ----------------- BOTTOM ROW: 4 WIDGETS ----------------- */}
                  <div className="theme-grid-row-bot">
                    {/* CARD 6: CROP RATIOS & 6-SEASON ALLOCATION */}
                    <div className="dash-card theme-ratios-card">
                      <div className="theme-card-header">
                        <div className="theme-card-title-group">
                          <span className="theme-card-eyebrow">6-SEASON SCHEDULE</span>
                          <h3 className="theme-card-title">Period Allocations</h3>
                        </div>
                      </div>

                      <table className="theme-dark-table">
                        <thead>
                          <tr>
                            <th>Season</th>
                            <th>Crop</th>
                            <th>Yield</th>
                            <th>Tons</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong style={{ color: 'var(--primary)' }}>Y1_S1</strong></td>
                            <td>{rotationPeriods.Y1_S1 || 'Mustard'}</td>
                            <td>1.90 t/ha</td>
                            <td>19.0 t</td>
                          </tr>
                          <tr>
                            <td><strong style={{ color: 'var(--primary)' }}>Y1_S2</strong></td>
                            <td>{rotationPeriods.Y1_S2 || 'Groundnut'}</td>
                            <td>2.80 t/ha</td>
                            <td>28.0 t</td>
                          </tr>
                          <tr>
                            <td><strong style={{ color: 'var(--primary)' }}>Y1_S3</strong></td>
                            <td>{rotationPeriods.Y1_S3 || 'Rice'}</td>
                            <td>5.50 t/ha</td>
                            <td>55.0 t</td>
                          </tr>
                          <tr>
                            <td><strong style={{ color: 'var(--primary)' }}>Y2_S1</strong></td>
                            <td>{rotationPeriods.Y2_S1 || 'Lentil'}</td>
                            <td>1.80 t/ha</td>
                            <td>18.0 t</td>
                          </tr>
                          <tr>
                            <td><strong style={{ color: 'var(--primary)' }}>Y2_S2</strong></td>
                            <td>{rotationPeriods.Y2_S2 || 'Maize'}</td>
                            <td>8.50 t/ha</td>
                            <td>85.0 t</td>
                          </tr>
                          <tr>
                            <td><strong style={{ color: 'var(--primary)' }}>Y2_S3</strong></td>
                            <td>{rotationPeriods.Y2_S3 || 'Mungbean'}</td>
                            <td>1.60 t/ha</td>
                            <td>16.0 t</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* CARD 7: SEASONAL WATER DYNAMICS */}
                    <div className="dash-card theme-water-spline-card">
                      <div className="theme-card-header">
                        <div className="theme-card-title-group">
                          <span className="theme-card-eyebrow">WATER & TRANSPIRATION</span>
                          <h3 className="theme-card-title">Hydrologic Demand</h3>
                        </div>
                      </div>

                      <div className="water-spline-legend">
                        <div className="legend-chip">
                          <span className="legend-indicator-line mint" />
                          <span>Crop Demand</span>
                        </div>
                        <div className="legend-chip">
                          <span className="legend-indicator-line blue" />
                          <span>Precipitation</span>
                        </div>
                      </div>

                      <div style={{ height: 120, width: '100%' }}>
                        <svg viewBox="0 0 300 120" width="100%" height="100%" preserveAspectRatio="none">
                          {/* Transpiration curve (Mint) */}
                          <path
                            d="M 10 90 Q 60 40 120 70 T 220 30 T 290 50"
                            fill="none"
                            stroke="#00df81"
                            strokeWidth="2.5"
                          />
                          {/* Precipitation curve (Blue) */}
                          <path
                            d="M 10 70 Q 70 80 130 50 T 230 75 T 290 40"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                          />
                        </svg>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Deficit managed via {formatNumber(activeField?.irrigation_capacity_mm, 0) || '110'} mm storage.
                      </div>
                    </div>

                    {/* CARD 8: DONUT GAUGE & SOIL HEALTH INDEX */}
                    <div className="dash-card theme-donut-card">
                      <div className="theme-card-header">
                        <div className="theme-card-title-group">
                          <span className="theme-card-eyebrow">SOIL BIOTA & ALLOCATION</span>
                          <h3 className="theme-card-title">Health Index</h3>
                        </div>
                      </div>

                      <div className="donut-gauge-flex">
                        <div className="donut-svg-center">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            {/* Track circle */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#1f2830"
                              strokeWidth="8"
                            />
                            {/* Neon mint progress arc (23%) */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#00df81"
                              strokeWidth="8"
                              strokeDasharray={`${2 * Math.PI * 40 * 0.23} ${2 * Math.PI * 40 * 0.77}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="donut-center-metric">
                            <strong>23%</strong>
                            <span>Allocation</span>
                          </div>
                        </div>

                        {/* 4 Horizontal Meters */}
                        <div className="donut-meters-stack">
                          <div className="donut-meter-row">
                            <div className="meter-meta-row">
                              <span>Drainage (প্রাক্কলন)</span>
                              <strong>75%</strong>
                            </div>
                            <div className="donut-meter-track">
                              <div className="donut-meter-bar mint" style={{ width: '75%' }} />
                            </div>
                          </div>

                          <div className="donut-meter-row">
                            <div className="meter-meta-row">
                              <span>Moisture</span>
                              <strong>50%</strong>
                            </div>
                            <div className="donut-meter-track">
                              <div className="donut-meter-bar cyan" style={{ width: '50%' }} />
                            </div>
                          </div>

                          <div className="donut-meter-row">
                            <div className="meter-meta-row">
                              <span>Persistence</span>
                              <strong>20%</strong>
                            </div>
                            <div className="donut-meter-track">
                              <div className="donut-meter-bar amber" style={{ width: '20%' }} />
                            </div>
                          </div>

                          <div className="donut-meter-row">
                            <div className="meter-meta-row">
                              <span>Fertility</span>
                              <strong>80%</strong>
                            </div>
                            <div className="donut-meter-track">
                              <div className="donut-meter-bar mint" style={{ width: '80%' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 9: VISUAL ANALYTICS MONTHLY BAR CHART */}
                    <div className="dash-card theme-bar-chart-card">
                      <div className="theme-card-header">
                        <div className="theme-card-title-group">
                          <span className="theme-card-eyebrow">HARVEST VOLUME</span>
                          <h3 className="theme-card-title">Monthly Production</h3>
                        </div>
                      </div>

                      <div className="monthly-bars-container">
                        {[
                          { m: 'Jan', h: 35 },
                          { m: 'Feb', h: 42 },
                          { m: 'Mar', h: 58 },
                          { m: 'Apr', h: 65 },
                          { m: 'May', h: 80, active: true },
                          { m: 'Jun', h: 92, active: true },
                          { m: 'Jul', h: 75 },
                          { m: 'Aug', h: 60 },
                          { m: 'Sep', h: 88, active: true },
                          { m: 'Oct', h: 70 },
                          { m: 'Nov', h: 45 },
                          { m: 'Dec', h: 30 }
                        ].map((b, idx) => (
                          <div key={idx} className="bar-column">
                            <div
                              className={`bar-cylinder ${b.active ? 'active' : ''}`}
                              style={{ height: `${b.h}%` }}
                              title={`${b.m}: ${b.h * 3.4} tons`}
                            />
                            <span className="bar-month-text">{b.m}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
                        Peak Harvest: May–June (S1) & September (S2)
                      </div>
                    </div>
                  </div>

                </div>

                {/* Decision Support Feature Modules Deck */}
                <section className="dash-card decision-support-deck-card" style={{ gridColumn: 'span 12', marginTop: 12, padding: '22px 24px', background: 'linear-gradient(135deg, #131920 0%, #161d23 100%)', border: '1px solid var(--border-light)', borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>🚀</span>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>
                          Autonomous Agronomic Decision Support Modules
                        </h3>
                        <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: 'rgba(0, 223, 129, 0.15)', color: 'var(--primary)', border: '1px solid rgba(0, 223, 129, 0.3)', fontWeight: 800 }}>
                          NASA 2026 SUITE
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                        Interactive research engines connecting satellite climate telemetry, mathematical optimization, and ground-truth validation.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    {[
                      { id: 'comparison_lab', icon: '🧪', title: 'Comparison Lab', subtitle: 'MILP vs RL vs Rule 3-Way Audit', color: '#00df81', desc: 'Side-by-side profit, water, and soil health benchmarks with exportable CSV/JSON results.' },
                      { id: 'recovery', icon: '⚡', title: 'Crop Failure & Recovery', subtitle: 'Shock Event Resilience Simulator', color: '#ef4444', desc: 'Simulate drought or crop loss shocks and solve for adaptive capital recovery.' },
                      { id: 'replan', icon: '🔄', title: 'Replan for Next Season', subtitle: 'Closed-Loop Adaptive Planning', color: '#38bdf8', desc: 'Incorporate actual harvested crops and updated soil pH/OM tests to re-optimize.' },
                      { id: 'uncertainty', icon: '🌦️', title: 'Weather Uncertainty', subtitle: '5 Multi-Scenario Stress Tests', color: '#38bdf8', desc: 'Evaluate plan feasibility against thermal waves, drought, and tube-well restrictions.' },
                      { id: 'sustainability', icon: '🌱', title: 'Sustainability Tracker', subtitle: 'Soil Health & Legume Trajectory', color: '#10b981', desc: 'Track multi-season biological soil scores, Fabaceae BNF breaks, and aquifer load.' },
                      { id: 'outcomes', icon: '📋', title: 'Actual vs Estimated Outcomes', subtitle: 'Ground Truth Harvest Variance', color: '#c084fc', desc: 'Record empirical seasonal harvest yields, farmgate prices, and compute model error.' },
                    ].map(card => (
                      <div
                        key={card.id}
                        onClick={() => {
                          setActiveNav('analytics');
                          setAnalysisTab(card.id);
                        }}
                        style={{
                          background: '#0e1318',
                          border: '1px solid #1e293b',
                          borderRadius: 12,
                          padding: 16,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 20 }}>{card.icon}</span>
                            <div>
                              <strong style={{ fontSize: 14, color: '#f8fafc', display: 'block' }}>{card.title}</strong>
                              <span style={{ fontSize: 11, color: card.color, fontWeight: 700 }}>{card.subtitle}</span>
                            </div>
                          </div>
                          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                            {card.desc}
                          </p>
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11.5, color: card.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          Launch Module  →
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* AI Research Assistant Teaser Card (COMPACT OBSIDIAN STYLED) */}
                <section className="dash-card ai-assistant-teaser-card" style={{ gridColumn: 'span 12', marginTop: 4 }}>
                  <div className="ai-teaser-inner">
                    <div className="ai-teaser-icon-wrap" style={{ background: 'rgba(0, 223, 129, 0.15)', color: 'var(--primary)' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 8V4H8"/>
                        <rect width="16" height="12" x="4" y="8" rx="2"/>
                        <path d="M2 14h2"/>
                        <path d="M20 14h2"/>
                        <path d="M15 13v2"/>
                        <path d="M9 13v2"/>
                      </svg>
                    </div>
                    <div className="ai-teaser-content">
                      <h4 style={{ color: '#f1f5f9' }}>AI Agronomic Assistant</h4>
                      <p style={{ color: '#8a99a8' }}>Ask questions about this field's rotation plan, simulate drought stress scenarios, or explore multi-objective trade-offs powered by Gemini.</p>
                    </div>
                    <button
                      type="button"
                      className="dashboard-primary-run-btn"
                      onClick={() => setActiveNav('assistant')}
                      title="Open full interactive AI Assistant"
                      style={{ padding: '8px 18px', fontSize: 13 }}
                    >
                      Open Assistant  → 
                    </button>
                  </div>
                </section>

                {/* Footer Note */}
                <footer className="dashboard-footer-note" style={{ gridColumn: 'span 12', color: 'var(--text-dim)' }}>
                  <p>FieldShift Autonomous Agronomy Suite — MILP Allocations, NASA POWER Satellite Feeds & Scientific Decision Support.</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: 4 }}>
                    Background: NASA GIBS / Worldview, VIIRS NOAA-20 Corrected Reflectance True Color, Rajshahi Farmland Grid, 2024-01-20
                  </p>
                </footer>
              </div>
            </ResultBoundary>
          </>
        )}

        {/* -------------------- VIEW 2: ANALYSIS & RESEARCH WORKSPACE -------------------- */}
        {/* -------------------- VIEW: RESEARCH WORKSPACE (LEGACY ANALYTICS COMPATIBILITY) -------------------- */}
        {activeNav === 'analytics' && (
          <ResearchWorkspaceView
            activeField={activeField}
            nasa={nasa}
            summary={summary}
            plan={plan}
            ml={ml}
            rl={rl}
            comparisonLab={comparisonLab}
            robustness={robustness}
            outcomes={outcomes}
            user={user}
            userFields={userFields}
            onNavigate={handleNavigate}
            onRunWorkflow={runAnalysis}
            initialTab={analysisTab || 'six_seasons_milp'}
            lang={lang}
            request={request}
            formatNumber={formatNumber}
            strategyProfiles={STRATEGY_PROFILES}
          />
        )}

        {(activeNav === 'field' || activeNav === 'field_map') && (
          <MyFarmWorkspaceView
            activeField={activeField}
            user={user}
            userFields={userFields}
            onSelectField={handleSelectActiveField}
            onAddField={openAddFieldModal}
            onEditField={openEditFieldModal}
            onArchiveField={handleArchiveField}
            onDeleteField={handleArchiveField}
            request={request}
            lang={lang}
            onNavigate={handleNavigate}
            initialSubTab={myFarmSubTab}
          />
        )}

        {/* -------------------- VIEW: FARM PLANNING -------------------- */}
        {activeNav === 'farm_planning' && (
          <FarmPlanningView
            activeField={activeField}
            summary={summary}
            plan={plan}
            ml={ml}
            user={user}
            userFields={userFields}
            lang={lang}
            theme={theme}
            onNavigate={handleNavigate}
            onRunWorkflow={runAnalysis}
            initialSubTab={farmPlanningSubTab}
            request={request}
          />
        )}

        {/* -------------------- VIEW: WATER & IRRIGATION OPTIMIZATION -------------------- */}
        {activeNav === 'water_irrigation' && (
          <WaterIrrigationView
            activeField={activeField}
            plan={plan}
            summary={summary}
            nasa={nasa}
            lang={lang}
            onNavigate={handleNavigate}
            initialSubTab={waterSubTab}
          />
        )}

        {/* -------------------- VIEW: DATA & EVIDENCE -------------------- */}
        {activeNav === 'data_evidence' && (
          <DataEvidenceView
            activeField={activeField}
            nasa={nasa}
            lang={lang}
            request={request}
            initialSubTab={dataEvidenceSubTab}
          />
        )}

        {/* -------------------- VIEW 4: NASA POWER WEATHER & CLIMATE -------------------- */}
        {activeNav === 'weather' && (
          <NasaWeatherStation3D
            nasa={nasa}
            env={env}
            activeField={activeField}
            onBack={() => handleNavigate('dashboard')}
            lang={lang}
          />
        )}

        {/* -------------------- VIEW 6: AI ASSISTANT & DECISION SUPPORT -------------------- */}
        {activeNav === 'assistant' && (
          <AiAssistantView
            activeField={activeField}
            nasa={nasa}
            summary={summary}
            plan={plan}
            ml={ml}
            rl={rl}
            comparisonLab={comparisonLab}
            robustness={robustness}
            outcomes={outcomes}
            user={user}
            lang={lang}
            onBack={() => handleNavigate(assistantParams?.fromPage || 'dashboard')}
            onNavigateTab={(tab) => handleNavigate(tab === 'farm_planning' ? 'farm_planning' : 'analytics', tab)}
            initialQuestion={assistantParams?.question}
            pageContext={assistantParams?.context}
            fromPage={assistantParams?.fromPage}
            onReturn={() => handleNavigate(assistantParams?.fromPage || 'farm_planning')}
          />
        )}


        {/* -------------------- VIEW 9: SYNTHETIC DATA LAB & PROVENANCE -------------------- */}
        {activeNav === 'synthetic_lab' && (
          <SyntheticDataLabView
            activeField={activeField}
            onNavigateTab={(tab) => handleNavigate('analytics', tab)}
          />
        )}

        {/* -------------------- VIEW 10: SCIENTIFIC SENSITIVITY & ROBUSTNESS -------------------- */}
        {activeNav === 'sensitivity' && (
          <SensitivityAnalysisView
            activeField={activeField}
            onNavigateTab={(tab) => handleNavigate('analytics', tab)}
            request={request}
            formatNumber={formatNumber}
          />
        )}

        {/* -------------------- VIEW 7: ACCOUNT & PROFILE (P1) -------------------- */}
        {activeNav === 'account' && (
          <div className="profile-3d-wrapper" style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 16px' }}>
            {/* 1. Header with Title & Profile Actions */}
            <div className="profile-3d-header" style={{ marginBottom: 24 }}>
              <div className="profile-3d-title-group">
                <span className="profile-3d-eyebrow">
                  <span className="live-pulse-dot" />
                  {lang === 'bn' ? 'ব্যবহারকারী অ্যাকাউন্ট' : 'USER ACCOUNT'}
                </span>
                <h1 className="profile-3d-title">
                  {lang === 'bn' ? 'প্রোফাইল ও সেটিংস' : 'Profile & Settings'}
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                  {lang === 'bn'
                    ? 'আপনার ব্যক্তিগত অ্যাকাউন্ট, ভাষা ও ভিজ্যুয়াল থিম পছন্দসমূহ।'
                    : 'Your personal account profile, language, and display preferences.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {user ? (
                  <>
                    <button
                      type="button"
                      className="ui-btn ui-btn-primary ui-btn-sm"
                      onClick={openEditProfile}
                      title="Edit agronomist profile"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {lang === 'bn' ? 'প্রোফাইল পরিবর্তন' : 'Edit Profile'}
                    </button>
                    <button
                      type="button"
                      className="ui-btn ui-btn-secondary ui-btn-sm"
                      onClick={handleSignOut}
                      title="Sign Out"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      {lang === 'bn' ? 'লগআউট' : 'Sign Out'}
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="ui-btn ui-btn-primary ui-btn-md"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthModal(true);
                      }}
                    >
                      {lang === 'bn' ? 'লগইন / নিবন্ধন' : 'Sign In / Register'}
                    </button>
                    <button
                      type="button"
                      className="ui-btn ui-btn-secondary ui-btn-md"
                      onClick={handleQuickDemoLogin}
                    >
                      {lang === 'bn' ? 'ডেমো সেশন' : 'Demo Session'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Account Grid: ID Card + My Farm Jump Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
              {/* Account Identity Card */}
              <div className="dash-card" style={{ padding: 24, borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div className="orbit-core-sphere" style={{ width: 56, height: 56, fontSize: 20, flexShrink: 0 }}>
                    {user ? (user.name || 'AG').slice(0, 2).toUpperCase() : 'AG'}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main, #f1f5f9)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {user ? user.name : (lang === 'bn' ? 'অতিথি ব্যবহারকারী' : 'Guest Agronomist')}
                      {user && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#00df81">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--primary, #10b981)', fontWeight: 600, marginTop: 2 }}>
                      {user?.role || (lang === 'bn' ? 'কৃষক ও খামার পরিচালক' : 'Farmer & Farm Operator')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {user ? user.email : 'guest@fieldshift.local'}
                    </div>
                  </div>
                </div>

                {/* Account Details & Settings */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                  {/* Language Setting */}
                  <div className="holo-spec-box" style={{ background: 'var(--surface-2, rgba(255,255,255,0.03))', padding: 12, borderRadius: 10 }}>
                    <span className="holo-spec-label" style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {lang === 'bn' ? 'অ্যাপের ভাষা' : 'App Language'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setLang('bn')}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          fontSize: 12,
                          borderRadius: 6,
                          border: lang === 'bn' ? '1px solid var(--primary, #10b981)' : '1px solid var(--border-light)',
                          background: lang === 'bn' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                          color: lang === 'bn' ? 'var(--primary, #10b981)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: lang === 'bn' ? 700 : 400
                        }}
                      >
                        বাংলা
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang('en')}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          fontSize: 12,
                          borderRadius: 6,
                          border: lang === 'en' ? '1px solid var(--primary, #10b981)' : '1px solid var(--border-light)',
                          background: lang === 'en' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                          color: lang === 'en' ? 'var(--primary, #10b981)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: lang === 'en' ? 700 : 400
                        }}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* Theme Setting */}
                  <div className="holo-spec-box" style={{ background: 'var(--surface-2, rgba(255,255,255,0.03))', padding: 12, borderRadius: 10 }}>
                    <span className="holo-spec-label" style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {lang === 'bn' ? 'ভিজ্যুয়াল থিম' : 'Color Theme'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          fontSize: 12,
                          borderRadius: 6,
                          border: theme === 'dark' ? '1px solid var(--primary, #10b981)' : '1px solid var(--border-light)',
                          background: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                          color: theme === 'dark' ? 'var(--primary, #10b981)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: theme === 'dark' ? 700 : 400
                        }}
                      >
                        🌙 {lang === 'bn' ? 'ডার্ক' : 'Dark'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          fontSize: 12,
                          borderRadius: 6,
                          border: theme === 'light' ? '1px solid var(--primary, #10b981)' : '1px solid var(--border-light)',
                          background: theme === 'light' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                          color: theme === 'light' ? 'var(--primary, #10b981)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontWeight: theme === 'light' ? 700 : 400
                        }}
                      >
                        ☀️ {lang === 'bn' ? 'লাইট' : 'Light'}
                      </button>
                    </div>
                  </div>

                  {/* Database Engine */}
                  <div className="holo-spec-box" style={{ background: 'var(--surface-2, rgba(255,255,255,0.03))', padding: 12, borderRadius: 10 }}>
                    <span className="holo-spec-label" style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {lang === 'bn' ? 'ডাটাবেস সংরক্ষণ' : 'Storage Engine'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                      {backendHealth?.database?.toLowerCase() === 'sqlite' || !backendHealth?.database
                        ? 'SQLite (Local)'
                        : `${backendHealth.database}`}
                    </span>
                  </div>

                  {/* Member Since */}
                  <div className="holo-spec-box" style={{ background: 'var(--surface-2, rgba(255,255,255,0.03))', padding: 12, borderRadius: 10 }}>
                    <span className="holo-spec-label" style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {lang === 'bn' ? 'নিবন্ধন তারিখ' : 'Member Since'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                      {user && user.created_at ? formatDate(user.created_at) : 'Oct 3, 2026'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Small My Farm Navigation Card (P1 Requirement) */}
              <div className="dash-card" style={{ padding: 24, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🚜</span>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'আমার জমি' : 'My Farm'}
                    </h3>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--primary, #10b981)',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    {userFields.length} {lang === 'bn' ? 'টি জমি' : 'fields'}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {lang === 'bn' ? (
                    <>আমার জমি: <strong style={{ color: 'var(--text-main)' }}>{userFields.length}</strong> টি, মোট <strong style={{ color: 'var(--text-main)' }}>{(userFields.reduce((acc, f) => acc + (Number(f.area_ha) || 0), 0) * (10000 / 1337.8)).toFixed(1)}</strong> বিঘা</>
                  ) : (
                    <>My Fields: <strong style={{ color: 'var(--text-main)' }}>{userFields.length}</strong> fields, total <strong style={{ color: 'var(--text-main)' }}>{(userFields.reduce((acc, f) => acc + (Number(f.area_ha) || 0), 0) * (10000 / 1337.8)).toFixed(1)}</strong> bigha</>
                  )}
                </p>

                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)' }}>
                  {lang === 'bn'
                    ? 'জমির পার্সেল যোগ, সম্পাদনা, স্যাটেলাইট ম্যাপ ও মাটির পুষ্টি দেখতে আমার জমি পেজে যান।'
                    : 'Manage farm parcels, satellite boundaries, soil diagnostics, and seasonal rotations in My Farm.'}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <button
                    type="button"
                    className="dashboard-primary-run-btn"
                    onClick={() => setActiveNav('field')}
                    style={{ width: '100%', padding: '10px 16px', fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <span>{lang === 'bn' ? 'আমার জমিতে যান' : 'Go to My Farm'}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Developer Command Telemetry behind ?debug=1 */}
            {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1' && (
              <div className="terminal-hud-card" style={{ marginTop: 24 }}>
                <div className="terminal-hud-header">
                  <span style={{ color: 'var(--primary)', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em' }}>
                    ● SYSTEM COMMAND TELEMETRY [DEBUG MODE]
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>PORT 8000 / 5173</span>
                </div>
                <div className="terminal-logs-stream">
                  <div className="terminal-line-ok">[SYSTEM] Database Engine: {backendHealth?.database || 'sqlite'} ({backendHealth?.status || 'connected'})</div>
                  <div className="terminal-line-ok">[CLIMATE] NASA POWER data mode: {nasa?.data_mode || 'cache'}</div>
                  <div className="terminal-line-ok">[SOLVER] PuLP CBC MILP engine active</div>
                  <div className="terminal-line-ok">[SOLVER_OK] MILP CBC dynamic rotation optimization solver ready</div>
                  <div className="terminal-line-dim">[INFO] Active field target: {activeField ? `#${activeField.id} (${activeField.name})` : 'Unassigned'}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= GLOBAL MODALS LAYER ================= */}

            {/* ADD / EDIT FIELD MODAL */}
            {fieldModal && (
              <div className="modal-backdrop" onClick={() => !fieldModalLoading && setFieldModal(null)}>
                <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h3>{fieldModal === 'edit' ? (lang === 'bn' ? `জমি সম্পাদন: ${fieldForm.name || ''}` : `Edit Field: ${fieldForm.name || 'Parcel'}`) : (lang === 'bn' ? 'নতুন কৃষি জমি যোগ করুন' : 'Add New Agricultural Field')}</h3>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => !fieldModalLoading && setFieldModal(null)}
                      aria-label={lang === 'bn' ? 'পপআপ বন্ধ করুন' : 'Close modal'}
                    >×</button>
                  </div>
                  <form onSubmit={handleFieldFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', margin: 0 }}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px' }}>
                      <div className="form-group">
                        <label>{lang === 'bn' ? 'জমির নাম *' : 'Field Name *'}</label>
                        <input
                          className="input-box"
                          placeholder={lang === 'bn' ? 'যেমন: উত্তর মাঠ ১ / দিঘীর পাড়' : 'e.g. North Plot 1'}
                          value={fieldForm.name}
                          onChange={e => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>

                      {/* Interactive Google Maps Field Location Picker */}
                      <div className="form-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>{lang === 'bn' ? 'ম্যাপে জমির অবস্থান নির্বাচন *' : 'Interactive Field Location (Google Maps) *'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মার্কার টেনে বা জিপিএস দিয়ে স্থানাঙ্ক নির্ধারণ করুন' : 'Click or drag marker to set coordinates'}</span>
                        </label>
                        <GoogleFieldMapPicker
                          lang={lang}
                          latitude={fieldForm.latitude}
                          longitude={fieldForm.longitude}
                          onChange={(lat, lng) => {
                            setFieldForm(prev => ({
                              ...prev,
                              latitude: String(lat),
                              longitude: String(lng)
                            }));
                          }}
                        />
                      </div>

                      {/* Precise Synced Latitude & Longitude Inputs */}
                      <div className="form-grid-inner">
                        <div className="form-group">
                          <label>{lang === 'bn' ? 'অক্ষাংশ (Latitude ° N) *' : 'Latitude (° N) *'}</label>
                          <input
                            className="input-box"
                            type="number"
                            step="0.0001"
                            placeholder={lang === 'bn' ? 'ম্যাপে পিন রাখুন' : 'Pin location on map'}
                            value={fieldForm.latitude}
                            onChange={e => setFieldForm(prev => ({ ...prev, latitude: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>{lang === 'bn' ? 'দ্রাঘিমাংশ (Longitude ° E) *' : 'Longitude (° E) *'}</label>
                          <input
                            className="input-box"
                            type="number"
                            step="0.0001"
                            placeholder={lang === 'bn' ? 'ম্যাপে পিন রাখুন' : 'Pin location on map'}
                            value={fieldForm.longitude}
                            onChange={e => setFieldForm(prev => ({ ...prev, longitude: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-grid-inner">
                        <div className="form-group">
                          <label>{lang === 'bn' ? 'জমির পরিমাপ *' : 'Field Area *'}</label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input
                              className="input-box"
                              type="number"
                              step="any"
                              min="0.01"
                              placeholder={fieldForm.area_unit === 'bigha' ? (lang === 'bn' ? 'যেমন: ৫' : 'e.g. 5') : 'e.g. 1.0'}
                              value={fieldForm.area_input != null ? fieldForm.area_input : (fieldForm.area_ha ? (Number(fieldForm.area_ha) / 0.13378).toFixed(1) : '')}
                              onChange={e => {
                                const val = e.target.value;
                                const unit = fieldForm.area_unit || 'bigha';
                                let ha = '';
                                if (val !== '' && !isNaN(val)) {
                                  const num = parseFloat(val);
                                  if (unit === 'bigha') ha = (num * 0.13378).toFixed(4);
                                  else if (unit === 'shatansh') ha = ((num * 40.47) / 10000).toFixed(4);
                                  else ha = num.toFixed(4);
                                }
                                setFieldForm(prev => ({ ...prev, area_input: val, area_ha: ha }));
                              }}
                              required
                              style={{ flex: 1 }}
                            />
                            <select
                              className="input-box"
                              style={{ width: 110, padding: '0 6px' }}
                              value={fieldForm.area_unit || 'bigha'}
                              onChange={e => {
                                const unit = e.target.value;
                                const val = fieldForm.area_input;
                                let ha = '';
                                if (val !== '' && !isNaN(val)) {
                                  const num = parseFloat(val);
                                  if (unit === 'bigha') ha = (num * 0.13378).toFixed(4);
                                  else if (unit === 'shatansh') ha = ((num * 40.47) / 10000).toFixed(4);
                                  else ha = num.toFixed(4);
                                }
                                setFieldForm(prev => ({ ...prev, area_unit: unit, area_ha: ha }));
                              }}
                            >
                              <option value="bigha">{lang === 'bn' ? 'বিঘা' : 'Bigha'}</option>
                              <option value="hectare">{lang === 'bn' ? 'হেক্টর' : 'Hectare'}</option>
                              <option value="shatansh">{lang === 'bn' ? 'শতাংশ' : 'Shatansh'}</option>
                            </select>
                          </div>
                          {fieldForm.area_ha && Number(fieldForm.area_ha) > 0 && (
                            <small style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                              ≈ {Number(fieldForm.area_ha).toFixed(2)} {lang === 'bn' ? 'হেক্টর' : 'ha'} {lang === 'bn' ? '(১ বিঘা = ০.১৩৩৭৮ হেক্টর; ১ শতাংশ = ৪০.৪৭ বর্গমিটার)' : '(1 bigha = 0.13378 ha; 1 shatansh = 40.47 sq m)'}
                            </small>
                          )}
                        </div>
                        <div className="form-group">
                          <label>{lang === 'bn' ? 'মাটির ধরন *' : 'Soil Texture *'}</label>
                          <select
                            className="input-box"
                            value={fieldForm.soil_texture || 'unknown'}
                            onChange={e => setFieldForm(prev => ({ ...prev, soil_texture: e.target.value }))}
                            required
                          >
                            <option value="unknown">{lang === 'bn' ? 'জানি না' : 'Unknown'}</option>
                            <option value="loam">{lang === 'bn' ? 'দোআঁশ' : 'Loam'}</option>
                            <option value="silty_loam">{lang === 'bn' ? 'পলি দোআঁশ' : 'Silty Loam'}</option>
                            <option value="clay_loam">{lang === 'bn' ? 'এঁটেল দোআঁশ' : 'Clay Loam'}</option>
                            <option value="clay">{lang === 'bn' ? 'এঁটেল' : 'Clay'}</option>
                            <option value="sandy_loam">{lang === 'bn' ? 'বেলে দোআঁশ' : 'Sandy Loam'}</option>
                          </select>
                        </div>
                      </div>

                      {/* Irrigation Capacity (3 Choices + Collapsible Advanced) */}
                      <div className="form-group">
                        <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                          {lang === 'bn' ? 'সেচ সুবিধা' : 'Irrigation Capacity'}
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                          <button
                            type="button"
                            onClick={() => setFieldForm(prev => ({ ...prev, irrigation_tier: 'ample', irrigation_capacity_mm: '1200' }))}
                            style={{
                              padding: '10px 8px',
                              borderRadius: 8,
                              border: fieldForm.irrigation_tier === 'ample' ? '2px solid var(--leaf, #22c55e)' : '1px solid var(--border-light, #334155)',
                              background: fieldForm.irrigation_tier === 'ample' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-card, #1e293b)',
                              color: 'inherit',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{lang === 'bn' ? 'পর্যাপ্ত' : 'Ample'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatI18nNumber(1200, lang)} {unitLabel('mm', lang)}/{lang === 'bn' ? 'বছর' : 'yr'}</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFieldForm(prev => ({ ...prev, irrigation_tier: 'limited', irrigation_capacity_mm: '400' }))}
                            style={{
                              padding: '10px 8px',
                              borderRadius: 8,
                              border: fieldForm.irrigation_tier === 'limited' ? '2px solid var(--leaf, #22c55e)' : '1px solid var(--border-light, #334155)',
                              background: fieldForm.irrigation_tier === 'limited' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-card, #1e293b)',
                              color: 'inherit',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{lang === 'bn' ? 'সীমিত' : 'Limited'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatI18nNumber(400, lang)} {unitLabel('mm', lang)}/{lang === 'bn' ? 'বছর' : 'yr'}</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFieldForm(prev => ({ ...prev, irrigation_tier: 'rainfed', irrigation_capacity_mm: '0' }))}
                            style={{
                              padding: '10px 8px',
                              borderRadius: 8,
                              border: fieldForm.irrigation_tier === 'rainfed' ? '2px solid var(--leaf, #22c55e)' : '1px solid var(--border-light, #334155)',
                              background: fieldForm.irrigation_tier === 'rainfed' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-card, #1e293b)',
                              color: 'inherit',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{lang === 'bn' ? 'সেচ নেই' : 'Rainfed'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatI18nNumber(0, lang)} {unitLabel('mm', lang)}/{lang === 'bn' ? 'বছর' : 'yr'}</div>
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <button
                            type="button"
                            onClick={() => setFieldForm(prev => ({ ...prev, show_custom_irrigation: !prev.show_custom_irrigation }))}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--leaf, #22c55e)',
                              cursor: 'pointer',
                              fontSize: 12,
                              padding: 0,
                              textDecoration: 'underline'
                            }}
                          >
                            {fieldForm.show_custom_irrigation
                              ? (lang === 'bn' ? '▲ উন্নত ইনপুট বন্ধ করুন' : '▲ Hide custom mm')
                              : (lang === 'bn' ? 'উন্নত: mm দিন ▾' : 'Advanced: specify mm ▾')}
                          </button>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {lang === 'bn' ? `বর্তমান মান: ${fieldForm.irrigation_capacity_mm || 0} মিমি` : `Current: ${fieldForm.irrigation_capacity_mm || 0} mm`}
                          </span>
                        </div>

                        {fieldForm.show_custom_irrigation && (
                          <div style={{ marginTop: 8 }}>
                            <input
                              className="input-box"
                              type="number"
                              min="0"
                              max="3000"
                              placeholder="e.g. 800"
                              value={fieldForm.irrigation_capacity_mm}
                              onChange={e => setFieldForm(prev => ({ ...prev, irrigation_capacity_mm: e.target.value, irrigation_tier: 'custom' }))}
                            />
                          </div>
                        )}
                      </div>

                      {/* 3-Season Existing Rotation with Farmer Economics (MF8 + MF9) */}
                      <div className="form-group" style={{ padding: '12px 14px', background: 'var(--bg-card, #1e293b)', borderRadius: 8, border: '1px solid var(--border-light, #334155)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <label style={{ fontWeight: 600, display: 'block', margin: 0, fontSize: 13 }}>
                            🔄 {lang === 'bn' ? 'বিদ্যমান ৩-মৌসুম ফসল আবর্তন (বেসলাইন)' : 'Existing 3-Season Crop Rotation (Baseline)'}
                          </label>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            {lang === 'bn' ? 'ফলন ও দাম ঐচ্ছিক' : 'Yield & price optional'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                          {/* Rabi */}
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-light, #334155)' }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                              {lang === 'bn' ? 'রবি (শীতকালীন)' : 'Rabi (Winter)'}
                            </label>
                            <select
                              className="input-box"
                              value={fieldForm.rotation_rabi || 'Boro'}
                              onChange={e => setFieldForm(prev => ({ ...prev, rotation_rabi: e.target.value }))}
                            >
                              <option value="Boro">{lang === 'bn' ? 'বোরো ধান' : 'Boro Rice'}</option>
                              <option value="Mustard">{lang === 'bn' ? 'সরিষা' : 'Mustard'}</option>
                              <option value="Wheat">{lang === 'bn' ? 'গম' : 'Wheat'}</option>
                              <option value="Potato">{lang === 'bn' ? 'আলু' : 'Potato'}</option>
                              <option value="Maize">{lang === 'bn' ? 'ভুট্টা' : 'Maize'}</option>
                              <option value="Lentil">{lang === 'bn' ? 'মসুর' : 'Lentil'}</option>
                              <option value="Chickpea">{lang === 'bn' ? 'ছোলা' : 'Chickpea'}</option>
                              <option value="Soybean">{lang === 'bn' ? 'সয়াবিন' : 'Soybean'}</option>
                              <option value="Groundnut">{lang === 'bn' ? 'চীনাবাদাম' : 'Groundnut'}</option>
                              <option value="Sunflower">{lang === 'bn' ? 'সূর্যমুখী' : 'Sunflower'}</option>
                              <option value="Tomato">{lang === 'bn' ? 'টমেটো' : 'Tomato'}</option>
                              <option value="Fallow">{lang === 'bn' ? 'পতিত' : 'Fallow'}</option>
                            </select>
                            {fieldForm.rotation_rabi !== 'Fallow' ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                                <div>
                                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                    {lang === 'bn' ? 'ফলন (মণ/বিঘা)' : 'Yield (maund/bigha)'}
                                  </label>
                                  <input
                                    className="input-box"
                                    type="number"
                                    step="0.1"
                                    placeholder={lang === 'bn' ? 'যেমন ২০' : 'e.g. 20'}
                                    value={fieldForm.rabi_yield || ''}
                                    onChange={e => setFieldForm(prev => ({ ...prev, rabi_yield: e.target.value }))}
                                    style={{ fontSize: 11, padding: '4px 6px' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                    {lang === 'bn' ? 'বিক্রয় (টাকা/মণ)' : 'Price (BDT/maund)'}
                                  </label>
                                  <input
                                    className="input-box"
                                    type="number"
                                    placeholder={lang === 'bn' ? 'যেমন ১২০০' : 'e.g. 1200'}
                                    value={fieldForm.rabi_price || ''}
                                    onChange={e => setFieldForm(prev => ({ ...prev, rabi_price: e.target.value }))}
                                    style={{ fontSize: 11, padding: '4px 6px' }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 8 }}>
                                {lang === 'bn' ? 'ফাঁকা মৌসুম' : 'Fallow Season'}
                              </div>
                            )}
                          </div>

                          {/* Kharif-1 */}
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-light, #334155)' }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                              {lang === 'bn' ? 'খরিপ-১ (প্রাক-বর্ষা)' : 'Kharif-1 (Pre-Monsoon)'}
                            </label>
                            <select
                              className="input-box"
                              value={fieldForm.rotation_kharif1 || 'Fallow'}
                              onChange={e => setFieldForm(prev => ({ ...prev, rotation_kharif1: e.target.value }))}
                            >
                              <option value="Fallow">{lang === 'bn' ? 'পতিত' : 'Fallow'}</option>
                              <option value="Aus">{lang === 'bn' ? 'আউশ ধান' : 'Aus Rice'}</option>
                              <option value="Mungbean">{lang === 'bn' ? 'মুগডাল' : 'Mungbean'}</option>
                              <option value="Jute">{lang === 'bn' ? 'পাট' : 'Jute'}</option>
                              <option value="Sesame">{lang === 'bn' ? 'তিল' : 'Sesame'}</option>
                              <option value="Maize">{lang === 'bn' ? 'ভুট্টা' : 'Maize'}</option>
                              <option value="Soybean">{lang === 'bn' ? 'সয়াবিন' : 'Soybean'}</option>
                              <option value="Groundnut">{lang === 'bn' ? 'চীনাবাদাম' : 'Groundnut'}</option>
                            </select>
                            {fieldForm.rotation_kharif1 !== 'Fallow' ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                                <div>
                                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                    {lang === 'bn' ? 'ফলন (মণ/বিঘা)' : 'Yield (maund/bigha)'}
                                  </label>
                                  <input
                                    className="input-box"
                                    type="number"
                                    step="0.1"
                                    placeholder={lang === 'bn' ? 'যেমন ৫' : 'e.g. 5'}
                                    value={fieldForm.k1_yield || ''}
                                    onChange={e => setFieldForm(prev => ({ ...prev, k1_yield: e.target.value }))}
                                    style={{ fontSize: 11, padding: '4px 6px' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                    {lang === 'bn' ? 'বিক্রয় (টাকা/মণ)' : 'Price (BDT/maund)'}
                                  </label>
                                  <input
                                    className="input-box"
                                    type="number"
                                    placeholder={lang === 'bn' ? 'যেমন ৩৫০০' : 'e.g. 3500'}
                                    value={fieldForm.k1_price || ''}
                                    onChange={e => setFieldForm(prev => ({ ...prev, k1_price: e.target.value }))}
                                    style={{ fontSize: 11, padding: '4px 6px' }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 8 }}>
                                {lang === 'bn' ? 'ফাঁকা মৌসুম' : 'Fallow Season'}
                              </div>
                            )}
                          </div>

                          {/* Kharif-2 */}
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-light, #334155)' }}>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                              {lang === 'bn' ? 'খরিপ-২ (বর্ষাকালীন)' : 'Kharif-2 (Monsoon)'}
                            </label>
                            <select
                              className="input-box"
                              value={fieldForm.rotation_kharif2 || 'Aman'}
                              onChange={e => setFieldForm(prev => ({ ...prev, rotation_kharif2: e.target.value }))}
                            >
                              <option value="Aman">{lang === 'bn' ? 'আমন ধান' : 'Aman Rice'}</option>
                              <option value="Fallow">{lang === 'bn' ? 'পতিত' : 'Fallow'}</option>
                            </select>
                            {fieldForm.rotation_kharif2 !== 'Fallow' ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                                <div>
                                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                    {lang === 'bn' ? 'ফলন (মণ/বিঘা)' : 'Yield (maund/bigha)'}
                                  </label>
                                  <input
                                    className="input-box"
                                    type="number"
                                    step="0.1"
                                    placeholder={lang === 'bn' ? 'যেমন ১৪' : 'e.g. 14'}
                                    value={fieldForm.k2_yield || ''}
                                    onChange={e => setFieldForm(prev => ({ ...prev, k2_yield: e.target.value }))}
                                    style={{ fontSize: 11, padding: '4px 6px' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                    {lang === 'bn' ? 'বিক্রয় (টাকা/মণ)' : 'Price (BDT/maund)'}
                                  </label>
                                  <input
                                    className="input-box"
                                    type="number"
                                    placeholder={lang === 'bn' ? 'যেমন ১১০০' : 'e.g. 1100'}
                                    value={fieldForm.k2_price || ''}
                                    onChange={e => setFieldForm(prev => ({ ...prev, k2_price: e.target.value }))}
                                    style={{ fontSize: 11, padding: '4px 6px' }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 8 }}>
                                {lang === 'bn' ? 'ফাঁকা মৌসুম' : 'Fallow Season'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Optional Soil Diagnostics */}
                      <div className="form-grid-inner">
                        <div className="form-group">
                          <label>
                            {lang === 'bn' ? 'মাটির পিএইচ (ঐচ্ছিক)' : 'Soil pH (0 - 14, Optional)'}
                          </label>
                          <input
                            className="input-box"
                            type="number"
                            step="0.1"
                            min="0"
                            max="14"
                            placeholder={lang === 'bn' ? 'খালি রাখলে SoilGrids (ঐচ্ছিক)' : 'Optional (SoilGrids auto-fills)'}
                            value={fieldForm.soil_ph}
                            onChange={e => setFieldForm(prev => ({ ...prev, soil_ph: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            {lang === 'bn' ? 'জৈব পদার্থ (%, ঐচ্ছিক)' : 'Organic Matter (%, Optional)'}
                          </label>
                          <input
                            className="input-box"
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder={lang === 'bn' ? 'খালি রাখলে SoilGrids (ঐচ্ছিক)' : 'Optional (SoilGrids auto-fills)'}
                            value={fieldForm.organic_matter}
                            onChange={e => setFieldForm(prev => ({ ...prev, organic_matter: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginTop: 4, padding: '10px 14px', background: 'rgba(0, 223, 129, 0.05)', borderRadius: 8, border: '1px solid rgba(0, 223, 129, 0.2)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(fieldForm.seasonally_flooded)}
                            onChange={e => setFieldForm(prev => ({ ...prev, seasonally_flooded: e.target.checked }))}
                            style={{ width: 18, height: 18, accentColor: '#00df81', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 600, color: 'var(--text-main, #e2e8f0)', fontSize: 13 }}>
                            🌊 {lang === 'bn' ? 'মৌসুমি প্লাবিত হাওর জমি (জুন-নভেম্বর পানির নিচে)' : 'Seasonally Flooded Haor Wetland (Submerged Jun–Nov)'}
                          </span>
                        </label>
                        <p style={{ margin: '4px 0 0 28px', fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>
                          {lang === 'bn' ? 'হাওর জমিতে খরিপ-২ মৌসুমে জমি পানিতে তলিয়ে থাকে এবং রবি মৌসুমে বোরো ধান প্রধান ফসল।' : 'Haor basins are deep-flooded in Kharif-2; Boro rice is primary winter crop.'}
                        </p>
                      </div>

                      {/* Inline duplicate & proximity warning */}
                      {(() => {
                        const trimmed = (fieldForm.name || '').trim().toLowerCase();
                        if (trimmed && userFields.some(f => String(f.id) !== String(fieldForm.id) && (f.name || '').trim().toLowerCase() === trimmed)) {
                          return (
                            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 6, color: '#ef4444', fontSize: 12.5, fontWeight: 500 }}>
                              ⚠️ {lang === 'bn' ? 'সতর্কতা: এই নামের জমি ইতিমধ্যে নিবন্ধিত রয়েছে। অনুগ্রহ করে ভিন্ন নাম দিন।' : 'Warning: A field with this name already exists. Please choose a different name.'}
                            </div>
                          );
                        }
                        const latN = parseFloat(fieldForm.latitude);
                        const lonN = parseFloat(fieldForm.longitude);
                        if (Number.isFinite(latN) && Number.isFinite(lonN)) {
                          const near = userFields.find(f => String(f.id) !== String(fieldForm.id) && f.latitude != null && f.longitude != null && haversineMeters(latN, lonN, Number(f.latitude), Number(f.longitude)) < 50);
                          if (near) {
                            return (
                              <div style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: 6, color: '#f59e0b', fontSize: 12.5, fontWeight: 500 }}>
                                ⚠️ {lang === 'bn' ? `সতর্কতা: এই স্থানাঙ্কের ৫০ মিটারের মধ্যে "${near.name}" জমিটি ইতিমধ্যে বিদ্যমান।` : `Warning: Field "${near.name}" already exists within 50 meters of these coordinates.`}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}

                      {fieldModalError && (
                        <p style={{ color: '#c0392b', fontSize: 13, margin: 0, fontWeight: 600 }}>{fieldModalError}</p>
                      )}
                    </div>

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 22px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-card, #ffffff)', flexShrink: 0, boxShadow: '0 -2px 10px rgba(0,0,0,0.04)' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setFieldModal(null)}
                        disabled={fieldModalLoading}
                      >
                        {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="run-cta-btn"
                        disabled={
                          fieldModalLoading ||
                          !fieldForm.name?.trim() ||
                          !Number.isFinite(parseFloat(fieldForm.latitude)) ||
                          !Number.isFinite(parseFloat(fieldForm.longitude)) ||
                          !Number.isFinite(parseFloat(fieldForm.area_ha)) ||
                          parseFloat(fieldForm.area_ha) <= 0
                        }
                        title={(!Number.isFinite(parseFloat(fieldForm.latitude)) || !Number.isFinite(parseFloat(fieldForm.longitude))) ? (lang === 'bn' ? '⚠ মানচিত্রে জমি চিহ্নিত করুন' : 'Please set field pin on map') : ''}
                      >
                        {fieldModalLoading
                          ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে…' : 'Saving…')
                          : (fieldModal === 'edit'
                              ? (lang === 'bn' ? 'আপডেট করুন' : 'Update Field')
                              : (lang === 'bn' ? 'জমি সংরক্ষণ করুন' : 'Save Field'))}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW FIELD DETAILS MODAL */}
            {viewingField && (
              <div className="modal-backdrop" onClick={() => setViewingField(null)}>
                <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="modal-header" style={{ flexShrink: 0 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{viewingField.name}</h3>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Field ID #{viewingField.id} • Farm Station #{viewingField.farm_id}</span>
                    </div>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setViewingField(null)}
                      aria-label={lang === 'bn' ? 'পপআপ বন্ধ করুন' : 'Close modal'}
                    >×</button>
                  </div>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px' }}>
                    {/* Read-only Google Maps Field Location View */}
                    <div className="form-group">
                      <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Field Parcel Satellite Map</label>
                      <GoogleFieldMapPicker
                        lang={lang}
                        latitude={viewingField.latitude}
                        longitude={viewingField.longitude}
                        readOnly={true}
                        onChange={() => {}}
                      />
                    </div>

                    {/* Parameters Table */}
                    <div className="field-metrics-table">
                      <div className="metric-cell">
                        <span>Field Size:</span>
                        <strong>{viewingField.area_ha != null ? `${viewingField.area_ha} ha` : 'Not provided'}</strong>
                      </div>
                      <div className="metric-cell">
                        <span>Soil Texture:</span>
                        <strong style={{ textTransform: 'capitalize' }}>{viewingField.soil_texture ? viewingField.soil_texture.replaceAll('_', ' ') : 'Not provided'}</strong>
                      </div>
                      <div className="metric-cell">
                        <span>Soil pH:</span>
                        <strong>{viewingField.soil_ph != null ? viewingField.soil_ph : 'Not provided'}</strong>
                      </div>
                      <div className="metric-cell">
                        <span>Organic Matter:</span>
                        <strong>{viewingField.organic_matter != null ? `${viewingField.organic_matter} %` : 'Not provided'}</strong>
                      </div>
                      <div className="metric-cell">
                        <span>Irrigation Capacity:</span>
                        <strong>{viewingField.irrigation_capacity_mm != null ? `${viewingField.irrigation_capacity_mm} mm` : 'Not provided'}</strong>
                      </div>
                    </div>

                    {/* Crop History Table */}
                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Crop History Records</h4>
                      {viewingField.history && viewingField.history.length > 0 ? (
                        <div style={{ border: '1px solid var(--border-light)', borderRadius: 10, overflow: 'hidden' }}>
                          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--bg-card-subtle)' }}>
                              <tr>
                                <th style={{ padding: '8px 12px' }}>Year</th>
                                <th style={{ padding: '8px 12px' }}>Crop</th>
                                <th style={{ padding: '8px 12px' }}>Season</th>
                                <th style={{ padding: '8px 12px' }}>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {viewingField.history.map((hist, idx) => (
                                <tr key={idx} style={{ borderTop: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>{hist.year}</td>
                                  <td style={{ padding: '8px 12px' }}><span className="crop-chip">{hist.crop}</span></td>
                                  <td style={{ padding: '8px 12px', textTransform: 'capitalize' }}>{hist.season || 'Annual'}</td>
                                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{hist.notes || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
                          No prior crop rotations recorded for this field parcel.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid var(--border-light)', background: '#ffffff', flexShrink: 0, boxShadow: '0 -2px 10px rgba(0,0,0,0.04)' }}>
                    <button
                      type="button"
                      className="btn-field-archive"
                      onClick={() => {
                        handleArchiveField(viewingField);
                      }}
                    >
                      {lang === "bn" ? "মুছে ফেলুন" : "Delete Field"}
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        className="btn-field-action"
                        onClick={() => {
                          const fld = viewingField;
                          setViewingField(null);
                          openEditFieldModal(fld);
                        }}
                      >
                        Edit Field
                      </button>
                      <button
                        type="button"
                        className="btn-select-analysis"
                        onClick={() => {
                          const fld = viewingField;
                          setViewingField(null);
                          selectFieldForAnalysis(fld);
                        }}
                      >
                        Select for Analysis  → 
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OPERATOR PROFILE EDIT MODAL */}
            {profileModal && (
              <div className="modal-backdrop" onClick={() => !profileLoading && setProfileModal(false)}>
                <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h3>Edit Agronomist Profile & Station</h3>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => !profileLoading && setProfileModal(false)}
                      aria-label={lang === 'bn' ? 'পপআপ বন্ধ করুন' : 'Close modal'}
                    >×</button>
                  </div>
                  <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', margin: 0 }}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px' }}>
                      <div className="form-group">
                        <label>Operator Full Name *</label>
                        <input
                          className="input-box"
                          value={profileName}
                          onChange={e => setProfileName(e.target.value)}
                          placeholder="e.g. Dani"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Agricultural Research Station / Farm Name *</label>
                        <input
                          className="input-box"
                          value={profileFarmName}
                          onChange={e => setProfileFarmName(e.target.value)}
                          placeholder="e.g. Dhaka Research Basin Station #27"
                          required
                        />
                      </div>
                      {profileError && (
                        <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{profileError}</p>
                      )}
                      {profileSuccess && (
                        <p style={{ color: '#27ae60', fontSize: 13, margin: 0 }}>{profileSuccess}</p>
                      )}
                    </div>
                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: '1px solid var(--border-light)', background: '#ffffff', flexShrink: 0, boxShadow: '0 -2px 10px rgba(0,0,0,0.04)' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setProfileModal(false)}
                        disabled={profileLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="run-cta-btn"
                        disabled={profileLoading}
                      >
                        {profileLoading ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* AUTHENTICATION / LOGIN / REGISTER MODAL */}
            {authModal && (
              <div className="modal-backdrop" onClick={() => setAuthModal(false)}>
                <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                  <div className="modal-header">
                    <h3>{authMode === 'register' ? 'Register Agronomist Account' : 'Sign In to FieldShift'}</h3>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => setAuthModal(false)}
                      aria-label={lang === 'bn' ? 'লগইন উইন্ডো বন্ধ করুন' : 'Close authentication dialog'}
                    >×</button>
                  </div>
                  <form onSubmit={handleAuthSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 22px' }}>
                      <div className="auth-tabs" style={{ display: 'flex', gap: 8, marginBottom: 8, borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>
                        <button
                          type="button"
                          className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                          onClick={() => { setAuthMode('login'); setAuthError(''); setAuthMsg(''); }}
                          style={{ fontWeight: 600, padding: '6px 12px', background: authMode === 'login' ? 'rgba(0, 223, 129, 0.15)' : 'transparent', color: authMode === 'login' ? 'var(--primary)' : 'inherit', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                          onClick={() => { setAuthMode('register'); setAuthError(''); setAuthMsg(''); }}
                          style={{ fontWeight: 600, padding: '6px 12px', background: authMode === 'register' ? 'rgba(0, 223, 129, 0.15)' : 'transparent', color: authMode === 'register' ? 'var(--primary)' : 'inherit', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Create Account
                        </button>
                      </div>

                      {authMode === 'register' && (
                        <div className="form-group">
                          <label>Full Name *</label>
                          <input
                            className="input-box"
                            value={authForm.name}
                            onChange={e => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Dr. Jane Doe"
                            required
                          />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Email Address *</label>
                        <input
                          className="input-box"
                          type="email"
                          value={authForm.email}
                          onChange={e => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="e.g. farmer@fieldshift.local"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Password *</label>
                        <input
                          className="input-box"
                          type="password"
                          value={authForm.password}
                          onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter your password"
                          required
                        />
                      </div>

                      {authError && (
                        <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{authError}</p>
                      )}
                      {authMsg && (
                        <p style={{ color: '#27ae60', fontSize: 13, margin: 0 }}>{authMsg}</p>
                      )}
                    </div>
                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderTop: '1px solid var(--border-light)' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleQuickDemoLogin}
                      >
                        Use Demo Session
                      </button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setAuthModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="run-cta-btn"
                        >
                          {authMode === 'register' ? 'Register' : 'Sign In'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}


                {/* Field Delete Confirmation Modal */}
        {deleteConfirmTarget && (
          <Modal
            isOpen={Boolean(deleteConfirmTarget)}
            onClose={() => setDeleteConfirmTarget(null)}
            title={lang === 'bn' ? 'জমি মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Field Deletion'}
            maxWidth="480px"
          >
            <div style={{ padding: '8px 0' }}>
              <p style={{ margin: '0 0 16px', color: 'var(--text, #f8fafc)', fontSize: 13.5, lineHeight: 1.5 }}>
                {Array.isArray(deleteConfirmTarget)
                  ? (lang === 'bn'
                      ? `আপনি কি নিশ্চিত যে নির্বাচিত ${deleteConfirmTarget.length}টি জমি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`
                      : `Are you sure you want to permanently delete the ${deleteConfirmTarget.length} selected fields? This action cannot be undone.`)
                  : (lang === 'bn'
                      ? `আপনি কি নিশ্চিত যে "${deleteConfirmTarget?.name}" জমিটি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`
                      : `Are you sure you want to permanently delete field "${deleteConfirmTarget?.name}"? This action cannot be undone.`)}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-field-action"
                  onClick={() => setDeleteConfirmTarget(null)}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="ui-btn ui-btn-danger ui-btn-sm"
                  onClick={() => executeDeleteFields(deleteConfirmTarget)}
                >
                  {lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* Mobile Persistent Bottom Navigation Bar (Visible only on narrow screens <= 768px) */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
            title="Home"
          >
            <span className="mobile-nav-icon"><HomeIcon size={20} /></span>
            <span className="mobile-nav-text">{lang === 'bn' ? 'হোম' : 'Home'}</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeNav === 'field' || activeNav === 'field_map' ? 'active' : ''}`}
            onClick={() => handleNavigate('field')}
            title="My Farm"
          >
            <span className="mobile-nav-icon"><FieldIcon size={20} /></span>
            <span className="mobile-nav-text">{lang === 'bn' ? 'জমি' : 'Fields'}</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeNav === 'farm_planning' || activeNav === 'crop_advice' ? 'active' : ''}`}
            onClick={() => handleNavigate('farm_planning')}
            title="Rotation Planner"
          >
            <span className="mobile-nav-icon"><RotationIcon size={20} /></span>
            <span className="mobile-nav-text">{lang === 'bn' ? 'পরিকল্পনা' : 'Plan'}</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeNav === 'weather' ? 'active' : ''}`}
            onClick={() => handleNavigate('weather')}
            title="Climate & Risk"
          >
            <span className="mobile-nav-icon"><WeatherIcon size={20} /></span>
            <span className="mobile-nav-text">{lang === 'bn' ? 'আবহাওয়া' : 'Weather'}</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeNav === 'harvest_profit' || activeNav === 'market' ? 'active' : ''}`}
            onClick={() => handleNavigate('harvest_profit')}
            title="Market & Profit"
          >
            <span className="mobile-nav-icon"><MarketIcon size={20} /></span>
            <span className="mobile-nav-text">{lang === 'bn' ? 'বাজার ও লাভ' : 'Market & Profit'}</span>
          </button>
          <button
            type="button"
            className={`mobile-bottom-nav-item ${activeNav === 'data_evidence' || activeNav === 'research' ? 'active' : ''}`}
            onClick={() => handleNavigate('data_evidence')}
            title="Evidence"
          >
            <span className="mobile-nav-icon"><EvidenceIcon size={20} /></span>
            <span className="mobile-nav-text">{lang === 'bn' ? 'প্রমাণ' : 'Evidence'}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
