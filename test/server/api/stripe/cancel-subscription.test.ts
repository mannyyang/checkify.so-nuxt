import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createError } from 'h3';
import handler from '../../../../server/api/stripe/cancel-subscription.post';

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

describe('Cancel Subscription API', () => {
  let mockEvent: any;
  let mockStripe: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Get mocked instances
    const Stripe = require('stripe').default;
    mockStripe = new Stripe();
    
    const { createClient } = require('@supabase/supabase-js');
    mockSupabase = createClient();

    mockEvent = {
      context: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }
    };
  });

  it('should successfully cancel an active subscription', async () => {
    const mockSubscription = {
      id: 'sub_test123',
      status: 'active',
      current_period_end: 1234567890,
      cancel_at_period_end: false
    };

    mockStripe.subscriptions.list.mockResolvedValue({
      data: [mockSubscription]
    });

    mockStripe.subscriptions.update.mockResolvedValue({
      ...mockSubscription,
      cancel_at_period_end: true
    });

    const result = await handler(mockEvent);

    expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
      customer: 'test@example.com',
      status: 'active',
      limit: 1
    });

    expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
      'sub_test123',
      { cancel_at_period_end: true }
    );

    expect(result).toEqual({
      success: true,
      message: 'Your subscription has been scheduled for cancellation. You will have access until Thursday, January 15, 1970.',
      subscription: expect.objectContaining({
        cancel_at_period_end: true
      })
    });
  });

  it('should throw error if no active subscription found', async () => {
    mockStripe.subscriptions.list.mockResolvedValue({
      data: []
    });

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 404,
        statusMessage: 'No active subscription found'
      })
    );
  });

  it('should handle already cancelled subscription', async () => {
    const mockSubscription = {
      id: 'sub_test123',
      status: 'active',
      current_period_end: 1234567890,
      cancel_at_period_end: true
    };

    mockStripe.subscriptions.list.mockResolvedValue({
      data: [mockSubscription]
    });

    mockStripe.subscriptions.update.mockResolvedValue(mockSubscription);

    const result = await handler(mockEvent);

    expect(result).toEqual({
      success: true,
      message: 'Your subscription is already scheduled for cancellation.',
      subscription: mockSubscription
    });
  });

  it('should handle Stripe API errors', async () => {
    mockStripe.subscriptions.list.mockRejectedValue(
      new Error('Stripe API error')
    );

    await expect(handler(mockEvent)).rejects.toThrow(
      expect.objectContaining({
        statusCode: 500,
        statusMessage: 'Failed to cancel subscription'
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
});