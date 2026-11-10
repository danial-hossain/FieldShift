// frontend/src/FarmPlanningView.jsx
// Farm Planning Workspace for FieldShift 2026
// Sub-navigation: 6-Season Rotation Planner (MILP), Adaptive Replanning, Scenario Comparison Lab.

import React, { useState, useEffect } from 'react';
import { SixSeasonRecommendationView } from './SixSeasonRecommendationView.jsx';
import { AdaptiveReplanningView } from './AdaptiveReplanningView.jsx';
import { ClimateStressTestView } from './ClimateStressTestView.jsx';
import { YourFarmingVsPlanView } from './YourFarmingVsPlanView.jsx';
import { ExperimentSimulator3DView } from './ExperimentSimulator3DView.jsx';
import { NasaPlantingAdvisoryView } from './NasaPlantingAdvisoryView.jsx';
import { formatNumber } from './marketUtils.js';
import { useTranslation } from './i18n.js';
import { Card, Pill, Tabs } from './ui/index.js';
import { setFieldSelectedStrategy } from './store/rotationPlansStore.js';

export function FarmPlanningView({
  activeField,
  summary,
  plan,
  ml,
  user,
  userFields = [],
  lang = 'bn',
  theme = 'dark',
  onNavigate,
  onRunWorkflow,
  initialSubTab = 'milp',
  request,
}) {
  const { t } = useTranslation(lang);
  const [subTab, setSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]); // 'milp' | 'replan' | 'comparison'

  const subTabs = [
    { id: 'milp', label: lang === 'bn' ? '১. ৬-মৌসুম পরিকল্পনা (6-Season Plan)' : '1. 6-Season Rotation Plan', icon: '🌾' },
    { id: 'replan', label: lang === 'bn' ? '২. অভিযোজিত পুনঃপরিকল্পনা (Adaptive Replan)' : '2. Adaptive Next-Season Replan', icon: '🔄' },
    { id: 'stress', label: lang === 'bn' ? '৩. জলবায়ু চাপ পরীক্ষা (Stress Test)' : '3. Climate Stress Test', icon: '⚡' },
    { id: 'comparison', label: lang === 'bn' ? '৪. আপনার চাষ বনাম পরামর্শ' : '4. Your farming vs plan', icon: '🔬' },
  ];

  return (
    <div className="farm-planning-workspace" style={{ padding: '8px 0 32px 0', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Top Banner & Sub-Navigation */}
      <Card variant="glass" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 26 }}>🌾📐</span>
              <Pill tone="leaf">PuLP MILP Optimization Model</Pill>
              <Pill tone="water">
                {activeField?.name || (lang === 'bn' ? 'বগুড়া পরীক্ষামূলক খামার' : 'Bogura Demo Field')} ({formatNumber(activeField?.area_ha || 10.0, 1)} ha)
              </Pill>
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              {lang === 'bn' ? 'খামার পরিকল্পনা ও বহু-মৌসুমী ফসল আবর্তন' : 'Multi-Season Farm Rotation Planning'}
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, maxWidth: 840 }}>
              {lang === 'bn'
                ? '২ বছর, ৬ মৌসুমের গাণিতিক অপ্টিমাইজেশন (PuLP MILP), নাইট্রোজেন ফিক্সিং ডালশস্য নিয়ম, বোটানিক্যাল পরিবার পর্যায়ক্রম ও মধ্য-মৌসুমী অভিযোজিত পুনঃপরিকল্পনা।'
                : 'PuLP Mixed-Integer Linear Programming (MILP) solving multi-objective trade-offs across profit, water conservation, and soil health with dynamic in-season replanning.'}
            </p>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <Tabs
            tabs={subTabs}
            activeTab={subTab}
            onChange={setSubTab}
          />
        </div>
      </Card>

      {/* Render Active Sub-View */}
      {subTab === 'milp' && (
        <SixSeasonRecommendationView
          activeField={activeField}
          defaultDistrict={activeField?.district || ''}
          summary={summary}
          plan={plan}
          ml={ml}
          user={user}
          userFields={userFields}
          onNavigateTab={(t, extra) => {
            if (t === 'assistant' || t === 'dashboard' || t === 'field' || t === 'water_irrigation') {
              if (onNavigate) onNavigate(t, extra);
            } else if (typeof t === 'string' && ['milp', 'advisory', 'replan', 'stress', 'comparison', 'simulation'].includes(t)) {
              if (extra?.strategy && activeField?.id) {
                setFieldSelectedStrategy(activeField.id, extra.strategy);
              }
              setSubTab(t);
            } else if (onNavigate) {
              onNavigate(t, extra);
            } else {
              setSubTab(t);
            }
          }}
          onBack={() => setSubTab('milp')}
          lang={lang}
          theme={theme}
          onRunWorkflow={onRunWorkflow}
          request={request}
        />
      )}

      {subTab === 'advisory' && (
        <NasaPlantingAdvisoryView
          defaultDistrict={activeField?.district || 'rajshahi'}
          activeField={activeField}
          lang={lang}
          onNavigate={(target) => onNavigate ? onNavigate(target) : setSubTab('milp')}
        />
      )}

      {subTab === 'replan' && (
        <AdaptiveReplanningView
          activeField={activeField}
          summary={summary}
          plan={plan}
          ml={ml}
          user={user}
          lang={lang}
          request={request}
          onNavigateTab={(t, extra) => {
            if (t === 'milp') {
              setSubTab('milp');
            } else if (typeof t === 'string' && ['milp', 'advisory', 'replan', 'stress', 'comparison', 'simulation'].includes(t)) {
              setSubTab(t);
            } else if (onNavigate) {
              onNavigate(t, extra);
            }
          }}
          onBack={() => setSubTab('milp')}
          onRunWorkflow={onRunWorkflow}
        />
      )}

      {subTab === 'stress' && (
        <ClimateStressTestView
          activeField={activeField}
          user={user}
          lang={lang}
          theme={theme}
          request={request}
          onBack={() => setSubTab('milp')}
          onNavigateTab={(t, extra) => {
            if (t === 'milp') {
              setSubTab('milp');
            } else if (typeof t === 'string' && ['milp', 'advisory', 'replan', 'stress', 'comparison', 'simulation'].includes(t)) {
              if (extra?.strategy && activeField?.id) {
                setFieldSelectedStrategy(activeField.id, extra.strategy);
              }
              setSubTab(t);
            } else if (onNavigate) {
              onNavigate(t, extra);
            }
          }}
        />
      )}

      {subTab === 'comparison' && (
        <YourFarmingVsPlanView
          activeField={activeField}
          user={user}
          lang={lang}
          theme={theme}
          onBack={() => setSubTab('milp')}
          onNavigateTab={(t, extra) => {
            if (typeof t === 'string' && ['milp', 'advisory', 'replan', 'stress', 'comparison', 'simulation'].includes(t)) {
              if (extra?.strategy && activeField?.id) {
                setFieldSelectedStrategy(activeField.id, extra.strategy);
              }
              setSubTab(t);
            } else if (onNavigate) {
              onNavigate(t, extra);
            }
          }}
        />
      )}

      {subTab === 'experiment_simulator_3d' && (
        <ExperimentSimulator3DView
          activeField={activeField}
          lang={lang}
          onBack={() => setSubTab('milp')}
          onNavigateTab={(t, extra) => {
            if (t === 'assistant' || t === 'dashboard' || t === 'field' || t === 'water_irrigation') {
              if (onNavigate) onNavigate(t, extra);
            } else if (typeof t === 'string' && ['milp', 'advisory', 'replan', 'stress', 'comparison', 'simulation'].includes(t)) {
              setSubTab(t);
            } else if (onNavigate) {
              onNavigate(t, extra);
            } else {
              setSubTab(t);
            }
          }}
        />
      )}

    </div>
  );
}

export default FarmPlanningView;
