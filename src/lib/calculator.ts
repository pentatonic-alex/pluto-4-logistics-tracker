/**
 * Material Calculator Logic
 *
 * Forward calculation: Target units → Required inbound kg
 * Reverse calculation: Available kg → Possible units
 */

// Default yield assumptions (when no historical data available)
export const CALCULATOR_DEFAULTS = {
  // Fallback yields when no historical data
  yields: {
    granulation: 0.95,
    metalRemoval: 0.95,
    purification: 0.80,
    extrusion: 0.95,
  },
  contaminationBuffer: 0.05, // 5% buffer for contamination

  // Product presets
  products: {
    storageBox: { name: 'Storage Box', materialKg: 3.0 },
  } as Record<string, ProductPreset>,

  // CO2e assumptions
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
