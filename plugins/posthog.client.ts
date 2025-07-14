import posthogLib from 'posthog-js';

export default defineNuxtPlugin(() => {
  if (typeof window !== 'undefined') {
    posthogLib.init('phc_BIxmZZkq3eZnFe34blKaxY9s6XG90vXv0AcoIqKGBia', {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      loaded: () => {
        // PostHog loaded successfully
      }
    });
  }

  return {
    provide: {
      posthog: posthogLib
    }
  };
});
