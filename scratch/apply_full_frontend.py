from pathlib import Path

path = Path(r"C:\FieldShift\frontend\src\main.jsx")
content = path.read_text(encoding="utf-8")

# 1. Add handleRunBenchmark if not already present
if "async function handleRunBenchmark" not in content and "const handleRunBenchmark" not in content:
    func_target = "  const handleApplyStrategy = async strategyName => {"
    func_replacement = """  const handleRunBenchmark = async scenarioId => {
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

  const handleApplyStrategy = async strategyName => {"""
    if func_target in content:
        content = content.replace(func_target, func_replacement)
        print("handleRunBenchmark inserted!")
    else:
        old_crlf = func_target.replace("\n", "\r\n")
        new_crlf = func_replacement.replace("\n", "\r\n")
        if old_crlf in content:
            content = content.replace(old_crlf, new_crlf)
            print("handleRunBenchmark inserted with CRLF!")

# 2. Add Benchmark Scenarios Panel, What Changed, and Optimization Provenance right above the Hero Header Banner or right after it
hero_marker = "                    {/* Hero Header Banner */}"
new_sections = """                    {/* Synthetic Benchmark Scenarios Panel */}
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

                    {/* Hero Header Banner */}"""

if hero_marker in content:
    content = content.replace(hero_marker, new_sections)
    print("Optimization header sections inserted!")
else:
    old_crlf = hero_marker.replace("\n", "\r\n")
    new_crlf = new_sections.replace("\n", "\r\n")
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf)
        print("Optimization header sections inserted with CRLF!")
    else:
        print("Hero marker not found!")

# 3. Add Dynamic Per-Season Explanations inside the Inspector
inspector_end_marker = "                        {/* Agronomic Constraints Verification */}"
explanation_section = """                        {/* Dynamic Per-Season Decision Explanations */}
                        <div style={{ gridColumn: 'span 2', background: '#fff', padding: 18, borderRadius: 14, border: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 18 }}>🧠</span>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Per-Season MILP Decision Explanation &amp; Competitor Alternatives</h4>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                            {(inspectedItem.decision_explanation?.period_reasons || summary.xai?.milp_explanation?.period_reasons || []).map((p, pIdx) => (
                              <div key={p.period || pIdx} style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <strong style={{ color: 'var(--primary)', fontSize: 12.5 }}>{p.period}: {p.crop} ({p.family})</strong>
                                  <span style={{ fontSize: 10.5, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    {p.season_label || p.period}
                                  </span>
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, color: '#334155' }}>Why Feasible: </span>
                                  <span style={{ color: '#475569' }}>{p.why_feasible}</span>
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, color: '#334155' }}>Why Selected: </span>
                                  <span style={{ color: '#475569' }}>{p.why_selected}</span>
                                </div>
                                {p.alternatives_considered && p.alternatives_considered.length > 0 && (
                                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #cbd5e1' }}>
                                    <span style={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>Competitor Alternatives Evaluated:</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                      {p.alternatives_considered.map((alt, aIdx) => (
                                        <span key={aIdx} style={{ fontSize: 11, background: '#fff', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                                          {alt.crop} (৳{Number(alt.expected_gross_margin_bdt || 0).toLocaleString()})
                                        </span>
                                      ))}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#15803d', marginTop: 4, fontStyle: 'italic' }}>
                                      {p.why_beat_alternatives || p.comparative_advantage}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Agronomic Constraints Verification */}"""

if inspector_end_marker in content:
    content = content.replace(inspector_end_marker, explanation_section)
    print("Inspector per-season explanation inserted!")
else:
    old_crlf = inspector_end_marker.replace("\n", "\r\n")
    new_crlf = explanation_section.replace("\n", "\r\n")
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf)
        print("Inspector per-season explanation inserted with CRLF!")
    else:
        print("Inspector marker not found!")

path.write_text(content, encoding="utf-8")
