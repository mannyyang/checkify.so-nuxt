export type TierName = 'free' | 'pro' | 'max';

export interface TierFeature {
  text: string;
  included: boolean;
}

export interface TierLimits {
  maxPages: number;
  maxCheckboxesPerPage: number;
  maxTodoLists: number;
}

export interface PricingTier {
  name: string;
  id: TierName;
  price: string;
  priceMonthly: number;
  description: string;
  features: TierFeature[];
  limits: TierLimits;
  highlighted?: boolean;
  cta: string;
}

export const TIER_LIMITS: Record<TierName, TierLimits> = {
  free: {
    maxPages: 25,
    maxCheckboxesPerPage: 25,
    maxTodoLists: 2
  },
  pro: {
    maxPages: 100,
    maxCheckboxesPerPage: 100,
    maxTodoLists: 10
  },
  max: {
    maxPages: 500,
    maxCheckboxesPerPage: 1000,
    maxTodoLists: 25
  }
};

export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Free',
    id: 'free',
    price: '$0',
    priceMonthly: 0,
    description: 'Perfect for personal use',
    features: [
      { text: '15 Notion pages', included: true },
      { text: '25 checkboxes per page', included: true },
      { text: '2 todo lists', included: true },
      { text: 'Manual sync only', included: true },
      { text: 'Sync Checkboxes to Notion Database', included: true },
      { text: 'Basic support', included: true },
      { text: 'Daily automatic sync', included: false },
      { text: 'Hourly automatic sync', included: false },
      { text: 'Priority support', included: false }
    ],
    limits: TIER_LIMITS.free,
    cta: 'Current Plan'
  },
  {
    name: 'Pro',
    id: 'pro',
    price: '$6.99',
    priceMonthly: 6.99,
    description: 'For power users',
    features: [
      { text: '100 Notion pages', included: true },
      { text: '100 checkboxes per page', included: true },
      { text: '10 todo lists', included: true },
      { text: 'Daily automatic sync', included: true },
      { text: 'Sync Checkboxes to Notion Database', included: true },
      { text: 'Email support', included: true },
      { text: 'Priority support', included: true },
      { text: 'Hourly automatic sync', included: false }
    ],
    limits: TIER_LIMITS.pro,
    highlighted: true,
    cta: 'Upgrade to Pro'
  },
  {
    name: 'Max',
    id: 'max',
    price: '$19.99',
    priceMonthly: 19.99,
    description: 'For teams and enterprises',
    features: [
      { text: '500 Notion pages', included: true },
      { text: '1000 checkboxes per page', included: true },
      { text: '25 todo lists', included: true },
      { text: 'Hourly automatic sync', included: true },
      { text: 'Sync Checkboxes to Notion Database', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Priority support', included: true }
    ],
    limits: TIER_LIMITS.max,
    cta: 'Upgrade to Max'
  }
];

export function getTierByName (tierName: TierName): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === tierName);
}

export function getTierFeatures (tierName: TierName): TierFeature[] {
  const tier = getTierByName(tierName);
  return tier?.features || [];
}

export function getTierLimits (tierName: TierName): TierLimits {
  return TIER_LIMITS[tierName];
}

export function formatTierLimit (limit: number): string {
  if (limit === -1) { return 'Unlimited'; }
  return limit.toLocaleString();
}

export function isFeatureIncluded (tierName: TierName, featureName: string): boolean {
  const tier = getTierByName(tierName);
  const feature = tier?.features.find(f => f.text.toLowerCase().includes(featureName.toLowerCase()));
  return feature?.included || false;
}
