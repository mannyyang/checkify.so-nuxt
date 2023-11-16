<script setup lang="ts">
const supabase = useSupabaseClient();

onBeforeMount(async () => {
  await supabase.auth.signOut();
  navigateTo('/login');
});
</script>

<template>
  <div></div>
</template>
