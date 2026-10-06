const form = document.getElementById('farmForm');
const formStepLabel = document.querySelector('.form-card .step-label');
const statusMessage = document.getElementById('statusMessage');
const resultContent = document.getElementById('resultContent');
const resultOutput = document.getElementById('resultOutput');
const rawDetails = document.getElementById('rawDetails');
const resultBadge = document.getElementById('resultBadge');
const connectionBadge = document.getElementById('connectionBadge');
const heroStatus = document.getElementById('heroStatus');
const heroStatusDetail = document.getElementById('heroStatusDetail');
const heroMode = document.getElementById('heroMode');
const runButton = document.getElementById('runButton');
const runButtonLabel = runButton.querySelector('.button-label');
const geoButton = document.getElementById('geoButton');
const geoButtonLabel = geoButton.querySelector('.geo-button-label');
const weatherButton = document.getElementById('weatherButton');
const weatherButtonLabel = weatherButton.querySelector('.weather-button-label');
const stepBackButton = document.getElementById('stepBackButton');
const stepNextButton = document.getElementById('stepNextButton');
const formCard = document.querySelector('.form-card');
const resultsCard = document.getElementById('results');
const workspace = document.querySelector('.workspace');
const healthButton = document.getElementById('healthButton');
const copyButton = document.getElementById('copyButton');
const accountButton = document.getElementById('accountButton');
const historyButton = document.getElementById('historyButton');
const accountForm = document.getElementById('accountForm');
const accountDialogTitle = document.getElementById('accountDialogTitle');
const accountDialogStatus = document.getElementById('accountDialogStatus');
const accountNameRow = document.getElementById('accountNameRow');
const accountModeButton = document.getElementById('accountModeButton');
const accountSubmitButton = document.getElementById('accountSubmitButton');
const historyDialog = document.getElementById('historyDialog');
const historyList = document.getElementById('historyList');
const landingView = document.getElementById('landingView');
const appWorkspace = document.getElementById('appWorkspace');
const accountView = document.getElementById('accountView');
let accountMode = 'login';
let currentUser = null;
let savedFieldId = null;
let accountReturnView = 'landing';
let weatherRequestId = 0;
let currentFormStep = 1;

const labels = {
  soil_texture: { loam: 'Loam', silty_loam: 'Silty loam', clay_loam: 'Clay loam', unknown: 'Unknown' },
  priority: { profit: 'Profit', water_efficiency: 'Water efficiency', soil_health: 'Soil health' },
  season: { dry: 'Dry season', wet: 'Wet season', transition: 'Transition' }
};

function openWorkspace() {
  landingView.hidden = true;
  appWorkspace.hidden = false;
  showWorkspaceView('setup');
  setFormStep(1);
  document.querySelector('.topbar').classList.add('workspace-mode');
  document.getElementById('breadcrumbFarm').textContent = currentUser ? `${currentUser.name}'s Farm` : 'Demo Farm';
  document.getElementById('breadcrumbSize').textContent = `${form.elements.field_size_ha.value || '—'} ha · 3-season plan`;
  document.getElementById('sidebarFarmName').textContent = currentUser ? `${currentUser.name}'s Farm` : 'Demo Farm';
  document.getElementById('sidebarFarmMeta').textContent = `${form.elements.field_size_ha.value || '—'} ha · 3-season plan`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showWorkspaceView(view) {
  const showingResults = view === 'results';
  workspace.classList.toggle('results-mode', showingResults);
  formCard.hidden = showingResults;
  resultsCard.hidden = !showingResults;
  const eyebrow = document.querySelector('.workspace-intro .eyebrow');
  if (showingResults) {
    eyebrow.textContent = 'RESEARCH OUTPUT';
    document.getElementById('workspaceTitle').textContent = 'Review your field plan';
    document.getElementById('workspaceDescription').textContent =
      'Explore scenario impacts and compare the optimizer output with the clearly stated limits of the current RL baseline.';
  } else {
    setFormStep(currentFormStep);
  }
}

function setFormStep(step) {
  currentFormStep = Math.min(3, Math.max(1, step));
  document.querySelectorAll('[data-form-step]').forEach((section) => {
    section.hidden = Number(section.dataset.formStep) !== currentFormStep;
  });
  document.querySelectorAll('[data-step-indicator]').forEach((indicator) => {
    const indicatorStep = Number(indicator.dataset.stepIndicator);
    indicator.classList.toggle('active', indicatorStep === currentFormStep);
    indicator.classList.toggle('complete', indicatorStep < currentFormStep);
    if (indicatorStep === currentFormStep) indicator.setAttribute('aria-current', 'step');
    else indicator.removeAttribute('aria-current');
  });
  document.getElementById('formCardTitle').textContent = [
    'Set your field location',
    'Describe your field',
    'Choose your planning preferences'
  ][currentFormStep - 1];
  document.getElementById('workspaceTitle').textContent = [
    'Start with your location',
    'Add the field details you know',
    'Choose what your plan should prioritize'
  ][currentFormStep - 1];
  document.getElementById('workspaceDescription').textContent = [
    'Set the area and weather dates. You can use your device location or enter coordinates.',
    'Add what you know about your farm. Optional details can be left blank.',
    'Pick a weather source, season and priority before running the research workflow.'
  ][currentFormStep - 1];
  document.querySelector('.workspace-intro .eyebrow').textContent = [
    'FIELD PROFILE',
    'FIELD PROFILE',
    'PLAN PREFERENCES'
  ][currentFormStep - 1];
  document.getElementById('stepCounter').textContent = `Step ${currentFormStep} of 3`;
  document.getElementById('breadcrumbStep').textContent =
    ['Location', 'Field details', 'Priorities'][currentFormStep - 1];
  stepBackButton.hidden = currentFormStep === 1;
  stepNextButton.hidden = currentFormStep === 3;
  runButton.hidden = currentFormStep !== 3;
  const stepName = ['LOCATION', 'FIELD DETAILS', 'PLAN PREFERENCES'][currentFormStep - 1];
  formStepLabel.replaceChildren(
    document.createTextNode(String(currentFormStep).padStart(2, '0')),
    node('span', '', stepName)
  );
}

function showLanding(targetId) {
  appWorkspace.hidden = true;
  landingView.hidden = false;
  accountView.hidden = true;
  document.querySelector('.topbar').classList.remove('workspace-mode');
  document.querySelector('.topbar').classList.remove('account-mode');
  window.setTimeout(() => {
    if (targetId) document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 0);
}

function showAccountPage() {
  accountReturnView = appWorkspace.hidden ? 'landing' : 'workspace';
  landingView.hidden = true;
  appWorkspace.hidden = true;
  accountView.hidden = false;
  document.querySelector('.topbar').classList.remove('workspace-mode');
  document.querySelector('.topbar').classList.add('account-mode');
  document.getElementById('closeAccountDialog').querySelector('span').textContent =
    accountReturnView === 'workspace' ? 'Back to planning' : 'Back to overview';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  accountForm.elements.email.focus();
}

function closeAccountPage() {
  accountView.hidden = true;
  if (accountReturnView === 'workspace') {
    landingView.hidden = true;
    appWorkspace.hidden = false;
    document.querySelector('.topbar').classList.remove('account-mode');
    document.querySelector('.topbar').classList.add('workspace-mode');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    showLanding();
  }
}

function updateWorkflowNavigation(target) {
  document.querySelectorAll('[data-workflow-nav]').forEach((link) => {
    link.classList.toggle('active', link.dataset.workflowNav === target);
  });
  const ordered = ['dashboard', 'fieldSetup', 'aiInsights', 'rotationPlan', 'stressTest', 'whatIfAnalysis', 'rlSimulation'];
  const index = ordered.indexOf(target);
  document.querySelectorAll('.workflow-dots i').forEach((dot, dotIndex) => {
    dot.classList.toggle('done', index >= 0 && dotIndex < index);
    dot.classList.toggle('active', dotIndex === Math.max(index, 0));
  });
  const labelsByTarget = {
    fieldSetup: 'My Field',
    dashboard: 'Dashboard',
    aiInsights: 'AI Insights',
    rotationPlan: 'Crop Rotation',
    stressTest: 'Stress Test',
    whatIfAnalysis: 'What-if Analysis',
    rlSimulation: 'RL Simulation',
    history: 'Field History'
  };
  document.getElementById('breadcrumbStep').textContent = labelsByTarget[target] || 'My Field';
}

function setStatus(message, type = 'info') {
  statusMessage.className = `status-message ${type}`;
  statusMessage.replaceChildren();
  const symbol = document.createElement('span');
  symbol.className = 'status-symbol';
  symbol.setAttribute('aria-hidden', 'true');
  symbol.textContent = type === 'success' ? '✓' : type === 'warning' ? '!' : '✦';
  const text = document.createElement('span');
  text.textContent = message;
  statusMessage.append(symbol, text);
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = String(text);
  return element;
}

function formatValue(value, digits = 2) {
  if (value === null || value === undefined || value === '') return 'Not available';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : String(value);
}

function displayDate(value) {
  if (!value) return 'date unavailable';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function updateLocationCoordinates() {
  weatherRequestId += 1;
  geoButton.disabled = false;
  weatherButton.disabled = false;
  geoButtonLabel.textContent = 'Use my location';
  weatherButtonLabel.textContent = 'Load weather';
  const latitude = form.elements.latitude.value || '—';
  const longitude = form.elements.longitude.value || '—';
  document.getElementById('locationCoordinates').textContent = `${latitude}, ${longitude}`;
  document.getElementById('locationName').textContent = 'Location not checked';
  document.getElementById('weatherTemperature').replaceChildren(
    document.createTextNode('—'),
    node('small', '', '°C')
  );
  document.getElementById('weatherRange').textContent = 'High — · Low —';
  document.getElementById('weatherObservation').textContent = 'Check this area to load available weather.';
  const status = document.getElementById('locationStatus');
  status.classList.remove('error');
  status.textContent = 'Weather uses the latest available NASA POWER daily observation, not a live thermometer reading.';
}

async function loadAreaWeather(latitudeValue, longitudeValue) {
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    setStatus('Enter a latitude between -90 and 90 degrees.', 'warning');
    form.elements.latitude.focus();
    return;
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    setStatus('Enter a longitude between -180 and 180 degrees.', 'warning');
    form.elements.longitude.focus();
    return;
  }

  const requestId = ++weatherRequestId;
  const locationName = document.getElementById('locationName');
  const locationCoordinates = document.getElementById('locationCoordinates');
  const temperature = document.getElementById('weatherTemperature');
  const weatherRange = document.getElementById('weatherRange');
  const observation = document.getElementById('weatherObservation');
  const locationStatus = document.getElementById('locationStatus');
  geoButton.disabled = true;
  weatherButton.disabled = true;
  geoButtonLabel.textContent = 'Finding area…';
  weatherButtonLabel.textContent = 'Loading…';
  locationName.textContent = 'Finding your area…';
  locationCoordinates.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  temperature.innerHTML = '… <small>°C</small>';
  weatherRange.textContent = 'Loading daily weather';
  observation.textContent = 'Connecting to NASA POWER…';
  locationStatus.classList.remove('error');
  locationStatus.textContent = 'Looking up the place name and the latest available daily observation.';

  try {
    const result = await apiRequest('/api/location/weather', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude })
    });
    if (requestId !== weatherRequestId) return;
    const bundledLocation =
      Math.abs(latitude - 23.8103) <= 0.0001 &&
      Math.abs(longitude - 90.4125) <= 0.0001;
    const switchedToLive = !bundledLocation && form.elements.mode.value === 'offline';
    if (switchedToLive) {
      form.elements.mode.value = 'live';
      form.elements.mode.dispatchEvent(new Event('change', { bubbles: true }));
    }
    locationName.textContent = result.location_name || 'Area name unavailable';
    locationCoordinates.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    if (result.weather?.temperature_c === null || result.weather?.temperature_c === undefined) {
      temperature.replaceChildren(document.createTextNode('—'), node('small', '', '°C'));
      weatherRange.textContent = 'Temperature unavailable';
      observation.textContent = 'No valid temperature observation was returned.';
    } else {
      temperature.replaceChildren(
        document.createTextNode(formatValue(result.weather.temperature_c, 1)),
        node('small', '', '°C')
      );
      const high = result.weather.temp_max_c;
      const low = result.weather.temp_min_c;
      weatherRange.textContent = `High ${high === null ? '—' : `${formatValue(high, 1)}°`} · Low ${low === null ? '—' : `${formatValue(low, 1)}°`}`;
      observation.textContent = `Observed ${displayDate(result.weather.observation_date)} · NASA POWER`;
    }
    const requestedThrough = result.weather_requested_through
      ? `Requested through ${displayDate(result.weather_requested_through)}. `
      : '';
    locationStatus.textContent = `${result.location_message ? `${result.location_message} ` : ''}${requestedThrough}${result.weather_note}`;
    setStatus(
      result.weather?.temperature_c === null || result.weather?.temperature_c === undefined
        ? 'Area found, but NASA POWER returned no recent temperature observation.'
        : switchedToLive
          ? `Loaded the latest daily temperature for ${result.location_name || 'your coordinates'}. NASA POWER live retrieval is selected because the offline demo covers only Dhaka.`
          : `Loaded the latest daily temperature for ${result.location_name || 'your coordinates'}.`,
      result.weather?.temperature_c === null || result.weather?.temperature_c === undefined ? 'warning' : 'success'
    );
  } catch (error) {
    if (requestId !== weatherRequestId) return;
    locationName.textContent = 'Area lookup incomplete';
    temperature.replaceChildren(document.createTextNode('—'), node('small', '', '°C'));
    weatherRange.textContent = 'Weather unavailable';
    observation.textContent = 'Check your connection and try again.';
    locationStatus.classList.add('error');
    locationStatus.textContent = error.message;
    setStatus(`Could not load area weather: ${error.message}`, 'warning');
  } finally {
    if (requestId === weatherRequestId) {
      geoButton.disabled = false;
      weatherButton.disabled = false;
      geoButtonLabel.textContent = 'Use my location';
      weatherButtonLabel.textContent = 'Load weather';
    }
  }
}

function createMetric(label, value, unit, detail) {
  const card = node('div', 'metric-card');
  card.append(node('div', 'metric-label', label));
  const mainValue = node('div', 'metric-value');
  mainValue.append(document.createTextNode(value));
  if (unit) mainValue.append(node('small', '', unit));
  card.append(mainValue);
  if (detail) card.append(node('div', 'metric-sub', detail));
  return card;
}

const stressScenarioDetails = {
  normal: {
    title: 'Normal conditions',
    summary: 'Baseline season conditions',
    icon: '◉'
  },
  drought: {
    title: 'Drought stress',
    summary: 'Hypothetical soil-moisture reduction',
    icon: '☀'
  },
  heat: {
    title: 'Heat stress',
    summary: 'Hypothetical temperature increase',
    icon: '△'
  },
  low_water: {
    title: 'Water shortage',
    summary: 'Reduced seasonal water, when provided',
    icon: '◎'
  }
};

function displayRotation(rotation) {
  if (!rotation || typeof rotation !== 'object') return 'No rotation available';
  return Object.entries(rotation)
    .map(([period, crop]) => `${period.replaceAll('_', ' ')} · ${crop}`)
    .join(' → ');
}

function renderStressScenario(stress, rl, selectedName) {
  const scenarios = stress.scenarios || {};
  const scenario = scenarios[selectedName];
  const detail = stressScenarioDetails[selectedName];
  const view = document.getElementById('stressScenarioView');
  if (!scenario || !detail || !view) return;

  const compare = node('div', 'stress-comparison');
  const heading = node('div', 'stress-view-heading');
  heading.append(
    node('div', 'stress-view-kicker', 'SCENARIO COMPARISON'),
    node('h4', '', `Baseline vs ${detail.title}`)
  );
  const stateBadge = node(
    'span',
    `stress-state-badge ${scenario.status === 'not_applicable' ? 'unavailable' : ''}`,
    scenario.status === 'not_applicable' ? 'Not available' : scenario.status || 'Not run'
  );
  heading.append(stateBadge);
  compare.append(heading);

  const fields = scenario.changed_fields || {};
  const fieldEntries = Object.entries(fields);
  const metrics = node('div', 'stress-metric-grid');
  if (fieldEntries.length) {
    fieldEntries.forEach(([name, change]) => {
      const baseline = change.baseline;
      const changed = change.scenario;
      const isFraction = name === 'soil_moisture';
      const unit = isFraction ? 'm³/m³' : name === 'available_water_mm' ? 'mm' : '°C';
      const digits = isFraction ? 3 : 1;
      const card = node('article', 'stress-metric-card');
      card.append(
        node('span', 'stress-metric-label', name.replaceAll('_', ' ')),
        node('span', 'stress-metric-values', `${formatValue(baseline, digits)} → ${formatValue(changed, digits)} ${unit}`),
        node('small', '', 'Observed/provided baseline → hypothetical scenario')
      );
      metrics.append(card);
    });
  } else {
    const explanation = scenario.reason || 'This scenario does not change an available input.';
    metrics.append(node('p', 'stress-unavailable', explanation));
  }
  compare.append(metrics);

  const rotationCompare = node('div', 'stress-rotation-grid');
  const baselineRotation = stress.baseline_rotation;
  const scenarioRotation = scenario.scenario_rotation;
  [
    ['Baseline rotation', baselineRotation],
    ['Scenario rotation', scenarioRotation]
  ].forEach(([label, rotation]) => {
    const card = node('article', 'stress-rotation-card');
    card.append(
      node('span', 'stress-metric-label', label),
      node('p', '', displayRotation(rotation))
    );
    rotationCompare.append(card);
  });
  compare.append(rotationCompare);
  compare.append(node(
    'p',
    'stress-plan-delta',
    scenario.rotation_changed === null || scenario.rotation_changed === undefined
      ? 'Rotation comparison is unavailable for this scenario.'
      : scenario.rotation_changed
        ? 'The optimizer returned a different rotation under this hypothetical input.'
        : 'The optimizer returned the same rotation under this hypothetical input.'
  ));

  const policy = node('aside', 'stress-policy-card');
  const policyHeader = node('div', 'stress-policy-header');
  const policyCopy = node('div');
  policyCopy.append(
    node('span', 'stress-view-kicker', 'POLICY RESPONSE'),
    node('h4', '', 'RL is not evaluating this scenario')
  );
  policyHeader.append(policyCopy, node('span', 'stress-policy-badge', 'UNTRAINED'));
  policy.append(policyHeader);
  const policyType = rl.policy_type || 'No policy information returned';
  const baselineAction = rl.proposal_action?.action || rl.proposal_action || 'Unavailable';
  policy.append(node(
    'p',
    '',
    `The current ${policyType} is a deterministic baseline, not a learned policy. Its workflow action was “${baselineAction}”; it was not re-run against each scenario.`
  ));
  policy.append(node(
    'p',
    'stress-policy-note',
    'The RL environment has no action-conditioned crop outcome or validated reward model. Scenario changes are evaluated by the existing rules/rotation optimizer, not by a trained RL policy.'
  ));
  compare.append(policy);

  compare.append(node(
    'p',
    'stress-boundary-note',
    `${scenario.reason || 'This is a deterministic what-if scenario, not a forecast.'} No yield, profit, water-saving, or RL performance score is inferred.`
  ));
  view.replaceChildren(compare);
}

function renderStressTest(stress, rl) {
  const section = node('section', 'result-section stress-test-panel');
  section.id = 'stressTest';
  const intro = node('div', 'stress-test-intro');
  intro.append(
    node('span', 'stress-view-kicker', 'FIELD CONDITIONS · WHAT-IF ANALYSIS'),
    node('h3', '', 'What if conditions change?'),
    node('p', '', 'Explore how the current rules and crop-rotation plan respond to hypothetical conditions. This does not forecast weather or test a learned RL policy.')
  );
  section.append(intro);

  const layout = node('div', 'stress-test-layout');
  const presets = node('div', 'stress-presets-card');
  presets.append(node('span', 'stress-view-kicker', 'SCENARIO PRESETS'));
  const presetList = node('div', 'stress-preset-list');
  const availableScenarios = Object.keys(stress.scenarios || {});
  const selectedName = availableScenarios.includes('drought')
    ? 'drought'
    : availableScenarios[0];
  availableScenarios.forEach((name) => {
    const detail = stressScenarioDetails[name];
    if (!detail) return;
    const result = stress.scenarios[name];
    const button = node('button', 'stress-preset-button');
    button.type = 'button';
    button.dataset.stressScenario = name;
    button.setAttribute('aria-pressed', String(name === selectedName));
    button.classList.toggle('active', name === selectedName);
    button.append(
      node('span', 'stress-preset-icon', detail.icon),
      node('strong', '', detail.title),
      node('small', '', detail.summary),
      node(
        'span',
        `stress-preset-status ${result.status === 'not_applicable' ? 'muted' : ''}`,
        result.status === 'not_applicable' ? 'Unavailable for supplied inputs' : result.status || 'Not run'
      )
    );
    presetList.append(button);
  });
  presets.append(presetList);
  layout.append(presets);
  layout.append(node('div', 'stress-scenario-view'));
  layout.lastElementChild.id = 'stressScenarioView';
  section.append(layout);

  const note = node('p', 'stress-boundary-note');
  note.textContent = 'Scenario values are controlled assumptions. Missing measurements remain unknown; unavailable scenarios are not filled with demo values.';
  section.append(note);

  section.addEventListener('click', (event) => {
    const button = event.target.closest('[data-stress-scenario]');
    if (!button || !section.contains(button)) return;
    const name = button.dataset.stressScenario;
    section.querySelectorAll('[data-stress-scenario]').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    renderStressScenario(stress, rl, name);
  });
  renderStressScenario(stress, rl, selectedName);
  return section;
}

function renderWorkflow(summary, request) {
  const ml = summary.ml || {};
  const nasa = summary.nasa_power || {};
  const planning = summary.planning || {};
  const milp = planning.milp_status || {};
  const rl = summary.rl || {};
  const periods = milp.selected_crop_by_period || {};
  const stress = summary.stress_test || {};
  const metricGrid = node('div', 'metric-grid');
  metricGrid.append(
    createMetric('ML ESTIMATE', formatValue(ml.prediction_t_ha, 2), 't/ha', 'Synthetic model estimate only'),
    createMetric('ROTATION PLAN', milp.status || 'Unavailable', '', milp.feasible || ['optimal', 'feasible'].includes(milp.status) ? 'Feasible in demo optimizer' : 'See optimizer status'),
    createMetric('WEATHER INPUT', nasa.rows ? `${nasa.rows} days` : 'Bundled demo', '', nasa.latest_valid_date ? `Through ${nasa.latest_valid_date}` : 'NASA POWER demo CSV'),
    createMetric('BASELINE ACTION', rl.proposal_action?.action || rl.proposal_action || 'Unavailable', '', `Safety: ${rl.safety_status || 'not reported'}`)
  );

  const field = summary.field_state || {};
  const environment = field.environment || field;
  const dataStatus = nasa.data_status || field.data_status?.environment || 'unknown';
  const overviewSection = node('section', 'dashboard-overview');
  overviewSection.id = 'dashboard';
  const fieldPanel = node('article', 'insight-panel field-panel');
  fieldPanel.append(node('span', 'section-kicker', 'ACTIVE FIELD'), node('h3', '', field.field_id || 'Selected field'));
  const coordinates = field.latitude !== undefined && field.longitude !== undefined
    ? `${field.latitude}, ${field.longitude}` : 'Coordinates not returned';
  fieldPanel.append(node('p', 'panel-lead', coordinates));
  const fieldDetails = node('div', 'mini-detail-grid');
  [['Area', field.field_size_ha ? `${field.field_size_ha} ha` : 'Not provided'], ['Soil', field.soil_texture || 'Not provided'], ['As of', field.as_of_date || 'Not returned']]
    .forEach(([label, value]) => { const item = node('div'); item.append(node('span', '', label), node('strong', '', value)); fieldDetails.append(item); });
  fieldPanel.append(fieldDetails, node('p', 'panel-note', 'Location is a field input. No parcel boundary, satellite layer, or field-health score is shown because none was returned by the API.'));

  const environmentalPanel = node('article', 'insight-panel environmental-panel');
  environmentalPanel.id = 'environmentalData';
  const envHeading = node('div', 'panel-heading');
  envHeading.append(node('div', '', undefined), node('span', `source-badge ${String(dataStatus).toLowerCase() === 'live' ? 'live' : 'demo'}`, String(dataStatus).toLowerCase() === 'live' ? 'NASA LIVE' : `NASA ${String(dataStatus).toUpperCase()}`));
  envHeading.firstElementChild.append(node('span', 'section-kicker', 'NASA POWER · ENVIRONMENT'), node('h3', '', 'Observed environmental inputs'));
  environmentalPanel.append(envHeading);
  const envGrid = node('div', 'environment-grid');
  const environmentMetrics = [
    ['Temperature', environment.temperature, '°C'], ['Rainfall', environment.rainfall, 'mm/day'], ['Humidity', environment.humidity, '%'],
    ['Wind', environment.wind_speed, 'm/s'], ['Solar radiation', environment.solar_radiation, 'kWh/m²/day']
  ];
  environmentMetrics.forEach(([label, value, unit]) => {
    const item = node('div', 'environment-metric');
    item.append(node('span', '', label), node('strong', '', value === null || value === undefined ? 'Not available' : `${formatValue(value, 2)} ${unit}`));
    envGrid.append(item);
  });
  environmentalPanel.append(envGrid, node('p', 'panel-note', `${nasa.source || field.environment_source || 'NASA POWER source not returned'} · ${nasa.latest_valid_date ? `latest valid date ${nasa.latest_valid_date}` : 'date coverage not returned'}.`));
  overviewSection.append(fieldPanel, environmentalPanel);

  const aiSection = node('section', 'result-section ai-insights-panel');
  aiSection.id = 'aiInsights';
  const aiHeading = node('h4');
  aiHeading.append(document.createTextNode('AI insights'), node('span', '', 'MODEL ESTIMATE'));
  aiSection.append(aiHeading);
  const aiGrid = node('div', 'ai-insight-grid');
  [['Prediction', `${formatValue(ml.prediction_t_ha, 2)} t/ha`], ['Model', ml.model_name || 'Not returned'], ['Data boundary', ml.data_boundary || ml.prediction_label || 'Not returned']]
    .forEach(([label, value]) => { const item = node('article', 'ai-insight-item'); item.append(node('span', '', label), node('strong', '', value)); aiGrid.append(item); });
  aiSection.append(aiGrid, node('p', 'panel-note', 'Why this estimate: this interface reports only model and data provenance returned by the backend. It does not present feature attribution as causal agronomic evidence.'));

  const rotationSection = node('section', 'result-section');
  rotationSection.id = 'rotationPlan';
  const rotationHeading = node('h4');
  rotationHeading.append(document.createTextNode('Crop-rotation plan'), node('span', '', 'MILP OPTIMIZER'));
  rotationSection.append(rotationHeading);
  const cropSequence = node('div', 'crop-sequence');
  const entries = Object.entries(periods);
  if (entries.length) {
    entries.forEach(([period, crop]) => {
      const chip = node('span', 'crop-chip');
      chip.append(document.createTextNode(crop || 'Unavailable'), node('small', '', period.replaceAll('_', ' ')));
      cropSequence.append(chip);
    });
  } else {
    cropSequence.append(node('span', 'result-note', 'No crop sequence was returned.'));
  }
  rotationSection.append(cropSequence);
  rotationSection.append(node('p', 'result-note', 'Optimization output is a research result, not a guaranteed agronomic recommendation.'));
  const solverDetails = node('div', 'objective-strip');
  [['Solver', milp.solver_status || milp.status || 'Not returned'], ['Objective', milp.objective_value], ['Profit component', milp.profit_component], ['Water component', milp.water_component], ['Soil component', milp.soil_component]]
    .forEach(([label, value]) => { const item = node('span'); item.append(node('small', '', label), document.createTextNode(value === null || value === undefined ? 'Not available' : formatValue(value, 2))); solverDetails.append(item); });
  rotationSection.append(solverDetails);

  const profileSection = node('section', 'result-section');
  const profileHeading = node('h4');
  profileHeading.append(document.createTextNode('Your submitted profile'), node('span', '', 'FORM INPUTS'));
  profileSection.append(profileHeading);
  const profileGrid = node('div', 'profile-grid');
  const profileValues = [
    ['Coordinates', `${request.latitude || '—'}, ${request.longitude || '—'}`],
    ['Date range', `${request.start_date || '—'} to ${request.end_date || '—'}`],
    ['Field size', request.field_size_ha ? `${request.field_size_ha} ha` : 'Not provided'],
    ['Soil / season', `${labels.soil_texture[request.soil_texture] || 'Unknown'} · ${labels.season[request.season] || 'Unknown'}`],
    ['Priority', labels.priority[request.priority] || 'Unknown'],
    ['Optional inputs', `Organic matter: ${request.organic_matter || 'unknown'} · Irrigation: ${request.irrigation_capacity_mm || 'unknown'}`],
    ['Previous crop', request.include_history && request.previous_crop ? `${request.previous_crop} (${request.previous_crop_year || 'year unknown'})` : 'Not included']
  ];
  profileValues.forEach(([label, value]) => {
    const item = node('div', 'profile-item');
    item.append(node('span', '', label), node('strong', '', value));
    profileGrid.append(item);
  });
  profileSection.append(profileGrid);
  profileSection.append(node('p', 'result-note', 'Coordinates and dates select the weather series; the selected priority chooses an existing optimizer profile, and provided soil texture/organic matter are applied to the field state. Field size and irrigation capacity are recorded but are not used by current optimizer constraints.'));

  const compareSection = node('section', 'result-section');
  compareSection.id = 'comparePlans';
  const compareHeading = node('h4');
  compareHeading.append(document.createTextNode('Compare rotation priorities'), node('span', '', 'EXISTING MILP STRATEGIES'));
  compareSection.append(compareHeading);
  const strategies = planning.all_strategies || {};
  const strategyEntries = Object.entries(strategies);
  if (strategyEntries.length) {
    strategyEntries.forEach(([name, strategy]) => {
      const row = node('div', 'profile-item');
      const selected = name === planning.selected_strategy ? ' · selected' : '';
      row.append(
        node('span', '', `${name.replaceAll('_', ' ')}${selected}`),
        node('strong', '', strategy.status === 'optimal' && strategy.selected_crop_by_period
          ? Object.values(strategy.selected_crop_by_period).join(' → ')
          : `Plan unavailable (${strategy.status || 'unknown'})`)
      );
      compareSection.append(row);
    });
  } else {
    compareSection.append(node('p', 'result-note', 'Alternative rotation strategies were not returned.'));
  }

  const selectedStrategy = planning.selected_strategy && strategies[planning.selected_strategy];
  const whySection = node('section', 'result-section');
  whySection.id = 'whyPlan';
  const whyHeading = node('h4');
  whyHeading.append(document.createTextNode('Why this plan'), node('span', '', 'OPTIMIZER CONTEXT'));
  whySection.append(whyHeading);
  const selectedWeights = selectedStrategy?.requested_weights || selectedStrategy?.weights?.requested || {};
  const weightSummary = Object.entries(selectedWeights)
    .map(([key, value]) => `${key}: ${formatValue(value, 2)}`)
    .join(' · ');
  whySection.append(node(
    'p',
    'result-note',
    weightSummary
      ? `The ${planning.selected_priority || 'selected'} priority uses this existing prototype profile: ${weightSummary}. These are planning weights, not measured outcomes.`
      : 'The optimizer did not return priority weights for this plan.'
  ));
  const constraintSummary = selectedStrategy?.constraint_summary;
  if (constraintSummary && typeof constraintSummary === 'object') {
    const constraints = Object.entries(constraintSummary)
      .filter(([, value]) => typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string')
      .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value}`)
      .join(' · ');
    if (constraints) whySection.append(node('p', 'result-note', constraints));
  }

  const stressSection = renderStressTest(stress, rl);
  stressSection.id = 'whatIfAnalysis';
  const stressHeading = stressSection.querySelector('.stress-test-intro h3');
  if (stressHeading) stressHeading.textContent = 'Stress test & what-if analysis';

  const rlSection = node('section', 'result-section rl-simulation-panel');
  rlSection.id = 'rlSimulation';
  const rlHeading = node('h4');
  rlHeading.append(document.createTextNode('RL simulation'), node('span', '', 'SIMULATION ONLY'));
  rlSection.append(rlHeading, node('p', 'rl-boundary', 'Simulation-trained RL policy; not field validated. It is visually and scientifically separate from the authoritative MILP crop-rotation plan.'));
  const rlGrid = node('div', 'profile-grid');
  [['Policy', rl.policy_type || 'Not returned'], ['Proposed action', rl.proposal_action?.action || rl.proposal_action || 'Not returned'], ['Safety status', rl.safety_status || 'Not returned']]
    .forEach(([label, value]) => { const item = node('div', 'profile-item'); item.append(node('span', '', label), node('strong', '', value)); rlGrid.append(item); });
  rlSection.append(rlGrid);

  const finalPlanSection = node('section', 'result-section');
  finalPlanSection.id = 'finalPlan';
  const finalPlanHeading = node('h4');
  finalPlanHeading.append(document.createTextNode('Final plan'), node('span', '', 'SELECTED MILP OUTPUT'));
  finalPlanSection.append(finalPlanHeading);
  finalPlanSection.append(node(
    'p',
    'result-note',
    summary.final_plan?.status
      ? `${summary.final_plan.status}: ${Object.entries(summary.final_plan.rotation || {}).map(([period, crop]) => `${period.replaceAll('_', ' ')} — ${crop}`).join(' · ')}`
      : 'The optimizer did not return a final rotation.'
  ));

  const researchSection = node('section', 'result-section');
  const researchHeading = node('h4');
  researchHeading.append(document.createTextNode('Research boundary'), node('span', '', summary.research_boundary || 'DEMO'));
  researchSection.append(researchHeading);
  const limitations = Array.isArray(summary.limitations) ? summary.limitations : [];
  const summaryText = limitations.length
    ? limitations.join(' ')
    : 'This workflow uses demo data and is not field-validated.';
  researchSection.append(node('p', 'result-note', summaryText));
  if (stress.status) researchSection.append(node('p', 'result-note', `Stress-test status: ${stress.status}. This is a deterministic scenario test, not a field forecast.`));

  resultContent.replaceChildren(
    metricGrid,
    overviewSection,
    aiSection,
    rotationSection,
    compareSection,
    whySection,
    stressSection,
    rlSection,
    finalPlanSection,
    profileSection,
    researchSection
  );
  resultOutput.textContent = JSON.stringify(summary, null, 2);
  rawDetails.hidden = false;
  rawDetails.open = false;
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned an invalid response (HTTP ${response.status}).`);
  }
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    ...options
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.message || `Request failed (HTTP ${response.status}).`);
  return data;
}

function setAccount(user) {
  currentUser = user;
  accountButton.textContent = user ? `Sign out · ${user.name}` : 'Sign in';
  historyButton.hidden = !user;
  savedFieldId = user ? localStorage.getItem(`fieldshift-field-${user.id}`) : null;
  const farmId = user ? localStorage.getItem(`fieldshift-farm-${user.id}`) : null;
  form.dataset.farmId = farmId || '';
}

async function loadSession() {
  try {
    const result = await apiRequest('/api/auth/me');
    setAccount(result.user || null);
    await loadSavedField();
  } catch {
    setAccount(null);
  }
}

async function loadSavedField() {
  if (!currentUser || !savedFieldId || !form.dataset.farmId) return;
  try {
    const fields = await apiRequest(`/api/fields?farm_id=${encodeURIComponent(form.dataset.farmId)}`);
    const field = fields.fields.find((item) => String(item.id) === savedFieldId);
    if (!field) throw new Error('Saved field no longer exists.');
    form.elements.latitude.value = field.latitude ?? '';
    form.elements.longitude.value = field.longitude ?? '';
    form.elements.field_size_ha.value = field.area_ha ?? '';
    form.elements.soil_texture.value = field.soil_texture || 'unknown';
    form.elements.organic_matter.value = field.organic_matter ?? '';
    form.elements.irrigation_capacity_mm.value = field.irrigation_capacity_mm ?? '';
  } catch {
    localStorage.removeItem(`fieldshift-field-${currentUser.id}`);
    savedFieldId = null;
  }
}

function setAccountMode(mode) {
  accountMode = mode;
  const registering = mode === 'register';
  accountNameRow.hidden = !registering;
  accountNameRow.querySelector('input').required = registering;
  accountDialogTitle.textContent = registering ? 'Create an account' : 'Sign in';
  document.getElementById('accountPageTitle').textContent = registering
    ? 'Create an account to save your fields and analysis history.'
    : 'Access your saved fields and analysis history.';
  accountSubmitButton.textContent = registering ? 'Create account' : 'Sign in';
  document.getElementById('accountSwitchPrompt').textContent = registering ? 'Already have an account?' : 'New to FieldShift?';
  accountModeButton.textContent = registering ? 'Sign in' : 'Create an account';
  accountForm.elements.password.autocomplete = registering ? 'new-password' : 'current-password';
  accountDialogStatus.textContent = '';
}

async function checkHealth() {
  healthButton.disabled = true;
  try {
    const response = await fetch('/api/health', { headers: { Accept: 'application/json' } });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.message || `Health check failed (HTTP ${response.status}).`);
    connectionBadge.classList.remove('offline');
    connectionBadge.innerHTML = '<i></i> API connected';
    heroStatus.textContent = 'Ready to explore';
    heroStatusDetail.textContent = 'Your analysis runs locally with bundled demo data.';
    setStatus('App server is healthy. Your analysis results will appear here after you run the workflow.');
  } catch (error) {
    connectionBadge.classList.add('offline');
    connectionBadge.innerHTML = '<i></i> API unavailable';
    heroStatus.textContent = 'Server not reachable';
    heroStatusDetail.textContent = 'Start or refresh the FieldShift app server, then check again.';
    setStatus(error.message, 'warning');
  } finally {
    healthButton.disabled = false;
  }
}

async function runWorkflow(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const request = Object.fromEntries(formData.entries());
  request.include_history = formData.has('include_history');
  request.unknown_values_allowed = formData.has('unknown_values_allowed');
  request.mode = request.mode || 'offline';
  if (savedFieldId) {
    request.field_id = Number(savedFieldId);
    request.farm_id = Number(form.dataset.farmId);
    request.save_result = true;
  }

  const start = new Date(`${request.start_date}T00:00:00`);
  const end = new Date(`${request.end_date}T00:00:00`);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start > end) {
    setStatus('End date must be on or after the start date.', 'warning');
    form.elements.end_date.focus();
    return;
  }

  runButton.disabled = true;
  runButton.classList.add('is-loading');
  runButton.querySelector('.button-arrow').textContent = '↻';
  runButtonLabel.textContent = request.mode === 'live' ? 'Fetching NASA data…' : 'Running demo…';
  resultBadge.className = 'result-badge';
  resultBadge.textContent = 'Running';
  heroStatus.textContent = 'Running offline workflow';
  heroStatusDetail.textContent = request.mode === 'live'
    ? 'Retrieving NASA POWER observations and running the existing FieldShift pipeline.'
    : 'Loading bundled climate data and executing the existing research pipeline.';
  heroMode.textContent = 'Please keep this page open';
  setStatus(request.mode === 'live'
    ? 'Retrieving NASA POWER observations. Live requests do not fall back to demo data.'
    : 'Running the bundled offline workflow. This may take a few moments…');
  resultContent.replaceChildren(node('div', 'empty-state', 'Running the research workflow…'));
  rawDetails.hidden = true;
  showWorkspaceView('results');

  try {
    const response = await fetch('/api/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request)
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.message || `Workflow request failed (HTTP ${response.status}).`);
    if (data.status !== 'ok' || !data.summary) throw new Error(data.reason || 'The workflow did not return a completed summary.');
    renderWorkflow(data.summary, request);
    updateWorkflowNavigation('dashboard');
    resultBadge.className = 'result-badge complete';
    resultBadge.textContent = 'Complete';
    heroStatus.textContent = 'Workflow complete';
    heroStatusDetail.textContent = request.mode === 'live'
      ? 'NASA POWER data was retrieved. The ML artifact remains synthetic and the RL policy remains a baseline.'
      : 'The offline demo finished. Review its research outputs and limitations below.';
    heroMode.textContent = request.mode === 'live'
      ? 'Live NASA POWER · synthetic ML model'
      : 'Bundled offline demo · synthetic boundary';
    setStatus(
      data.analysis_id
        ? `Workflow completed and saved as analysis ${data.analysis_id}.`
        : 'Workflow completed. Review the source and research limitations before interpreting any result.',
      'success'
    );
    connectionBadge.classList.remove('offline');
    connectionBadge.innerHTML = '<i></i> API connected';
  } catch (error) {
    resultBadge.className = 'result-badge failed';
    resultBadge.textContent = 'Failed';
    heroStatus.textContent = 'Workflow could not finish';
    heroStatusDetail.textContent = 'The server reported an error. Your existing form values have been kept.';
    heroMode.textContent = 'Check the message below and retry';
    resultContent.replaceChildren(node('div', 'empty-state', error.message));
    setStatus(error.message, 'warning');
  } finally {
    runButton.disabled = false;
    runButton.classList.remove('is-loading');
    runButton.querySelector('.button-arrow').textContent = '↗';
    runButtonLabel.textContent = form.elements.mode.value === 'live' ? 'Run NASA POWER analysis' : 'Run offline analysis';
  }
}

async function saveField() {
  if (!currentUser) {
    setStatus('Sign in or create an account before saving a field.', 'warning');
    setAccountMode('login');
    showAccountPage();
    return;
  }
  const button = document.getElementById('saveFieldButton');
  button.disabled = true;
  try {
    let farmId = form.dataset.farmId;
    if (!farmId) {
      const createdFarm = await apiRequest('/api/farms', {
        method: 'POST',
        body: JSON.stringify({ name: 'My farm', description: 'Created from FieldShift field setup.' })
      });
      farmId = String(createdFarm.farm.id);
      form.dataset.farmId = farmId;
      localStorage.setItem(`fieldshift-farm-${currentUser.id}`, farmId);
    }
    const values = Object.fromEntries(new FormData(form).entries());
    const result = await apiRequest('/api/fields', {
      method: 'POST',
      body: JSON.stringify({
        farm_id: Number(farmId),
        name: `Field ${new Date().toLocaleDateString()}`,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        area_ha: values.field_size_ha ? Number(values.field_size_ha) : null,
        soil_texture: values.soil_texture || null,
        organic_matter: values.organic_matter ? Number(values.organic_matter) : null,
        irrigation_capacity_mm: values.irrigation_capacity_mm ? Number(values.irrigation_capacity_mm) : null
      })
    });
    const previousCropYear = values.previous_crop_year.trim();
    if (values.previous_crop && previousCropYear) {
      await apiRequest(`/api/fields/${result.field.id}/history`, {
        method: 'POST',
        body: JSON.stringify({
          crop: values.previous_crop,
          season: values.season,
          year: Number(previousCropYear)
        })
      });
    }
    savedFieldId = String(result.field.id);
    localStorage.setItem(`fieldshift-field-${currentUser.id}`, savedFieldId);
    const historyNote = values.previous_crop && !previousCropYear
      ? ' The previous crop was not added to saved history because its year is unknown.'
      : '';
    setStatus(`Field saved to ${currentUser.name}'s account. Future workflows can be saved to analysis history.${historyNote}`, 'success');
  } catch (error) {
    setStatus(error.message, 'warning');
  } finally {
    button.disabled = false;
  }
}

async function loadAnalysisHistory() {
  historyList.replaceChildren(node('p', 'result-note', 'Loading saved analyses…'));
  try {
    const data = await apiRequest('/api/analyses');
    if (!data.analyses.length) {
      historyList.replaceChildren(node('p', 'result-note', 'No saved analyses yet. Save a field and run a workflow to build history.'));
      return;
    }
    historyList.replaceChildren();
    data.analyses.forEach((analysis) => {
      let stored = {};
      try {
        stored = JSON.parse(analysis.summary_json || '{}');
      } catch {
        stored = {};
      }
      const workflow = stored.summary || stored;
      const summary = workflow.summary || workflow;
      const entry = node('div', 'history-entry');
      entry.append(
        node('strong', '', `Analysis ${analysis.id} · ${analysis.status}`),
        node('small', '', `${analysis.created_at} · ${summary.mode || analysis.mode || 'offline'} · ${summary.final_plan?.status || 'No plan status'}`)
      );
      const rotation = summary.final_plan?.rotation;
      if (rotation) {
        entry.append(node('small', '', Object.values(rotation).join(' → ')));
      }
      historyList.append(entry);
    });
  } catch (error) {
    historyList.replaceChildren(node('p', 'result-note', error.message));
  }
}

async function loadCropOptions() {
  const cropSelect = form.elements.previous_crop;
  try {
    const result = await apiRequest('/api/crops');
    result.crops.forEach((crop) => {
      cropSelect.add(new Option(crop.crop, crop.crop));
    });
  } catch {
    cropSelect.disabled = true;
    cropSelect.title = 'Crop catalog is currently unavailable.';
  }
}

geoButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Browser location is unavailable in this browser. Enter latitude and longitude manually.', 'warning');
    return;
  }
  geoButton.disabled = true;
  geoButtonLabel.textContent = 'Getting location…';
  setStatus('Waiting for browser location permission. Your coordinates will be sent to NASA POWER and OpenStreetMap only to load this lookup.');
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude.toFixed(4);
      const longitude = position.coords.longitude.toFixed(4);
      form.elements.latitude.value = latitude;
      form.elements.longitude.value = longitude;
      await loadAreaWeather(latitude, longitude);
    },
    (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied. You can enter coordinates manually.'
        : error.code === error.TIMEOUT
          ? 'Location request timed out. Try again or enter coordinates manually.'
          : `Could not get your location: ${error.message}`;
      setStatus(message, 'warning');
      geoButton.disabled = false;
      geoButtonLabel.textContent = 'Use my location';
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
});
weatherButton.addEventListener('click', () => {
  loadAreaWeather(form.elements.latitude.value, form.elements.longitude.value);
});

healthButton.addEventListener('click', checkHealth);
stepNextButton.addEventListener('click', () => {
  if (!form.reportValidity()) return;
  if (currentFormStep === 1) {
    const start = new Date(`${form.elements.start_date.value}T00:00:00`);
    const end = new Date(`${form.elements.end_date.value}T00:00:00`);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start > end) {
      setStatus('The weather end date must be on or after the start date.', 'warning');
      form.elements.end_date.focus();
      return;
    }
  }
  setFormStep(currentFormStep + 1);
  document.getElementById('fieldSetup').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
stepBackButton.addEventListener('click', () => {
  setFormStep(currentFormStep - 1);
  document.getElementById('fieldSetup').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.getElementById('editInputsButton').addEventListener('click', () => {
  showWorkspaceView('setup');
  setFormStep(currentFormStep);
  document.getElementById('fieldSetup').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
form.elements.mode.addEventListener('change', () => {
  runButtonLabel.textContent = form.elements.mode.value === 'live'
    ? 'Run NASA POWER analysis'
    : 'Run offline analysis';
});
form.addEventListener('submit', runWorkflow);
['getStartedButton', 'startPlanningButton', 'bottomStartButton'].forEach((id) => {
  document.getElementById(id).addEventListener('click', () => {
    openWorkspace();
    updateWorkflowNavigation('fieldSetup');
  });
});
document.getElementById('backToLanding').addEventListener('click', () => showLanding());
document.querySelectorAll('[data-workflow-nav]').forEach((link) => {
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    const destination = link.dataset.workflowNav;
    updateWorkflowNavigation(destination);
    if (destination === 'history') {
      await loadAnalysisHistory();
      historyDialog.showModal();
      return;
    }
    if (destination === 'fieldSetup') {
      showWorkspaceView('setup');
      setFormStep(1);
      return;
    }
    if (resultBadge.textContent !== 'Complete') {
      setStatus('Run an analysis first to populate this workflow section.', 'info');
      showWorkspaceView('setup');
      setFormStep(3);
      return;
    }
    showWorkspaceView('results');
    document.getElementById(destination)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
document.querySelectorAll('[data-return-landing]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showLanding(link.getAttribute('href')?.slice(1));
  });
});
document.querySelectorAll('.landing-nav a, .landing-actions a').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = link.getAttribute('href')?.slice(1);
    if (!target) return;
    event.preventDefault();
    showLanding(target);
  });
});
form.addEventListener('input', (event) => {
  document.getElementById('breadcrumbSize').textContent = `${form.elements.field_size_ha.value || '—'} ha · 3-season plan`;
  document.getElementById('sidebarFarmMeta').textContent = `${form.elements.field_size_ha.value || '—'} ha · 3-season plan`;
  if (event.target.name === 'latitude' || event.target.name === 'longitude') updateLocationCoordinates();
});
document.getElementById('saveFieldButton').addEventListener('click', saveField);
document.getElementById('closeAccountDialog').addEventListener('click', closeAccountPage);
document.getElementById('closeHistoryDialog').addEventListener('click', () => historyDialog.close());
accountModeButton.addEventListener('click', () => setAccountMode(accountMode === 'login' ? 'register' : 'login'));
accountButton.addEventListener('click', async () => {
  if (!currentUser) {
    setAccountMode('login');
    showAccountPage();
    return;
  }
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    setAccount(null);
    setStatus('Signed out. You can continue using offline demo mode.', 'success');
  } catch (error) {
    setStatus(error.message, 'warning');
  }
});
historyButton.addEventListener('click', async () => {
  await loadAnalysisHistory();
  historyDialog.showModal();
});
accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(accountForm).entries());
  const endpoint = accountMode === 'register' ? '/api/auth/register' : '/api/auth/login';
  accountSubmitButton.disabled = true;
  accountDialogStatus.textContent = accountMode === 'register' ? 'Creating account…' : 'Signing in…';
  try {
    const result = await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(payload) });
    setAccount(result.user);
    await loadSavedField();
    closeAccountPage();
    setStatus(`Signed in as ${result.user.name}.`, 'success');
  } catch (error) {
    accountDialogStatus.textContent = error.message;
  } finally {
    accountSubmitButton.disabled = false;
  }
});
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(resultOutput.textContent);
    copyButton.textContent = 'Copied';
    window.setTimeout(() => { copyButton.textContent = 'Copy JSON'; }, 1800);
  } catch {
    setStatus('Clipboard access is unavailable. Select and copy the JSON text manually.', 'warning');
  }
});

form.addEventListener('reset', () => {
  window.setTimeout(() => {
    setFormStep(1);
    showWorkspaceView('setup');
    updateLocationCoordinates();
    runButtonLabel.textContent = 'Run offline analysis';
    setStatus('Form reset to the bundled demo defaults. Continue through the setup steps when ready.');
  }, 0);
});

checkHealth();
loadSession();
loadCropOptions();
