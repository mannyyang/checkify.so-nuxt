<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();

// create computed property to encode url for query params
const encodedUrl = computed(() => {
  const redirectUrl = encodeURIComponent(
    runtimeConfig.public.BASE_URL + '/connect-notion'
  );

  return `https://api.notion.com/v1/oauth/authorize?client_id=2632be3c-842c-4597-b89f-58f60a345ad9&response_type=code&owner=user&redirect_uri=${redirectUrl}`;
});
</script>

<template>
  <a :href="encodedUrl">
    <Button label="Connect Notion">
      <template #icon>
        <img class="w-5 h-5 mr-2" src="/notion-logo.svg" alt="Notion Logo" />
      </template>
    </Button>
  </a>
</template>

<style></style>
