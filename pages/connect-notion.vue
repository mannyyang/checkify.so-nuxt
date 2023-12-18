<script setup lang="ts">
const user = useSupabaseUser();
const route = useRoute();
const query = route.query;

const response = ref();

onMounted(async () => {
  if (query.code) {
    response.value = await useFetch('/api/connect-notion', {
      method: 'POST',
      body: {
        user_id: user.value?.id,
        code: query.code
      }
    });

    navigateTo('/my-todo-lists');
  }
});
</script>
<template>
  <div>Waiting for connection...</div>
</template>
