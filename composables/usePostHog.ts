export const usePostHog = () => {
  const { $posthog } = useNuxtApp();

  return $posthog;
};
