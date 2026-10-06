import re
from pathlib import Path

file_path = Path("C:/FieldShift/frontend/src/main.jsx")
content = file_path.read_text(encoding="utf-8")

# Marker to find start of activeNav === 'account'
start_marker = "{/* -------------------- VIEW 7: ACCOUNT & PROFILE SECTION (PROFESSIONAL AGRONOMIST PROFILE) -------------------- */}"
# The activeNav === 'account' block ends before the closing of main-wrapper, right before:
#       </div>
#     </div>
#   );
# }

end_marker = """            )}
          </div>
        )}
      </div>
    </div>
  );
}"""

if start_marker not in content:
    print(f"Error: start_marker not found!")
    exit(1)

if end_marker not in content:
    print(f"Error: end_marker not found!")
    exit(1)

idx_start = content.index(start_marker)
idx_end = content.index(end_marker) + len("""            )}
          </div>
        )}""")

old_section = content[idx_start:idx_end]
print(f"Found old section of length: {len(old_section)}")

new_section = '''        {/* -------------------- VIEW 7: PROFILE & MY FIELDS SECTION -------------------- */}
        {activeNav === 'account' && (
          <div className="profile-view-wrapper">
            <div className="view-sub-header">
              <div>
                <h2>Agronomist Profile & Registered Fields</h2>
                <p>Personal Operator Information & Multi-Field Management</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button type="button" className="back-btn" onClick={() => setActiveNav('dashboard')}>
                  ← Back to Dashboard
                </button>
                {user ? (
                  <button type="button" className="btn-secondary" onClick={handleSignOut} title="Sign Out of Active Session">
                    Sign Out
                  </button>
                ) : (
                  <button type="button" className="btn-primary-sm" onClick={handleQuickDemoLogin} style={{ padding: '8px 18px', fontSize: 13 }}>
                    Demo Sign In (Dani)
                  </button>
                )}
              </div>
            </div>

            {/* If user is not authenticated: Show clean login / demo sign-in options */}
            {!user && (
              <section className="dash-card" style={{ marginBottom: 20 }}>
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

            {/* 1. PERSONAL INFORMATION */}
            <section className="profile-card-section">
              <div className="personal-info-header">
                <div className="personal-avatar">
                  {user ? user.name.slice(0, 2).toUpperCase() : 'AG'}
                </div>
                <div className="personal-title-wrap">
                  <h2>
                    {user ? user.name : 'Guest Operator'}
                    <span className="field-id-badge" style={{ fontSize: 12, padding: '3px 10px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      {user ? 'Verified User' : 'Unauthenticated'}
                    </span>
                  </h2>
                  <p>Agricultural Research Operator · FieldShift Relational Profile</p>
                </div>
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
                  <label>User Location / Station</label>
                  <strong>
                    {userFarms.length > 0 && userFarms[0].name
                      ? `${userFarms[0].name} (Station #${userFarms[0].id})`
                      : 'Dhaka Agricultural Region, Bangladesh'}
                  </strong>
                </div>
              </div>
            </section>

            {/* 2. MY FIELDS SECTION */}
            <section className="profile-card-section" style={{ marginTop: 24 }}>
              <div className="my-fields-header">
                <div className="my-fields-title">
                  <h3>My Fields</h3>
                  <span className="field-count-pill">
                    {userFields.length} {userFields.length === 1 ? 'Field' : 'Fields'}
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

              {userFields.length > 0 ? (
                <div className="fields-cards-grid">
                  {userFields.map(fld => {
                    const latestCrop = fld.previous_crop || fld.current_crop || (fld.history && fld.history[0]?.crop) || 'Maize';
                    const latestCropYear = fld.previous_crop_year || (fld.history && fld.history[0]?.year) || 2024;
                    const historyList = fld.history || [];

                    return (
                      <div key={fld.id} className="field-card-item">
                        {/* Header: Name and ID */}
                        <div className="field-card-header">
                          <div className="field-card-title-wrap">
                            <h4>{fld.name}</h4>
                            <span className="field-id-badge">Field ID #{fld.id}</span>
                          </div>
                          <span className="completeness-badge">
                            Active Field
                          </span>
                        </div>

                        {/* Location: Mini-glyph & Coordinates */}
                        <div className="location-preview-box">
                          <div className="mini-map-glyph" title="Geographic Location">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                          </div>
                          <div className="location-text">
                            <span className="location-coords">
                              {fld.latitude != null ? Number(fld.latitude).toFixed(4) : '23.8103'}° N, {fld.longitude != null ? Number(fld.longitude).toFixed(4) : '90.4125'}° E
                            </span>
                            <span className="location-desc">
                              {userFarms.find(farm => farm.id === fld.farm_id)?.name || `Farm Station #${fld.farm_id || 1}`}
                            </span>
                          </div>
                        </div>

                        {/* Agronomic & Soil Metrics Grid */}
                        <div className="field-metrics-table">
                          <div className="metric-cell">
                            <span>Field Size:</span>
                            <strong>{fld.area_ha != null ? Number(fld.area_ha).toFixed(1) : '10.0'} ha</strong>
                          </div>
                          <div className="metric-cell">
                            <span>Soil Texture:</span>
                            <strong style={{ textTransform: 'capitalize' }}>
                              {(fld.soil_texture || 'loam').replaceAll('_', ' ')}
                            </strong>
                          </div>
                          <div className="metric-cell">
                            <span>Organic Matter:</span>
                            <strong>{fld.organic_matter != null ? Number(fld.organic_matter).toFixed(1) : '2.5'} %</strong>
                          </div>
                          <div className="metric-cell">
                            <span>Irrigation Cap:</span>
                            <strong>{fld.irrigation_capacity_mm != null ? Math.round(Number(fld.irrigation_capacity_mm)) : 90} mm</strong>
                          </div>
                        </div>

                        {/* Crop History & Current Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div className="crop-history-row">
                            <span style={{ fontWeight: 600 }}>Previous Crop:</span>
                            <span className="crop-chip">{latestCrop} ({latestCropYear})</span>
                          </div>

                          {historyList.length > 1 && (
                            <div className="crop-history-row">
                              <span style={{ fontSize: 11 }}>History:</span>
                              {historyList.slice(0, 3).map((h, idx) => (
                                <span key={idx} className="chip-tag" style={{ fontSize: 10.5, padding: '1px 6px' }}>
                                  {h.year}: {h.crop}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Metadata */}
                        <div className="field-card-meta">
                          <span>Registered: {fld.created_at ? new Date(fld.created_at).toLocaleDateString() : 'Active'}</span>
                          <span>Last Analysis: {fld.last_analysis_date ? new Date(fld.last_analysis_date).toLocaleDateString() : 'Ready'}</span>
                        </div>

                        {/* Actions: Select for Analysis / View / Edit / Archive */}
                        <div className="field-card-actions">
                          <button
                            type="button"
                            className="btn-select-analysis"
                            onClick={() => selectFieldForAnalysis(fld)}
                            title="Load this field's parameters into the Planner and run analysis"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            Select for Analysis
                          </button>
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
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed var(--border-light)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <h4 style={{ margin: '0 0 6px', fontSize: 16 }}>No Fields Registered Yet</h4>
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
                <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                  <div className="modal-header">
                    <h3>{fieldModal === 'edit' ? `Edit Field: ${fieldForm.name || 'Parcel'}` : 'Add New Agricultural Field'}</h3>
                    <button type="button" className="modal-close-btn" onClick={() => !fieldModalLoading && setFieldModal(null)}>×</button>
                  </div>
                  <form onSubmit={handleFieldFormSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Location Presets:</span>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={() => setFieldForm(prev => ({ ...prev, latitude: '23.8103', longitude: '90.4125', soil_texture: 'loam', organic_matter: '2.5', irrigation_capacity_mm: '90' }))}
                        >
                          Dhaka
                        </button>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={() => setFieldForm(prev => ({ ...prev, latitude: '22.7010', longitude: '90.3535', soil_texture: 'silty_loam', organic_matter: '2.8', irrigation_capacity_mm: '120' }))}
                        >
                          Barisal
                        </button>
                        <button
                          type="button"
                          className="preset-chip"
                          onClick={() => setFieldForm(prev => ({ ...prev, latitude: '24.3636', longitude: '88.6241', soil_texture: 'clay_loam', organic_matter: '1.8', irrigation_capacity_mm: '60' }))}
                        >
                          Rajshahi
                        </button>
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

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
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
                <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                  <div className="modal-header">
                    <div>
                      <h3 style={{ margin: 0 }}>{viewingField.name}</h3>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Field ID #{viewingField.id} · Farm Station #{viewingField.farm_id}</span>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={() => setViewingField(null)}>×</button>
                  </div>
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Location Summary */}
                    <div className="location-preview-box">
                      <div className="mini-map-glyph">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div className="location-text">
                        <span className="location-coords" style={{ fontSize: 14 }}>
                          {viewingField.latitude}° N, {viewingField.longitude}° E
                        </span>
                        <span className="location-desc">
                          Location calibrated for NASA POWER meteorological retrieval and MILP optimization
                        </span>
                      </div>
                    </div>

                    {/* Parameters Table */}
                    <div className="field-metrics-table">
                      <div className="metric-cell">
                        <span>Field Size:</span>
                        <strong>{viewingField.area_ha || 10.0} ha</strong>
                      </div>
                      <div className="metric-cell">
                        <span>Soil Texture:</span>
                        <strong style={{ textTransform: 'capitalize' }}>{(viewingField.soil_texture || 'loam').replaceAll('_', ' ')}</strong>
                      </div>
                      <div className="metric-cell">
                        <span>Organic Matter:</span>
                        <strong>{viewingField.organic_matter || 2.5} %</strong>
                      </div>
                      <div className="metric-cell">
                        <span>Irrigation Capacity:</span>
                        <strong>{viewingField.irrigation_capacity_mm || 90} mm</strong>
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

                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
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
                        Select for Analysis →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}'''

updated_content = content[:idx_start] + new_section + content[idx_end:]
file_path.write_text(updated_content, encoding="utf-8")
print("Successfully replaced Profile view in main.jsx!")
