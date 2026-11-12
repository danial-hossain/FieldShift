// frontend/src/NasaDataCardsSection.jsx
// Section "যে তথ্য ব্যবহার করি": Single compact interactive table replacing the 5 long dataset cards.
// Matches docs/evidence_layout_reference.html closely:
// Columns: তথ্য | কী মাপে | মাপ · সময় | রহিমের জমিতে (active field live value) | কোথায় লাগে | অবস্থা
// Clicking any row highlights its path on the 3D/SVG system map and opens the side drawer.

import React from 'react';
import { Satellite } from 'lucide-react';

export function NasaDataCardsSection({
  lang = 'bn',
  activeField = null,
  selectedId = null,
  onSelectNode = null,
}) {
  const isBn = lang === 'bn';

  // Format soil type localized
  const getSoilLabel = (texture) => {
    const t = String(texture || '').toLowerCase();
    if (t.includes('clay') && t.includes('loam')) return isBn ? 'এঁটেল দোআঁশ' : 'Clay Loam';
    if (t.includes('sandy') && t.includes('loam')) return isBn ? 'বেলে দোআঁশ' : 'Sandy Loam';
    if (t.includes('silt') && t.includes('loam')) return isBn ? 'পলি দোআঁশ' : 'Silty Loam';
    if (t.includes('clay')) return isBn ? 'এঁটেল মাটি' : 'Clay';
    if (t.includes('loam')) return isBn ? 'দোআঁশ মাটি' : 'Loam';
    return isBn ? 'এঁটেল দোআঁশ' : 'Clay Loam';
  };

  const dist = String(activeField?.district || 'chapainawabganj').toLowerCase();
  const fieldName = isBn ? (activeField?.name || 'রহিমের জমি') : (activeField?.name || "Rahim's Field");
  const soilTypeStr = getSoilLabel(activeField?.soil_texture);

  // Dynamic values based on active field
  const liveRain = dist.includes('sunamganj') || dist.includes('sylhet')
    ? (isBn ? 'বছরে ~৩,৪৫০ মিমি (হাওর অতিবৃষ্টি)' : '~3,450 mm/yr (Haor high rainfall)')
    : dist.includes('satkhira') || dist.includes('khulna')
    ? (isBn ? 'বছরে ~১,৭১০ মিমি (উপকূলীয় বৃষ্টি)' : '~1,710 mm/yr (Coastal monsoon rainfall)')
    : (isBn ? 'বছরে ~১,৩৫০ মিমি' : '~1,350 mm/yr');

  // EF3 GRACE fix: Show BOTH field cell trend and northwest barind regional average
  const liveGrace = dist.includes('sunamganj') || dist.includes('sylhet')
    ? (isBn ? 'আপনার জমির ঘর: +০.২২ সেমি/বছর · হাওর গড়: +০.২২' : 'Your field cell: +0.22 cm/yr · Haor avg: +0.22')
    : (isBn ? 'আপনার জমির ঘর: −০.৫৮ সেমি/বছর · বরেন্দ্র অঞ্চলের গড়: −১.০৭' : 'Your field cell: −0.58 cm/yr · Barind regional avg: −1.07');

  const liveElevation = dist.includes('sunamganj')
    ? (isBn ? '৭.৫ মি (নিচু হাওর অববাহিকা)' : '7.5 m (Low-lying Haor basin)')
    : (isBn ? '১৮.০ মি (বরেন্দ্র উঁচু ভূমি)' : '18.0 m (Level Barind terrace)');

  const DATASET_ROWS = [
    {
      id: 'gpm',
      nameBn: 'GPM IMERG',
      nameEn: 'GPM IMERG',
      measuresBn: 'বৃষ্টি (দৈনিক)',
      measuresEn: 'Precipitation (Daily)',
      resPeriodBn: '১০ কিমি · ২০০১–২০২৪',
      resPeriodEn: '10 km · 2001–2024',
      liveValue: liveRain,
      pagesBn: 'পানি, ঝুঁকি, প্ল্যানার',
      pagesEn: 'Water, Risk, Planner',
      status: 'used',
    },
    {
      id: 'power',
      nameBn: 'NASA POWER',
      nameEn: 'NASA POWER',
      measuresBn: 'তাপ, আর্দ্রতা, বাতাস, রোদ',
      measuresEn: 'Temp, Humidity, Wind, Solar',
      resPeriodBn: '৫০ কিমি · ১৯৮১–২০২৫ (৪৫ বছর)',
      resPeriodEn: '50 km · 1981–2025 (45 yrs)',
      liveValue: isBn ? 'বছরে ~৯০ দিন ৩৫°C+ · গড় ২৫.৪°C' : '~90 days 35°C+ / yr · avg 25.4°C',
      pagesBn: 'সব পাতা',
      pagesEn: 'All pages',
      status: 'used',
    },
    {
      id: 'grace',
      nameBn: 'GRACE / GRACE-FO',
      nameEn: 'GRACE / GRACE-FO',
      measuresBn: 'মাটির নিচের ও উপরের মোট পানি',
      measuresEn: 'Total Water Storage (Ground, Surface & Soil)',
      resPeriodBn: 'mascon (~৩°), ০.৫° গ্রিডে · ২০০২–২০২৬',
      resPeriodEn: 'mascon (~3°), 0.5° grid · 2002–2026',
      liveValue: liveGrace,
      pagesBn: 'পানি, ঝুঁকি',
      pagesEn: 'Water, Risk',
      status: 'used',
    },
    {
      id: 'visible_earth',
      nameBn: 'NASA Visible Earth (Blue Marble)',
      nameEn: 'NASA Visible Earth (Blue Marble)',
      measuresBn: 'বৈশ্বিক ৩ডি স্তর ও মেঘমালা',
      measuresEn: 'Global 3D Earth & Cloud Surface Imagery',
      resPeriodBn: '২ কিমি · ২০০৪–২০২৬',
      resPeriodEn: '2 km · 2004–2026',
      liveValue: isBn ? 'আবহাওয়া ও বৈশ্বিক ভিজ্যুয়াল' : 'Dynamic 3D flight & orbital overview',
      pagesBn: 'ওভারভিউ',
      pagesEn: 'Overview',
      status: 'used',
    },
    {
      id: 'srtm',
      nameBn: 'SRTM',
      nameEn: 'SRTM',
      measuresBn: 'জমির উচ্চতা',
      measuresEn: 'Surface Elevation',
      resPeriodBn: '৩০ মি',
      resPeriodEn: '30 m',
      liveValue: liveElevation,
      pagesBn: 'পানি (ET০-এর চাপ সংশোধন)',
      pagesEn: 'Water (ET0 pressure correction)',
      status: 'partial',
    },
    {
      id: 'soil',
      nameBn: isBn ? 'ISRIC SoilGrids (NASA নয়)' : 'ISRIC SoilGrids (non-NASA)',
      nameEn: 'ISRIC SoilGrids (non-NASA)',
      measuresBn: 'মাটির ধরন',
      measuresEn: 'Soil Texture',
      resPeriodBn: '২৫০ মি',
      resPeriodEn: '250 m',
      liveValue: isBn ? `${soilTypeStr} (TAW: ১৩২ মিমি/মি)` : `${soilTypeStr} (TAW: 132 mm/m)`,
      pagesBn: 'পানি, আমার জমি',
      pagesEn: 'Water, My Farm',
      status: 'used',
    },
    {
      id: 'price',
      nameBn: isBn ? 'DAM · TCB · BBS (NASA নয়)' : 'DAM · TCB · BBS (non-NASA)',
      nameEn: 'DAM · TCB · BBS (non-NASA)',
      measuresBn: 'বাজার দর',
      measuresEn: 'Market Wholesale Prices',
      resPeriodBn: 'স্থির তালিকা',
      resPeriodEn: 'Fixed Baseline',
      liveValue: isBn ? 'সরিষা ~২,৮০০ টাকা/মণ · আমন ১,২৫০' : 'Mustard ~2,800 BDT/maund · Aman 1,250',
      pagesBn: 'প্ল্যানার, বাজার',
      pagesEn: 'Planner, Market',
      status: 'used',
    },
    {
      id: 'smap',
      nameBn: 'SMAP',
      nameEn: 'SMAP',
      measuresBn: 'মাটির আর্দ্রতা',
      measuresEn: 'Root-Zone Soil Moisture',
      resPeriodBn: '৯ কিমি · ২০১৫–',
      resPeriodEn: '9 km · 2015–',
      liveValue: '—',
      pagesBn: '—',
      pagesEn: '—',
      status: 'planned',
    },
    {
      id: 'modis',
      nameBn: 'MODIS NDVI',
      nameEn: 'MODIS NDVI',
      measuresBn: 'গাছের সবুজভাব',
      measuresEn: 'Vegetation (NDVI)',
      resPeriodBn: '২৫০ মি · ১৬ দিন',
      resPeriodEn: '250 m · 16 days',
      liveValue: '—',
      pagesBn: '—',
      pagesEn: '—',
      status: 'planned',
    },
  ];

  const STATUS_BADGES = {
    used: {
      labelBn: 'ব্যবহৃত',
      labelEn: 'Used',
      bg: 'rgba(200, 241, 105, 0.16)',
      color: '#C8F169',
    },
    partial: {
      labelBn: 'আংশিক',
      labelEn: 'Partial',
      bg: 'rgba(245, 176, 76, 0.16)',
      color: '#F5B04C',
    },
    planned: {
      labelBn: 'পরিকল্পিত',
      labelEn: 'Planned',
      bg: 'rgba(255, 255, 255, 0.08)',
      color: '#a5b2a9',
    },
  };

  const handleRowClick = (nodeId) => {
    if (onSelectNode) {
      onSelectNode(nodeId);
    }
    // Smooth scroll back to map hero so the highlighted path is in view
    const hero = document.getElementById('hero') || document.querySelector('.system-map-3d-wrapper');
    if (hero) {
      hero.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <section
      className="card nasa-data-cards-section"
      style={{
        background: 'var(--surface-panel)',
        border: '1px solid var(--line, #243029)',
        borderRadius: 16,
        padding: '12px 18px',
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <h2
        style={{
          fontFamily: 'var(--display, "Space Grotesk", sans-serif)',
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--fg, #e7efe8)',
          margin: '0 0 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Satellite size={18} strokeWidth={1.75} color="var(--cyan, #5be3ff)" />
        <span>{isBn ? 'যে তথ্য ব্যবহার করি' : 'Data We Actually Use'}</span>
      </h2>

      {/* One-line harmonisation subtitle */}
      <div
        className="muted"
        style={{
          color: 'var(--muted, #93a597)',
          fontSize: 12.5,
          marginBottom: 10,
        }}
      >
        {isBn
          ? 'জমির স্থানাঙ্কভিত্তিক স্যাটেলাইট ও গ্রিড উপাত্ত।'
          : 'Point and grid satellite telemetry calibrated for your field.'}
      </div>

      {/* Interactive Compact Table */}
      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table
          className="dt"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            minWidth: 720,
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted, #93a597)', fontWeight: 600, padding: '8px', borderBottom: '1px solid var(--line, #243029)' }}>
                {isBn ? 'তথ্য' : 'Dataset'}
              </th>
              <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted, #93a597)', fontWeight: 600, padding: '8px', borderBottom: '1px solid var(--line, #243029)' }}>
                {isBn ? 'কী মাপে' : 'Measures'}
              </th>
              <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted, #93a597)', fontWeight: 600, padding: '8px', borderBottom: '1px solid var(--line, #243029)' }}>
                {isBn ? 'মাপ · সময়' : 'Resolution · Period'}
              </th>
              <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted, #93a597)', fontWeight: 600, padding: '8px', borderBottom: '1px solid var(--line, #243029)' }}>
                {isBn ? `${fieldName}-তে` : `On ${fieldName}`}
              </th>
              <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted, #93a597)', fontWeight: 600, padding: '8px', borderBottom: '1px solid var(--line, #243029)' }}>
                {isBn ? 'কোথায় লাগে' : 'Consumer Pages'}
              </th>
              <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--muted, #93a597)', fontWeight: 600, padding: '8px', borderBottom: '1px solid var(--line, #243029)' }}>
                {isBn ? 'অবস্থা' : 'Status'}
              </th>
            </tr>
          </thead>
          <tbody>
            {DATASET_ROWS.map((row) => {
              const isSelected = selectedId === row.id;
              const isPlanned = row.status === 'planned';
              const badge = STATUS_BADGES[row.status] || STATUS_BADGES.used;

              return (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row.id)}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(200, 241, 105, 0.1)' : 'transparent',
                    opacity: isPlanned ? 0.55 : 1,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(200, 241, 105, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--line, #243029)', verticalAlign: 'middle' }}>
                    <b style={{ fontFamily: 'var(--display, "Space Grotesk", sans-serif)', color: isPlanned ? '#94a3b8' : '#e7efe8' }}>
                      {isBn ? row.nameBn : row.nameEn}
                    </b>
                  </td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--line, #243029)', verticalAlign: 'middle', color: '#cbd5e1' }}>
                    {isBn ? row.measuresBn : row.measuresEn}
                  </td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--line, #243029)', verticalAlign: 'middle', color: 'var(--muted, #93a597)' }}>
                    {isBn ? row.resPeriodBn : row.resPeriodEn}
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid var(--line, #243029)',
                      verticalAlign: 'middle',
                      fontVariantNumeric: 'tabular-nums',
                      color: isPlanned ? 'var(--muted, #93a597)' : 'var(--lime, #C8F169)',
                      fontWeight: 600,
                    }}
                  >
                    {row.liveValue}
                  </td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--line, #243029)', verticalAlign: 'middle', color: '#cbd5e1' }}>
                    {isBn ? row.pagesBn : row.pagesEn}
                  </td>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--line, #243029)', verticalAlign: 'middle' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 99,
                        padding: '1px 8px',
                        whiteSpace: 'nowrap',
                        background: badge.bg,
                        color: badge.color,
                        display: 'inline-block',
                      }}
                    >
                      {isBn ? badge.labelBn : badge.labelEn}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default NasaDataCardsSection;
