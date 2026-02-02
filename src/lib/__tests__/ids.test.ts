import { describe, it, expect } from 'vitest';
import {
  generateCampaignId,
  generateEventId,
  isValidCampaignId,
  isValidEventId,
} from '../ids';

describe('ID Generation', () => {
  describe('generateCampaignId', () => {
    it('generates an ID with cmp_ prefix', () => {
      const id = generateCampaignId();
      expect(id).toMatch(/^cmp_/);
    });

    it('generates a 30-character ID (prefix + 26-char ULID)', () => {
      const id = generateCampaignId();
      expect(id).toHaveLength(30);
    });

    it('generates unique IDs on each call', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCampaignId());
      }
      expect(ids.size).toBe(100);
    });

    it('generates IDs in lexicographic order when called sequentially', async () => {
      const id1 = generateCampaignId();
      await new Promise((resolve) => setTimeout(resolve, 2));
      const id2 = generateCampaignId();
      expect(id1 < id2).toBe(true);
    });
  });

  describe('generateEventId', () => {
    it('generates an ID with evt_ prefix', () => {
      const id = generateEventId();
      expect(id).toMatch(/^evt_/);
    });

    it('generates a 30-character ID (prefix + 26-char ULID)', () => {
      const id = generateEventId();
      expect(id).toHaveLength(30);
    });

    it('generates unique IDs on each call', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateEventId());
      }
      expect(ids.size).toBe(100);
    });
  });
});

describe('ID Validation', () => {
  describe('isValidCampaignId', () => {
    it('returns true for valid campaign IDs', () => {
      const validId = generateCampaignId();
      expect(isValidCampaignId(validId)).toBe(true);
    });

    it('returns true for manually constructed valid ID', () => {
      expect(isValidCampaignId('cmp_01ARYZ6S41TSV4RRFFQ69G5FAV')).toBe(true);
    });

    it('returns false for IDs without cmp_ prefix', () => {
      expect(isValidCampaignId('evt_01ARYZ6S41TSV4RRFFQ69G5FAV')).toBe(false);
      expect(isValidCampaignId('01ARYZ6S41TSV4RRFFQ69G5FAV')).toBe(false);
    });

    it('returns false for IDs with wrong length', () => {
      expect(isValidCampaignId('cmp_01ARYZ')).toBe(false);
      expect(isValidCampaignId('cmp_01ARYZ6S41TSV4RRFFQ69G5FAVEXTRA')).toBe(false);
    });

    it('returns false for IDs with lowercase characters', () => {
      expect(isValidCampaignId('cmp_01aryz6s41tsv4rrffq69g5fav')).toBe(false);
    });

    it('returns false for IDs with invalid characters', () => {
      expect(isValidCampaignId('cmp_01ARYZ6S41TSV4RRFFQ69G5FA!')).toBe(false);
      expect(isValidCampaignId('cmp_01ARYZ6S41TSV4RRFFQ69G5FA ')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidCampaignId('')).toBe(false);
    });
  });

  describe('isValidEventId', () => {
    it('returns true for valid event IDs', () => {
      const validId = generateEventId();
      expect(isValidEventId(validId)).toBe(true);
    });

    it('returns true for manually constructed valid ID', () => {
      expect(isValidEventId('evt_01ARYZ6S41TSV4RRFFQ69G5FAV')).toBe(true);
    });

    it('returns false for IDs without evt_ prefix', () => {
      expect(isValidEventId('cmp_01ARYZ6S41TSV4RRFFQ69G5FAV')).toBe(false);
      expect(isValidEventId('01ARYZ6S41TSV4RRFFQ69G5FAV')).toBe(false);
    });

    it('returns false for IDs with wrong length', () => {
      expect(isValidEventId('evt_01ARYZ')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidEventId('')).toBe(false);
    });
  });
});
