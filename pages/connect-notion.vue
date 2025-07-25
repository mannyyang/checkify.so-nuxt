<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';

const user = useSupabaseUser();
const route = useRoute();
const query = route.query;

const response = ref();

onMounted(async () => {
  if (query.code) {
    // Handle OAuth callback
    response.value = await useFetch('/api/connect-notion', {
      method: 'POST',
      body: {
        user_id: user.value?.id,
        code: query.code
      }
    });

    navigateTo('/my-todo-lists');
  } else {
    // Initiate OAuth flow
    const clientId = '2632be3c-842c-4597-b89f-58f60a345ad9';
    const redirectUri = encodeURIComponent(window.location.origin + '/connect-notion');
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
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p class="text-center text-muted-foreground">
            Connecting to Notion...
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
