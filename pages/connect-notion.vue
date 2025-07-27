<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';

const user = useSupabaseUser();
const route = useRoute();
const query = route.query;

const response = ref();
const isProcessing = ref(false);

onMounted(async () => {
  // Check for error first (user cancelled or denied access)
  if (query.error) {
    console.log('Notion connection cancelled or denied:', query.error);
    // Redirect back to todo lists with appropriate error message
    if (query.error === 'access_denied') {
      await navigateTo('/my-todo-lists?error=notion_cancelled');
    } else {
      await navigateTo('/my-todo-lists?error=notion_error');
    }
    return;
  }

  if (query.code) {
    // Prevent duplicate processing
    if (isProcessing.value) {
      console.log('Already processing OAuth callback');
      return;
    }
    isProcessing.value = true;

    // Handle OAuth callback
    try {
      response.value = await $fetch('/api/connect-notion', {
        method: 'POST',
        body: {
          user_id: user.value?.id,
          code: query.code
        }
      });

      // Only navigate on success
      await navigateTo('/my-todo-lists?success=connected');
    } catch (error: any) {
      console.error('Failed to connect:', error);
      // Clear the code from URL to prevent reuse
      await navigateTo('/my-todo-lists?error=connection_failed');
    }
  } else {
    // Initiate OAuth flow
    const clientId = '2632be3c-842c-4597-b89f-58f60a345ad9';
    const redirectUri = encodeURIComponent(
      window.location.origin + '/connect-notion'
    );
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  }
});
</script>
<template>
  <div class="flex items-center justify-center min-h-screen">
    <Card class="w-96">
      <CardContent class="pt-6">
        <div class="flex flex-col items-center space-y-4">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          />
          <p class="text-center text-muted-foreground">
            Connecting to Notion...
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
