import { describe, it, expect } from 'vitest';
import {
  PRICING_TIERS,
  TIER_LIMITS,
  getTierByName,
  getTierFeatures,
  getTierLimits,
  formatTierLimit,
  isFeatureIncluded
} from '../lib/pricing';

describe('Pricing Module', () => {
  describe('PRICING_TIERS', () => {
    it('should have three tiers defined', () => {
      expect(PRICING_TIERS).toHaveLength(3);
      expect(PRICING_TIERS.map(t => t.id)).toEqual(['free', 'pro', 'max']);
    });

    it('should have correct pricing for each tier', () => {
      expect(PRICING_TIERS[0].price).toBe('$0');
      expect(PRICING_TIERS[0].priceMonthly).toBe(0);
      expect(PRICING_TIERS[1].price).toBe('$6.99');
      expect(PRICING_TIERS[1].priceMonthly).toBe(6.99);
      expect(PRICING_TIERS[2].price).toBe('$19.99');
      expect(PRICING_TIERS[2].priceMonthly).toBe(19.99);
    });

    it('should have Pro tier highlighted', () => {
      const proTier = PRICING_TIERS.find(t => t.id === 'pro');
      expect(proTier?.highlighted).toBe(true);
    });

    it('should have Sync Checkboxes to Notion Database available for all tiers', () => {
      PRICING_TIERS.forEach((tier) => {
        const syncFeature = tier.features.find(f => f.text.includes('Sync Checkboxes to Notion Database'));
        expect(syncFeature?.included).toBe(true);
      });
    });

    it('should not have API access feature in any tier', () => {
      PRICING_TIERS.forEach((tier) => {
        const apiFeature = tier.features.find(f => f.text.toLowerCase().includes('api access'));
        expect(apiFeature).toBeUndefined();
      });
    });
  });

  describe('TIER_LIMITS', () => {
    it('should have correct limits for free tier', () => {
      expect(TIER_LIMITS.free).toEqual({
        maxPages: 25,
        maxCheckboxesPerPage: 25,
        maxTodoLists: 2
      });
    });

    it('should have correct limits for pro tier', () => {
      expect(TIER_LIMITS.pro).toEqual({
        maxPages: 100,
        maxCheckboxesPerPage: 100,
        maxTodoLists: 10
      });
    });

    it('should have correct limits for max tier', () => {
      expect(TIER_LIMITS.max).toEqual({
        maxPages: 500,
        maxCheckboxesPerPage: 1000,
        maxTodoLists: 25
      });
    });
  });

  describe('getTierByName', () => {
    it('should return correct tier for valid names', () => {
      const freeTier = getTierByName('free');
      expect(freeTier?.name).toBe('Free');
      expect(freeTier?.id).toBe('free');

      const proTier = getTierByName('pro');
      expect(proTier?.name).toBe('Pro');
      expect(proTier?.id).toBe('pro');

      const maxTier = getTierByName('max');
      expect(maxTier?.name).toBe('Max');
      expect(maxTier?.id).toBe('max');
    });

    it('should return undefined for invalid tier name', () => {
      // @ts-expect-error Testing invalid input
      const result = getTierByName('invalid');
      expect(result).toBeUndefined();
    });
  });

  describe('getTierFeatures', () => {
    it('should return features for valid tier', () => {
      const features = getTierFeatures('pro');
      expect(features).toBeInstanceOf(Array);
      expect(features.length).toBeGreaterThan(0);
      expect(features.some(f => f.text.includes('100 Notion pages'))).toBe(true);
    });

    it('should return empty array for invalid tier', () => {
      // @ts-expect-error Testing invalid input
      const features = getTierFeatures('invalid');
      expect(features).toEqual([]);
    });
  });

  describe('getTierLimits', () => {
    it('should return correct limits for each tier', () => {
      const freeLimits = getTierLimits('free');
      expect(freeLimits.maxPages).toBe(25);
      expect(freeLimits.maxCheckboxesPerPage).toBe(25);

      const proLimits = getTierLimits('pro');
      expect(proLimits.maxPages).toBe(100);
      expect(proLimits.maxCheckboxesPerPage).toBe(100);

      const maxLimits = getTierLimits('max');
      expect(maxLimits.maxPages).toBe(500);
      expect(maxLimits.maxCheckboxesPerPage).toBe(1000);
    });
  });

  describe('formatTierLimit', () => {
    it('should format unlimited correctly', () => {
      expect(formatTierLimit(-1)).toBe('Unlimited');
    });

    it('should format numbers with locale string', () => {
      expect(formatTierLimit(1000)).toBe('1,000');
      expect(formatTierLimit(50)).toBe('50');
    });
  });

  describe('isFeatureIncluded', () => {
    it('should correctly identify included features', () => {
      expect(isFeatureIncluded('free', 'Sync Checkboxes')).toBe(true);
      expect(isFeatureIncluded('free', 'Daily automatic sync')).toBe(false);
      expect(isFeatureIncluded('pro', 'Daily automatic sync')).toBe(true);
      expect(isFeatureIncluded('max', 'Hourly automatic sync')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isFeatureIncluded('pro', 'DAILY AUTOMATIC SYNC')).toBe(true);
      expect(isFeatureIncluded('pro', 'Daily Automatic Sync')).toBe(true);
    });

    it('should return false for non-existent features', () => {
      expect(isFeatureIncluded('free', 'non-existent-feature')).toBe(false);
    });

    it('should return false for invalid tier', () => {
      // @ts-expect-error Testing invalid input
      expect(isFeatureIncluded('invalid', 'webhooks')).toBe(false);
    });
  });
});
