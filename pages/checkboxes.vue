<script setup lang="ts">
definePageMeta({
  layout: 'embed'
})

const { data, pending, error, refresh } = await useFetch('/api/get-checkboxes')
const resp = data.value
</script>

<template>
  <pre>{{ resp?.results }}</pre>
</template>

<style scoped></style>
