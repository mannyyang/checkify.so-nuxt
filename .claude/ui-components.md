# UI Components Guide

This document provides a comprehensive overview of the UI architecture in Checkify.so, including component organization, PrimeVue usage, layouts, and key components.

## Component Organization

### Directory Structure

```
components/
├── app/                 # Application-specific components
│   ├── AppFooter.vue
│   ├── AppLayout.vue
│   ├── AppMenuItem.vue
│   ├── AppMenu.vue
│   ├── AppSidebar.vue
│   ├── AppTopbar.vue
│   ├── ConnectNotion.vue
│   ├── PublicFooter.vue
│   └── PublicMenu.vue
├── content/            # Content display components
│   ├── ContentHeader.vue
│   ├── ContentSection.vue
│   └── ContentWrapper.vue
├── tiptap/            # TipTap editor components
│   ├── EditorButton.vue
│   ├── index.vue
│   └── lowlight.ts
├── LocaleSwitcher.vue  # i18n language switcher
├── NotionBlock.vue     # Notion block renderer
└── ProductItem.vue     # Demo product component
```

### Component Naming Convention

- **App** prefix: Layout and navigation components
- **Content** prefix: Content wrapper components
- **Public** prefix: Unauthenticated view components
- PascalCase for all component names
- Single-word components in subdirectories

## PrimeVue Component Usage

### Configuration

PrimeVue is configured in `nuxt.config.ts`:

```typescript
primevue: {
  options: {
    ripple: true
  },
  components: {
    prefix: 'Prime' // Optional prefix
  }
}
```

### Commonly Used Components

#### 1. Data Display
```vue
<!-- DataTable for lists -->
<DataTable :value="todoLists" paginator :rows="10">
  <Column field="name" header="List Name" sortable />
  <Column field="created_at" header="Created" sortable />
</DataTable>

<!-- Card for content sections -->
<Card>
  <template #header>
    <h3>My Todo Lists</h3>
  </template>
  <template #content>
    <!-- Content here -->
  </template>
</Card>
```

#### 2. Form Components
```vue
<!-- Button with loading state -->
<Button 
  label="Connect Notion" 
  icon="pi pi-link"
  :loading="isConnecting"
  @click="connectNotion" 
/>

<!-- Checkbox for todos -->
<Checkbox 
  v-model="todo.checked"
  :binary="true"
  @change="toggleCheckbox(todo)"
/>

<!-- Input with validation -->
<InputText 
  v-model="searchQuery"
  placeholder="Search databases..."
  class="w-full"
/>
```

#### 3. Feedback Components
```vue
<!-- Toast notifications -->
<Toast position="top-right" />

<!-- Progress indicator -->
<ProgressSpinner v-if="loading" />

<!-- Confirmation dialog -->
<ConfirmDialog />
```

### PrimeVue Theme

Using the Sakai theme with Lara design system:

```scss
// assets/scss/layout/layout.scss
@import './presets/lara/green/theme.scss';

// Custom theme variables
:root {
  --primary-color: #10b981;
  --primary-color-text: #ffffff;
  --surface-a: #ffffff;
  --surface-b: #f9fafb;
  --surface-c: #f3f4f6;
}
```

## Layout System

### Three Layout Types

#### 1. Default Layout (`layouts/default.vue`)
For authenticated users:

```vue
<template>
  <AppLayout>
    <slot />
  </AppLayout>
</template>

<script setup>
definePageMeta({
  middleware: 'auth' // Requires authentication
})
</script>
```

#### 2. Public Layout (`layouts/public.vue`)
For unauthenticated pages:

```vue
<template>
  <div class="public-layout">
    <PublicMenu />
    <main class="content">
      <slot />
    </main>
    <PublicFooter />
  </div>
</template>
```

#### 3. Embed Layout (`layouts/embed.vue`)
For embedded todo lists:

```vue
<template>
  <div class="embed-layout">
    <div class="embed-container">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.embed-layout {
  min-height: 100vh;
  padding: 1rem;
}
</style>
```

### Using Layouts in Pages

```vue
<script setup>
// Default layout (authenticated)
definePageMeta({
  layout: 'default'
})

// Public layout
definePageMeta({
  layout: 'public'
})

// Embed layout
definePageMeta({
  layout: 'embed'
})
</script>
```

## Key UI Components

### 1. AppLayout Component

The main application shell for authenticated users:

```vue
<!-- components/app/AppLayout.vue -->
<template>
  <div class="layout-wrapper">
    <AppTopbar />
    <AppSidebar />
    <div class="layout-main-container">
      <div class="layout-main">
        <slot />
      </div>
      <AppFooter />
    </div>
  </div>
</template>
```

Features:
- Responsive sidebar navigation
- Top bar with user menu
- Footer with app info
- Mobile-friendly with hamburger menu

### 2. NotionBlock Component

Renders Notion blocks with checkbox functionality:

```vue
<!-- components/NotionBlock.vue -->
<template>
  <div class="notion-block" :class="blockClass">
    <Checkbox 
      v-if="block.type === 'to_do'"
      v-model="block.to_do.checked"
      @change="onToggle"
    />
    <span class="block-text" v-html="renderText(block)" />
  </div>
</template>

<script setup>
const props = defineProps({
  block: Object,
  onToggle: Function
})

const renderText = (block) => {
  // Convert Notion rich text to HTML
  return block.to_do?.rich_text
    .map(text => text.plain_text)
    .join('')
}
</script>
```

### 3. ConnectNotion Component

OAuth connection flow for Notion:

```vue
<!-- components/app/ConnectNotion.vue -->
<template>
  <Card>
    <template #content>
      <div v-if="!isConnected" class="text-center">
        <i class="pi pi-link text-5xl mb-4" />
        <h3>Connect Your Notion Workspace</h3>
        <p>Link your Notion account to start managing todos</p>
        <Button 
          label="Connect Notion"
          icon="pi pi-arrow-right"
          @click="initiateOAuth"
        />
      </div>
      <div v-else>
        <Message severity="success">
          Notion connected successfully!
        </Message>
      </div>
    </template>
  </Card>
</template>
```

### 4. Todo List Display

Example of displaying todo lists:

```vue
<template>
  <div class="todo-lists">
    <DataView :value="todoLists" layout="grid">
      <template #grid="slotProps">
        <div class="col-12 md:col-6 lg:col-4">
          <Card>
            <template #header>
              <h4>{{ slotProps.data.name }}</h4>
            </template>
            <template #content>
              <p>{{ slotProps.data.todo_count }} todos</p>
              <Button 
                label="View"
                @click="viewList(slotProps.data)"
              />
            </template>
          </Card>
        </div>
      </template>
    </DataView>
  </div>
</template>
```

## FormKit Integration

### Configuration

FormKit is integrated with PrimeVue components:

```typescript
// formkit.config.ts
import { primeInputs } from '@sfxcode/formkit-primevue'

export default {
  inputs: primeInputs
}
```

### Usage Example

```vue
<FormKit
  type="primeInputText"
  name="database_name"
  label="Database Name"
  validation="required|length:3"
  :validation-messages="{
    required: 'Database name is required',
    length: 'Must be at least 3 characters'
  }"
/>
```

## i18n Implementation

### Language Support

Currently supports English and German:

```typescript
// nuxt.config.ts
i18n: {
  locales: [
    { code: 'en', iso: 'en-US', name: 'English' },
    { code: 'de', iso: 'de-DE', name: 'Deutsch' }
  ],
  defaultLocale: 'en'
}
```

### LocaleSwitcher Component

```vue
<!-- components/LocaleSwitcher.vue -->
<template>
  <Dropdown 
    v-model="locale" 
    :options="availableLocales"
    optionLabel="name"
    optionValue="code"
    @change="switchLocale"
  />
</template>

<script setup>
const { locale, locales, setLocale } = useI18n()

const switchLocale = (event) => {
  setLocale(event.value)
}
</script>
```

### Using Translations

```vue
<template>
  <h1>{{ $t('welcome.title') }}</h1>
  <p>{{ $t('welcome.description') }}</p>
</template>

<!-- In script -->
<script setup>
const { t } = useI18n()
const message = t('errors.not_found')
</script>
```

## Styling with UnoCSS

### Utility Classes

```vue
<div class="flex items-center justify-between p-4 bg-surface-50 rounded-lg">
  <span class="text-lg font-semibold text-surface-900">
    Todo Item
  </span>
  <Button 
    class="p-button-sm p-button-text"
    icon="pi pi-ellipsis-v"
  />
</div>
```

### Responsive Design

```vue
<div class="grid">
  <div class="col-12 md:col-6 lg:col-4">
    <!-- Mobile: full width -->
    <!-- Tablet: half width -->
    <!-- Desktop: third width -->
  </div>
</div>
```

## Component Best Practices

### 1. Composition API

Always use `<script setup>`:

```vue
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  todo: Object
})

const emit = defineEmits(['update', 'delete'])

const isEditing = ref(false)
const editedText = ref(props.todo.text)

const save = () => {
  emit('update', { ...props.todo, text: editedText.value })
  isEditing.value = false
}
</script>
```

### 2. Component Props

Define props with TypeScript:

```vue
<script setup lang="ts">
interface Props {
  todo: {
    id: string
    text: string
    checked: boolean
  }
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: true
})
</script>
```

### 3. Event Handling

Use clear event names:

```vue
<script setup>
const emit = defineEmits<{
  toggle: [id: string, checked: boolean]
  delete: [id: string]
  update: [todo: Todo]
}>()
</script>
```

### 4. Accessibility

Always include ARIA attributes:

```vue
<Button 
  :aria-label="`Mark ${todo.text} as ${todo.checked ? 'incomplete' : 'complete'}`"
  @click="toggle"
/>
```

## Performance Optimization

### 1. Lazy Loading

```vue
<script setup>
const NotionSettings = defineAsyncComponent(
  () => import('./NotionSettings.vue')
)
</script>
```

### 2. List Rendering

Use proper keys:

```vue
<div v-for="todo in todos" :key="todo.notion_block_id">
  <!-- Always use stable, unique keys -->
</div>
```

### 3. Computed Properties

Cache expensive operations:

```vue
<script setup>
const sortedTodos = computed(() => 
  todos.value.sort((a, b) => a.order - b.order)
)
</script>
```

## Testing Components

### Unit Tests

```typescript
import { mount } from '@vue/test-utils'
import NotionBlock from '@/components/NotionBlock.vue'

describe('NotionBlock', () => {
  it('renders checkbox for todo blocks', () => {
    const wrapper = mount(NotionBlock, {
      props: {
        block: {
          type: 'to_do',
          to_do: { checked: false }
        }
      }
    })
    
    expect(wrapper.find('.p-checkbox').exists()).toBe(true)
  })
})
```

### Component Testing Best Practices

1. Test user interactions
2. Test prop variations
3. Test emitted events
4. Test accessibility features
5. Use data-testid for reliable selectors