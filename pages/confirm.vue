<script setup lang="ts">
const user = useSupabaseUser();
watch(
  user,
  () => {
    if (user.value) {
      return navigateTo('/my-todo-lists');
    }
  },
  { immediate: true }
);
</script>
<template>
  <div>Waiting for login...</div>
</template>
