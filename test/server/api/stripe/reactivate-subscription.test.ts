import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createError } from 'h3';
import handler from '../../../../server/api/stripe/reactivate-subscription.post';

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

describe('Reactivate Subscription API', () => {
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

  it('should successfully reactivate a canceled subscription', async () => {
    const mockSubscription = {
      id: 'sub_test123',
      status: 'active',
      cancel_at_period_end: true,
      current_period_end: 1234567890
    };

    const reactivatedSubscription = {
      ...mockSubscription,
      cancel_at_period_end: false
    };

    mockStripe.subscriptions.list.mockResolvedValue({
      data: [mockSubscription]
    });

    mockStripe.subscriptions.update.mockResolvedValue(reactivatedSubscription);

    const result = await handler(mockEvent);

    expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
      customer: 'test@example.com',
      status: 'all',
      limit: 1
    });

    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
      'sub_test123',
      { cancel_at_period_end: false }
    );

    expect(result).toEqual({
      success: true,
      message: 'Your subscription has been reactivated.',
      subscription: reactivatedSubscription
    });
  });

  it('should handle already active subscription without cancellation', async () => {
    const mockSubscription = {
      id: 'sub_test123',
      status: 'active',
      cancel_at_period_end: false
    };

    mockStripe.subscriptions.list.mockResolvedValue({
      data: [mockSubscription]
    });

    const result = await handler(mockEvent);

    expect(result).toEqual({
      success: true,
      message: 'Your subscription is already active.',
      subscription: mockSubscription
    });

    expect(mockStripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it('should throw error if no subscription found', async () => {
    mockStripe.subscriptions.list.mockResolvedValue({
      data: []
    });

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 404,
        statusMessage: 'No subscription found'
      })
    );
  });

  it('should handle canceled subscription (not just scheduled for cancellation)', async () => {
    const mockSubscription = {
      id: 'sub_test123',
      status: 'canceled',
      cancel_at_period_end: false
    };

    mockStripe.subscriptions.list.mockResolvedValue({
      data: [mockSubscription]
    });

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Cannot reactivate a fully canceled subscription. Please create a new subscription.'
      })
    );
  });

  it('should require authentication', async () => {
    mockEvent.context.user = null;

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    );
  });

  it('should handle Stripe API errors', async () => {
    const mockSubscription = {
      id: 'sub_test123',
      status: 'active',
      cancel_at_period_end: true
    };

    mockStripe.subscriptions.list.mockResolvedValue({
      data: [mockSubscription]
    });

    mockStripe.subscriptions.update.mockRejectedValue(
      new Error('Stripe API error')
    );

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 500,
        statusMessage: 'Failed to reactivate subscription'
      })
    );
  });
});