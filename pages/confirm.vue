<script setup lang="ts">
const user = useSupabaseUser();
const supabase = useSupabaseClient();

// Check for auth errors in URL
onMounted(async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Auth error:', error);
    // Redirect to login on error
    await navigateTo('/login');
    return;
  }

  if (session) {
    // Session exists, redirect to dashboard
    await navigateTo('/my-todo-lists');
  } else {
    // No session, wait a bit for auth to complete
    setTimeout(async () => {
      const { data: { session: retrySession } } = await supabase.auth.getSession();
      if (retrySession) {
        await navigateTo('/my-todo-lists');
      } else {
        await navigateTo('/login');
      }
    }, 2000);
  }
});

// Also watch for user changes
watch(
  user,
  (newUser) => {
    if (newUser) {
      navigateTo('/my-todo-lists');
    }
  },
  { immediate: false }
);
</script>
<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="mb-4">
        <svg class="animate-spin h-8 w-8 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p class="text-muted-foreground">
        Completing sign in...
      </p>
    </div>
  </div>
</template>
