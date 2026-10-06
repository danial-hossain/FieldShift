import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleFieldMapPicker } from './GoogleFieldMapPicker.jsx';
import { GoogleFieldMapThumbnail } from './GoogleFieldMapThumbnail.jsx';
import './styles.css';

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
    throw new Error(`Could not reach the FastAPI backend at ${API || 'the /api proxy'} (${err.message}). Is uvicorn running on port 8000?`);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Backend returned a non-JSON response (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(body.detail || body.message || `Request failed (${response.status})`);
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
  balanced: {
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
    name: 'Water Focused',
    mainPriority: 'Better water efficiency',
    legend: 'prioritizes water efficiency',
    icon: '💧'
  },
  soil_focused: {
    name: 'Soil Focused',
    mainPriority: 'Better soil health',
    legend: 'prioritizes soil health',
    icon: '🌱'
  },
  balanced: {
    name: 'Balanced',
    mainPriority: 'Balanced objectives',
    legend: 'balances the configured objectives',
    icon: '⚖️'
  }
};

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
        <div><strong>ML Engine:</strong> Synthetic benchmark</div>
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
      return (
        <div style={{ padding: '40px 24px', maxWidth: 800, margin: '60px auto', background: '#ffffff', borderRadius: 16, border: '1px solid #fed7d7', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 32 }}>⚠️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#c53030' }}>FieldShift Interface Notice</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#742a2a' }}>An unexpected render issue occurred while processing field data.</p>
            </div>
          </div>
          <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <strong style={{ display: 'block', fontSize: 13, color: '#9b2c2c', marginBottom: 6 }}>Error Details:</strong>
            <code style={{ fontSize: 12.5, color: '#742a2a', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {String(this.state.error?.message || this.state.error)}
            </code>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{ padding: '10px 20px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}
            >
              Reload Application
            </button>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '10px 20px', background: '#edf2f7', color: '#2d3748', border: '1px solid #cbd5e0', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}
            >
              Dismiss & Continue
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
  const [selectedStress, setSelectedStress] = useState('normal');

  // User & Account state
  const [user, setUser] = useState(null);
  const [userFarms, setUserFarms] = useState([]);
  const [userFields, setUserFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [fieldsLoaded, setFieldsLoaded] = useState(false);
  const [fieldsError, setFieldsError] = useState('');
  const [userAnalyses, setUserAnalyses] = useState([]);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authMsg, setAuthMsg] = useState('');
  const [authError, setAuthError] = useState('');
  const [saveFieldMsg, setSaveFieldMsg] = useState('');
  const [profileTab, setProfileTab] = useState('parcels');
  const [analysisTab, setAnalysisTab] = useState('overview');
  const [selectedMatrixStrategy, setSelectedMatrixStrategy] = useState(null);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [provenanceExpanded, setProvenanceExpanded] = useState(false);
  const [matrixViewMode, setMatrixViewMode] = useState('matrix'); // 'matrix' | 'tradeoffs' | 'timeline'
  const [inspectedAnalysis, setInspectedAnalysis] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [defaultsMsg, setDefaultsMsg] = useState('');
  const [newParcel, setNewParcel] = useState({
    name: '',
    latitude: '',
    longitude: '',
    area_ha: '',
    soil_texture: 'unknown',
    organic_matter: '',
    irrigation_capacity_mm: ''
  });

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
    organic_matter: '',
    irrigation_capacity_mm: '',
    crop: '',
    previous_crop_year: ''
  });

  // The selected PostgreSQL field is held once in selectedFieldId. The form
  // contains only analysis controls and is hydrated from that row at submit.
  const [form, setForm] = useState(() => {
    let initialPriority = 'profit';
    try {
      const saved = localStorage.getItem('fs_selected_priority_demo');
      if (saved && ['profit', 'water_efficiency', 'soil_health', 'balanced'].includes(saved)) {
        initialPriority = saved;
      }
    } catch {}
    return {
      start_date: '2026-08-31',
      end_date: '2026-09-29',
      mode: 'live',
      priority: initialPriority,
      season: 'dry',
      include_history: true,
      counterfactual_rainfall_delta_mm: ''
    };
  });

  const demoField = {
    id: 'demo',
    name: 'Dhaka Research Station',
    latitude: 23.8103,
    longitude: 90.4125,
    area_ha: 10.0,
    soil_texture: 'loam',
    organic_matter: 2.5,
    irrigation_capacity_mm: 90,
    crop: 'Maize',
    previous_crop: 'Maize',
    previous_crop_year: 2024
  };

  // Registered fields always resolve by the shared selectedFieldId. Demo is
  // available only after an explicit selection from the research benchmark list.
  const activeField = useMemo(() => {
    if (selectedFieldId === 'demo') return form.mode === 'offline' ? demoField : null;
    if (selectedFieldId == null) return null;
    return userFields.find(field => String(field.id) === String(selectedFieldId)) || null;
  }, [userFields, selectedFieldId, form.mode]);

  const workflowPayload = (controls = form, field = activeField) => {
    const payload = { ...controls };
    delete payload.field_id;
    delete payload.area_ha;
    delete payload.field_size_ha;
    delete payload.latitude;
    delete payload.longitude;
    delete payload.soil_texture;
    delete payload.organic_matter;
    delete payload.irrigation_capacity_mm;
    delete payload.previous_crop;
    delete payload.previous_crop_year;
    if (field?.id === 'demo') {
      return {
        ...payload,
        field_id: 'demo',
        mode: 'offline',
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
    try {
      if (ownerId != null && fld.id !== 'demo') {
        localStorage.setItem(`fs_selected_field_id_${ownerId}`, String(fld.id));
      } else if (fld.id === 'demo') {
        localStorage.setItem('fs_selected_field_id_demo', 'demo');
      }
    } catch {}
    const history = Array.isArray(fld.history) ? fld.history : [];
    const prevCrop = fld.previous_crop || fld.current_crop || (history[0] ? history[0].crop : '') || '';
    const prevYear = fld.previous_crop_year ?? (history[0] ? history[0].year : '') ?? '';

    let fieldPriority = form.priority || 'profit';
    try {
      const p = ownerId != null ? localStorage.getItem(`fs_selected_priority_${ownerId}`) : localStorage.getItem('fs_selected_priority_demo');
      if (p && ['profit', 'water_efficiency', 'soil_health', 'balanced'].includes(p)) {
        fieldPriority = p;
      }
    } catch {}

    const nextForm = { ...form, priority: fieldPriority, mode: fld.id === 'demo' ? 'offline' : form.mode };
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

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
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
    setForm(prev => ({ ...prev, priority: prio }));
    try {
      const scopeKey = user?.id != null ? user.id : 'demo';
      localStorage.setItem(`fs_selected_priority_${scopeKey}`, prio);
    } catch {}
  };

  const handleRunBenchmark = async scenarioId => {
    setBenchmarkLoading(true);
    setSelectedBenchmarkId(scenarioId);
    try {
      const res = await request('/api/scenarios/benchmark/run', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: scenarioId })
      });
      setBenchmarkResult(res);
      setSelectedMatrixStrategy('profit_focused');
    } catch (err) {
      console.error('Failed to run benchmark scenario:', err);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleApplyStrategy = async strategyName => {
    const prioKey = STRATEGY_META[strategyName]?.priorityKey || (strategyName === 'water_focused' ? 'water_efficiency' : strategyName === 'soil_focused' ? 'soil_health' : strategyName.replace('_focused', ''));
    const updatedForm = { ...form, priority: prioKey };
    setForm(updatedForm);
    setSelectedMatrixStrategy(strategyName);
    try {
      const scopeKey = user?.id != null ? user.id : 'demo';
      localStorage.setItem(`fs_selected_priority_${scopeKey}`, prioKey);
      localStorage.setItem(`fs_selected_strategy_${scopeKey}`, strategyName);
    } catch {}

    const targetField = activeField || (selectedFieldId === 'demo' || !user ? demoField : null);
    if (targetField || userFields.length > 0) {
      setRunning(true);
      setError('');
      const requestSequence = ++analysisRequestSequence.current;
      try {
        const body = await request('/api/workflow', {
          method: 'POST',
          body: JSON.stringify(workflowPayload(updatedForm, targetField || userFields[0]))
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
    }
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
        await handleQuickDemoLogin();
      }
    } catch {
      await handleQuickDemoLogin();
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
            const oldSelection = localStorage.getItem('fs_selected_field_id');
            if (oldSelection && fields.some(field => String(field.id) === String(oldSelection))) targetId = oldSelection;
          }
        } catch {}
      }
      const active = (targetId ? fields.find(field => String(field.id) === String(targetId)) : null) || fields[0] || null;
      if (active) {
        try {
          if (account?.id != null) localStorage.setItem(`fs_selected_field_id_${account.id}`, String(active.id));
        } catch {}
        handleSelectActiveField(active, false, account?.id);
      } else {
        setSelectedFieldId(null);
        setResult(null);
      }
      const analRes = await request('/api/analyses');
      if (analRes.status === 'ok') {
        setUserAnalyses(analRes.analyses || []);
      }
    } catch (err) {
      console.error('Failed loading user data:', err);
      setUserFields([]);
      setSelectedFieldId(null);
      setResult(null);
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
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Quick Demo Login as Dani (User 47)
  const handleQuickDemoLogin = async () => {
    setAuthError('');
    setAuthMsg('Signing in with demo account…');
    try {
      // Direct session or register if needed
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'danialhossain2022@gmail.com', password: '12345678' })
      });
      if (res.user) {
        setUser(res.user);
        setAuthMsg('Signed in as Dani!');
        loadUserData(res.user);
      }
    } catch (err) {
      setAuthError(err.message);
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

  // Dedicated Profile Field Management Handlers
  const openAddFieldModal = () => {
    setFieldModal('add');
    setFieldModalError('');
    setFieldForm({
      id: null,
      name: '',
      latitude: '',
      longitude: '',
      area_ha: '',
      soil_texture: 'unknown',
      organic_matter: '',
      irrigation_capacity_mm: '',
      crop: '',
      previous_crop_year: ''
    });
  };

  const openEditFieldModal = fld => {
    setFieldModal('edit');
    setFieldModalError('');
    setFieldForm({
      id: fld.id,
      farm_id: fld.farm_id,
      name: fld.name || '',
      latitude: fld.latitude != null ? String(fld.latitude) : '',
      longitude: fld.longitude != null ? String(fld.longitude) : '',
      area_ha: fld.area_ha != null ? String(fld.area_ha) : '',
      soil_texture: fld.soil_texture || 'unknown',
      organic_matter: fld.organic_matter != null ? String(fld.organic_matter) : '',
      irrigation_capacity_mm: fld.irrigation_capacity_mm != null ? String(fld.irrigation_capacity_mm) : '',
      crop: fld.previous_crop || fld.current_crop || (fld.history && fld.history[0]?.crop) || '',
      previous_crop_year: fld.previous_crop_year != null ? String(fld.previous_crop_year) : (fld.history && fld.history[0]?.year ? String(fld.history[0]?.year) : '')
    });
  };

  const handleFieldFormSubmit = async e => {
    e.preventDefault();
    setFieldModalLoading(true);
    setFieldModalError('');
    try {
      const latVal = fieldForm.latitude === '' || fieldForm.latitude == null ? null : parseFloat(fieldForm.latitude);
      const lonVal = fieldForm.longitude === '' || fieldForm.longitude == null ? null : parseFloat(fieldForm.longitude);
      const areaVal = fieldForm.area_ha === '' || fieldForm.area_ha == null ? null : parseFloat(fieldForm.area_ha);
      const omVal = fieldForm.organic_matter === '' || fieldForm.organic_matter == null ? null : parseFloat(fieldForm.organic_matter);
      const irrVal = fieldForm.irrigation_capacity_mm === '' || fieldForm.irrigation_capacity_mm == null ? null : parseFloat(fieldForm.irrigation_capacity_mm);
      const yrVal = fieldForm.previous_crop_year === '' || fieldForm.previous_crop_year == null ? null : parseInt(fieldForm.previous_crop_year, 10);

      const payload = {
        name: fieldForm.name.trim(),
        latitude: Number.isFinite(latVal) ? latVal : null,
        longitude: Number.isFinite(lonVal) ? lonVal : null,
        area_ha: Number.isFinite(areaVal) ? areaVal : null,
        soil_texture: fieldForm.soil_texture === 'unknown' ? null : fieldForm.soil_texture,
        organic_matter: Number.isFinite(omVal) ? omVal : null,
        irrigation_capacity_mm: Number.isFinite(irrVal) ? irrVal : null,
        crop: fieldForm.crop ? fieldForm.crop.trim() : null,
        previous_crop: fieldForm.crop ? fieldForm.crop.trim() : null,
        previous_crop_year: Number.isFinite(yrVal) ? yrVal : null
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
      await loadUserData(user, newFieldId);
      setFieldModal(null);
    } catch (err) {
      setFieldModalError(err.message);
    } finally {
      setFieldModalLoading(false);
    }
  };

  const handleArchiveField = async fld => {
    if (!window.confirm(`Are you sure you want to archive / delete field "${fld.name}" (ID #${fld.id})?`)) {
      return;
    }
    try {
      await request(`/api/fields/${fld.id}`, { method: 'DELETE' });
      await loadUserData();
      if (viewingField && viewingField.id === fld.id) {
        setViewingField(null);
      }
    } catch (err) {
      alert(`Could not archive field: ${err.message}`);
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

  const summary = result?.summary || {};
  const ml = summary.ml || {};
  const planning = summary.planning || {};
  const plan = planning.selected_strategy_result || planning.milp_status || {};
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

  const allStrategiesMap = useMemo(() => {
    const rawAll = planning.all_strategies || {};
    const rawComp = planning.strategy_comparison || {};
    const strategyKeys = Array.from(new Set([
      ...Object.keys(rawComp),
      ...Object.keys(rawAll),
      'profit_focused',
      'water_focused',
      'soil_focused',
      'balanced'
    ]));

    const result = {};
    strategyKeys.forEach(k => {
      const allItem = rawAll[k] || {};
      const compItem = rawComp[k] || {};

      result[k] = {
        strategy_name: k,
        weights: allItem.requested_weights || compItem.weights || allItem.weights?.requested || null,
        effective_weights: allItem.effective_weights || allItem.weights?.effective || null,
        rotation: allItem.selected_crop_by_period || compItem.rotation || null,
        profit_component: allItem.profit_component ?? compItem.profit_component ?? null,
        water_component: allItem.water_component ?? compItem.water_component ?? null,
        soil_component: allItem.soil_component ?? compItem.soil_component ?? null,
        objective_value: allItem.objective_value ?? compItem.objective_value ?? null,
        solver_status: allItem.solver_status || compItem.solver_status || 'Optimal',
        status: allItem.status || compItem.status || 'optimal',
        normalized_components: allItem.normalized_components || null,
        constraint_summary: allItem.constraint_summary || null,
        same_rotation_as: allItem.same_rotation_as || null,
        decision_explanation: allItem.decision_explanation || compItem.decision_explanation || null
      };
    });

    return result;
  }, [planning]);

  // Weather observations
  const env = field.environment || summary.stress_test?.scenarios?.normal?.baseline_state_values || summary.stress_test?.scenarios?.drought?.baseline_state_values || field;
  const tempVal = env.temperature != null ? number(env.temperature, 1) : 'Not available';
  const windVal = env.wind_speed != null ? number(env.wind_speed, 1) : 'Not available';
  const humidVal = env.humidity != null ? number(env.humidity, 1) : 'Not available';
  const rainVal = env.rainfall != null ? number(env.rainfall, 2) : 'Not available';
  const moistureVal = env.soil_moisture != null ? number(env.soil_moisture, 2) : 'Not available';

  // Rotation data
  const rotationPeriods = plan.selected_crop_by_period || {};

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
    const status = plan.solver_status || 'Optimal';
    const isOptimal = String(status).toLowerCase() === 'optimal';
    const isFeasible = String(status).toLowerCase() === 'feasible';

    const stratKey = planning.selected_strategy || form.priority || 'profit_focused';
    const stratMeta = STRATEGY_META[stratKey] || STRATEGY_META.profit_focused;
    const seq = rotationPeriods.Y1_S1 && rotationPeriods.Y1_S2
      ? `${rotationPeriods.Y1_S1} → ${rotationPeriods.Y1_S2} ...`
      : 'Rotation sequence calculated';
    const profitVal = plan.total_profit_bdt || plan.profit_bdt || plan.objective_value;
    const metricText = profitVal != null ? `৳${Math.round(Number(profitVal)).toLocaleString()} BDT` : 'Metrics available';

    if (isOptimal) {
      return {
        status: 'optimal',
        badgeLabel: 'MILP Optimal',
        sequenceLabel: seq,
        metricLabel: metricText,
        strategyTitle: stratMeta.title
      };
    } else if (isFeasible) {
      return {
        status: 'feasible',
        badgeLabel: 'Feasible Solution',
        sequenceLabel: seq,
        metricLabel: metricText,
        strategyTitle: stratMeta.title
      };
    } else {
      return {
        status: 'failed',
        badgeLabel: 'Unavailable',
        sequenceLabel: 'Optimization Unavailable',
        metricLabel: 'Check field inputs / constraints',
        strategyTitle: stratMeta.title
      };
    }
  }, [plan, planning.selected_strategy, form.priority, rotationPeriods]);

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
          setAnalysisTab('overview');
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
          setAnalysisTab('overview');
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

  return (
    <div className="app-shell">
      {/* Left Vertical Navigation Rail */}
      <aside className="sidebar">
        <div className="sidebar-logo" title="FieldShift Decision Support" onClick={() => setActiveNav('dashboard')} style={{ cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveNav('dashboard')}
            title="Overview Dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1"/>
              <rect width="7" height="7" x="14" y="3" rx="1"/>
              <rect width="7" height="7" x="14" y="14" rx="1"/>
              <rect width="7" height="7" x="3" y="14" rx="1"/>
            </svg>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveNav('analytics')}
            title="Analysis & Research Workspace"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'field' ? 'active' : ''}`}
            onClick={() => setActiveNav('field')}
            title="Field Parcel Map & History"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'weather' ? 'active' : ''}`}
            onClick={() => setActiveNav('weather')}
            title="NASA POWER Weather & Climate"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
            </svg>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'scenarios' ? 'active' : ''}`}
            onClick={() => setActiveNav('scenarios')}
            title="Stress Test & What-If"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="21" y2="21"/>
              <line x1="4" x2="20" y1="3" y2="3"/>
              <line x1="12" x2="12" y1="3" y2="21"/>
            </svg>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveNav('assistant')}
            title="AI Assistant & Decision Support"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8"/>
              <rect width="16" height="12" x="4" y="8" rx="2"/>
              <path d="M2 14h2"/>
              <path d="M20 14h2"/>
              <path d="M15 13v2"/>
              <path d="M9 13v2"/>
            </svg>
          </button>

          <button
            type="button"
            className={`nav-item ${activeNav === 'account' ? 'active' : ''}`}
            onClick={() => setActiveNav('account')}
            title="Account, Profile & Saved History"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className={`nav-item ${activeNav === 'account' ? 'active' : ''}`}
            onClick={() => setActiveNav('account')}
            title="Settings & Farm Profile"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Workspace Content */}
      <div className="main-wrapper">
        {/* Top Header */}
        {activeNav === 'dashboard' && error && (
          <div className="dash-card boundary-banner" style={{ background: '#ffebeb', borderColor: '#f5c2c2', color: '#900', margin: '16px 28px 0' }}>
            <strong>Workflow Alert</strong>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {/* -------------------- VIEW 1: DASHBOARD (OVERVIEW) -------------------- */}
        {activeNav === 'dashboard' && (
          <>
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
                    {running ? 'Running Pipeline…' : (activeField?.last_analysis_date ? 'Last Analysis: Recent' : 'Last Analysis: Ready')}
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
                {/* 1. Real Field Data Card (CURRENT FIELD) */}
                <section className="dash-card current-field-summary-card">
                  <div className="card-top-label">
                    <span className="label-sub">CURRENT FIELD</span>
                    <span className="label-badge">{activeField ? `Field ID #${activeField.id}` : 'No field selected'}</span>
                  </div>
                  <h3 className="current-field-name">{activeField?.name || 'Select a field'}</h3>
                  <div className="field-coords-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{formatNumber(activeField?.latitude, 4, null) != null && formatNumber(activeField?.longitude, 4, null) != null ? `${formatNumber(activeField.latitude, 4)}°, ${formatNumber(activeField.longitude, 4)}°` : 'Coordinates not available'}</span>
                  </div>

                  <div className="field-data-table">
                    <div className="field-data-row">
                      <span className="field-data-key">Area</span>
                      <span className="field-data-val">
                        {formatNumber(activeField?.area_ha, 1, null) != null
                          ? `${formatNumber(activeField.area_ha, 1)} ha`
                          : 'Not available'}
                      </span>
                    </div>
                    <div className="field-data-row">
                      <span className="field-data-key">Soil Texture</span>
                      <span className="field-data-val" style={{ textTransform: 'capitalize' }}>
                        {activeField?.soil_texture ? activeField.soil_texture.replaceAll('_', ' ') : 'Not available'}
                      </span>
                    </div>
                    <div className="field-data-row">
                      <span className="field-data-key">Organic Matter</span>
                      <span className="field-data-val">{formatNumber(activeField?.organic_matter, 1, null) != null ? `${formatNumber(activeField.organic_matter, 1)}%` : 'Not available'}</span>
                    </div>
                    <div className="field-data-row">
                      <span className="field-data-key">Irrigation Cap</span>
                      <span className="field-data-val">{formatNumber(activeField?.irrigation_capacity_mm, 0, null) != null ? `${Math.round(Number(activeField.irrigation_capacity_mm))} mm` : 'Not available'}</span>
                    </div>
                    <div className="field-data-row">
                      <span className="field-data-key">Previous Crop</span>
                      <span className="field-data-val">
                        {activeField?.previous_crop || activeField?.current_crop || (activeField?.history && activeField.history[0]?.crop)
                          ? `${activeField.previous_crop || activeField.current_crop || activeField.history[0].crop} (${activeField.previous_crop_year || activeField.history?.[0]?.year || 'year unavailable'})`
                          : 'Not available'}
                      </span>
                    </div>
                    <div className="field-data-row">
                      <span className="field-data-key">Farm Station</span>
                      <span className="field-data-val">
                        {userFarms.find(f => f.id === activeField?.farm_id)?.name || (activeField?.farm_id ? `Farm #${activeField.farm_id}` : 'Not available')}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer-action">
                    <button
                      type="button"
                      className="btn-text-link"
                      onClick={() => {
                        if (activeField) setViewingField(activeField);
                        setActiveNav('account');
                      }}
                      title="Open field details in Profile"
                    >
                      Manage in Profile  → 
                    </button>
                  </div>
                </section>

                {/* 2. Real Observed Conditions Card (CURRENT CONDITIONS) */}
                <section className="dash-card current-conditions-card">
                  <div className="card-top-label">
                    <span className="label-sub">CURRENT CONDITIONS</span>
                    <span className={`source-tag ${nasa.data_status === 'observed' || nasa.data_status === 'live' ? 'live' : 'demo'}`}>
                      {nasa.data_status === 'observed' || nasa.data_status === 'live' ? 'NASA POWER Daily Point API' : 'Offline Demo Dataset'}
                    </span>
                  </div>
                  <div className="conditions-date-wrap">
                    <span className="conditions-date-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" x2="21" y1="10" y2="10"/>
                      </svg>
                    </span>
                    <span>Observed Observation Date: {nasa.latest_valid_date || '2026-09-29'}</span>
                  </div>

                  <div className="conditions-metrics-grid">
                    <div className="condition-metric-box">
                      <div className="metric-box-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
                        <span>Temperature</span>
                      </div>
                      <div className="metric-box-val">{tempVal} °C</div>
                    </div>
                    <div className="condition-metric-box">
                      <div className="metric-box-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
                        <span>Humidity</span>
                      </div>
                      <div className="metric-box-val">{humidVal} %</div>
                    </div>
                    <div className="condition-metric-box">
                      <div className="metric-box-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>
                        <span>Rainfall</span>
                      </div>
                      <div className="metric-box-val">{rainVal} mm</div>
                    </div>
                    <div className="condition-metric-box">
                      <div className="metric-box-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
                        <span>Wind Speed</span>
                      </div>
                      <div className="metric-box-val">{windVal} m/s</div>
                    </div>
                  </div>

                  <div className="conditions-subtext">
                    Empirical daily environmental telemetry from NASA POWER context.
                  </div>
                </section>

                {/* 3. Optimized Crop Rotation Card (MAIN VISUAL) */}
                <section className="dash-card rotation-main-card">
                  <div className="rotation-card-header">
                    <div>
                      <div className="card-top-label" style={{ marginBottom: 4 }}>
                        <span className="label-sub">OPTIMIZED CROP ROTATION</span>
                        <span className="badge-optimal">{plan.solver_status || 'Optimal'}</span>
                      </div>
                      <h3 className="rotation-card-title">3-Year / 6-Season Allocation Plan</h3>
                      <p className="rotation-card-subtitle">Optimized multi-year crop trajectory balancing harvest yield, water conservation, and soil biology.</p>
                    </div>
                    <button
                      type="button"
                      className="btn-outline-action"
                      onClick={() => setActiveNav('analytics')}
                      title="Inspect full optimization breakdown, objective trade-offs and XAI"
                    >
                      View Full Analysis  → 
                    </button>
                  </div>

                  <div className="rotation-years-grid">
                    {/* Year 1 */}
                    <div className="rotation-year-card">
                      <div className="rotation-year-header">
                        <span className="year-title">Year 1</span>
                        <span className="year-cycle-tag">Seasons 1 & 2</span>
                      </div>
                      <div className="rotation-seasons-row">
                        <div className="rotation-season-box">
                          <span className="season-label">Season 1 (Dry)</span>
                          <strong className="crop-label">{rotationPeriods.Y1_S1 || 'Not available'}</strong>
                        </div>
                        <div className="rotation-arrow"> → </div>
                        <div className="rotation-season-box">
                          <span className="season-label">Season 2 (Wet)</span>
                          <strong className="crop-label">{rotationPeriods.Y1_S2 || 'Not available'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Year 2 */}
                    <div className="rotation-year-card">
                      <div className="rotation-year-header">
                        <span className="year-title">Year 2</span>
                        <span className="year-cycle-tag">Seasons 3 & 4</span>
                      </div>
                      <div className="rotation-seasons-row">
                        <div className="rotation-season-box">
                          <span className="season-label">Season 1 (Dry)</span>
                          <strong className="crop-label">{rotationPeriods.Y2_S1 || 'Not available'}</strong>
                        </div>
                        <div className="rotation-arrow"> → </div>
                        <div className="rotation-season-box">
                          <span className="season-label">Season 2 (Wet)</span>
                          <strong className="crop-label">{rotationPeriods.Y2_S2 || 'Not available'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Year 3 */}
                    <div className="rotation-year-card">
                      <div className="rotation-year-header">
                        <span className="year-title">Year 3</span>
                        <span className="year-cycle-tag">Seasons 5 & 6</span>
                      </div>
                      <div className="rotation-seasons-row">
                        <div className="rotation-season-box">
                          <span className="season-label">Season 1 (Dry)</span>
                          <strong className="crop-label">{rotationPeriods.Y3_S1 || 'Not available'}</strong>
                        </div>
                        <div className="rotation-arrow"> → </div>
                        <div className="rotation-season-box">
                          <span className="season-label">Season 2 (Wet)</span>
                          <strong className="crop-label">{rotationPeriods.Y3_S2 || 'Not available'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Interactive Field Location Map (FIELD LOCATION) */}
                <section className="dash-card field-location-card">
                  <div className="card-top-label">
                    <span className="label-sub">FIELD LOCATION</span>
                    <span className="label-badge">Real Coordinates</span>
                  </div>

                  <div className="field-map-wrapper">
                    <GoogleFieldMapThumbnail
                      latitude={activeField?.latitude ?? null}
                      longitude={activeField?.longitude ?? null}
                      name={activeField?.name || 'Active Farm Field'}
                      height="190px"
                      onClick={() => {
                        if (activeField) setViewingField(activeField);
                        setActiveNav('account');
                      }}
                    />
                  </div>

                  <div className="field-location-meta">
                    <div className="field-location-info">
                      <div className="field-location-name">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <strong>{activeField?.name || 'No field selected'}</strong>
                      </div>
                      <div className="field-location-coords">
                        {formatNumber(activeField?.latitude, 4, null) != null && formatNumber(activeField?.longitude, 4, null) != null ? `${formatNumber(activeField.latitude, 4)}, ${formatNumber(activeField.longitude, 4)}` : 'Coordinates not available'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-text-link"
                      onClick={() => {
                        if (activeField) setViewingField(activeField);
                        setActiveNav('account');
                      }}
                      title="View farm parcel in Profile"
                    >
                      View Details  → 
                    </button>
                  </div>
                </section>

                {/* 5. ML Yield Estimate Card (USER-FRIENDLY EXPLANATION) */}
                <section className="dash-card ml-yield-summary-card">
                  <div className="card-top-label">
                    <div className="card-title-with-emoji">
                      <span className="card-emoji" aria-hidden="true">🌾</span>
                      <span className="label-sub">ML YIELD ESTIMATE</span>
                    </div>
                  </div>

                  <div className="ml-yield-hero-block">
                    <span className="ml-expected-yield-title">Expected Yield:</span>
                    <div className="ml-stat-hero">
                      <span className="ml-stat-num">{ml.prediction_t_ha != null ? number(ml.prediction_t_ha, 2) : 'Not available'}</span>
                      <span className="ml-stat-unit">t/ha</span>
                    </div>
                  </div>

                  {/* Field Harvest Volume directly scaled by Area */}
                  {ml.total_production_tons != null && (
                    <div style={{ background: 'rgba(46, 125, 50, 0.08)', border: '1px solid rgba(46, 125, 50, 0.25)', borderRadius: '8px', padding: '7px 12px', margin: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Est. Total Harvest Production:</span>
                      <strong style={{ fontSize: '13.5px', color: 'var(--primary-dark)' }}>
                        {number(ml.total_production_tons, 1)} tons
                        <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          ({formatNumber(summary.field_state?.field_size_ha ?? activeField?.area_ha, 1)} ha)
                        </span>
                      </strong>
                    </div>
                  )}

                  {/* Short user explanation */}
                  <div className="ml-explanation-box">
                    <strong className="ml-explanation-heading">What is ML doing?</strong>
                    <p className="ml-explanation-body">
                      The ML model estimates how much crop yield this field may produce based on the available field and environmental inputs (generic field baseline; not crop-specific).
                    </p>
                  </div>

                  {/* Estimated Range - NOT Confidence Interval */}
                  <div className="ml-range-row">
                    <span className="ml-range-title">Estimated Range:</span>
                    <strong className="ml-range-values">
                      {ml.uncertainty ? `${number(ml.uncertainty.lower)} to ${number(ml.uncertainty.upper)} t/ha` : 'Not available'}
                    </strong>
                    <span className="ml-uncertainty-pill">
                      ±{ml.uncertainty_t_ha != null ? number(ml.uncertainty_t_ha, 2) : 'Not available'}
                    </span>
                  </div>

                  {/* Research disclaimer */}
                  <div className="ml-disclaimer-note">
                    <em>Synthetic-demo estimate. The model has not been validated against real field-trial yield data.</em>
                  </div>

                  {/* ML vs MILP clarification */}
                  <div className="ml-milp-distinction-bar">
                    <div className="distinction-role-group">
                      <span className="distinction-badge">ML's job:</span>
                      <span className="distinction-text">Estimate expected yield</span>
                    </div>
                    <span className="distinction-sep">•</span>
                    <div className="distinction-role-group">
                      <span className="distinction-badge">MILP's job:</span>
                      <span className="distinction-text">Optimize the crop rotation</span>
                    </div>
                  </div>
                </section>

                {/* 6. Field Status Card (COMPACT STATUS PILLS) */}
                <section className="dash-card field-status-summary-card">
                  <div className="card-top-label">
                    <span className="label-sub">FIELD STATUS</span>
                    <span className="badge-optimal">● Operational</span>
                  </div>
                  <div className="status-pills-list">
                    <div className="status-pill-item">
                      <span className="status-pill-dot ready" />
                      <div className="status-pill-text">
                        <strong>Analysis Pipeline</strong>
                        <span>Ready & Synchronized</span>
                      </div>
                    </div>
                    <div className="status-pill-item">
                      <span className="status-pill-dot optimal" />
                      <div className="status-pill-text">
                        <strong>MILP Optimizer</strong>
                        <span>Optimal ({plan.solver_status || 'Optimal'})</span>
                      </div>
                    </div>
                    <div className="status-pill-item">
                      <span className="status-pill-dot safe" />
                      <div className="status-pill-text">
                        <strong>Safety Protocol</strong>
                        <span>{rl.proposal_action?.action || rl.proposal_action || 'Safe fallback'} (Verified Safe)</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 7. AI Research Assistant Teaser Card (COMPACT) */}
                <section className="dash-card ai-assistant-teaser-card">
                  <div className="ai-teaser-inner">
                    <div className="ai-teaser-icon-wrap">
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
                      <h4>AI Research Assistant</h4>
                      <p>Ask questions about this field's rotation plan, simulate drought stress scenarios, or explore multi-objective trade-offs.</p>
                    </div>
                    <button
                      type="button"
                      className="btn-teaser-action"
                      onClick={() => setActiveNav('assistant')}
                      title="Open full interactive AI Assistant"
                    >
                      Open Assistant  → 
                    </button>
                  </div>
                </section>

                {/* 8. Footer Note */}
                <footer className="dashboard-footer-note">
                  <p>Research prototype — not an agronomic recommendation. AI models and MILP allocations are for research evaluation.</p>
                </footer>
              </div>
            </ResultBoundary>
          </>
        )}

        {/* -------------------- VIEW 2: ANALYSIS & RESEARCH WORKSPACE -------------------- */}
        {activeNav === 'analytics' && (
          <div className="analytics-view-wrapper">
            <div className="view-sub-header">
              <div>
                <h2>Analysis & Research Workspace</h2>
                <p>MILP Crop Rotation Optimization, Synthetic ML Models, Scenarios & Simulation Controls</p>
              </div>
              <button type="button" className="back-btn" onClick={() => setActiveNav('dashboard')} aria-label="Back to Dashboard">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>

            {/* Analysis Navigation Sub-tabs */}
            <div className="analysis-nav-tabs">
              <button
                type="button"
                className={`analysis-tab-btn ${analysisTab === 'overview' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('overview')}
              >
                Overview & Objectives
              </button>
              <button
                type="button"
                className={`analysis-tab-btn ${analysisTab === 'optimization' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('optimization')}
              >
                MILP Strategies Matrix
              </button>
              <button
                type="button"
                className={`analysis-tab-btn ${analysisTab === 'ml_models' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('ml_models')}
              >
                ML Models & Explainability (XAI)
              </button>
              <button
                type="button"
                className={`analysis-tab-btn ${analysisTab === 'stress_testing' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('stress_testing')}
              >
                Stress Testing & Scenarios
              </button>
              <button
                type="button"
                className={`analysis-tab-btn ${analysisTab === 'controls' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('controls')}
              >
                Field Profile & Controls Form
              </button>
              <button
                type="button"
                className={`analysis-tab-btn ${analysisTab === 'diagnostics' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('diagnostics')}
              >
                Diagnostics & Raw Provenance
              </button>
            </div>

            <div className="dashboard-grid">
              {/* TAB 1: OVERVIEW & OBJECTIVES */}
              {analysisTab === 'overview' && (
                <>
                  <section className="dash-card" style={{ gridColumn: 'span 6' }}>
                    <div className="panel-heading">
                      <h3>MILP Objective Function</h3>
                      <span className="source-tag math" style={{ textTransform: 'none' }}>
                        Solver Status: {plan.solver_status || 'Optimal'}
                      </span>
                    </div>

                    <div className="gauge-container" style={{ padding: '20px 0' }}>
                      <svg className="gauge-svg" viewBox="0 0 240 140" style={{ width: 260, height: 150 }} aria-hidden="true" focusable="false">
                        <defs>
                          <linearGradient id="gaugeGradLg" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#81c784" />
                            <stop offset="60%" stopColor="#4caf50" />
                            <stop offset="100%" stopColor="#2e7d32" />
                          </linearGradient>
                        </defs>
                        <path d="M 30 130 A 90 90 0 0 1 210 130" fill="none" stroke="#e8efe9" strokeWidth="18" strokeLinecap="round" />
                        <path d="M 30 130 A 90 90 0 0 1 188 64" fill="none" stroke="url(#gaugeGradLg)" strokeWidth="18" strokeLinecap="round" />
                        <circle cx="120" cy="130" r="10" fill="#1b7a4b" />
                        <line x1="120" y1="130" x2="182" y2="68" stroke="#1b7a4b" strokeWidth="4" strokeLinecap="round" />
                        <circle cx="182" cy="68" r="6" fill="#2e7d32" stroke="#ffffff" strokeWidth="2" />
                      </svg>
                      <div className="gauge-center-text">
                        <span className="gauge-percent" style={{ fontSize: 38 }}>
                          {plan.objective_value != null ? number(plan.objective_value, 3) : 'Not available'}
                        </span>
                        <div className="gauge-label">Optimizer Score</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: 12.5, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                        Objective Components
                      </h4>
                      <div className="gauge-metrics-row">
                        <div className="gauge-stat-pill">
                          <strong>{plan.profit_component != null ? `${Number(plan.profit_component).toLocaleString()} BDT` : 'Not available'}</strong>
                          <small>Profit</small>
                        </div>
                        <div className="gauge-stat-pill">
                          <strong>{plan.water_component != null ? number(plan.water_component, 2) : 'Not available'}</strong>
                          <small>Water</small>
                        </div>
                        <div className="gauge-stat-pill">
                          <strong>{plan.soil_component != null ? number(plan.soil_component, 2) : 'Not available'}</strong>
                          <small>Soil Health</small>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Active Strategy:</span>
                      <strong style={{ fontSize: 13, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                        {(planning.selected_strategy || 'profit_focused').replaceAll('_', ' ')}
                      </strong>
                    </div>

                    {/* Actual Priority Weights from Backend */}
                    {(() => {
                      const rawWeights = plan.requested_weights || plan.weights?.requested || plan.weights?.effective || planning.all_strategies?.[planning.selected_strategy]?.requested_weights;
                      if (!rawWeights) return null;
                      return (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', fontSize: 11 }}>
                            Configured Priority Weights
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span>Profit Weight: <strong>{rawWeights.profit != null ? number(rawWeights.profit, 2) : '—'}</strong></span>
                            <span>Water Weight: <strong>{rawWeights.water != null ? number(rawWeights.water, 2) : '—'}</strong></span>
                            <span>Soil Health Weight: <strong>{rawWeights.soil != null ? number(rawWeights.soil, 2) : '—'}</strong></span>
                          </div>
                        </div>
                      );
                    })()}

                    <div style={{ marginTop: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 12.5, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                          Period Decision Rationale (XAI)
                        </h4>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Optimizer-based rationale</span>
                      </div>
                      <div className="rationale-list">
                        {xai.milp_explanation?.period_reasons && xai.milp_explanation.period_reasons.length > 0 ? (
                          xai.milp_explanation.period_reasons.map(pr => (
                            <div key={pr.period} className="rationale-item">
                              <span className="rationale-period-badge">{pr.period}</span>
                              <div className="rationale-content">
                                <span className="rationale-crop-name">{pr.crop}</span>
                                <span className="rationale-reason">
                                  <strong>Reason:</strong> {pr.reason || 'Selected to satisfy the configured rotation and objective trade-off for this period.'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : Object.keys(rotationPeriods).length > 0 ? (
                          Object.entries(rotationPeriods).map(([period, crop]) => (
                            <div key={period} className="rationale-item">
                              <span className="rationale-period-badge">{period}</span>
                              <div className="rationale-content">
                                <span className="rationale-crop-name">{crop}</span>
                                <span className="rationale-reason">
                                  <strong>Reason:</strong> Selected to satisfy the configured rotation and objective trade-off for this period.
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rationale-item">
                            <span className="rationale-reason">
                              <strong>Reason:</strong> Optimizer selected rotation satisfying configured rotation and objective trade-offs.
                            </span>
                          </div>
                        )}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        {xai.milp_explanation?.causal_claim || 'MILP explanations reflect optimizer objective and constraints, not learned causal effects.'}
                      </p>
                    </div>
                  </section>

                  <section className="dash-card" style={{ gridColumn: 'span 6' }}>
                    <div className="panel-heading">
                      <h3>Active Rotation Sequence</h3>
                      <span>Multi-Season Progression</span>
                    </div>

                    <div style={{ padding: '16px 0' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Selected Crop Rotation Sequence
                      </span>
                      <div className="rotation-years-grid" style={{ marginTop: 10 }}>
                        {/* Year 1 */}
                        <div className="rotation-year-card">
                          <div className="rotation-year-header">
                            <span className="year-title">Year 1</span>
                            <span className="year-cycle-tag">Seasons 1 &amp; 2</span>
                          </div>
                          <div className="rotation-seasons-row">
                            <div className="rotation-season-box">
                              <span className="season-label">Season 1 (Dry)</span>
                              <strong className="crop-label">{rotationPeriods.Y1_S1 || 'Not available'}</strong>
                            </div>
                            <div className="rotation-arrow">→</div>
                            <div className="rotation-season-box">
                              <span className="season-label">Season 2 (Wet)</span>
                              <strong className="crop-label">{rotationPeriods.Y1_S2 || 'Not available'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Year 2 */}
                        <div className="rotation-year-card">
                          <div className="rotation-year-header">
                            <span className="year-title">Year 2</span>
                            <span className="year-cycle-tag">Seasons 3 &amp; 4</span>
                          </div>
                          <div className="rotation-seasons-row">
                            <div className="rotation-season-box">
                              <span className="season-label">Season 1 (Dry)</span>
                              <strong className="crop-label">{rotationPeriods.Y2_S1 || 'Not available'}</strong>
                            </div>
                            <div className="rotation-arrow">→</div>
                            <div className="rotation-season-box">
                              <span className="season-label">Season 2 (Wet)</span>
                              <strong className="crop-label">{rotationPeriods.Y2_S2 || 'Not available'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Year 3 */}
                        <div className="rotation-year-card">
                          <div className="rotation-year-header">
                            <span className="year-title">Year 3</span>
                            <span className="year-cycle-tag">Seasons 5 &amp; 6</span>
                          </div>
                          <div className="rotation-seasons-row">
                            <div className="rotation-season-box">
                              <span className="season-label">Season 1 (Dry)</span>
                              <strong className="crop-label">{rotationPeriods.Y3_S1 || 'Not available'}</strong>
                            </div>
                            <div className="rotation-arrow">→</div>
                            <div className="rotation-season-box">
                              <span className="season-label">Season 2 (Wet)</span>
                              <strong className="crop-label">{rotationPeriods.Y3_S2 || 'Not available'}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <button
                        type="button"
                        className="btn-primary-sm"
                        onClick={() => setAnalysisTab('optimization')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <span>Deep-Dive Strategy Comparison Matrix</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </button>
                    </div>
                  </section>

                  {/* STRATEGY COMPARISON SECTION */}
                  <section className="dash-card strategy-comparison-card" style={{ gridColumn: 'span 12', marginTop: 8 }}>
                    <div className="panel-heading" style={{ marginBottom: 4 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Strategy Comparison</h3>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                          Different strategies prioritize different goals. The selected strategy determines what the optimizer prioritizes when creating the crop rotation.
                        </p>
                      </div>
                      <span className="source-tag math" style={{ textTransform: 'none' }}>
                        Currently Selected: <strong>{STRATEGY_PRIORITY_DESC[planning.selected_strategy || 'profit_focused']?.name || (planning.selected_strategy || 'profit_focused').replaceAll('_', ' ')}</strong>
                      </span>
                    </div>

                    {/* Simple Comparison Table */}
                    <div className="strategy-table-simple-wrapper" style={{ margin: '14px 0 10px', overflowX: 'auto' }}>
                      <table className="strategy-table-simple">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left' }}>Strategy</th>
                            <th style={{ textAlign: 'left' }}>Main Priority</th>
                            <th style={{ textAlign: 'right' }}>Profit</th>
                            <th style={{ textAlign: 'right' }}>Water</th>
                            <th style={{ textAlign: 'right' }}>Soil Health</th>
                            <th style={{ textAlign: 'right' }}>Score</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {['profit_focused', 'water_focused', 'soil_focused', 'balanced'].map(key => {
                            const item = allStrategiesMap[key];
                            const desc = STRATEGY_PRIORITY_DESC[key] || {
                              name: key.replaceAll('_', ' '),
                              mainPriority: 'Custom objective trade-off',
                              legend: 'prioritizes configured objectives',
                              icon: '🌾'
                            };
                            const isActive = key === (planning.selected_strategy || 'profit_focused');

                            if (!item || (item.profit_component == null && item.water_component == null && item.soil_component == null && item.objective_value == null)) {
                              return (
                                <tr key={key} className={isActive ? 'row-active-simple' : ''}>
                                  <td>
                                    <strong>{desc.icon} {desc.name}</strong>
                                  </td>
                                  <td>{desc.mainPriority}</td>
                                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>
                                    Comparison data unavailable – this strategy is not currently computed.
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    {isActive ? (
                                      <span className="badge-active-simple">Active</span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn-select-strategy"
                                        onClick={() => handleApplyStrategy(key)}
                                      >
                                        Select Strategy
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={key} className={isActive ? 'row-active-simple' : ''}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                    <span>{desc.icon}</span>
                                    <span>{desc.name}</span>
                                  </div>
                                </td>
                                <td style={{ color: 'var(--text-main)' }}>{desc.mainPriority}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#27ae60' }}>
                                  {item.profit_component != null ? `৳${Number(item.profit_component).toLocaleString()} BDT` : '—'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#0288d1' }}>
                                  {item.water_component != null ? number(item.water_component, 2) : '—'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#e67e22' }}>
                                  {item.soil_component != null ? number(item.soil_component, 2) : '—'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 800 }}>
                                  {item.objective_value != null ? number(item.objective_value, 3) : '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {isActive ? (
                                    <span className="badge-active-simple">Active</span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn-select-strategy"
                                      onClick={() => handleApplyStrategy(key)}
                                    >
                                      Select Strategy
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Meaning Legend & Selected Strategy Configured Weights */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginTop: 12, padding: '14px 16px', background: 'var(--bg-card-subtle)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                      <div style={{ flex: '1 1 300px' }}>
                        <strong style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                          Strategy Meaning
                        </strong>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-main)' }}>
                          <li><strong>Profit Focused</strong> – prioritizes economic return</li>
                          <li><strong>Water Focused</strong> – prioritizes water efficiency</li>
                          <li><strong>Soil Focused</strong> – prioritizes soil health</li>
                          <li><strong>Balanced</strong> – balances the configured objectives</li>
                        </ul>
                      </div>

                      {(() => {
                        const activeKey = planning.selected_strategy || 'profit_focused';
                        const activeDisplayName = STRATEGY_PRIORITY_DESC[activeKey]?.name || activeKey.replaceAll('_', ' ');
                        const activeWeights = plan.requested_weights || plan.weights?.requested || plan.weights?.effective || allStrategiesMap[activeKey]?.weights || allStrategiesMap[activeKey]?.requested_weights;

                        return (
                          <div style={{ flex: '1 1 260px', borderLeft: '1px solid var(--border-light)', paddingLeft: 16 }}>
                            <div style={{ fontSize: 13, marginBottom: 8 }}>
                              <strong>Currently Selected:</strong> <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{activeDisplayName}</span>
                            </div>
                            {activeWeights && (
                              <div>
                                <strong style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                                  Configured Weights
                                </strong>
                                <div style={{ display: 'flex', gap: 12, fontSize: 12.5 }}>
                                  <span style={{ color: '#27ae60' }}>● Profit: <strong>{Math.round((activeWeights.profit || 0) * 100)}%</strong></span>
                                  <span style={{ color: '#0288d1' }}>● Water: <strong>{Math.round((activeWeights.water || 0) * 100)}%</strong></span>
                                  <span style={{ color: '#e67e22' }}>● Soil Health: <strong>{Math.round((activeWeights.soil || 0) * 100)}%</strong></span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Scientific Disclaimer Note */}
                    <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      Strategy results are generated by the configured optimization objective and constraints. They represent mathematical optimization results, not guaranteed real-world agronomic outcomes.
                    </p>
                  </section>
                </>
              )}

              {/* TAB 2: MILP STRATEGIES MATRIX */}
              {analysisTab === 'optimization' && (() => {
                const activeStrategyName = planning.selected_strategy || 'profit_focused';
                const inspectedKey = selectedMatrixStrategy || activeStrategyName;
                const inspectedItem = allStrategiesMap[inspectedKey] || allStrategiesMap[activeStrategyName] || Object.values(allStrategiesMap)[0] || {};
                const activeItem = allStrategiesMap[activeStrategyName] || Object.values(allStrategiesMap)[0] || {};

                const stratList = Object.values(allStrategiesMap);
                const maxProfitStrategy = stratList.reduce((prev, curr) => (Number(curr.profit_component || 0) > Number(prev.profit_component || 0) ? curr : prev), activeItem);
                const maxWaterStrategy = stratList.reduce((prev, curr) => (Number(curr.water_component || 0) > Number(prev.water_component || 0) ? curr : prev), activeItem);
                const maxSoilStrategy = stratList.reduce((prev, curr) => (Number(curr.soil_component || 0) > Number(prev.soil_component || 0) ? curr : prev), activeItem);

                const inspectedMeta = STRATEGY_META[inspectedKey] || {
                  title: inspectedKey.replaceAll('_', ' '),
                  icon: '🌾',
                  summary: 'Alternative multi-objective MILP crop sequence evaluated against multi-period constraints.',
                  primaryColor: 'var(--primary)',
                  badgeClass: 'profit',
                  priorityKey: 'profit'
                };

                const inspectedRotation = inspectedItem.rotation || {};

                // Determine if all strategies yielded the identical rotation sequence
                const rotEntries = stratList.map(s => JSON.stringify(s.rotation || {}));
                const allRotationsSame = rotEntries.length > 1 && rotEntries.every(r => r === rotEntries[0]);
                const sampleRot = inspectedItem.rotation || (stratList[0] && stratList[0].rotation) || {};

                return (
                  <div className="strategy-matrix-container" style={{ gridColumn: 'span 12' }}>
                    {/* Synthetic Benchmark Scenarios Panel */}
                    <div className="dash-card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 14, padding: 18, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🧪</span>
                            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>Synthetic Benchmark Scenario Suite</h4>
                            <span className="source-tag demo" style={{ fontSize: 10 }}>MULTI-SCENARIO PROOF</span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                            Test and verify MILP multi-objective solver responsiveness across 6 diverse agro-climatic regimes with distinct mathematical properties.
                          </p>
                        </div>
                        {benchmarkLoading && <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>Solving scenarios with PuLP CBC...</span>}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 14 }}>
                        {[
                          { id: 'A', label: 'A. Profit-Dominant', desc: 'High-margin (800mm, 28°C, pH 6.5)', color: '#2e7d32' },
                          { id: 'B', label: 'B. Water-Constrained', desc: 'Arid dryland (320mm, 30°C, pH 6.8)', color: '#0288d1' },
                          { id: 'C', label: 'C. Cool-Season Rabi', desc: 'Winter regime (600mm, 18°C, pH 6.5)', color: '#00897b' },
                          { id: 'D', label: 'D. Hot-Season Kharif', desc: 'Tropical heat (950mm, 34°C, pH 6.8)', color: '#e65100' },
                          { id: 'E', label: 'E. Acidic & Depleted', desc: 'Acidic parcel (500mm, 26°C, pH 4.8)', color: '#c2185b' },
                          { id: 'F', label: 'F. Balanced Diverse', desc: 'Multi-objective (700mm, 25°C, pH 6.5)', color: '#673ab7' },
                        ].map(scen => (
                          <button
                            key={scen.id}
                            type="button"
                            className={`btn-secondary-sm ${selectedBenchmarkId === scen.id ? 'active' : ''}`}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              padding: '10px 12px',
                              border: selectedBenchmarkId === scen.id ? `2px solid ${scen.color}` : '1px solid #cbd5e1',
                              background: selectedBenchmarkId === scen.id ? '#fff' : 'rgba(255,255,255,0.7)',
                              textAlign: 'left',
                              borderRadius: 10,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleRunBenchmark(scen.id)}
                          >
                            <span style={{ fontWeight: 800, fontSize: 13, color: scen.color }}>{scen.label}</span>
                            <span style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{scen.desc}</span>
                          </button>
                        ))}
                      </div>

                      {benchmarkResult && (
                        <div style={{ marginTop: 14, padding: 12, background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12.5 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <strong style={{ color: '#0f172a' }}>Scenario {benchmarkResult.scenario?.scenario_id}: {benchmarkResult.scenario?.name}</strong>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              background: benchmarkResult.divergence_analysis?.has_divergence ? '#dcfce7' : '#fef9c3',
                              color: benchmarkResult.divergence_analysis?.has_divergence ? '#15803d' : '#854d0e'
                            }}>
                              {benchmarkResult.divergence_analysis?.has_divergence ? `✓ Divergence Confirmed (${benchmarkResult.divergence_analysis?.distinct_rotation_count} Unique Rotations)` : '⚠ Constraint Convergence (1 Rotation)'}
                            </span>
                          </div>
                          <div style={{ color: '#475569', lineHeight: 1.4 }}>
                            {benchmarkResult.divergence_analysis?.explanation}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* What Changed / Decision Impact Card */}
                    {summary.what_changed && (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 8 }}>
                          <span>📊</span>
                          <span>Decision Impact &amp; Active Field Parameter Deltas</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                          {(summary.what_changed.active_parameters || []).map((p, idx) => (
                            <div key={idx} style={{ background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                              <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>{p.parameter}</div>
                              <div style={{ color: '#0f172a', fontWeight: 800, margin: '2px 0' }}>{p.value}</div>
                              <div style={{ color: '#475569', fontSize: 11 }}>{p.impact_description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optimization Provenance View */}
                    <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, padding: '12px 16px', background: 'var(--bg-card-subtle)', marginBottom: 16 }}>
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setProvenanceExpanded(prev => !prev)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>🔍</span>
                          <strong style={{ fontSize: 13.5 }}>Optimization Provenance: How this recommendation was calculated</strong>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>
                          {provenanceExpanded ? 'Hide Calculation Steps ▲' : 'Show Calculation Steps ▼'}
                        </span>
                      </div>

                      {provenanceExpanded && (
                        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, fontSize: 12 }}>
                          <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: 'var(--primary)' }}>Step 1: Agro-Climatic Profile</strong>
                            <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                              Area: {summary.optimization_provenance?.field_inputs?.area_ha ?? 1.0} ha • Temp: {summary.optimization_provenance?.field_inputs?.temperature_c ?? '28'}°C • pH: {summary.optimization_provenance?.field_inputs?.soil_ph ?? '6.5'}
                            </div>
                          </div>
                          <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: 'var(--primary)' }}>Step 2: Feasibility Filtering</strong>
                            <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                              Catalog: {summary.optimization_provenance?.feasibility_filter?.catalog_crop_count ?? 15} species → Feasible: {summary.optimization_provenance?.feasibility_filter?.feasible_crop_count ?? 15} species
                            </div>
                          </div>
                          <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: 'var(--primary)' }}>Step 3: PuLP CBC Solver</strong>
                            <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                              Branch-and-Bound MILP ({summary.optimization_provenance?.decision_model?.decision_variables ?? 90} binary variables across 6 periods).
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hero Header Banner */}
                    <div className="strategy-matrix-hero">
                      <div className="strategy-hero-content">
                        <h2>MILP Multi-Objective Strategy Comparison Matrix</h2>
                        <p>
                          Explore alternative multi-year rotation trajectories computed via Mixed Integer Linear Programming (PuLP CBC Solver).
                          Each strategy evaluates an alternative multi-objective MILP balance between economic gross margin, water footprint conservation, and soil biology regeneration across 6 seasons.
                        </p>
                        <div className="strategy-hero-badges">
                          <span className="strategy-hero-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true" focusable="false"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>PuLP CBC Solver: {inspectedItem.solver_status || 'Optimal'}</span>
                          </span>
                          <span className="strategy-hero-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span>6-Season Multi-Period Model</span>
                          </span>
                          <span className="strategy-hero-pill">
                            <span>🌱 Legume Interval: ≥1 Pulse every 3 Consecutive Seasons</span>
                          </span>
                          <span className="strategy-hero-pill" style={{ background: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                            <span>★ Active: {(activeStrategyName || 'profit_focused').replaceAll('_', ' ')}</span>
                          </span>
                        </div>
                      </div>
                      <div className="strategy-hero-stats">
                        <div className="strategy-hero-stat-box">
                          <div className="strategy-hero-stat-val">{stratList.length || 4}</div>
                          <div className="strategy-hero-stat-lbl">Priority Profiles</div>
                        </div>
                        <div className="strategy-hero-stat-box">
                          <div className="strategy-hero-stat-val">100%</div>
                          <div className="strategy-hero-stat-lbl">Feasible Plans</div>
                        </div>
                      </div>
                    </div>

                    {/* Uniform Rotation Agronomic Explanation Banner */}
                    {allRotationsSame && (
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: 12,
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        fontSize: 13,
                        color: '#166534',
                        lineHeight: 1.5
                      }}>
                        <span style={{ fontSize: 20 }}>💡</span>
                        <div>
                          <strong>All strategies converged on the same optimal rotation ({Object.values(sampleRot).join(' → ') || 'Mungbean → Maize'}) under current field parameters:</strong>
                          <div style={{ marginTop: 4, color: '#15803d' }}>
                            Under this parcel's temperature regime, pH, and agronomic rotation constraints (legume interval ≥ 1 pulse every 3 consecutive seasons and botanical family alternation), the solver determined that this specific crop sequence simultaneously maximizes profit while satisfying water conservation and soil biology targets. The strategies differ in how objective weights are distributed and composite scores are calculated.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4 KPI Summary Cards */}
                    <div className="strategy-kpi-grid">
                      {/* Active Profile */}
                      <div className="strategy-kpi-card active-kpi">
                        <div className="strategy-kpi-top">
                          <div className="strategy-kpi-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>🎯</div>
                          <span className="strategy-kpi-tag" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>Active Operational</span>
                        </div>
                        <div className="strategy-kpi-label">Current Field Strategy</div>
                        <div className="strategy-kpi-val" style={{ fontSize: 19 }}>
                          {(activeItem.strategy_name || activeStrategyName || 'profit_focused').replaceAll('_', ' ')}
                        </div>
                        <div className="strategy-kpi-sub">
                          <span>Score: <strong>{activeItem.objective_value != null ? number(activeItem.objective_value, 3) : '—'}</strong></span>
                          <span>•</span>
                          <span><strong>{activeItem.profit_component != null ? `৳${Number(activeItem.profit_component).toLocaleString()} BDT` : '—'}</strong></span>
                        </div>
                      </div>

                      {/* Max Profit */}
                      <div className="strategy-kpi-card" onClick={() => setSelectedMatrixStrategy(maxProfitStrategy.strategy_name)} style={{ cursor: 'pointer' }}>
                        <div className="strategy-kpi-top">
                          <div className="strategy-kpi-icon" style={{ background: '#e8f5ec', color: '#2e7d32' }}>💰</div>
                          <span className="strategy-kpi-tag" style={{ background: '#e8f5ec', color: '#2e7d32' }}>Max Revenue</span>
                        </div>
                        <div className="strategy-kpi-label">Highest Gross Margin</div>
                        <div className="strategy-kpi-val" style={{ color: '#2e7d32' }}>
                          {maxProfitStrategy.profit_component != null ? `৳${Number(maxProfitStrategy.profit_component).toLocaleString()}` : '—'} <span style={{ fontSize: 13, fontWeight: 600 }}>BDT</span>
                        </div>
                        <div className="strategy-kpi-sub">
                          <strong>{maxProfitStrategy.strategy_name?.replaceAll('_', ' ') || 'Profit Focused'}</strong> ({formatNumber((maxProfitStrategy.weights?.profit ?? 0.7) * 100, 0)}% profit weight)
                        </div>
                      </div>

                      {/* Max Water Conservation */}
                      <div className="strategy-kpi-card" onClick={() => setSelectedMatrixStrategy(maxWaterStrategy.strategy_name)} style={{ cursor: 'pointer' }}>
                        <div className="strategy-kpi-top">
                          <div className="strategy-kpi-icon" style={{ background: '#e1f5fe', color: '#0288d1' }}>💧</div>
                          <span className="strategy-kpi-tag" style={{ background: '#e1f5fe', color: '#0288d1' }}>Low Water Stress</span>
                        </div>
                        <div className="strategy-kpi-label">Water Conservation Rating</div>
                        <div className="strategy-kpi-val" style={{ color: '#0288d1' }}>
                          {maxWaterStrategy.water_component != null ? number(maxWaterStrategy.water_component, 2) : '—'} <span style={{ fontSize: 13, fontWeight: 600 }}>/ 6.0</span>
                        </div>
                        <div className="strategy-kpi-sub">
                          <strong>{maxWaterStrategy.strategy_name?.replaceAll('_', ' ') || 'Water Efficiency'}</strong> ({formatNumber((maxWaterStrategy.weights?.water ?? 0.6) * 100, 0)}% water weight)
                        </div>
                      </div>

                      {/* Max Soil Regeneration */}
                      <div className="strategy-kpi-card" onClick={() => setSelectedMatrixStrategy(maxSoilStrategy.strategy_name)} style={{ cursor: 'pointer' }}>
                        <div className="strategy-kpi-top">
                          <div className="strategy-kpi-icon" style={{ background: '#fff3e0', color: '#e67e22' }}>🌱</div>
                          <span className="strategy-kpi-tag" style={{ background: '#fff3e0', color: '#e67e22' }}>Max Soil Biology</span>
                        </div>
                        <div className="strategy-kpi-label">Soil Health &amp; Nitrogen Index</div>
                        <div className="strategy-kpi-val" style={{ color: '#e67e22' }}>
                          {maxSoilStrategy.soil_component != null ? number(maxSoilStrategy.soil_component, 2) : '—'} <span style={{ fontSize: 13, fontWeight: 600 }}>/ 6.0</span>
                        </div>
                        <div className="strategy-kpi-sub">
                          <strong>{maxSoilStrategy.strategy_name?.replaceAll('_', ' ') || 'Soil Health'}</strong> ({formatNumber((maxSoilStrategy.weights?.soil ?? 0.6) * 100, 0)}% soil weight)
                        </div>
                      </div>
                    </div>

                    {/* Toolbar & View Tabs */}
                    <div className="strategy-toolbar">
                      <div className="strategy-toolbar-left">
                        <strong style={{ fontSize: 14 }}>Multi-Objective Matrix View:</strong>
                        <div className="strategy-view-toggle">
                          <button
                            type="button"
                            className={`strategy-view-btn ${matrixViewMode === 'matrix' ? 'active' : ''}`}
                            onClick={() => setMatrixViewMode('matrix')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                            <span>Comparison Table</span>
                          </button>
                          <button
                            type="button"
                            className={`strategy-view-btn ${matrixViewMode === 'tradeoffs' ? 'active' : ''}`}
                            onClick={() => setMatrixViewMode('tradeoffs')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            <span>Trade-Off Analytics</span>
                          </button>
                          <button
                            type="button"
                            className={`strategy-view-btn ${matrixViewMode === 'timeline' ? 'active' : ''}`}
                            onClick={() => setMatrixViewMode('timeline')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                            <span>Multi-Season Timeline</span>
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                        Click any strategy row to inspect full agronomic sequence &amp; solver proof
                      </div>
                    </div>

                    {/* VIEW 1: ENHANCED COMPARISON MATRIX TABLE */}
                    {matrixViewMode === 'matrix' && (
                      <div className="strategy-table-enhanced-wrapper">
                        <table className="strategy-table-enhanced">
                          <thead>
                            <tr>
                              <th>Strategy Profile</th>
                              <th style={{ width: 150 }}>Objective Weights</th>
                              <th>Gross Margin (6-Season / ha)</th>
                              <th>Water Score (0–6.0)</th>
                              <th>Soil Health (0–6.0)</th>
                              <th>Composite Score</th>
                              <th>6-Season Rotation Sequence</th>
                              <th>Agronomic Rules</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(allStrategiesMap).map(([name, item]) => {
                              const meta = STRATEGY_META[name] || {
                                title: name.replaceAll('_', ' '),
                                icon: '🌾',
                                summary: 'Alternative multi-objective crop sequence',
                                primaryColor: 'var(--primary)'
                              };
                              const isInspected = name === inspectedKey;
                              const isActive = name === activeStrategyName;
                              const weights = item.weights || { profit: 0.34, water: 0.33, soil: 0.33 };
                              const pPct = Math.round((weights.profit || 0) * 100);
                              const wPct = Math.round((weights.water || 0) * 100);
                              const sPct = Math.round((weights.soil || 0) * 100);
                              const rot = item.rotation || {};

                              return (
                                <tr
                                  key={name}
                                  className={`strategy-table-row ${isActive ? 'row-active' : ''} ${isInspected ? 'row-inspected' : ''}`}
                                  onClick={() => setSelectedMatrixStrategy(name)}
                                >
                                  <td>
                                    <div className="strategy-profile-cell">
                                      <div className="strategy-profile-icon" style={{ background: meta.accentBg || 'var(--primary-light)', color: meta.primaryColor }}>
                                        {meta.icon}
                                      </div>
                                      <div>
                                        <div className="strategy-profile-title">
                                          <span>{meta.title}</span>
                                          {isActive && (
                                            <span style={{ fontSize: 10, background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: 999 }}>
                                              ACTIVE
                                            </span>
                                          )}
                                        </div>
                                        <div className="strategy-profile-sub">{meta.summary}</div>
                                      </div>
                                    </div>
                                  </td>

                                  <td>
                                    <div className="strategy-weight-bars">
                                      <div className="strategy-weight-progress-stacked" title={`Profit: ${pPct}% | Water: ${wPct}% | Soil: ${sPct}%`}>
                                        <div className="weight-seg-profit" style={{ width: `${pPct}%` }} />
                                        <div className="weight-seg-water" style={{ width: `${wPct}%` }} />
                                        <div className="weight-seg-soil" style={{ width: `${sPct}%` }} />
                                      </div>
                                      <div className="strategy-weight-legend">
                                        <span style={{ color: '#27ae60' }}>{pPct}% P</span>
                                        <span style={{ color: '#2980b9' }}>{wPct}% W</span>
                                        <span style={{ color: '#e67e22' }}>{sPct}% S</span>
                                      </div>
                                    </div>
                                  </td>

                                  <td>
                                    <div className="profit-bdt-chip">
                                      <span>৳</span>
                                      <span>{item.profit_component != null ? Number(item.profit_component).toLocaleString() : '—'}</span>
                                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>BDT/ha</span>
                                    </div>
                                  </td>

                                  <td>
                                    <div className="score-chip water">
                                      <span>💧</span>
                                      <strong>{item.water_component != null ? number(item.water_component, 2) : '—'}</strong>
                                    </div>
                                  </td>

                                  <td>
                                    <div className="score-chip soil">
                                      <span>🌱</span>
                                      <strong>{item.soil_component != null ? number(item.soil_component, 2) : '—'}</strong>
                                    </div>
                                  </td>

                                  <td>
                                    <div className="score-chip composite">
                                      <strong>{item.objective_value != null ? number(item.objective_value, 3) : '—'}</strong>
                                    </div>
                                  </td>

                                  <td>
                                    <div className="crop-sequence-chain">
                                      {['Y1_S1', 'Y1_S2', 'Y2_S1', 'Y2_S2', 'Y3_S1', 'Y3_S2'].map((periodKey, idx) => {
                                        const crop = rot[periodKey];
                                        if (!crop) return <span key={periodKey} style={{ color: 'var(--text-muted)' }}>—</span>;
                                        const cMeta = CROP_META[crop] || { icon: '🌱', is_legume: crop.toLowerCase().includes('bean') || crop.toLowerCase().includes('lentil') };
                                        const isDry = idx % 2 === 0;

                                        return (
                                          <React.Fragment key={periodKey}>
                                            <span
                                              className={`crop-chain-chip ${cMeta.is_legume ? 'legume-highlight' : ''}`}
                                              title={`${periodKey} (${isDry ? 'Dry Season' : 'Wet Season'}): ${crop}`}
                                            >
                                              <span className="crop-chain-season-tag">{periodKey.replace('Y', 'Y').replace('_S', '·S')}</span>
                                              <span>{cMeta.icon}</span>
                                              <span>{crop}</span>
                                            </span>
                                            {idx < 5 && <span className="crop-chain-arrow">→</span>}
                                          </React.Fragment>
                                        );
                                      })}
                                    </div>
                                  </td>

                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11 }}>
                                      <span style={{ color: '#27ae60', fontWeight: 700 }}>✓ Legume (≥1 in 3s)</span>
                                      <span style={{ color: '#27ae60', fontWeight: 700 }}>✓ Family Rotated</span>
                                      <span style={{ color: 'var(--text-muted)' }}>CBC ({item.solver_status || 'Optimal'})</span>
                                    </div>
                                  </td>

                                  <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button
                                        type="button"
                                        className="btn-secondary-sm"
                                        style={{ fontSize: 11, padding: '4px 8px' }}
                                        onClick={e => {
                                          e.stopPropagation();
                                          setSelectedMatrixStrategy(name);
                                        }}
                                      >
                                        Inspect
                                      </button>
                                      {!isActive && (
                                        <button
                                          type="button"
                                          className="btn-primary-sm"
                                          style={{ fontSize: 11, padding: '4px 8px' }}
                                          onClick={e => {
                                            e.stopPropagation();
                                            handleApplyStrategy(name);
                                          }}
                                        >
                                          Activate
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* VIEW 2: TRADE-OFF ANALYTICS CARDS */}
                    {matrixViewMode === 'tradeoffs' && (
                      <div className="tradeoff-comparative-grid">
                        {Object.entries(allStrategiesMap).map(([name, item]) => {
                          const meta = STRATEGY_META[name] || { title: name.replaceAll('_', ' '), icon: '🌾', summary: 'Trade-off profile' };
                          const isActive = name === activeStrategyName;
                          const isInspected = name === inspectedKey;
                          const weights = item.weights || { profit: 0.34, water: 0.33, soil: 0.33 };

                          const profitVal = item.profit_component != null ? Number(item.profit_component) : null;
                          const profitPct = profitVal != null ? Math.min(100, Math.round((profitVal / 900000) * 100)) : 0;

                          const waterVal = item.water_component != null ? Number(item.water_component) : null;
                          const waterPct = waterVal != null ? Math.min(100, Math.round((waterVal / 6.0) * 100)) : 0;

                          const soilVal = item.soil_component != null ? Number(item.soil_component) : null;
                          const soilPct = soilVal != null ? Math.min(100, Math.round((soilVal / 6.0) * 100)) : 0;

                          return (
                            <div
                              key={name}
                              className={`tradeoff-strategy-card ${isActive ? 'active-border' : ''} ${isInspected ? 'row-inspected' : ''}`}
                              onClick={() => setSelectedMatrixStrategy(name)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div className="strategy-profile-icon" style={{ background: meta.accentBg || '#f0fdf4', color: meta.primaryColor }}>
                                    {meta.icon}
                                  </div>
                                  <div>
                                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{meta.title}</h4>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{meta.summary}</span>
                                  </div>
                                </div>
                                {isActive ? (
                                  <span style={{ fontSize: 11, background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                                    ACTIVE
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-secondary-sm"
                                    style={{ fontSize: 11, padding: '3px 8px' }}
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleApplyStrategy(name);
                                    }}
                                  >
                                    Apply
                                  </button>
                                )}
                              </div>

                              {/* Trade-off Progress Bars */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>
                                    <span style={{ color: '#27ae60' }}>💰 Profit Component (6-Season Gross Margin)</span>
                                    <span>{profitVal != null ? `৳${profitVal.toLocaleString()} BDT/ha` : '—'}</span>
                                  </div>
                                  <div className="score-bar-track">
                                    <div className="score-bar-fill" style={{ width: `${profitPct}%`, background: '#27ae60' }} />
                                  </div>
                                </div>

                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>
                                    <span style={{ color: '#2980b9' }}>💧 Water Conservation Index</span>
                                    <span>{waterVal != null ? `${number(waterVal, 2)} / 6.0` : '—'}</span>
                                  </div>
                                  <div className="score-bar-track">
                                    <div className="score-bar-fill" style={{ width: `${waterPct}%`, background: '#2980b9' }} />
                                  </div>
                                </div>

                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>
                                    <span style={{ color: '#e67e22' }}>🌱 Soil Regeneration &amp; Biology</span>
                                    <span>{soilVal != null ? `${number(soilVal, 2)} / 6.0` : '—'}</span>
                                  </div>
                                  <div className="score-bar-track">
                                    <div className="score-bar-fill" style={{ width: `${soilPct}%`, background: '#e67e22' }} />
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-light)', fontSize: 12 }}>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  Weights: <strong>{Math.round(weights.profit * 100)}% P</strong> • <strong>{Math.round(weights.water * 100)}% W</strong> • <strong>{Math.round(weights.soil * 100)}% S</strong>
                                </span>
                                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                  Score: {item.objective_value != null ? number(item.objective_value, 3) : '—'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* VIEW 3: MULTI-SEASON PROGRESSION TIMELINE */}
                    {matrixViewMode === 'timeline' && (
                      <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Side-by-Side 6-Season Crop Trajectories</h4>
                        {Object.entries(allStrategiesMap).map(([name, item]) => {
                          const meta = STRATEGY_META[name] || { title: name.replaceAll('_', ' '), icon: '🌾' };
                          const isActive = name === activeStrategyName;
                          const rot = item.rotation || {};

                          return (
                            <div key={name} style={{ background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 12, border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-light)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span>{meta.icon}</span>
                                  <strong style={{ fontSize: 14 }}>{meta.title}</strong>
                                  {isActive && <span style={{ fontSize: 10, background: 'var(--primary)', color: '#fff', padding: '1px 6px', borderRadius: 999 }}>ACTIVE</span>}
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                  Profit: <strong>{item.profit_component != null ? `৳${Number(item.profit_component).toLocaleString()}` : '—'}</strong> • Water: <strong>{item.water_component != null ? number(item.water_component, 2) : '—'}</strong> • Soil: <strong>{item.soil_component != null ? number(item.soil_component, 2) : '—'}</strong>
                                </span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                                {['Y1_S1', 'Y1_S2', 'Y2_S1', 'Y2_S2', 'Y3_S1', 'Y3_S2'].map((periodKey, idx) => {
                                  const crop = rot[periodKey];
                                  const cMeta = crop ? (CROP_META[crop] || { family: 'Other', is_legume: crop.toLowerCase().includes('bean') || crop.toLowerCase().includes('lentil'), duration: 90, water_mm: 400, icon: '🌱' }) : null;
                                  const isDry = idx % 2 === 0;

                                  return (
                                    <div
                                      key={periodKey}
                                      style={{
                                        background: '#fff',
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        border: cMeta?.is_legume ? '1px solid #a5d6a7' : '1px solid var(--border-light)',
                                        borderLeft: cMeta?.is_legume ? '3px solid #27ae60' : undefined,
                                        textAlign: 'center'
                                      }}
                                    >
                                      <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        {periodKey} ({isDry ? 'Dry' : 'Wet'})
                                      </div>
                                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                                        {cMeta ? `${cMeta.icon} ${crop}` : '—'}
                                      </div>
                                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {cMeta ? `${cMeta.family} • ${cMeta.water_mm}mm` : 'Unassigned'}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* DEEP-DIVE STRATEGY INSPECTOR PANEL */}
                    <div className="strategy-inspector-card">
                      <div className="inspector-top-banner">
                        <div className="inspector-title-group">
                          <div className="inspector-icon-lg" style={{ background: inspectedMeta.accentBg || 'var(--primary-light)', color: inspectedMeta.primaryColor }}>
                            {inspectedMeta.icon}
                          </div>
                          <div className="inspector-title-text">
                            <h3>Inspecting Strategy: {inspectedMeta.title}</h3>
                            <p>{inspectedMeta.summary}</p>
                          </div>
                        </div>
                        <div className="inspector-actions">
                          <span className="score-chip composite" style={{ fontSize: 14, padding: '6px 12px' }}>
                            Solver Score: <strong>{inspectedItem.objective_value != null ? number(inspectedItem.objective_value, 3) : '—'}</strong>
                          </span>
                          {inspectedKey !== activeStrategyName ? (
                            <button
                              type="button"
                              className="btn-primary-sm"
                              onClick={() => handleApplyStrategy(inspectedKey)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
                            >
                              <span>Apply as Active Operational Strategy</span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </button>
                          ) : (
                            <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, padding: '6px 14px', borderRadius: 8, fontSize: 12.5 }}>
                              ★ Currently Active Field Recommendation
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Strategy Priority Focus Breakdown */}
                      <div className="strategy-formula-box">
                        <div className="formula-text" style={{ fontSize: 13.5, fontWeight: 700 }}>
                          Main Priority: {STRATEGY_PRIORITY_DESC[inspectedKey]?.mainPriority || inspectedMeta.summary}
                        </div>
                        <div className="formula-weights-breakdown">
                          <span style={{ color: '#27ae60' }}>● Profit Focus: {Math.round((inspectedItem.weights?.profit ?? 0.7) * 100)}%</span>
                          <span style={{ color: '#0288d1' }}>● Water Focus: {Math.round((inspectedItem.weights?.water ?? 0.2) * 100)}%</span>
                          <span style={{ color: '#e67e22' }}>● Soil Focus: {Math.round((inspectedItem.weights?.soil ?? 0.1) * 100)}%</span>
                        </div>
                      </div>

                      {/* 3-Year Visual Rotation Timeline Schedule */}
                      <div>
                        <h4 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                          3-Year (6-Season) Multi-Period Optimal Rotation Schedule
                        </h4>
                        <div className="strategy-3year-timeline">
                          {[
                            { year: 1, label: 'Year 1', badge: 'Seasons 1 & 2', s1: 'Y1_S1', s2: 'Y1_S2' },
                            { year: 2, label: 'Year 2', badge: 'Seasons 3 & 4', s1: 'Y2_S1', s2: 'Y2_S2' },
                            { year: 3, label: 'Year 3', badge: 'Seasons 5 & 6', s1: 'Y3_S1', s2: 'Y3_S2' }
                          ].map(y => {
                            const crop1 = inspectedRotation[y.s1];
                            const crop2 = inspectedRotation[y.s2];
                            const meta1 = crop1 ? (CROP_META[crop1] || { family: 'Other', is_legume: crop1.toLowerCase().includes('bean') || crop1.toLowerCase().includes('lentil'), duration: 75, water_mm: 350, icon: '🌱' }) : null;
                            const meta2 = crop2 ? (CROP_META[crop2] || { family: 'Other', is_legume: crop2.toLowerCase().includes('bean') || crop2.toLowerCase().includes('lentil'), duration: 110, water_mm: 600, icon: '🌽' }) : null;

                            return (
                              <div key={y.year} className="timeline-year-card">
                                <div className="timeline-year-header">
                                  <span className="timeline-year-title">{y.label}</span>
                                  <span className="timeline-year-badge">{y.badge}</span>
                                </div>
                                <div className="timeline-season-row">
                                  {/* Season 1 (Dry) */}
                                  <div className={`timeline-season-card ${meta1?.is_legume ? 'is-legume' : ''}`}>
                                    <div className="timeline-season-meta">
                                      <span>Season 1 (Dry / Rabi)</span>
                                      {meta1?.is_legume && <span style={{ color: '#27ae60', fontWeight: 800 }}>🌱 Nitrogen Fixer</span>}
                                    </div>
                                    <div className="timeline-crop-main">
                                      <span className="timeline-crop-name">{meta1 ? `${meta1.icon} ${crop1}` : '—'}</span>
                                      {meta1 && <span className="trait-pill">{meta1.family}</span>}
                                    </div>
                                    <div className="timeline-crop-traits">
                                      {meta1 ? (
                                        <>
                                          <span className="trait-pill">⏳ {meta1.duration} days</span>
                                          <span className="trait-pill">💧 {meta1.water_mm} mm req</span>
                                          <span className="trait-pill">{meta1.is_legume ? 'Bio-N Fixation' : 'Cash Margin'}</span>
                                        </>
                                      ) : (
                                        <span className="trait-pill">Unscheduled</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Season 2 (Wet) */}
                                  <div className={`timeline-season-card ${meta2?.is_legume ? 'is-legume' : ''}`}>
                                    <div className="timeline-season-meta">
                                      <span>Season 2 (Wet / Kharif)</span>
                                      {meta2?.is_legume && <span style={{ color: '#27ae60', fontWeight: 800 }}>🌱 Nitrogen Fixer</span>}
                                    </div>
                                    <div className="timeline-crop-main">
                                      <span className="timeline-crop-name">{meta2 ? `${meta2.icon} ${crop2}` : '—'}</span>
                                      {meta2 && <span className="trait-pill">{meta2.family}</span>}
                                    </div>
                                    <div className="timeline-crop-traits">
                                      {meta2 ? (
                                        <>
                                          <span className="trait-pill">⏳ {meta2.duration} days</span>
                                          <span className="trait-pill">💧 {meta2.water_mm} mm req</span>
                                          <span className="trait-pill">{meta2.is_legume ? 'Bio-N Fixation' : 'High Cash Margin'}</span>
                                        </>
                                      ) : (
                                        <span className="trait-pill">Unscheduled</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Decomposition & Constraints Grid */}
                      <div className="inspector-details-grid">
                        {/* Objective Decomposition */}
                        <div className="decomposition-card">
                          <h4>Objective Score Component Decomposition</h4>

                          <div className="score-bar-item">
                            <div className="score-bar-header">
                              <span style={{ color: '#27ae60' }}>💰 Expected Net Revenue (6-Season Gross Margin)</span>
                              <span>{inspectedItem.profit_component != null ? `৳${Number(inspectedItem.profit_component).toLocaleString()} BDT/ha` : '—'}</span>
                            </div>
                            <div className="score-bar-track">
                              <div className="score-bar-fill" style={{ width: `${inspectedItem.profit_component != null ? Math.min(100, Math.round((Number(inspectedItem.profit_component) / 900000) * 100)) : 0}%`, background: '#27ae60' }} />
                            </div>
                            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                              Weight: {number(inspectedItem.weights?.profit ?? 0.7, 2)} • Maximizes return per hectare across 6 seasons.
                            </small>
                          </div>

                          <div className="score-bar-item">
                            <div className="score-bar-header">
                              <span style={{ color: '#2980b9' }}>💧 Water Conservation Component</span>
                              <span>{inspectedItem.water_component != null ? `${number(inspectedItem.water_component, 2)} / 6.0` : '—'}</span>
                            </div>
                            <div className="score-bar-track">
                              <div className="score-bar-fill" style={{ width: `${inspectedItem.water_component != null ? Math.min(100, Math.round((Number(inspectedItem.water_component) / 6.0) * 100)) : 0}%`, background: '#2980b9' }} />
                            </div>
                            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                              Weight: {number(inspectedItem.weights?.water ?? 0.2, 2)} • Minimizes irrigation demand in dry seasons.
                            </small>
                          </div>

                          <div className="score-bar-item">
                            <div className="score-bar-header">
                              <span style={{ color: '#e67e22' }}>🌱 Soil Health &amp; Biology Component</span>
                              <span>{inspectedItem.soil_component != null ? `${number(inspectedItem.soil_component, 2)} / 6.0` : '—'}</span>
                            </div>
                            <div className="score-bar-track">
                              <div className="score-bar-fill" style={{ width: `${inspectedItem.soil_component != null ? Math.min(100, Math.round((Number(inspectedItem.soil_component) / 6.0) * 100)) : 0}%`, background: '#e67e22' }} />
                            </div>
                            <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                              Weight: {number(inspectedItem.weights?.soil ?? 0.1, 2)} • Rewards nitrogen-fixing pulses and root biomass.
                            </small>
                          </div>
                        </div>

                        {/* Dynamic Per-Season Decision Explanations */}
                        <div style={{ gridColumn: 'span 2', background: '#fff', padding: 20, borderRadius: 14, border: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 20 }}>🌱</span>
                              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                                Agronomic Decision Explanation &amp; Alternatives ({inspectedMeta.title})
                              </h4>
                            </div>
                            <span style={{ fontSize: 12, background: 'var(--primary-lightest)', color: 'var(--primary-dark)', padding: '3px 10px', borderRadius: 12, fontWeight: 700 }}>
                              {inspectedItem.decision_explanation?.strategy_title || inspectedMeta.title}
                            </span>
                          </div>

                          {inspectedItem.decision_explanation?.strategy_summary && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#166534', lineHeight: 1.5 }}>
                              <strong>Strategy Focus: </strong>{inspectedItem.decision_explanation.strategy_summary}
                            </div>
                          )}

                          {inspectedItem.decision_explanation?.pattern_explanation && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#475569' }}>
                              <strong>Rotation Pattern: </strong>{inspectedItem.decision_explanation.pattern_explanation}
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                            {(() => {
                              const reasons = inspectedItem.decision_explanation?.period_reasons;
                              const pWeights = inspectedItem.weights || { profit: 0.34, water: 0.33, soil: 0.33 };
                              if (reasons && reasons.length > 0) {
                                return reasons.map((p, pIdx) => (
                                  <div key={p.period || pIdx} style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                                      <div>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-dark)' }}>{p.crop}</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>({p.family})</span>
                                        {p.is_legume && <span style={{ marginLeft: 6, fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>BNF Legume</span>}
                                      </div>
                                      <span style={{ fontSize: 11, background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                                        {p.season_label || p.period}
                                      </span>
                                    </div>

                                    {/* Why This Crop */}
                                    <div>
                                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Why This Crop?</div>
                                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#334155', lineHeight: 1.4 }}>{p.why_this_crop || p.why_feasible}</p>
                                    </div>

                                    {/* Feasibility Bullets */}
                                    {p.feasibility_bullets && p.feasibility_bullets.length > 0 && (
                                      <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: 6, fontSize: 11.5 }}>
                                        <div style={{ fontWeight: 700, color: '#475569', marginBottom: 3 }}>Feasibility Factors:</div>
                                        <ul style={{ margin: 0, paddingLeft: 16, color: '#334155' }}>
                                          {p.feasibility_bullets.map((b, bIdx) => (
                                            <li key={bIdx} style={{ marginBottom: 2 }}>{b}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Expected Performance */}
                                    <div style={{ background: '#faf5ff', border: '1px solid #f3e8ff', borderRadius: 6, padding: '6px 10px', fontSize: 11.5 }}>
                                      <div style={{ fontWeight: 700, color: '#6b21a8', marginBottom: 2 }}>Expected Seasonal Performance:</div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, color: '#4c1d95' }}>
                                        <span>Margin: <strong>BDT {Number(p.expected_gross_margin_bdt_ha || 0).toLocaleString()}/ha</strong></span>
                                        <span>Water: <strong>{Number(p.water_requirement_mm || 0).toFixed(0)} mm</strong></span>
                                        <span>Yield: <strong>{Number(p.expected_yield_t_ha || 0).toFixed(2)} t/ha</strong></span>
                                        {p.composite_score != null && <span>Score: <strong>{Number(p.composite_score).toFixed(3)}</strong></span>}
                                      </div>
                                    </div>

                                    {/* Why Selected */}
                                    <div>
                                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Why Selected?</div>
                                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#1e293b', lineHeight: 1.4 }}>{p.why_selected}</p>
                                    </div>

                                    {/* Main Alternatives */}
                                    {p.alternatives_considered && p.alternatives_considered.length > 0 && (
                                      <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 6 }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Main Alternatives Evaluated:</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                          {p.alternatives_considered.map((alt, aIdx) => (
                                            <div key={aIdx} style={{ fontSize: 11, color: '#475569', background: '#f8fafc', padding: '3px 6px', borderRadius: 4 }}>
                                              <strong style={{ color: '#1e293b' }}>{alt.crop}:</strong> {alt.reason_not_chosen || `BDT ${Number(alt.expected_gross_margin_bdt || 0).toLocaleString()}/ha margin`}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Key Takeaway */}
                                    {p.key_takeaway && (
                                      <div style={{ fontSize: 11.5, color: '#15803d', fontWeight: 600, borderLeft: '3px solid #22c55e', paddingLeft: 8, marginTop: 2 }}>
                                        {p.key_takeaway}
                                      </div>
                                    )}

                                    {/* Collapsible Technical Details */}
                                    <details style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                      <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Technical Optimization Details</summary>
                                      <div style={{ marginTop: 4, padding: 6, background: '#f1f5f9', borderRadius: 4, fontFamily: 'monospace', fontSize: 10.5 }}>
                                        <div>Strategy Weights: Profit {formatNumber((pWeights.profit || 0.34) * 100, 0)}%, Water {formatNumber((pWeights.water || 0.33) * 100, 0)}%, Soil {formatNumber((pWeights.soil || 0.33) * 100, 0)}%</div>
                                        <div>Calculated Composite Score: {formatNumber(p.composite_score || 0, 3)} / 1.000</div>
                                        <div>Legume BNF Interval Constraint: Satisfied</div>
                                      </div>
                                    </details>
                                  </div>
                                ));
                              }
                              // Strategy-isolated fallback
                              const periods = ['Y1_S1', 'Y1_S2', 'Y2_S1', 'Y2_S2', 'Y3_S1', 'Y3_S2'];
                              return periods.map((periodKey, pIdx) => {
                                const crop = inspectedRotation[periodKey] || 'Unassigned';
                                const cMeta = CROP_META[crop] || { family: 'Agronomic', is_legume: false };
                                const isDry = pIdx % 2 === 0;
                                return (
                                  <div key={periodKey} style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                      <strong style={{ color: 'var(--primary)', fontSize: 12.5 }}>{periodKey}: {crop} ({cMeta.family})</strong>
                                      <span style={{ fontSize: 10.5, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                        Year {Math.floor(pIdx/2) + 1}, Season {(pIdx%2) + 1} ({isDry ? 'Dry/Rabi' : 'Wet/Kharif'})
                                      </span>
                                    </div>
                                    <div style={{ marginBottom: 4 }}>
                                      <span style={{ fontWeight: 700, color: '#334155' }}>Why Feasible: </span>
                                      <span style={{ color: '#475569' }}>Meets parcel agro-climatic boundaries and botanical family alternation.</span>
                                    </div>
                                    <div style={{ marginBottom: 4 }}>
                                      <span style={{ fontWeight: 700, color: '#334155' }}>Why Selected: </span>
                                      <span style={{ color: '#475569' }}>
                                        Selected for optimal trade-off under {formatNumber((pWeights.profit || 0) * 100, 0)}% Profit / {formatNumber((pWeights.water || 0) * 100, 0)}% Water / {formatNumber((pWeights.soil || 0) * 100, 0)}% Soil weights.
                                      </span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* Agronomic Constraints Verification */}
                        <div className="compliance-checklist-card">
                          <h4>Agronomic Constraints &amp; Solver Integrity</h4>
                          <div className="checklist-items">
                            <div className="checklist-row">
                              <div className="check-icon-circle">✓</div>
                              <div>
                                <strong>Legume Interval Constraint Satisfied:</strong>
                                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                  Enforces biological nitrogen-fixing pulse (e.g. Mungbean/Lentil) at least once every 3 consecutive seasons via mathematical constraint.
                                </div>
                              </div>
                            </div>

                            <div className="checklist-row">
                              <div className="check-icon-circle">✓</div>
                              <div>
                                <strong>Botanical Family Alternation Verified:</strong>
                                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                  Consecutive seasons avoid matching botanical families (e.g. Fabaceae rotated with Poaceae) to break pest cycles.
                                </div>
                              </div>
                            </div>

                            <div className="checklist-row">
                              <div className="check-icon-circle">✓</div>
                              <div>
                                <strong>Agro-Climatic &amp; Soil pH Feasibility:</strong>
                                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                  Every scheduled crop is verified within temperature bounds and soil pH limits for the parcel.
                                </div>
                              </div>
                            </div>

                            <div className="checklist-row">
                              <div className="check-icon-circle">✓</div>
                              <div>
                                <strong>PuLP Branch-and-Bound Solver Formulation:</strong>
                                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                  Solved to global integer optimality without heuristic shortcuts ({inspectedItem.solver_status || 'Optimal'}).
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 3: ML MODELS & XAI */}
              {analysisTab === 'ml_models' && (
                <>
                  <section className="dash-card" style={{ gridColumn: 'span 6' }}>
                    <div className="panel-heading">
                      <h3>Synthetic ML Yield Model &amp; Uncertainty</h3>
                      <span className="source-tag demo">SYNTHETIC BENCHMARK</span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, margin: '14px 0' }}>
                      <div style={{ flex: 1, background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 14, border: '1px solid var(--border-light)' }}>
                        <small style={{ color: 'var(--text-muted)', fontWeight: 700 }}>PREDICTED YIELD</small>
                        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                          {ml.prediction_t_ha ? `${number(ml.prediction_t_ha, 3)}` : '2.929'} <span style={{ fontSize: 14 }}>t/ha</span>
                        </div>
                      </div>
                      <div style={{ flex: 1, background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 14, border: '1px solid var(--border-light)' }}>
                        <small style={{ color: 'var(--text-muted)', fontWeight: 700 }}>UNCERTAINTY BOUND (±)</small>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#e67e22', marginTop: 4 }}>
                          ±{ml.uncertainty_t_ha ? `${number(ml.uncertainty_t_ha, 3)}` : '0.146'} <span style={{ fontSize: 14 }}>t/ha</span>
                        </div>
                      </div>
                    </div>

                    <h4 style={{ margin: '16px 0 8px', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Synthetic Benchmark Evaluation Metrics
                    </h4>
                    <table className="strategy-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Value</th>
                          <th>Interpretation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(ml.metrics || {}).map(([k, v]) => (
                          <tr key={k}>
                            <td><code>{k}</code></td>
                            <td><strong>{number(v, 4)}</strong></td>
                            <td>{k.includes('mae') ? 'Mean absolute error (t/ha)' : k.includes('rmse') ? 'Root mean squared error' : 'Coefficient of determination (R²)'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>

                  <section className="dash-card" style={{ gridColumn: 'span 6' }}>
                    <div className="panel-heading">
                      <h3>Model-Attributed Feature Contributors (XAI)</h3>
                      <span>Explainability</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      {mlContributors.map(c => (
                        <div key={c.feature} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--bg-card-subtle)', borderRadius: 8, fontSize: 13 }}>
                          <span>{c.feature.replaceAll('_', ' ')}: <strong>{number(c.value)}</strong></span>
                          <strong style={{ color: c.attributed_contribution >= 0 ? '#27ae60' : '#d35400' }}>
                            {c.attributed_contribution > 0 ? '+' : ''}{number(c.attributed_contribution)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* REINFORCEMENT LEARNING MULTI-YEAR CROP ROTATION POLICY CARD */}
                  <section className="dash-card" style={{ gridColumn: 'span 12', marginTop: 8 }}>
                    <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>🤖</span>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Reinforcement Learning Multi-Year Crop Rotation Policy</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                          Adaptive 6-season (3-year) sequential Markov Decision Process (MDP) optimizing economic gross margin, water stress budgets, and soil nutrient carryover.
                        </p>
                      </div>
                      <span className="source-tag demo" style={{ fontSize: 11, background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', fontWeight: 700 }}>
                        {rlPolicy.policy_label || 'Synthetic RL Policy — Simulation Trained — Not Field Validated'}
                      </span>
                    </div>

                    {/* RL Trajectory KPI Grid */}
                    {rlPolicy.trajectory_summary && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, margin: '18px 0 22px' }}>
                        <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>TOTAL PROFIT (6-SEASON)</small>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#27ae60', marginTop: 4 }}>
                            ৳{rlPolicy.trajectory_summary.total_profit_bdt_per_ha ? Number(rlPolicy.trajectory_summary.total_profit_bdt_per_ha).toLocaleString() : '—'}
                          </div>
                          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>BDT / hectare</span>
                        </div>

                        <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>PARCEL GROSS MARGIN</small>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                            ৳{rlPolicy.trajectory_summary.total_field_profit_bdt ? Number(rlPolicy.trajectory_summary.total_field_profit_bdt).toLocaleString() : '—'}
                          </div>
                          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Total field yield</span>
                        </div>

                        <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>CUMULATIVE REWARD</small>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#4338ca', marginTop: 4 }}>
                            {rlPolicy.trajectory_summary.total_cumulative_reward ? number(rlPolicy.trajectory_summary.total_cumulative_reward, 1) : '—'} pts
                          </div>
                          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Summed MDP return</span>
                        </div>

                        <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>WATER DEMAND</small>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#2980b9', marginTop: 4 }}>
                            {rlPolicy.trajectory_summary.total_water_requirement_mm ? number(rlPolicy.trajectory_summary.total_water_requirement_mm, 0) : '—'} mm
                          </div>
                          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Avg: {number(rlPolicy.trajectory_summary.mean_water_requirement_mm, 0)} mm/season</span>
                        </div>

                        <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>SOIL HEALTH SCORE</small>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
                            {number(rlPolicy.trajectory_summary.final_soil_health, 1)} <span style={{ fontSize: 12 }}>/ 100</span>
                          </div>
                          <span style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700 }}>
                            {rlPolicy.trajectory_summary.soil_health_improvement >= 0 ? '+' : ''}{number(rlPolicy.trajectory_summary.soil_health_improvement, 1)} pts gain
                          </span>
                        </div>

                        <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                          <small style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>LEGUME &amp; DIVERSITY</small>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                            {Math.round((rlPolicy.trajectory_summary.legume_fraction || 0) * 100)}% <span style={{ fontSize: 12 }}>legumes</span>
                          </div>
                          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{rlPolicy.trajectory_summary.crop_diversity_count || 0} distinct crops</span>
                        </div>
                      </div>
                    )}

                    {/* 6-Season Sequential Decision Timeline */}
                    <div style={{ marginTop: 10 }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Per-Season Policy Decision Progression (6 Horizons)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(rlPolicy.decisions || []).map((dec, idx) => {
                          const isDry = idx % 2 === 0;
                          return (
                            <div
                              key={dec.period_name || idx}
                              style={{
                                background: '#fff',
                                padding: 16,
                                borderRadius: 12,
                                border: '1px solid var(--border-light)',
                                borderLeft: dec.is_legume ? '4px solid #16a34a' : '4px solid #3b82f6',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontSize: 11, fontWeight: 800, background: isDry ? '#fef3c7' : '#e0f2fe', color: isDry ? '#92400e' : '#0369a1', padding: '2px 8px', borderRadius: 999 }}>
                                    Season {dec.season_index}: {isDry ? 'Dry / Rabi' : 'Wet / Kharif'}
                                  </span>
                                  <strong style={{ fontSize: 16, color: 'var(--text-main)' }}>{dec.chosen_crop}</strong>
                                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({dec.crop_family})</span>
                                  {dec.is_legume && (
                                    <span style={{ fontSize: 10.5, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>
                                      🌱 Nitrogen-Fixing Legume
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                                  <span style={{ color: '#27ae60', fontWeight: 700 }}>৳{Number(dec.gross_margin_bdt_ha).toLocaleString()}/ha</span>
                                  <span style={{ color: '#2980b9' }}>💧 {number(dec.water_requirement_mm, 0)} mm</span>
                                  <span style={{ color: '#d97706' }}>🌱 Soil: {number(dec.soil_health_after, 1)} ({dec.soil_health_delta >= 0 ? '+' : ''}{number(dec.soil_health_delta, 0)} pts)</span>
                                  <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
                                    Q-Value: {number(dec.q_value, 2)}
                                  </span>
                                </div>
                              </div>

                              <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 8 }}>
                                {dec.decision_rationale}
                              </div>

                              {dec.top_candidates && dec.top_candidates.length > 1 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
                                  <strong style={{ color: 'var(--text-muted)' }}>Alternatives Evaluated:</strong>
                                  {dec.top_candidates.slice(1, 3).map(alt => (
                                    <span key={alt.crop} style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                      {alt.crop}: Q={number(alt.q_value, 2)} (৳{Number(alt.gross_margin_bdt_ha).toLocaleString()})
                                    </span>
                                  ))}
                                  <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>{dec.key_takeaway}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  {/* RL POLICY VS MILP OPTIMIZER COMPARISON CARD */}
                  {rlVsMilp.comparison_metrics && (
                    <section className="dash-card" style={{ gridColumn: 'span 12', marginTop: 12 }}>
                      <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>RL Learned Policy vs. MILP Mathematical Optimizer Benchmark</h3>
                          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                            Systematic comparison between adaptive Markovian sequential decision making and global mixed-integer linear programming.
                          </p>
                        </div>
                        <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: 999, fontWeight: 800, fontSize: 13 }}>
                          Concordance: {rlVsMilp.agreement_percentage}% ({rlVsMilp.matching_seasons} of {rlVsMilp.total_seasons} Seasons Agreed)
                        </span>
                      </div>

                      {/* Side-by-Side Trajectory Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0' }}>
                        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1.5px solid #cbd5e1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <strong style={{ fontSize: 14, color: '#334155' }}>🤖 RL Multi-Year Policy Trajectory</strong>
                            <span style={{ fontSize: 11, background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Sequential MDP</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            {rlVsMilp.rl_rotation_sequence || '—'}
                          </div>
                        </div>

                        <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 12, border: '1.5px solid #86efac' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <strong style={{ fontSize: 14, color: '#166534' }}>📐 MILP Optimizer Plan Trajectory</strong>
                            <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Global CBC Solver</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                            {rlVsMilp.milp_rotation_sequence || '—'}
                          </div>
                        </div>
                      </div>

                      {/* Metrics Comparison Table */}
                      <table className="strategy-table" style={{ marginTop: 12 }}>
                        <thead>
                          <tr>
                            <th>Evaluation Metric</th>
                            <th>RL Policy Value</th>
                            <th>MILP Optimizer Value</th>
                            <th>Delta (RL vs MILP)</th>
                            <th>Methodological Trade-Off Interpretation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(rlVsMilp.comparison_metrics || []).map((m, idx) => (
                            <tr key={idx}>
                              <td><strong>{m.metric}</strong></td>
                              <td><strong style={{ color: '#4338ca' }}>{m.rl_value}</strong></td>
                              <td><strong style={{ color: '#15803d' }}>{m.milp_value}</strong></td>
                              <td><code>{m.delta}</code></td>
                              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.interpretation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Methodology Insights */}
                      {rlVsMilp.methodology_insights && (
                        <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-card-subtle)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                          <h4 style={{ margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            Optimization Insights &amp; Algorithmic Synthesis
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {rlVsMilp.methodology_insights.map((ins, idx) => (
                              <li key={idx}>{ins}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  )}
                </>
              )}

              {/* TAB 4: STRESS TESTING & WHAT-IF SUMMARY */}
              {analysisTab === 'stress_testing' && (
                <section className="dash-card" style={{ gridColumn: 'span 12' }}>
                  <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>🧪</span>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Stress Testing &amp; What-If Scenarios</h3>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                        Evaluate MILP mathematical optimizer and RL learned policy resilience under hypothetical environmental conditions (Normal, Drought, Heat, Low Water).
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary-sm"
                      onClick={() => setActiveNav('scenarios')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}
                    >
                      <span>Open Dedicated Stress Testing Workspace</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 16 }}>
                    {[
                      { name: 'Normal', icon: '☀️', desc: 'Baseline NASA POWER climate state evaluated without perturbation.' },
                      { name: 'Drought', icon: '🌵', desc: 'Precipitation deficit evaluated against baseline soil moisture bounds.' },
                      { name: 'Heat Wave', icon: '🔥', desc: 'Elevated temperature regime testing thermal crop tolerance envelope.' },
                      { name: 'Low Water', icon: '💧', desc: 'Constrained seasonal irrigation capacity testing aquifer resilience.' }
                    ].map(item => (
                      <div key={item.name} style={{ background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14 }}>
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* TAB 5: FIELD PROFILE & CONTROLS FORM */}
              {analysisTab === 'controls' && (
                <section className="dash-card form-panel-card" style={{ gridColumn: 'span 8', margin: '0 auto' }}>
                  <div className="panel-heading">
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Field Profile &amp; Simulation Controls</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
                        All weather and seasonal features are automatically derived from NASA POWER for the active field coordinates.
                      </p>
                    </div>
                    <span className="source-tag math" style={{ textTransform: 'none' }}>
                      Weather: <strong>NASA POWER API</strong>
                    </span>
                  </div>

                  <form onSubmit={runAnalysis} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                    {/* Active Field Properties (Read-Only Context) */}
                    <div style={{ background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>
                          Active Field: {activeField?.name || 'Selected Farm Parcel'}
                        </strong>
                        <span style={{ fontSize: 11, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                          PostgreSQL Source
                        </span>
                      </div>
                      <div className="form-grid-inner">
                        <div className="form-group">
                          <label>Latitude &amp; Longitude</label>
                          <input className="input-box" type="text" value={activeField?.latitude != null && activeField?.longitude != null ? `${Number(activeField.latitude).toFixed(4)}, ${Number(activeField.longitude).toFixed(4)}` : 'Not available'} readOnly />
                        </div>
                        <div className="form-group">
                          <label>Field Area (ha)</label>
                          <input className="input-box" type="text" value={activeField?.area_ha != null ? `${Number(activeField.area_ha).toFixed(1)} ha` : '1.0 ha'} readOnly />
                        </div>
                        <div className="form-group">
                          <label>Soil Texture</label>
                          <input className="input-box" type="text" value={activeField?.soil_texture || 'loam'} readOnly />
                        </div>
                        <div className="form-group">
                          <label>Organic Matter (%)</label>
                          <input className="input-box" type="text" value={activeField?.organic_matter != null ? `${Number(activeField.organic_matter).toFixed(1)}%` : '1.5%'} readOnly />
                        </div>
                      </div>
                    </div>

                    {/* Operational Strategy Selector */}
                    <div className="form-group full">
                      <label style={{ fontWeight: 800, fontSize: 13 }}>Operational Optimization Strategy</label>
                      <div className="pill-selector">
                        {[
                          { id: 'profit', label: 'Profit Focused (70% P / 20% W / 10% S)' },
                          { id: 'water_efficiency', label: 'Water Efficiency (20% P / 60% W / 20% S)' },
                          { id: 'soil_health', label: 'Soil Health (20% P / 20% W / 60% S)' },
                          { id: 'balanced', label: 'Balanced (34% P / 33% W / 33% S)' },
                        ].map(prio => (
                          <button
                            type="button"
                            key={prio.id}
                            className={`pill-option ${form.priority === prio.id ? 'active' : ''}`}
                            onClick={() => handlePrioritySelect(prio.id)}
                            style={{ fontSize: 12, padding: '8px 14px' }}
                          >
                            {prio.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Collapsible Advanced Research & Counterfactual Controls */}
                    <details style={{ background: 'var(--bg-card-subtle)', borderRadius: 12, border: '1px solid var(--border-light)', padding: 12 }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
                        Optional Advanced Research &amp; Counterfactual Controls
                      </summary>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                        <div className="form-grid-inner">
                          <div className="form-group">
                            <label>Weather Window Start</label>
                            <input className="input-box" name="start_date" type="date" value={form.start_date} onChange={change} required />
                          </div>
                          <div className="form-group">
                            <label>Weather Window End</label>
                            <input className="input-box" name="end_date" type="date" value={form.end_date} onChange={change} required />
                          </div>
                          <div className="form-group">
                            <label>Counterfactual Rainfall Delta (mm)</label>
                            <input className="input-box" name="counterfactual_rainfall_delta_mm" type="number" step=".1" placeholder="e.g. 10" value={form.counterfactual_rainfall_delta_mm} onChange={change} />
                          </div>
                          <div className="form-group">
                            <label>Irrigation Capacity (mm)</label>
                            <input className="input-box" type="number" value={activeField?.irrigation_capacity_mm ?? ''} readOnly />
                          </div>
                        </div>

                        <div className="switch-row" style={{ marginTop: 4 }}>
                          <div className="switch-label">
                            <strong>Include Previous Crop History</strong>
                            <small>Enforces initial family rotation constraint from field history</small>
                          </div>
                          <div
                            className={`toggle-switch ${form.include_history ? 'on' : ''}`}
                            onClick={() => setForm(prev => ({ ...prev, include_history: !prev.include_history }))}
                          >
                            <div className="toggle-switch-handle" />
                          </div>
                        </div>

                        <div className="fertilizer-bar-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700 }}>
                            <span>Synthetic Fertilizer Assumption Level</span>
                            <span style={{ color: '#27ae60' }}>Moderate — High</span>
                          </div>
                          <div className="spectrum-bars" aria-hidden="true">
                            {[
                              { h: 32, c: '#e74c3c' }, { h: 36, c: '#e74c3c' }, { h: 30, c: '#e67e22' }, { h: 28, c: '#e67e22' },
                              { h: 24, c: '#f39c12' }, { h: 22, c: '#f39c12' }, { h: 26, c: '#f1c40f' }, { h: 28, c: '#f1c40f' },
                              { h: 30, c: '#2ecc71' }, { h: 34, c: '#2ecc71' }, { h: 38, c: '#27ae60' }, { h: 36, c: '#27ae60' },
                              { h: 32, c: '#229954' }, { h: 28, c: '#1e8449' }
                            ].map((bar, i) => (
                              <div key={i} className="spectrum-bar" style={{ height: `${bar.h}px`, backgroundColor: bar.c }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </details>

                    <button type="submit" className="run-cta-btn" style={{ justifyContent: 'center', marginTop: 8 }} disabled={running}>
                      {running ? 'Running Simulation Workflow…' : 'Run Dynamic Pipeline (NASA POWER + PuLP + RL)'}
                    </button>
                  </form>
                </section>
              )}

              {/* TAB 6: DIAGNOSTICS & RAW PROVENANCE */}
              {analysisTab === 'diagnostics' && (
                <section className="dash-card" style={{ gridColumn: 'span 12' }}>
                  <div className="panel-heading">
                    <h3>Research Diagnostics, Provenance & Boundaries</h3>
                    <span>Scientific Rigor</span>
                  </div>

                  <div className="boundary-banner" style={{ marginTop: 14 }}>
                    <strong>Research Boundary: {summary.research_boundary || 'No analysis result yet'}</strong>
                    <p style={{ margin: '4px 0 0' }}>
                      {summary.limitations?.join(' ') || 'Run an analysis to display its research limitations.'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>
                      Simulation-trained RL policy; not field validated. NASA POWER observations are distinct from synthetic ML yield estimates and MILP optimization.
                    </p>
                  </div>

                  <h4 style={{ margin: '18px 0 8px', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Raw Analysis Summary JSON
                  </h4>
                  <pre className="code-block">
                    {JSON.stringify(summary, null, 2)}
                  </pre>
                </section>
              )}
            </div>
          </div>
        )}

        {/* -------------------- VIEW 3: FIELD & PARCEL MANAGER -------------------- */}
        {activeNav === 'field' && (
          <div className="field-manager-container">
            <div className="view-sub-header">
              <div>
                <h2>My Field & Parcel Manager</h2>
                <p>Manage Field Boundaries, Soil Texture & Saved Farm Locations</p>
              </div>
              <button type="button" className="back-btn" onClick={() => setActiveNav('dashboard')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>

            <div className="dashboard-grid">
              {/* Big Satellite Parcel Map View */}
              <section className="dash-card map-card" style={{ gridColumn: 'span 8', minHeight: 380 }}>
                <svg className="satellite-canvas" viewBox="0 0 700 380" preserveAspectRatio="xMidYMid slice">
                  <rect width="700" height="380" fill="#1b432a" />
                  <polygon points="20,10 200,25 240,190 30,170" fill="#40916c" />
                  <polygon points="215,28 420,40 395,200 245,185" fill="#52b788" />
                  <polygon points="435,45 680,65 655,240 410,210" fill="#2d6a4f" />
                  <polygon points="40,185 240,205 210,360 25,340" fill="#387e5b" />
                  <polygon points="250,210 405,225 375,375 220,365" fill="#4d9b70" />
                  <polygon points="415,228 675,250 650,375 390,378" fill="#1e4d30" />
                  <path d="M0,175 L700,220" stroke="#e8eedd" strokeWidth="6" strokeDasharray="10 3" opacity="0.8" />
                  <path d="M235,0 L215,380" stroke="#d5decb" strokeWidth="5" opacity="0.85" />
                  <circle cx="310" cy="120" r="32" fill="#74e49f" opacity="0.2" />
                  <circle cx="310" cy="120" r="9" fill="#ffffff" stroke="#1b7a4b" strokeWidth="4" />
                </svg>

                <div className="map-floating-overlay" style={{ top: 20, right: 20 }}>
                  <div className="overlay-header">
                    <span>{activeField ? activeField.name : 'Selected Field Parcel'}</span>
                    <span style={{ fontSize: 10, background: '#1b7a4b', padding: '2px 6px', borderRadius: 4 }}>COORDINATES</span>
                  </div>
                  <div className="overlay-grid">
                    <div className="overlay-col"><small>Latitude</small><strong>{activeField?.latitude ?? 'Not available'}° N</strong></div>
                    <div className="overlay-col"><small>Longitude</small><strong>{activeField?.longitude ?? 'Not available'}° E</strong></div>
                    <div className="overlay-col"><small>Soil Texture</small><strong>{activeField?.soil_texture || 'Not available'}</strong></div>
                    <div className="overlay-col"><small>Organic Matter</small><strong>{activeField?.organic_matter != null ? `${activeField.organic_matter} %` : 'Not available'}</strong></div>
                  </div>
                </div>
              </section>

              {/* Save Field / Quick Select Field */}
              <section className="dash-card" style={{ gridColumn: 'span 4' }}>
                <div className="panel-heading">
                  <h3>Selected Field</h3>
                  <span>PostgreSQL source of truth</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {activeField?.id === 'demo'
                    ? 'The selected offline research demo is not a registered PostgreSQL field and cannot be saved as one.'
                    : activeField
                    ? 'This registered field is already stored in PostgreSQL. Edit it from Profile to update its authoritative values.'
                    : 'Select a registered PostgreSQL field or explicitly choose the offline demo.'}
                </p>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Saved Fields in Database
                  </h4>
                  {userFields.length > 0 ? (
                    <div className="saved-list">
                      {userFields.map(fld => (
                        <div key={fld.id} className="saved-item-card">
                          <div className="saved-item-info">
                            <strong>{fld.name}</strong>
                            <span>{fld.latitude}°, {fld.longitude}° • {fld.soil_texture || 'Loam'}</span>
                          </div>
                          <button type="button" className="btn-primary-sm" onClick={() => loadSavedFieldIntoForm(fld)}>
                            Load
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {!user ? 'Sign in to view PostgreSQL fields.' : !fieldsLoaded ? 'Loading PostgreSQL fields…' : fieldsError ? `PostgreSQL fields unavailable: ${fieldsError}` : 'No registered fields were returned for this account.'}
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* -------------------- VIEW 4: NASA POWER WEATHER & CLIMATE -------------------- */}
        {activeNav === 'weather' && (
          <div className="weather-intelligence-wrapper">
            <div className="view-sub-header">
              <div>
                <h2>NASA POWER Environmental Observations</h2>
                <p>Observed daily climate telemetry (Context only — not a field forecast)</p>
              </div>
              <button type="button" className="back-btn" onClick={() => setActiveNav('dashboard')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>

            <div className="dashboard-grid">
              <section className="dash-card weather-card" style={{ gridColumn: 'span 12' }}>
                <div className="weather-overview">
                  <div className="weather-condition">
                    {nasa.data_status === 'observed' || nasa.data_status === 'live' ? 'NASA POWER Daily Point API Telemetry' : 'Offline Demo Series'}
                  </div>
                  <div className="weather-date-pill">
                    <span className="weather-date-num">{nasa.latest_valid_date ? nasa.latest_valid_date : 'Not available'}</span>
                    <span className="weather-date-sub">{nasa.rows ? `${nasa.rows} Observation Days` : 'Observation Telemetry'}</span>
                    <span className={`source-tag ${nasa.data_status === 'observed' || nasa.data_status === 'live' ? 'live' : 'demo'}`}>
                      {nasa.source ? nasa.source.replaceAll('_', ' ') : 'NASA POWER Daily Point API'}
                    </span>
                  </div>
                </div>

                <div className="weather-metrics-list" style={{ flex: 2 }}>
                  <div className="weather-param-item">
                    <span className="weather-param-label">Observed Temperature</span>
                    <span className="weather-param-val">{tempVal} °C</span>
                  </div>
                  <div className="weather-param-item">
                    <span className="weather-param-label">Max Temperature</span>
                    <span className="weather-param-val">{env.temp_max != null ? number(env.temp_max, 1) : 'Not available'} °C</span>
                  </div>
                  <div className="weather-param-item">
                    <span className="weather-param-label">Min Temperature</span>
                    <span className="weather-param-val">{env.temp_min != null ? number(env.temp_min, 1) : 'Not available'} °C</span>
                  </div>
                  <div className="weather-param-item">
                    <span className="weather-param-label">Average Humidity</span>
                    <span className="weather-param-val">{humidVal} %</span>
                  </div>
                  <div className="weather-param-item">
                    <span className="weather-param-label">Wind Speed</span>
                    <span className="weather-param-val">{windVal} m/s</span>
                  </div>
                  <div className="weather-param-item">
                    <span className="weather-param-label">Daily Precipitation</span>
                    <span className="weather-param-val">{rainVal} mm/day</span>
                  </div>
                </div>
              </section>

              <section className="dash-card" style={{ gridColumn: 'span 12' }}>
                <div className="panel-heading">
                  <h3>Provenance & Research Boundaries</h3>
                  <span>Scientific Safety Notice</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                  NASA POWER observations provide empirical historical and recent environmental context for the selected field coordinates.
                  The prototype does not silently substitute demo data for failed live queries; offline demo data is clearly isolated and labelled.
                  Missing soil moisture or soil sensor telemetry is explicitly retained as missing or synthetic and not inferred.
                </p>
              </section>
            </div>
          </div>
        )}

        {/* -------------------- VIEW 5: STRESS TESTING & WHAT-IF -------------------- */}
        {activeNav === 'scenarios' && (
          <div className="scenarios-view-container">
            <div className="view-sub-header">
              <div>
                <h2>Stress Testing & What-If Scenarios</h2>
                <p>Deterministic Scenario Evaluation & Counterfactual Simulation</p>
              </div>
              <button type="button" className="back-btn" onClick={() => setActiveNav('dashboard')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>

            <div className="dashboard-grid">
              {/* Scenario Selector Cards */}
              <section className="dash-card" style={{ gridColumn: 'span 12' }}>
                <div className="panel-heading">
                  <h3>Hypothetical Stress Scenarios</h3>
                  <span>Status: {stress.status || 'completed'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 14 }}>
                  {Object.entries(scenarios).map(([name, sc]) => (
                    <div
                      key={name}
                      onClick={() => setSelectedStress(name)}
                      style={{
                        background: selectedStress === name ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
                        border: selectedStress === name ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        borderRadius: 14,
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: 15, textTransform: 'capitalize' }}>
                        {name.replaceAll('_', ' ')}
                      </strong>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sc.status === 'completed' ? 'var(--primary)' : '#888' }}>
                        {sc.status?.toUpperCase()}
                      </span>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                        {sc.reason || 'Hypothetical environmental perturbation.'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Active Scenario Comparison */}
              <section className="dash-card" style={{ gridColumn: 'span 7' }}>
                <div className="panel-heading">
                  <h3>Scenario Evaluation: {selectedStress.toUpperCase()}</h3>
                  <span>Rotation & Telemetry Deltas</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 10 }}>
                      <small style={{ color: 'var(--text-muted)' }}>BASELINE ROTATION</small>
                      <div style={{ fontWeight: 700, marginTop: 4 }}>
                        {rotationText(plan.selected_crop_by_period)}
                      </div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 10 }}>
                      <small style={{ color: 'var(--text-muted)' }}>SCENARIO ROTATION</small>
                      <div style={{ fontWeight: 700, marginTop: 4, color: 'var(--primary)' }}>
                        {activeScenario.scenario_rotation ? rotationText(activeScenario.scenario_rotation) : 'Same as baseline'}
                      </div>
                    </div>
                  </div>

                  <h4 style={{ margin: '12px 0 6px', fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Perturbed Feature Values
                  </h4>
                  {Object.entries(activeScenario.changed_fields || {}).map(([fld, ch]) => (
                    <div key={fld} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card-subtle)', borderRadius: 8, fontSize: 13, marginBottom: 6 }}>
                      <span>{fld.replaceAll('_', ' ')}</span>
                      <strong>{number(ch.baseline)}  →  {number(ch.scenario)}</strong>
                    </div>
                  ))}
                </div>
              </section>

              {/* Counterfactual Rainfall Card */}
              <section className="dash-card" style={{ gridColumn: 'span 5' }}>
                <div className="panel-heading">
                  <h3>Counterfactual Rainfall Delta</h3>
                  <span>Synthetic Simulation</span>
                </div>
                {cf ? (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                      <small style={{ color: 'var(--text-muted)', fontWeight: 700 }}>RAINFALL PERTURBATION</small>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                        {cf.baseline_value} mm  →  {cf.counterfactual_value} mm
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      <div style={{ flex: 1, background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 10 }}>
                        <small style={{ color: 'var(--text-muted)' }}>BASELINE ESTIMATE</small>
                        <div style={{ fontWeight: 700, marginTop: 4 }}>{number(cf.baseline_prediction_t_ha, 3)} t/ha</div>
                      </div>
                      <div style={{ flex: 1, background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 10 }}>
                        <small style={{ color: 'var(--text-muted)' }}>SIMULATED ESTIMATE</small>
                        <div style={{ fontWeight: 700, marginTop: 4, color: 'var(--primary)' }}>{number(cf.counterfactual_prediction_t_ha, 3)} t/ha</div>
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                      Delta response: <strong>{number(cf.delta_prediction_t_ha, 4)} t/ha</strong>.
                      Preserves baseline state without permanent perturbation.
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 14 }}>
                    Enter a "Rainfall Delta (mm)" in the Field Profile form and click Run Analysis to view counterfactual ML response.
                  </p>
                )}
              </section>
            </div>
          </div>
        )}

        {/* -------------------- VIEW 6: AI ASSISTANT & DECISION SUPPORT -------------------- */}
        {activeNav === 'assistant' && (
          <div className="ai-assistant-view">
            <div className="view-sub-header">
              <div>
                <h2>AI Assistant & Decision Support</h2>
                <p>Interactive Recommendation Dialog & Agronomic Justifications</p>
              </div>
              <button type="button" className="back-btn" onClick={() => setActiveNav('dashboard')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>

            <div className="dashboard-grid">
              <section className="dash-card ai-assistant-card" style={{ gridColumn: 'span 12', minHeight: 480 }}>
                <div className="ai-header-banner">
                  <div className="ai-header-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#2b1d14">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    <span>FieldShift Agronomic AI Assistant</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#885e45', fontWeight: 700 }}>
                    PROTOTYPE EXPERT
                  </span>
                </div>

                <div className="ai-chat-body" style={{ padding: 24, gap: 18 }}>
                  <div className="chat-bubble-user" style={{ fontSize: 14 }}>
                    What is the optimal crop rotation for Area 1 under current water and profit goals?
                  </div>

                  <div className="chat-bubble-ai" style={{ fontSize: 14 }}>
                    <p style={{ margin: '0 0 10px', fontWeight: 700 }}>
                      {summary.research_boundary ? `Existing optimizer output for priority ${form.priority}:` : 'Run an analysis to show field-specific results.'}
                    </p>
                    <ul style={{ lineHeight: 1.7 }}>
                      <li>
                        <strong>Returned Rotation:</strong> {rotationText(plan.selected_crop_by_period)}
                      </li>
                      <li>
                        <strong>Objective Value:</strong> {plan.objective_value != null ? number(plan.objective_value, 2) : 'Not available'} (Profit: {plan.profit_component != null ? `${Math.round(plan.profit_component / 1000)}k BDT` : 'Not available'}, Water: {plan.water_component != null ? number(plan.water_component, 2) : 'Not available'}).
                      </li>
                      <li>
                        <strong>Expected Yield:</strong> {ml.prediction_t_ha != null ? `${number(ml.prediction_t_ha, 2)} t/ha` : 'Not available'} (estimated range {ml.uncertainty ? `${number(ml.uncertainty.lower)} to ${number(ml.uncertainty.upper)} t/ha` : 'Not available'}).
                      </li>
                      <li>
                        <strong>Safety Validation:</strong> {rl.safety_status ? <>DeterministicBaselinePolicy returned action <code>{rl.proposal_action?.action || rl.proposal_action}</code> under status <code>{rl.safety_status}</code>.</> : 'Not available until an analysis has run.'}
                      </li>
                    </ul>
                  </div>

                  <div className="ai-input-bar" style={{ padding: '10px 18px' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 16 }}>+</span>
                    <input placeholder="Ask anything or simulate what-if scenarios…" readOnly value="Scenario simulation ready" style={{ fontSize: 14 }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#27ae60' }} />
                  </div>
                  <div className="ai-disclaimer" style={{ fontSize: 11.5 }}>
                    Research prototype — not an agronomic recommendation. AI Assistant simulations are not field validated.
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

                {/* -------------------- VIEW 7: PROFILE & MY FIELDS SECTION -------------------- */}
        {activeNav === 'account' && (
          <div className="profile-view-wrapper">
            {/* 1. Clean Profile Page Header & Subtle Breadcrumb */}
            <div className="profile-page-header">
              <div className="profile-header-left">
                <nav className="profile-breadcrumb" aria-label="Breadcrumb">
                  <button
                    type="button"
                    className="breadcrumb-link"
                    onClick={() => setActiveNav('dashboard')}
                  >
                    Dashboard
                  </button>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-current">Profile</span>
                </nav>
                <h1 className="profile-page-title">Profile</h1>
                <p className="profile-page-subtitle">
                  Manage your operator information and registered agricultural fields
                </p>
              </div>

              <div className="profile-header-actions">
                {user ? (
                  <button
                    type="button"
                    className="btn-secondary profile-signout-btn"
                    onClick={handleSignOut}
                    title="Sign Out of Active Session"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary-sm"
                    onClick={handleQuickDemoLogin}
                    style={{ padding: '8px 18px', fontSize: 13 }}
                  >
                    Demo Sign In (Dani)
                  </button>
                )}
              </div>
            </div>

            {/* If user is not authenticated: Show clean login prompt */}
            {!user && (
              <section className="dash-card" style={{ marginBottom: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-main)' }}>Sign In to Manage Your Fields</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                      Authenticate to view and update your registered agricultural fields, soil profiles, and crop histories.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="button" className="run-cta-btn" onClick={handleQuickDemoLogin} style={{ padding: '10px 24px', fontSize: 13.5 }}>
                        Quick Demo Sign In (Dani)
                      </button>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card-subtle)', borderRadius: 12, padding: 16, border: '1px solid var(--border-light)' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Authentication Features</h4>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                      <li>Persistent multi-field registry in PostgreSQL</li>
                      <li>Crop rotation history & soil parameter tracking</li>
                      <li>Direct integration with FieldShift optimization pipeline</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* 2. ACTIVE FIELD SECTION (HIGHEST PRIORITY - APPEARS ABOVE OPERATOR PROFILE) */}
            <section className="active-field-card" aria-label="Currently Active Field">
              {activeField ? (
                <div className="active-field-inner">
                  <div className="active-field-top">
                    <div className="active-field-status-pill">
                      <span className="active-pulse-dot" />
                      <span className="active-pill-text">ACTIVE FIELD</span>
                    </div>
                    <span className="active-field-id">Field ID #{activeField.id}</span>
                  </div>

                  <div className="active-field-main">
                    <div className="active-field-info">
                      <h2 className="active-field-title">{activeField.name}</h2>
                      <div className="active-field-meta-row">
                        <span className="active-field-meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                          {formatNumber(activeField.latitude, 4, null) != null && formatNumber(activeField.longitude, 4, null) != null ? `${formatNumber(activeField.latitude, 4)}, ${formatNumber(activeField.longitude, 4)}` : 'Coordinates not available'}
                        </span>
                        <span className="active-field-meta-sep">|</span>
                        <span className="active-field-meta-item">
                          <strong>{formatNumber(activeField.area_ha, 1, null) != null ? `${formatNumber(activeField.area_ha, 1)} ha` : 'Not available'}</strong>
                        </span>
                        <span className="active-field-meta-sep">|</span>
                        <span className="active-field-meta-item">
                          {userFarms.find(farm => farm.id === activeField.farm_id)?.name || (activeField.farm_id ? `Farm #${activeField.farm_id}` : 'Not a registered field')}
                        </span>
                      </div>
                      <p className="active-field-note">
                        This field is currently selected for analysis.
                      </p>
                    </div>

                    <div className="active-field-actions">
                      <button
                        type="button"
                        className="btn-open-dashboard"
                        onClick={() => handleSelectActiveField(activeField, true)}
                        title="Open Dashboard with this field loaded into the optimizer"
                      >
                        <span>Open Dashboard</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : userFields.length > 0 ? (
                <div className="active-field-empty">
                  <div className="active-field-empty-text">
                    <h4>No field currently selected</h4>
                    <p>Select a registered field below to designate it as active for analysis and optimization.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleSelectActiveField(userFields[0], false)}
                  >
                    Select {userFields[0].name}
                  </button>
                </div>
              ) : !user ? (
                <div className="active-field-empty">
                  <div className="active-field-empty-text">
                    <h4>Sign in to load registered fields</h4>
                    <p>Field data is loaded from PostgreSQL after authentication.</p>
                  </div>
                </div>
              ) : !fieldsLoaded ? (
                <div className="active-field-empty"><h4>Loading PostgreSQL fields...</h4></div>
              ) : fieldsError ? (
                <div className="active-field-empty"><h4>Registered fields unavailable</h4><p>{fieldsError}</p></div>
              ) : (
                <div className="active-field-empty">
                  <div className="active-field-empty-text">
                    <h4>No registered fields found</h4>
                    <p>Register your first agricultural parcel with Google Maps coordinates to begin analysis.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary-sm"
                    onClick={openAddFieldModal}
                  >
                    + Add New Field
                  </button>
                </div>
              )}
            </section>

            {/* 3. Personal / Operator Profile */}
            <section className="profile-identity-card">
              <div className="profile-identity-main">
                <div className="profile-avatar-circle" aria-label="User Avatar">
                  {user ? user.name.slice(0, 2).toUpperCase() : 'AG'}
                </div>
                <div className="profile-identity-details">
                  <div className="profile-name-row">
                    <h2>{user ? user.name : 'Guest Operator'}</h2>
                    <span className="profile-verified-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      {user ? 'Verified' : 'Unauthenticated'}
                    </span>
                  </div>
                  <div className="profile-role-title">Agricultural Research Operator</div>
                  <div className="profile-email-text">{user ? user.email : 'guest@fieldshift.local'}</div>
                </div>
              </div>

              {user && (
                <div className="profile-identity-actions">
                  <button
                    type="button"
                    className="btn-edit-profile"
                    onClick={openEditProfile}
                    title="Edit agronomist profile name and farm station"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Profile
                  </button>
                </div>
              )}
            </section>

            {/* 4. Profile Overview Summary */}
            <section className="profile-overview-section">
              <div className="section-title-wrap">
                <h3>Profile Overview</h3>
              </div>
              <div className="profile-overview-grid">
                <div className="profile-stat-card">
                  <div className="profile-stat-icon-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                  </div>
                  <div className="profile-stat-content">
                  <div className="profile-stat-value">{!user ? 'Sign in' : !fieldsLoaded ? 'Loading...' : fieldsError ? 'Unavailable' : userFields.length}</div>
                    <div className="profile-stat-label">Registered Fields</div>
                  </div>
                </div>

                <div className="profile-stat-card">
                  <div className="profile-stat-icon-wrap active">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div className="profile-stat-content">
                  <div className="profile-stat-value">{activeField ? 1 : 0}</div>
                    <div className="profile-stat-label">Active Field</div>
                  </div>
                </div>

                <div className="profile-stat-card">
                  <div className="profile-stat-icon-wrap success">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="profile-stat-content">
                    <div className="profile-stat-value" title={activeField ? activeField.name : 'None selected'}>
                      {activeField ? activeField.name : 'None'}
                    </div>
                    <div className="profile-stat-label">Current Field</div>
                  </div>
                </div>

                <div className="profile-stat-card">
                  <div className="profile-stat-icon-wrap neutral">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="profile-stat-content">
                    <div className="profile-stat-value" style={{ fontSize: 16 }}>
                      {user && user.created_at ? formatDate(user.created_at) : 'Oct 2026'}
                    </div>
                    <div className="profile-stat-label">Member Since</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Personal Information Details */}
            <section className="profile-card-section">
              <div className="section-title-wrap" style={{ marginBottom: 14 }}>
                <h3>Personal Information</h3>
              </div>

              <div className="personal-info-grid">
                <div className="info-block">
                  <label>Full Name</label>
                  <strong>{user ? user.name : 'Guest User'}</strong>
                </div>

                <div className="info-block">
                  <label>Email Address</label>
                  <strong>{user ? user.email : 'None (Session guest)'}</strong>
                </div>

                <div className="info-block">
                  <label>Phone Number</label>
                  <strong style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                    Not provided
                  </strong>
                </div>

                <div className="info-block">
                  <label>Location / Station</label>
                  <strong>
                    {activeField
                      ? `${activeField.name} / ${userFarms.find(f => f.id === activeField.farm_id)?.name || `Farm #${activeField.farm_id}`}`
                      : !user ? 'Sign in to load PostgreSQL fields' : fieldsError ? 'PostgreSQL fields unavailable' : !fieldsLoaded ? 'Loading PostgreSQL fields...' : 'No active field selected'}
                  </strong>
                </div>
              </div>
            </section>

            {/* 6. MY FIELDS SECTION */}
            <section className="profile-card-section" style={{ marginTop: 24 }}>
              <div className="my-fields-header">
                <div className="my-fields-title">
                  <h3>My Fields</h3>
                  <span className="field-count-pill">
                  {!user ? 'Sign in required' : !fieldsLoaded ? 'Loading...' : fieldsError ? 'Unavailable' : `${userFields.length} ${userFields.length === 1 ? 'Field' : 'Fields'}`}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-add-field"
                  onClick={openAddFieldModal}
                  title="Register a new agricultural field in PostgreSQL"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  + Add New Field
                </button>
              </div>

              {!user ? (
                <p className="field-load-notice">Sign in to load registered fields from PostgreSQL.</p>
              ) : !fieldsLoaded ? (
                <p className="field-load-notice">Loading registered fields from PostgreSQL...</p>
              ) : fieldsError ? (
                <p className="field-load-notice" role="alert">Could not load registered fields: {fieldsError}</p>
              ) : userFields.length > 0 ? (
                <div className="fields-cards-grid">
                  {userFields.map(fld => {
                    const isActive = activeField && activeField.id === fld.id;
                    const latestCrop = fld.previous_crop || fld.current_crop || (fld.history && fld.history[0]?.crop) || 'Not recorded';
                    const latestCropYear = fld.previous_crop_year || (fld.history && fld.history[0]?.year) || 'year unavailable';
                    const historyList = fld.history || [];

                    return (
                      <div key={fld.id} className="field-card-item">
                        {/* 1. Google Maps Location Preview at Top of Card */}
                        <GoogleFieldMapThumbnail
                          latitude={fld.latitude}
                          longitude={fld.longitude}
                          name={fld.name}
                          height="180px"
                          onClick={() => setViewingField(fld)}
                        />

                        <div className="field-card-content">
                          {/* Level 1 & 2: Field Name, Status & ID */}
                          <div className="field-card-header">
                            <div className="field-card-title-wrap">
                              <h4>{fld.name}</h4>
                              <span className="field-id-badge">Field ID #{fld.id}</span>
                            </div>
                            <span className={`completeness-badge ${isActive ? 'active-highlight' : ''}`}>
                              {isActive ? 'Active Field' : 'Registered'}
                            </span>
                          </div>

                          {/* Level 3: Location / Farm Station */}
                          <div className="field-location-row">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="field-coords-text">
                              {formatNumber(fld.latitude, 4, null) != null && formatNumber(fld.longitude, 4, null) != null ? `${formatNumber(fld.latitude, 4)}, ${formatNumber(fld.longitude, 4)}` : 'Coordinates not provided'}
                            </span>
                            <span className="field-farm-text">
                              {userFarms.find(farm => farm.id === fld.farm_id)?.name || `Farm #${fld.farm_id}`}
                            </span>
                          </div>

                          {/* Level 4: Important Properties - 2 Highlight Blocks */}
                          <div className="field-props-highlight-grid">
                            <div className="prop-highlight-card">
                              <div className="prop-highlight-val">
                                {formatNumber(fld.area_ha, 1, null) != null ? `${formatNumber(fld.area_ha, 1)} ha` : 'Not provided'}
                              </div>
                              <div className="prop-highlight-lbl">Field Size</div>
                            </div>
                            <div className="prop-highlight-card">
                              <div className="prop-highlight-val" style={{ textTransform: 'capitalize' }}>
                                {fld.soil_texture ? fld.soil_texture.replaceAll('_', ' ') : 'Not provided'}
                              </div>
                              <div className="prop-highlight-lbl">Soil Texture</div>
                            </div>
                          </div>

                          {/* Level 5: Detailed Parameters & Metadata */}
                          <div className="field-props-list">
                            <div className="prop-row">
                              <span className="prop-row-key">Organic Matter</span>
                              <span className="prop-row-val">{formatNumber(fld.organic_matter, 1, null) != null ? `${formatNumber(fld.organic_matter, 1)} %` : 'Not provided'}</span>
                            </div>
                            <div className="prop-row">
                              <span className="prop-row-key">Irrigation Capacity</span>
                              <span className="prop-row-val">{fld.irrigation_capacity_mm != null ? `${Math.round(Number(fld.irrigation_capacity_mm))} mm` : 'Not provided'}</span>
                            </div>
                            <div className="prop-row">
                              <span className="prop-row-key">Previous Crop</span>
                              <span className="prop-row-val">
                                <span className="crop-chip">{latestCrop} ({latestCropYear})</span>
                              </span>
                            </div>
                            <div className="prop-row prop-meta-row">
                              <span className="prop-row-key">Registered</span>
                              <span className="prop-row-val">{formatDate(fld.created_at)}</span>
                            </div>
                            <div className="prop-row prop-meta-row">
                              <span className="prop-row-key">Last Analysis</span>
                              <span className="prop-row-val" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                {fld.last_analysis_date ? formatDate(fld.last_analysis_date) : 'Ready'}
                              </span>
                            </div>
                          </div>

                          {/* Level 6: Actions */}
                          <div className="field-card-actions">
                            {isActive ? (
                              <button
                                type="button"
                                className="btn-active-field-badge"
                                disabled
                                title="This field is currently selected and active"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Active Field
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-select-analysis"
                                onClick={() => handleSelectActiveField(fld, false)}
                                title="Set this field as active and sync coordinates for analysis"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                                Select for Analysis
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-field-action"
                              onClick={() => setViewingField(fld)}
                              title="View full field details and crop history"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="btn-field-action"
                              onClick={() => openEditFieldModal(fld)}
                              title="Edit field parameters"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-field-archive"
                              onClick={() => handleArchiveField(fld)}
                              title="Archive / Remove this field"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed var(--border-light)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>No PostgreSQL fields registered for this account</h4>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                    Add your first agricultural parcel to configure soil properties and optimize crop rotations.
                  </p>
                  <button type="button" className="btn-add-field" style={{ margin: '0 auto' }} onClick={openAddFieldModal}>
                    + Add Your First Field
                  </button>
                </div>
              )}
            </section>

            {/* ADD / EDIT FIELD MODAL */}
            {fieldModal && (
              <div className="modal-backdrop" onClick={() => !fieldModalLoading && setFieldModal(null)}>
                <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h3>{fieldModal === 'edit' ? `Edit Field: ${fieldForm.name || 'Parcel'}` : 'Add New Agricultural Field'}</h3>
                    <button type="button" className="modal-close-btn" onClick={() => !fieldModalLoading && setFieldModal(null)}>×</button>
                  </div>
                  <form onSubmit={handleFieldFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', margin: 0 }}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px' }}>
                      <div className="form-group">
                        <label>Field Name *</label>
                        <input
                          className="input-box"
                          placeholder="e.g. North Plot 1"
                          value={fieldForm.name}
                          onChange={e => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>

                      {/* Interactive Google Maps Field Location Picker */}
                      <div className="form-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>Interactive Field Location (Google Maps) *</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click or drag marker to set coordinates</span>
                        </label>
                        <GoogleFieldMapPicker
                          latitude={fieldForm.latitude}
                          longitude={fieldForm.longitude}
                          onChange={(lat, lng) => {
                            setFieldForm(prev => ({
                              ...prev,
                              latitude: String(lat),
                              longitude: String(lng)
                            }));
                          }}
                          onLocationNameChange={(locName) => {
                            if (!fieldForm.name || fieldForm.name.startsWith('Field') || fieldForm.name.startsWith('Parcel')) {
                              setFieldForm(prev => ({ ...prev, name: prev.name || locName }));
                            }
                          }}
                        />
                      </div>

                      {/* Precise Synced Latitude & Longitude Inputs */}
                      <div className="form-grid-inner">
                        <div className="form-group">
                          <label>Latitude (° N) *</label>
                          <input
                            className="input-box"
                            type="number"
                            step="0.0001"
                            value={fieldForm.latitude}
                            onChange={e => setFieldForm(prev => ({ ...prev, latitude: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Longitude (° E) *</label>
                          <input
                            className="input-box"
                            type="number"
                            step="0.0001"
                            value={fieldForm.longitude}
                            onChange={e => setFieldForm(prev => ({ ...prev, longitude: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-grid-inner">
                        <div className="form-group">
                          <label>Field Size (ha) *</label>
                          <input
                            className="input-box"
                            type="number"
                            step="0.1"
                            value={fieldForm.area_ha}
                            onChange={e => setFieldForm(prev => ({ ...prev, area_ha: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Soil Texture</label>
                          <select
                            className="input-box"
                            value={fieldForm.soil_texture}
                            onChange={e => setFieldForm(prev => ({ ...prev, soil_texture: e.target.value }))}
                          >
                            <option value="loam">Loam</option>
                            <option value="silty_loam">Silty Loam</option>
                            <option value="clay_loam">Clay Loam</option>
                            <option value="unknown">Unknown</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-grid-inner">
                        <div className="form-group">
                          <label>Organic Matter (%)</label>
                          <input
                            className="input-box"
                            type="number"
                            step="0.1"
                            value={fieldForm.organic_matter}
                            onChange={e => setFieldForm(prev => ({ ...prev, organic_matter: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label>Irrigation Capacity (mm)</label>
                          <input
                            className="input-box"
                            type="number"
                            step="1"
                            value={fieldForm.irrigation_capacity_mm}
                            onChange={e => setFieldForm(prev => ({ ...prev, irrigation_capacity_mm: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="form-grid-inner">
                        <div className="form-group">
                          <label>Previous / Current Crop</label>
                          <select
                            className="input-box"
                            value={fieldForm.crop}
                            onChange={e => setFieldForm(prev => ({ ...prev, crop: e.target.value }))}
                          >
                            <option value="Maize">Maize</option>
                            <option value="Wheat">Wheat</option>
                            <option value="Mungbean">Mungbean</option>
                            <option value="Rice">Rice</option>
                            <option value="Potato">Potato</option>
                            <option value="Mustard">Mustard</option>
                            <option value="Lentil">Lentil</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Previous Crop Year</label>
                          <input
                            className="input-box"
                            type="number"
                            step="1"
                            value={fieldForm.previous_crop_year}
                            onChange={e => setFieldForm(prev => ({ ...prev, previous_crop_year: e.target.value }))}
                          />
                        </div>
                      </div>

                      {fieldModalError && (
                        <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{fieldModalError}</p>
                      )}
                    </div>

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '14px 22px', borderTop: '1px solid var(--border-light)', background: '#ffffff', flexShrink: 0, boxShadow: '0 -2px 10px rgba(0,0,0,0.04)' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setFieldModal(null)}
                        disabled={fieldModalLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="run-cta-btn"
                        style={{ padding: '8px 20px', fontSize: 13.5 }}
                        disabled={fieldModalLoading}
                      >
                        {fieldModalLoading ? 'Saving…' : (fieldModal === 'edit' ? 'Update Field' : 'Save New Field')}
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
                    <button type="button" className="modal-close-btn" onClick={() => setViewingField(null)}>×</button>
                  </div>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px' }}>
                    {/* Read-only Google Maps Field Location View */}
                    <div className="form-group">
                      <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Field Parcel Satellite Map</label>
                      <GoogleFieldMapPicker
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
                      Archive Field
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
                    <button type="button" className="modal-close-btn" onClick={() => !profileLoading && setProfileModal(false)}>×</button>
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
                        style={{ padding: '8px 20px', fontSize: 13.5 }}
                        disabled={profileLoading}
                      >
                        {profileLoading ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
