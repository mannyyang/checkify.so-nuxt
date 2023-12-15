<script setup lang="ts">
import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type {
  AutoCompleteCompleteEvent,
  AutoCompleteItemSelectEvent
} from 'primevue/autocomplete';

const response = ref({
  data: {}
});
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const todo_lists = ref<any[]>([]);

onMounted(async () => {
  response.value = await useFetch('/api/auth-notion');
});

const searchDatabases = async (event: AutoCompleteCompleteEvent) => {
  const query = event.query;

  if (query) {
    const { data, error } = await useFetch(`/api/search-notion`, {
      query: { query }
    });

    if (error.value) {
      console.error(error.value);
      return;
    }

    console.log(data, error);

    searchResults.value = data.value?.databases || [];
  }
};

const getIcon = (option) => {
  if (option.icon) {
    const iconType = option.icon.type;
    const url = option.icon[iconType].url;

    return url;
  }
};

const onSelect = (item: AutoCompleteItemSelectEvent) => {
  addDatabase(item.value);
};

const addDatabase = async (database: DatabaseObjectResponse) => {
  todo_lists.value.push(database);

  const { data, error } = await useFetch(`/api/todo-list`, {
    method: 'POST',
    body: database
  });
};
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

    <div class="w-full flex pt-4">
      <AutoComplete
        class="database-search flex-1 mr-4"
        v-model="searchQuery"
        optionLabel="name"
        placeholder="Search for a database"
        :suggestions="searchResults"
        @complete="searchDatabases"
        @item-select="onSelect"
      >
        <template #option="slotProps">
          <div class="flex align-options-center">
            <img
              :alt="slotProps.option.name"
              :src="getIcon(slotProps.option)"
              class="mr-2"
              style="width: 20px"
              v-if="slotProps.option.icon"
            />
            <div>{{ slotProps.option.name }}</div>
          </div>
        </template>
      </AutoComplete>
      <Button label="Refresh" icon="pi pi-refresh" />
    </div>

    <DataView data-key="id" :value="todo_lists" layout="grid">
      <template #grid="slotProps">
        <div class="card">
          <div class="p-4 border-1 surface-border surface-card border-round">
            <div
              class="flex flex-wrap align-items-center justify-content-between gap-2"
            >
              <div class="flex align-items-center gap-2">
                <i class="pi pi-tag"></i>
                <span class="font-semibold">{{ slotProps.data.name }}</span>
              </div>
              <!-- <Tag
                    :value="item.inventoryStatus"
                    :severity="getSeverity(item)"
                  ></Tag> -->
            </div>
            <div class="flex flex-column align-items-center gap-3 py-5">
              <!-- <img
                    class="w-9 shadow-2 border-round"
                    :src="`https://primefaces.org/cdn/primevue/images/product/${item.image}`"
                    :alt="item.name"
                  /> -->
              <div class="text-2xl font-bold">
                {{ slotProps.data.name }}
              </div>
              <!-- <Rating
                    :modelValue="item.rating"
                    readonly
                    :cancel="false"
                  ></Rating> -->
            </div>
            <div class="flex align-items-center justify-content-between">
              <Button icon="pi pi-minus" rounded></Button>
            </div>
          </div>
        </div>
      </template>
    </DataView>

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
    <!-- <pre>{{ searchResults }}</pre> -->
  </div>
</template>

<style lang="scss">
.database-search {
  .p-autocomplete-input {
    width: 100%;
  }
}
</style>
