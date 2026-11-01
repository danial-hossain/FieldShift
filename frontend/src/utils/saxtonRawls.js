/**
 * Saxton & Rawls (2006) Soil Water Characteristics
 * "Soil Water Characteristic Estimates by Texture and Organic Matter for Hydrologic Solutions"
 * Soil Science Society of America Journal 70:1569-1578
 */

export function computeSaxtonRawls(sandPct, clayPct, omPct) {
  if (sandPct == null || clayPct == null) return null;
  const S = Number(sandPct) / 100.0;
  const C = Number(clayPct) / 100.0;
  const OM = omPct != null ? Math.max(0, Math.min(10, Number(omPct))) : 1.5;

  // Permanent Wilting Point (1500 kPa / 15 bar)
  const theta1500t = -0.024 * S + 0.487 * C + 0.006 * OM + 0.005 * (S * OM) - 0.013 * (C * OM) + 0.068 * (S * C) + 0.031;
  const theta1500 = theta1500t + (0.14 * theta1500t - 0.02);

  // Field Capacity (33 kPa / 0.33 bar)
  const theta33t = -0.251 * S + 0.195 * C + 0.011 * OM + 0.006 * (S * OM) - 0.027 * (C * OM) + 0.452 * (S * C) + 0.299;
  const theta33 = theta33t + (1.283 * Math.pow(theta33t, 2) - 0.374 * theta33t - 0.015);

  const fcPct = Math.max(5, Math.min(60, Math.round(theta33 * 100)));
  const pwpPct = Math.max(2, Math.min(fcPct - 2, Math.round(theta1500 * 100)));
  const awcPct = Math.max(2, fcPct - pwpPct);

  return {
    fc: `${fcPct}%`,
    pwp: `${pwpPct}%`,
    awc: `${awcPct}%`,
    fcNum: fcPct,
    pwpNum: pwpPct,
    awcNum: awcPct,
  };
}
