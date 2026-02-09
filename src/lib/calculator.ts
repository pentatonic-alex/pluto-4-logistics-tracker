/**
 * Material Calculator Logic
 *
 * Calculates material requirements and environmental impact for LEGO REPLAY's
 * circular supply chain (LEGO → MBA → RGE → LEGO).
 *
 * Supports two calculation modes:
 * - Forward: Target units → Required inbound kg
 * - Reverse: Available kg → Possible units
 *
 * Methodology and constants documented in:
 * docs/brainstorms/2026-02-02-analytics-calculator-brainstorm.md
 *
 * Key assumptions:
 * - Processing yields: Based on PCR plastic industry standards (granulation,
 *   metal removal, purification, extrusion)
 * - CO2e savings: Lifecycle analysis comparing recycled ABS (0.8 kg) vs virgin
 *   ABS (4.8 kg) = 4.0 kg CO2e savings per unit
 * - Product specs: From LEGO product specifications (e.g., Storage Box = 3 kg)
 */

// Default yield assumptions (when no historical data available)
export const CALCULATOR_DEFAULTS = {
  /**
   * Default yield assumptions for processing steps
   *
   * These fallback values are used when no historical campaign data is available.
   * Based on typical industry performance for post-consumer recycled (PCR) plastic processing:
   *
   * - granulation: 0.95 (95%) - Typical yield for mechanical grinding of plastic bricks
   *   into granules. Loss occurs from dust generation and size screening.
   *
   * - metalRemoval: 0.95 (95%) - Typical yield for magnetic separation to remove metal
   *   contaminants. Loss occurs from removing material adhering to metal particles.
   *
   * - purification: 0.80 (80%) - Lower yield accounts for polymer quality filtering,
   *   where off-spec material is rejected to maintain output quality standards.
   *
   * - extrusion: 0.95 (95%) - Typical yield for extrusion/compounding processes.
   *   Loss occurs from startup material, purging, and edge trim.
   *
   * Note: Actual yields may vary by campaign and should be updated with historical
   * data when available. The calculator uses these as conservative baseline estimates.
   */
  yields: {
    granulation: 0.95,
    metalRemoval: 0.95,
    purification: 0.80,
    extrusion: 0.95,
  },

  /**
   * Contamination buffer: 5% safety margin
   *
   * Added to inbound material requirements to account for unexpected contamination
   * in post-consumer recycled (PCR) LEGO bricks. This buffer ensures sufficient
   * material is available even if contamination levels exceed typical expectations.
   *
   * User-adjustable based on material source quality and risk tolerance.
   */
  contaminationBuffer: 0.05,

  /**
   * Product presets: Pre-configured output products with material specifications
   *
   * These presets allow quick calculations for common products manufactured from
   * recycled LEGO brick material. Each preset defines:
   *
   * - name: Human-readable product name for display in the UI
   * - materialKg: Amount of finished recycled material (kg) required per unit
   *
   * Current presets:
   * - storageBox: 3.0 kg per unit - A storage box product made from recycled ABS plastic.
   *   This specification represents the finished weight after all processing steps
   *   (granulation, metal removal, purification, and extrusion).
   *
   * Usage: These presets populate the material calculator UI, allowing project managers
   * to quickly estimate material requirements for target production runs without manually
   * entering material specifications for each calculation.
   *
   * Note: Additional product presets can be added as new products are defined in the
   * circular supply chain. Each preset should use actual finished material requirements
   * from product specifications or historical manufacturing data.
   */
  products: {
    storageBox: { name: 'Storage Box', materialKg: 3.0 },
  } as Record<string, ProductPreset>,

  /**
   * CO2e emissions and savings assumptions
   *
   * Sources:
   * - recycledPerUnit: Lifecycle analysis for recycled ABS plastic production
   * - virginPerUnit: Lifecycle analysis for virgin ABS plastic production
   * - savingsPerUnit: Calculated as virginPerUnit - recycledPerUnit = 4.8 - 0.8 = 4.0 kg CO2e savings per unit
   * - coalLbsPerUnit: EPA coal combustion emission factors converted to tangible environmental metric
   *
   * These values represent the carbon footprint across the full product lifecycle,
   * from raw material extraction through manufacturing, and enable calculation of
   * environmental impact for sustainability reporting.
   */
  co2e: {
    recycledPerUnit: 0.8, // kg CO2e for recycled
    virginPerUnit: 4.8, // kg CO2e for virgin plastic
    savingsPerUnit: 4.0, // kg CO2e saved (virgin - recycled)
    coalLbsPerUnit: 4.5, // lbs coal prevented per unit
  },
};

// Types
export interface YieldAssumptions {
  granulation: number;
  metalRemoval: number;
  purification: number;
  extrusion: number;
  contaminationBuffer: number;
}

export interface ProductPreset {
  name: string;
  materialKg: number;
}

export interface BreakdownStep {
  step: string;
  kg: number;
}

export interface ForwardCalculationResult {
  requiredInputKg: number;
  co2eSavedKg: number;
  coalPreventedLbs: number;
  breakdown: BreakdownStep[];
}

export interface ReverseCalculationResult {
  possibleUnits: number;
  co2eSavedKg: number;
  coalPreventedLbs: number;
  breakdown: BreakdownStep[];
}

/**
 * Forward calculation: Calculate required inbound material for target units
 *
 * Works backwards through the processing chain:
 * Target units → Finished material → Before extrusion → Before purification →
 * Before metal removal → Before granulation → With contamination buffer
 */
export function calculateRequiredInput(
  targetUnits: number,
  materialPerUnit: number,
  yields: YieldAssumptions
): ForwardCalculationResult {
  // Guard against invalid inputs
  if (targetUnits <= 0 || materialPerUnit <= 0) {
    return {
      requiredInputKg: 0,
      co2eSavedKg: 0,
      coalPreventedLbs: 0,
      breakdown: [],
    };
  }

  // Guard against zero/invalid yields (would cause division by zero)
  const MIN_YIELD = 0.01; // 1% minimum
  const safeYields = {
    granulation: Math.max(yields.granulation, MIN_YIELD),
    metalRemoval: Math.max(yields.metalRemoval, MIN_YIELD),
    purification: Math.max(yields.purification, MIN_YIELD),
    extrusion: Math.max(yields.extrusion, MIN_YIELD),
    contaminationBuffer: Math.max(0, Math.min(yields.contaminationBuffer, 0.99)),
  };

  const finishedMaterial = targetUnits * materialPerUnit;

  // Work backwards through the chain (divide by yield at each step)
  const afterExtrusion = finishedMaterial / safeYields.extrusion;
  const afterPurification = afterExtrusion / safeYields.purification;
  const afterMetalRemoval = afterPurification / safeYields.metalRemoval;
  const afterGranulation = afterMetalRemoval / safeYields.granulation;

  // Add contamination buffer
  const withBuffer = afterGranulation * (1 + safeYields.contaminationBuffer);

  // CO2e savings
  const co2eSaved = targetUnits * CALCULATOR_DEFAULTS.co2e.savingsPerUnit;
  const coalPrevented = targetUnits * CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit;

  return {
    requiredInputKg: Math.ceil(withBuffer),
    co2eSavedKg: co2eSaved,
    coalPreventedLbs: coalPrevented,
    breakdown: [
      { step: 'Finished material', kg: round2(finishedMaterial) },
      { step: 'Before extrusion', kg: round2(afterExtrusion) },
      { step: 'Before purification', kg: round2(afterPurification) },
      { step: 'Before metal removal', kg: round2(afterMetalRemoval) },
      { step: 'Before granulation', kg: round2(afterGranulation) },
      { step: 'With contamination buffer', kg: round2(withBuffer) },
    ],
  };
}

/**
 * Reverse calculation: Calculate possible output from available material
 *
 * Works forward through the processing chain:
 * Available kg → After buffer adjustment → After granulation → After metal removal →
 * After purification → After extrusion → Possible units
 */
export function calculatePossibleOutput(
  availableKg: number,
  materialPerUnit: number,
  yields: YieldAssumptions
): ReverseCalculationResult {
  if (availableKg <= 0 || materialPerUnit <= 0) {
    return {
      possibleUnits: 0,
      co2eSavedKg: 0,
      coalPreventedLbs: 0,
      breakdown: [],
    };
  }

  // Remove contamination buffer
  const afterBuffer = availableKg / (1 + yields.contaminationBuffer);

  // Work forward through the chain (multiply by yield at each step)
  const afterGranulation = afterBuffer * yields.granulation;
  const afterMetalRemoval = afterGranulation * yields.metalRemoval;
  const afterPurification = afterMetalRemoval * yields.purification;
  const afterExtrusion = afterPurification * yields.extrusion;

  const possibleUnits = Math.floor(afterExtrusion / materialPerUnit);

  // CO2e savings
  const co2eSaved = possibleUnits * CALCULATOR_DEFAULTS.co2e.savingsPerUnit;
  const coalPrevented = possibleUnits * CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit;

  return {
    possibleUnits,
    co2eSavedKg: co2eSaved,
    coalPreventedLbs: coalPrevented,
    breakdown: [
      { step: 'Available input', kg: round2(availableKg) },
      { step: 'After buffer adjustment', kg: round2(afterBuffer) },
      { step: 'After granulation', kg: round2(afterGranulation) },
      { step: 'After metal removal', kg: round2(afterMetalRemoval) },
      { step: 'After purification', kg: round2(afterPurification) },
      { step: 'After extrusion', kg: round2(afterExtrusion) },
    ],
  };
}

/**
 * Calculate overall yield from individual step yields
 */
export function calculateOverallYield(yields: YieldAssumptions): number {
  return (
    yields.granulation *
    yields.metalRemoval *
    yields.purification *
    yields.extrusion *
    (1 - yields.contaminationBuffer)
  );
}

/**
 * Get default yield assumptions (fallback values)
 */
export function getDefaultYields(): YieldAssumptions {
  return {
    ...CALCULATOR_DEFAULTS.yields,
    contaminationBuffer: CALCULATOR_DEFAULTS.contaminationBuffer,
  };
}

/**
 * Get available product presets
 */
export function getProductPresets(): ProductPreset[] {
  return Object.values(CALCULATOR_DEFAULTS.products);
}

/**
 * Format yield as percentage string (e.g., 0.95 → "95%")
 */
export function formatYieldPercent(yield_: number): string {
  return `${Math.round(yield_ * 100)}%`;
}

/**
 * Format CO2e with units
 */
export function formatCO2e(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} tonnes`;
  }
  return `${kg.toFixed(0)} kg`;
}

/**
 * Round to 2 decimal places
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
