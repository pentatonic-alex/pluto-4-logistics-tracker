import { describe, it, expect } from 'vitest';
import {
  calculateRequiredInput,
  calculatePossibleOutput,
  calculateOverallYield,
  getDefaultYields,
  formatYieldPercent,
  formatCO2e,
  CALCULATOR_DEFAULTS,
  type YieldAssumptions,
} from '../calculator';

describe('calculator', () => {
  const defaultYields: YieldAssumptions = getDefaultYields();

  describe('calculateRequiredInput (forward calculation)', () => {
    it('should calculate required input for target units', () => {
      const result = calculateRequiredInput(100, 3, defaultYields);

      // 100 units × 3 kg = 300 kg finished
      // Working backwards with yields: 0.95 × 0.95 × 0.80 × 0.95 = ~0.6859
      // Plus 5% buffer
      expect(result.requiredInputKg).toBeGreaterThan(400);
      expect(result.requiredInputKg).toBeLessThan(600);
      expect(result.breakdown.length).toBe(6);
    });

    it('should calculate CO2e savings', () => {
      const result = calculateRequiredInput(100, 3, defaultYields);

      expect(result.co2eSavedKg).toBe(100 * CALCULATOR_DEFAULTS.co2e.savingsPerUnit);
      expect(result.coalPreventedLbs).toBe(100 * CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit);
    });

    it('should return zero for zero units', () => {
      const result = calculateRequiredInput(0, 3, defaultYields);

      expect(result.requiredInputKg).toBe(0);
      expect(result.co2eSavedKg).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });

    it('should return zero for negative units', () => {
      const result = calculateRequiredInput(-10, 3, defaultYields);

      expect(result.requiredInputKg).toBe(0);
    });

    it('should scale linearly with target units', () => {
      const result100 = calculateRequiredInput(100, 3, defaultYields);
      const result200 = calculateRequiredInput(200, 3, defaultYields);

      // Should be approximately 2x (allowing for rounding with Math.ceil)
      const ratio = result200.requiredInputKg / result100.requiredInputKg;
      expect(ratio).toBeGreaterThanOrEqual(1.99);
      expect(ratio).toBeLessThanOrEqual(2.01);
    });

    it('should scale with material per unit', () => {
      const result3kg = calculateRequiredInput(100, 3, defaultYields);
      const result6kg = calculateRequiredInput(100, 6, defaultYields);

      // Should be approximately 2x (allowing for rounding with Math.ceil)
      const ratio = result6kg.requiredInputKg / result3kg.requiredInputKg;
      expect(ratio).toBeGreaterThanOrEqual(1.99);
      expect(ratio).toBeLessThanOrEqual(2.01);
    });

    it('should increase with lower yields', () => {
      const lowYields: YieldAssumptions = {
        ...defaultYields,
        purification: 0.6, // Much lower than default 0.8
      };

      const defaultResult = calculateRequiredInput(100, 3, defaultYields);
      const lowYieldResult = calculateRequiredInput(100, 3, lowYields);

      expect(lowYieldResult.requiredInputKg).toBeGreaterThan(
        defaultResult.requiredInputKg
      );
    });

    it('should include contamination buffer in calculation', () => {
      const noBuffer: YieldAssumptions = { ...defaultYields, contaminationBuffer: 0 };
      const withBuffer: YieldAssumptions = {
        ...defaultYields,
        contaminationBuffer: 0.1,
      };

      const noBufferResult = calculateRequiredInput(100, 3, noBuffer);
      const withBufferResult = calculateRequiredInput(100, 3, withBuffer);

      expect(withBufferResult.requiredInputKg).toBeGreaterThan(
        noBufferResult.requiredInputKg
      );
    });

    it('should handle zero yields without producing Infinity', () => {
      const zeroYields: YieldAssumptions = {
        granulation: 0,
        metalRemoval: 0,
        purification: 0,
        extrusion: 0,
        contaminationBuffer: 0,
      };

      const result = calculateRequiredInput(100, 3, zeroYields);

      // Should produce a finite number (clamped to 1% minimum yield)
      expect(Number.isFinite(result.requiredInputKg)).toBe(true);
      expect(result.requiredInputKg).toBeGreaterThan(0);
    });

    it('should handle very large numbers', () => {
      const result = calculateRequiredInput(1000000, 3, defaultYields);

      expect(Number.isFinite(result.requiredInputKg)).toBe(true);
      expect(result.requiredInputKg).toBeGreaterThan(0);
    });
  });

  describe('calculatePossibleOutput (reverse calculation)', () => {
    it('should calculate possible units from available material', () => {
      const result = calculatePossibleOutput(1000, 3, defaultYields);

      // Should produce some units
      expect(result.possibleUnits).toBeGreaterThan(100);
      expect(result.possibleUnits).toBeLessThan(300);
      expect(result.breakdown.length).toBe(6);
    });

    it('should calculate CO2e savings based on possible units', () => {
      const result = calculatePossibleOutput(1000, 3, defaultYields);

      expect(result.co2eSavedKg).toBe(
        result.possibleUnits * CALCULATOR_DEFAULTS.co2e.savingsPerUnit
      );
      expect(result.coalPreventedLbs).toBe(
        result.possibleUnits * CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit
      );
    });

    it('should return zero for zero available material', () => {
      const result = calculatePossibleOutput(0, 3, defaultYields);

      expect(result.possibleUnits).toBe(0);
      expect(result.co2eSavedKg).toBe(0);
    });

    it('should scale linearly with available material', () => {
      const result500 = calculatePossibleOutput(500, 3, defaultYields);
      const result1000 = calculatePossibleOutput(1000, 3, defaultYields);

      // Should be approximately 2x (allowing for rounding with Math.floor)
      const ratio = result1000.possibleUnits / result500.possibleUnits;
      expect(ratio).toBeGreaterThanOrEqual(1.95);
      expect(ratio).toBeLessThanOrEqual(2.05);
    });

    it('should round down to whole units', () => {
      const result = calculatePossibleOutput(1000, 3, defaultYields);

      expect(Number.isInteger(result.possibleUnits)).toBe(true);
    });
  });

  describe('forward and reverse calculations should be inverses', () => {
    it('should approximately reverse each other', () => {
      const targetUnits = 100;
      const materialPerUnit = 3;

      // Forward: how much input needed for 100 units?
      const forwardResult = calculateRequiredInput(
        targetUnits,
        materialPerUnit,
        defaultYields
      );

      // Reverse: how many units from that input?
      const reverseResult = calculatePossibleOutput(
        forwardResult.requiredInputKg,
        materialPerUnit,
        defaultYields
      );

      // Should get back at least the target units (might be slightly more due to rounding)
      expect(reverseResult.possibleUnits).toBeGreaterThanOrEqual(targetUnits);
      expect(reverseResult.possibleUnits).toBeLessThanOrEqual(targetUnits + 5);
    });
  });

  describe('calculateOverallYield', () => {
    it('should calculate product of all yields minus buffer', () => {
      const yields: YieldAssumptions = {
        granulation: 0.95,
        metalRemoval: 0.95,
        purification: 0.80,
        extrusion: 0.95,
        contaminationBuffer: 0.05,
      };

      const overall = calculateOverallYield(yields);

      // 0.95 × 0.95 × 0.80 × 0.95 × (1 - 0.05) ≈ 0.6516
      expect(overall).toBeCloseTo(0.6516, 3);
    });

    it('should return 1 with all perfect yields and no buffer', () => {
      const perfectYields: YieldAssumptions = {
        granulation: 1.0,
        metalRemoval: 1.0,
        purification: 1.0,
        extrusion: 1.0,
        contaminationBuffer: 0,
      };

      const overall = calculateOverallYield(perfectYields);

      expect(overall).toBe(1);
    });
  });

  describe('getDefaultYields', () => {
    it('should return default yield values', () => {
      const defaults = getDefaultYields();

      expect(defaults.granulation).toBe(0.95);
      expect(defaults.metalRemoval).toBe(0.95);
      expect(defaults.purification).toBe(0.80);
      expect(defaults.extrusion).toBe(0.95);
      expect(defaults.contaminationBuffer).toBe(0.05);
    });
  });

  describe('formatYieldPercent', () => {
    it('should format decimal as percentage', () => {
      expect(formatYieldPercent(0.95)).toBe('95%');
      expect(formatYieldPercent(0.8)).toBe('80%');
      expect(formatYieldPercent(1.0)).toBe('100%');
    });

    it('should round to nearest percent', () => {
      expect(formatYieldPercent(0.956)).toBe('96%');
      expect(formatYieldPercent(0.954)).toBe('95%');
    });
  });

  describe('formatCO2e', () => {
    it('should format kg for small values', () => {
      expect(formatCO2e(100)).toBe('100 kg');
      expect(formatCO2e(999)).toBe('999 kg');
    });

    it('should format tonnes for large values', () => {
      expect(formatCO2e(1000)).toBe('1.0 tonnes');
      expect(formatCO2e(2500)).toBe('2.5 tonnes');
    });
  });

  describe('CALCULATOR_DEFAULTS', () => {
    it('should have correct CO2e constants', () => {
      expect(CALCULATOR_DEFAULTS.co2e.savingsPerUnit).toBe(4.0);
      expect(CALCULATOR_DEFAULTS.co2e.coalLbsPerUnit).toBe(4.5);
      expect(CALCULATOR_DEFAULTS.co2e.virginPerUnit).toBe(4.8);
      expect(CALCULATOR_DEFAULTS.co2e.recycledPerUnit).toBe(0.8);
    });

    it('should have Storage Box product preset', () => {
      expect(CALCULATOR_DEFAULTS.products.storageBox).toEqual({
        name: 'Storage Box',
        materialKg: 3.0,
      });
    });
  });
});
