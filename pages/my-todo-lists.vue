<script setup lang="ts">
import type { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type {
  AutoCompleteCompleteEvent,
  AutoCompleteItemSelectEvent
} from 'primevue/autocomplete';
import InputGroup from 'primevue/inputgroup';

const response = ref({
  data: {}
});
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const todo_lists = ref<any[]>([]);
const visible = ref(false);
const currentTodoList = ref();

onMounted(async () => {
  response.value = await useFetch('/api/auth-notion');
  await fetchTodoLists();
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

  const { error } = await useFetch(`/api/todo-list`, {
    method: 'POST',
    body: database
  });

  if (error.value) {
    console.error(error.value);
    return;
  }

  fetchTodoLists();
};

const fetchTodoLists = async () => {
  const { data, error } = await useFetch(`/api/todo-list`);

  if (error.value) {
    console.error(error.value);
    return;
  }

  todo_lists.value = data.value?.todo_lists;
};

const handleTodoListName = (todoList: {
  todo_list_id: string;
  notion_database_id: {
    metadata: {
      name: string;
    };
  };
  name?: string;
}) => {
  if (todoList.name) {
    return todoList.name;
  }

  return todoList.notion_database_id.metadata.name;
};

const handleLink = (todoList: { todo_list_id: string }) => {
  return `https://checkify.so/todo-list/${todoList.todo_list_id}`;
};

const handleCopyLink = (todoList: { todo_list_id: string }) => {
  navigator.clipboard.writeText(handleLink(todoList));
};

const handleDeleteModal = (todoList: { todo_list_id: string }) => {
  currentTodoList.value = todoList;
  visible.value = true;
};

const clearCurrentTodoList = () => {
  currentTodoList.value = null;
};

const confirmDelete = async () => {
  const { error } = await useFetch(
    `/api/todo-list/${currentTodoList.value.todo_list_id}`,
    {
      method: 'DELETE'
    }
  );

  if (error.value) {
    console.error(error.value);
    return;
  }

  todo_lists.value = todo_lists.value.filter(
    (todoList) => todoList.todo_list_id !== currentTodoList.value.todo_list_id
  );

  clearCurrentTodoList();
  visible.value = false;

  fetchTodoLists();
};
</script>

<template>
  <div class="card">
    <Panel class="mb-8" toggleable>
      <template #header>
        <h2 class="mb-0">Get Started Here!</h2>
      </template>
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
      <InlineMessage severity="success" v-if="response.data.is_auth">
        You are connected
      </InlineMessage>
    </Panel>

    <Panel class="mb-8" toggleable>
      <template #header>
        <h2 class="mb-0">Add Database</h2>
      </template>
      <div class="flex items-center pb-4">
        <i
          class="pi pi-info-circle mr-4"
          style="font-size: 1.5rem; color: var(--primary-color)"
        ></i>
        <p>
          Search for and select the database that you'll be creating your to-do
          list from.
        </p>
      </div>

      <div class="w-full flex">
        <AutoComplete
          class="database-search w-full md:w-1/2 mr-4"
          v-model="searchQuery"
          optionLabel="name"
          placeholder="Search for a database"
          :suggestions="searchResults"
          :disabled="!response.data.is_auth"
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
        <!-- <Button label="Refresh" icon="pi pi-refresh" /> -->
      </div>
    </Panel>

    <Panel toggleable>
      <template #header>
        <h2 class="mb-0">My Todo Lists</h2>
      </template>

      <div class="flex items-center pb-4">
        <i
          class="pi pi-info-circle mr-4"
          style="font-size: 1.5rem; color: var(--primary-color)"
        ></i>
        <p>
          Here are all the to-do lists you've created. Click on the copy icon to
          copy the link for an embed.
        </p>
      </div>

      <DataView
        class="database-view"
        data-key="id"
        :value="todo_lists"
        layout="grid"
      >
        <template #empty>
          <p class="italic">You haven't created any to-do lists yet.</p>
        </template>
        <template #grid="slotProps">
          <div class="p-grid">
            <Card class="todo-list__card" v-for="data in slotProps.items">
              <template #content>
                <div class="flex items-center mb-4">
                  <div class="todo-list__label flex-1 flex items-center">
                    <img
                      class="mr-2"
                      :alt="handleTodoListName(data)"
                      :src="getIcon(data.notion_database_id?.metadata)"
                      style="width: 20px"
                      v-if="data.notion_database_id?.metadata.icon"
                    />
                    <span class="font-semibold">
                      {{ handleTodoListName(data) }}
                    </span>
                  </div>

                  <Button
                    text
                    size="small"
                    icon="pi pi-trash"
                    severity="danger"
                    @click="handleDeleteModal(data)"
                  />
                </div>
                <InputGroup>
                  <InputText :value="handleLink(data)" />
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    @click="handleCopyLink(data)"
                  />
                </InputGroup>
              </template>
            </Card>
          </div>
        </template>
      </DataView>
    </Panel>

    <Dialog
      v-model:visible="visible"
      modal
      header="Are you sure you want to delete?"
      :style="{ width: '50rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <div class="flex items-center">
        <img
          class="mr-2"
          :alt="handleTodoListName(currentTodoList)"
          :src="getIcon(currentTodoList.notion_database_id.metadata)"
          style="width: 20px"
          v-if="currentTodoList.notion_database_id.metadata.icon"
        />
        <span class="font-semibold">
          {{ handleTodoListName(currentTodoList) }}
        </span>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          @click="visible = false"
          autofocus
          severity="secondary"
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
          @click="confirmDelete"
          autofocus
          severity="danger"
        />
      </template>
    </Dialog>
  </div>
</template>

<style lang="scss">
.database-search {
  .p-autocomplete-input {
    width: 100%;
  }
}

.database-view {
  .p-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(250px, 1fr));
    grid-gap: 1rem;
  }
}

.todo-list__card {
  .p-card-content {
    padding: 0;
  }
}
</style>
