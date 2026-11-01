/**
 * Bangladesh Standard Agricultural Unit Conversions
 * 1 hectare = 10,000 m²
 * 1 bigha = 1,337.8 m²
 * 1 maund (মন) = 37.32 kg (standard government survey maund)
 */

export const SQM_PER_BIGHA = 1337.8;
export const HA_TO_BIGHA = 10000 / SQM_PER_BIGHA; // ~7.4749588877
export const KG_PER_MAUND = 37.32;

/**
 * Convert metric tonnes per hectare to maunds per bigha.
 * Formula: t/ha * 1000 kg/t * (1337.8 m² / 10000 m²) / 37.32 kg/maund
 *        = t/ha * 1000 * 0.13378 / 37.32
 *        = t/ha * 3.584673... (~3.585)
 */
export function tonPerHaToMaundPerBigha(tPerHa) {
  if (tPerHa == null || isNaN(Number(tPerHa))) return null;
  const val = Number(tPerHa);
  return (val * 1000 * 0.13378) / KG_PER_MAUND;
}

/**
 * Convert maunds per bigha to metric tonnes per hectare.
 * Formula: (maund/bigha * 37.32) / (1000 * 0.13378)
 */
export function maundPerBighaToTonPerHa(maundPerBigha) {
  if (maundPerBigha == null || isNaN(Number(maundPerBigha))) return null;
  const val = Number(maundPerBigha);
  return (val * KG_PER_MAUND) / (1000 * 0.13378);
}

/**
 * Convert hectares to standard bigha
 */
export function haToBigha(ha) {
  if (ha == null || isNaN(Number(ha))) return null;
  return Number(ha) * HA_TO_BIGHA;
}

/**
 * Convert standard bigha to hectares
 */
export function bighaToHa(bigha) {
  if (bigha == null || isNaN(Number(bigha))) return null;
  return Number(bigha) / HA_TO_BIGHA;
}
