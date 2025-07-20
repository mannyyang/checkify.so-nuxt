import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createError } from 'h3';
import handler from '../../../../server/api/stripe/update-subscription.post';

// Mock runtime config
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: {
      stripePriceIdPro: 'price_pro_test',
      stripePriceIdMax: 'price_max_test'
    }
  })
}));

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    subscriptions: {
      list: vi.fn(),
      update: vi.fn()
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
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }))
}));

describe('Update Subscription API', () => {
  let mockEvent: any;
  let mockStripe: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Get mocked instances
    const Stripe = require('stripe').default;
    mockStripe = new Stripe();

    mockEvent = {
      context: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }
    };
  });

  it('should successfully update subscription from pro to max', async () => {
    const mockSubscription = {
      id: 'sub_test123',
      status: 'active',
      items: {
        data: [{
          id: 'si_test123',
          price: { id: 'price_pro_test' }
        }]
      }
    };

    const updatedSubscription = {
      ...mockSubscription,
      items: {
        data: [{
          id: 'si_test123',
          price: { id: 'price_max_test' }
        }]
      }
    };

    mockStripe.subscriptions.list.mockResolvedValue({
      data: [mockSubscription]
    });

    mockStripe.subscriptions.update.mockResolvedValue(updatedSubscription);

    const body = await readBody(mockEvent, {
      priceId: 'price_max_test',
      tier: 'max'
    });

    const result = await handler(mockEvent);

    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
      'sub_test123',
      {
        items: [{
          id: 'si_test123',
          price: 'price_max_test'
        }],
        proration_behavior: 'always_invoice'
      }
    );

    expect(result).toEqual({
      success: true,
      subscription: updatedSubscription
    });
  });

  it('should throw error if no active subscription found', async () => {
    mockStripe.subscriptions.list.mockResolvedValue({
      data: []
    });

    const body = {
      priceId: 'price_max_test',
      tier: 'max'
    };

    mockEvent.body = body;

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 404,
        statusMessage: 'No active subscription found'
      })
    );
  });

  it('should throw error if trying to change to the same tier', async () => {
    const mockSubscription = {
      id: 'sub_test123',
      status: 'active',
      items: {
        data: [{
          id: 'si_test123',
          price: { id: 'price_pro_test' }
        }]
      }
    };

    mockStripe.subscriptions.list.mockResolvedValue({
      data: [mockSubscription]
    });

    const body = {
      priceId: 'price_pro_test',
      tier: 'pro'
    };

    mockEvent.body = body;

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'You are already on the pro plan'
      })
    );
  });

  it('should validate request body', async () => {
    mockEvent.body = {
      // Missing required fields
    };

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Missing required fields: priceId and tier'
      })
    );
  });

  it('should require authentication', async () => {
    mockEvent.context.user = null;
    mockEvent.body = {
      priceId: 'price_max_test',
      tier: 'max'
    };

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    );
  });

  it('should handle Stripe API errors gracefully', async () => {
    mockStripe.subscriptions.list.mockResolvedValue({
      data: [{
        id: 'sub_test123',
        status: 'active',
        items: {
          data: [{
            id: 'si_test123',
            price: { id: 'price_pro_test' }
          }]
        }
      }]
    });

    mockStripe.subscriptions.update.mockRejectedValue(
      new Error('Card declined')
    );

    const body = {
      priceId: 'price_max_test',
      tier: 'max'
    };

    mockEvent.body = body;

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 500,
        statusMessage: 'Failed to update subscription'
      })
    );
  });
});

// Helper function to simulate reading body
function readBody(event: any, body: any) {
  event.body = body;
  return Promise.resolve(body);
}