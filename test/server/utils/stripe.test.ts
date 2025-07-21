import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrCreateStripeCustomer,
  getTierFromPriceId,
  verifyAndSyncStripeCustomer
} from '../../../server/utils/stripe';

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
      list: vi.fn()
    },
    subscriptions: {
      list: vi.fn()
    }
  };
  return {
    default: vi.fn(() => mockStripe)
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }))
}));

// Mock runtime config
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    stripePriceIdPro: 'price_pro_test',
    stripePriceIdMax: 'price_max_test'
  })
}));

describe('Stripe Utils', () => {
  let mockStripe: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked instances
    const Stripe = require('stripe').default;
    mockStripe = new Stripe();

    const { createClient } = require('@supabase/supabase-js');
    mockSupabase = createClient();
  });

  describe('getOrCreateStripeCustomer', () => {
    it('should return existing customer if valid', async () => {
      const mockProfile = {
        stripe_customer_id: 'cus_existing123',
        user_id: 'test-user-id'
      };

      const mockCustomer = {
        id: 'cus_existing123',
        deleted: false
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null
      });

      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

      const result = await getOrCreateStripeCustomer('test-user-id', 'test@example.com');

      expect(result).toBe('cus_existing123');
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_existing123');
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer if existing one is deleted', async () => {
      const mockProfile = {
        stripe_customer_id: 'cus_deleted123',
        user_id: 'test-user-id'
      };

      const deletedCustomer = {
        id: 'cus_deleted123',
        deleted: true
      };

      const newCustomer = {
        id: 'cus_new123'
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null
      });

      mockStripe.customers.retrieve.mockResolvedValue(deletedCustomer);
      mockStripe.customers.create.mockResolvedValue(newCustomer);

      const result = await getOrCreateStripeCustomer('test-user-id', 'test@example.com');

      expect(result).toBe('cus_new123');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          user_id: 'test-user-id'
        }
      });
    });

    it('should create new customer if none exists', async () => {
      const newCustomer = {
        id: 'cus_new123'
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: null
      });

      mockStripe.customers.create.mockResolvedValue(newCustomer);

      const result = await getOrCreateStripeCustomer('test-user-id', 'test@example.com');

      expect(result).toBe('cus_new123');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          user_id: 'test-user-id'
        }
      });
    });

    it('should handle Stripe API errors when retrieving customer', async () => {
      const mockProfile = {
        stripe_customer_id: 'cus_error123',
        user_id: 'test-user-id'
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null
      });

      mockStripe.customers.retrieve.mockRejectedValue(new Error('Customer not found'));
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new123' });

      const result = await getOrCreateStripeCustomer('test-user-id', 'test@example.com');

      expect(result).toBe('cus_new123');
    });
  });

  describe('getTierFromPriceId', () => {
    it('should return correct tier for valid price IDs', () => {
      expect(getTierFromPriceId('price_pro_test')).toBe('pro');
      expect(getTierFromPriceId('price_max_test')).toBe('max');
    });

    it('should return free for unknown price IDs', () => {
      expect(getTierFromPriceId('price_unknown')).toBe('free');
      expect(getTierFromPriceId('')).toBe('free');
      expect(getTierFromPriceId(undefined as any)).toBe('free');
    });
  });

  describe('verifyAndSyncStripeCustomer', () => {
    it('should sync active subscription from Stripe', async () => {
      const mockSubscriptions = {
        data: [{
          status: 'active',
          items: {
            data: [{
              price: { id: 'price_pro_test' }
            }]
          }
        }]
      };

      mockStripe.customers.list.mockResolvedValue({
        data: [{ id: 'cus_test123' }]
      });

      mockStripe.subscriptions.list.mockResolvedValue(mockSubscriptions);

      const result = await verifyAndSyncStripeCustomer('test@example.com', 'test-user-id');

      expect(result).toEqual({
        hasCustomer: true,
        customerId: 'cus_test123',
        subscription: {
          status: 'active',
          tier: 'pro'
        }
      });

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        stripe_customer_id: 'cus_test123',
        subscription_status: 'active',
        subscription_tier: 'pro'
      });
    });

    it('should handle no customer found', async () => {
      mockStripe.customers.list.mockResolvedValue({
        data: []
      });

      const result = await verifyAndSyncStripeCustomer('test@example.com', 'test-user-id');

      expect(result).toEqual({
        hasCustomer: false,
        customerId: null,
        subscription: null
      });
    });

    it('should handle canceled subscriptions', async () => {
      const mockSubscriptions = {
        data: [{
          status: 'canceled',
          items: {
            data: [{
              price: { id: 'price_pro_test' }
            }]
          }
        }]
      };

      mockStripe.customers.list.mockResolvedValue({
        data: [{ id: 'cus_test123' }]
      });

      mockStripe.subscriptions.list.mockResolvedValue(mockSubscriptions);

      const result = await verifyAndSyncStripeCustomer('test@example.com', 'test-user-id');

      expect(result.subscription).toEqual({
        status: 'canceled',
        tier: 'pro'
      });

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        stripe_customer_id: 'cus_test123',
        subscription_status: 'canceled',
        subscription_tier: 'free'
      });
    });

    it('should handle errors gracefully', async () => {
      mockStripe.customers.list.mockRejectedValue(new Error('API Error'));

      await expect(
        verifyAndSyncStripeCustomer('test@example.com', 'test-user-id')
      ).rejects.toThrow('Failed to verify Stripe customer');
    });
  });
});
