<script setup lang="ts">
const supabase = useSupabaseClient();
const user = useSupabaseUser();

const response = ref({
  data: {}
});

onMounted(async () => {
  response.value = await useFetch('/api/auth-notion');

  console.log(response);
});
</script>

<template>
  <div class="card">
    <Panel header="Get Started Here!">
      <div class="flex items-center pb-4">
        <i
          class="pi pi-info-circle mr-4"
          style="font-size: 1.5rem; color: var(--primary-color)"
        ></i>
        <p>
          You are one step away from creating your first to-do list. Connect
          your Notion account to fetch all your checkboxes and checkify your
          Notion databases.
        </p>
      </div>

      <ConnectNotion class="mr-4" />
      <InlineMessage severity="success" v-if="response.data.is_auth"
        >You are connected</InlineMessage
      >
    </Panel>

    <h2>My Todo Lists</h2>

    <!-- <Inplace>
      <template #display> View Content </template>
      <template #content>
        <p class="m-0">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </template>
    </Inplace> -->
    <!-- <p>Use this page to start from scratch and place your custom content !</p> -->
    <!-- <NuxtLink to="/"> Home page </NuxtLink> -->
    <pre>
      {{ response }}
    </pre>
  </div>
</template>

<style></style>
