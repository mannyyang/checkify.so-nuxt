# UI Components Documentation

This document provides a comprehensive guide to the UI components used in Checkify.so, built with shadcn/ui and Tailwind CSS v4.

## Overview

Checkify.so uses **shadcn/ui**, a modern component library built on top of Radix UI primitives with Tailwind CSS styling. This provides:

- **Accessibility**: ARIA-compliant components out of the box
- **Customization**: Full control over component code and styling
- **Performance**: Tree-shakeable, only import what you use
- **Type Safety**: Full TypeScript support

## Component Architecture

### Directory Structure

```
components/
├── ui/                    # shadcn/ui components
│   ├── avatar/           # Avatar components
│   ├── button/           # Button component
│   ├── card/             # Card components
│   ├── checkbox/         # Checkbox component
│   ├── dialog/           # Dialog/Modal components
│   ├── dropdown-menu/    # Dropdown menu components
│   ├── input/            # Input component
│   ├── progress/         # Progress bar component
│   ├── separator/        # Separator component
│   ├── sheet/            # Sheet/Drawer components
│   ├── sidebar/          # Sidebar navigation components
│   ├── skeleton/         # Skeleton loader component
│   ├── sonner/           # Toast notification component
│   └── tooltip/          # Tooltip components
├── AppSidebar.vue        # Main application sidebar
├── NavMain.vue           # Main navigation component
├── NavProjects.vue       # Documentation navigation
├── NavUser.vue           # User profile dropdown
└── TeamSwitcher.vue      # Workspace switcher
```

## Core Components

### Button

The Button component is the primary interactive element throughout the application.

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <!-- Default button -->
  <Button>Click me</Button>
  
  <!-- With icon -->
  <Button>
    <Settings class="w-4 h-4 mr-2" />
    Settings
  </Button>
  
  <!-- Variants -->
  <Button variant="destructive">Delete</Button>
  <Button variant="outline">Cancel</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="link">Link</Button>
  
  <!-- Sizes -->
  <Button size="sm">Small</Button>
  <Button size="default">Default</Button>
  <Button size="lg">Large</Button>
  <Button size="icon"><X /></Button>
</template>
```

### Card

Cards are used to group related content and actions.

```vue
<script setup lang="ts">
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
      <CardDescription>Card description goes here</CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Card content -->
    </CardContent>
    <CardFooter>
      <!-- Card actions -->
    </CardFooter>
  </Card>
</template>
```

### Input

Input components for form fields.

```vue
<script setup lang="ts">
import { Input } from '@/components/ui/input'

const value = ref('')
</script>

<template>
  <Input 
    v-model="value" 
    placeholder="Enter text..."
    type="text"
  />
</template>
```

### Checkbox

Checkbox component for boolean inputs.

```vue
<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox'

const checked = ref(false)
</script>

<template>
  <Checkbox 
    v-model:checked="checked"
    id="terms"
  />
  <label for="terms">Accept terms and conditions</label>
</template>
```

### Dialog

Modal dialogs for important interactions.

```vue
<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const open = ref(false)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Dialog Title</DialogTitle>
        <DialogDescription>
          Dialog description goes here.
        </DialogDescription>
      </DialogHeader>
      <!-- Dialog content -->
      <DialogFooter>
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button @click="handleSave">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

### Sidebar

The sidebar component provides navigation and is a key UI element.

```vue
<script setup lang="ts">
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
</script>

<template>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/">
                  <Home class="w-4 h-4" />
                  <span>Home</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
```

### Toast Notifications (Sonner)

Toast notifications for user feedback.

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'

// Success toast
toast.success('Operation completed successfully')

// Error toast
toast.error('Something went wrong')

// With description
toast.success('Sync Successful', {
  description: 'Your todos have been synced with Notion'
})
</script>
```

## Styling System

### Tailwind CSS v4

Checkify.so uses Tailwind CSS v4 with a custom configuration:

```css
/* assets/css/tailwind.css */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* ... other design tokens */
}
```

### CSS Variables

The theme uses CSS variables for colors, allowing easy customization:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... more variables */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... dark mode variables */
}
```

### Utility Classes

Common utility patterns:

```vue
<!-- Spacing -->
<div class="p-4 m-2 space-y-4">

<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">

<!-- Grid -->
<div class="grid grid-cols-3 gap-6">

<!-- Typography -->
<h1 class="text-3xl font-bold">
<p class="text-sm text-muted-foreground">

<!-- Borders & Shadows -->
<div class="border rounded-lg shadow-sm">

<!-- Responsive -->
<div class="w-full md:w-1/2 lg:w-1/3">
```

## Component Patterns

### Form Patterns

```vue
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="space-y-2">
      <label for="email" class="text-sm font-medium">Email</label>
      <Input 
        id="email"
        v-model="email"
        type="email"
        placeholder="Enter your email"
      />
    </div>
    
    <div class="flex items-center space-x-2">
      <Checkbox id="terms" v-model:checked="acceptTerms" />
      <label for="terms" class="text-sm">
        I accept the terms and conditions
      </label>
    </div>
    
    <Button type="submit" :disabled="!acceptTerms">
      Submit
    </Button>
  </form>
</template>
```

### Loading States

```vue
<template>
  <div v-if="pending" class="space-y-4">
    <Skeleton class="h-12 w-full" />
    <Skeleton class="h-4 w-3/4" />
    <Skeleton class="h-4 w-1/2" />
  </div>
  
  <div v-else>
    <!-- Content -->
  </div>
</template>
```

### Empty States

```vue
<template>
  <div class="text-center py-12">
    <FileX class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
    <h3 class="text-lg font-medium mb-2">No todos found</h3>
    <p class="text-sm text-muted-foreground">
      Create your first todo list to get started
    </p>
    <Button class="mt-4">
      <Plus class="w-4 h-4 mr-2" />
      Create Todo List
    </Button>
  </div>
</template>
```

## Icon System

Checkify.so uses **lucide-vue-next** for icons:

```vue
<script setup lang="ts">
import { Home, Settings, User, X, Check, ChevronRight } from 'lucide-vue-next'
</script>

<template>
  <!-- Basic usage -->
  <Home class="w-4 h-4" />
  
  <!-- With color -->
  <Settings class="w-5 h-5 text-primary" />
  
  <!-- In buttons -->
  <Button>
    <User class="w-4 h-4 mr-2" />
    Profile
  </Button>
</template>
```

## Responsive Design

### Breakpoints

Tailwind CSS v4 default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach

```vue
<template>
  <!-- Stack on mobile, side-by-side on desktop -->
  <div class="flex flex-col md:flex-row gap-4">
    <div class="w-full md:w-1/2">Left content</div>
    <div class="w-full md:w-1/2">Right content</div>
  </div>
  
  <!-- Hide on mobile, show on desktop -->
  <div class="hidden md:block">
    Desktop only content
  </div>
  
  <!-- Different sizes based on screen -->
  <Button class="w-full md:w-auto">
    Responsive Button
  </Button>
</template>
```

## Accessibility

All shadcn/ui components follow WAI-ARIA guidelines:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

Example:

```vue
<template>
  <Button
    :aria-label="isPlaying ? 'Pause' : 'Play'"
    :aria-pressed="isPlaying"
    @click="togglePlay"
  >
    <Play v-if="!isPlaying" class="w-4 h-4" />
    <Pause v-else class="w-4 h-4" />
  </Button>
</template>
```

## Performance Considerations

1. **Component Imports**: Import only what you need
   ```vue
   // Good
   import { Button } from '@/components/ui/button'
   
   // Avoid importing everything
   import * as UI from '@/components/ui'
   ```

2. **Lazy Loading**: Use dynamic imports for heavy components
   ```vue
   const HeavyComponent = defineAsyncComponent(() => 
     import('@/components/HeavyComponent.vue')
   )
   ```

3. **Icon Optimization**: Icons are tree-shaken automatically

## Migration from PrimeVue

Key differences when migrating from PrimeVue:

1. **Component Names**: 
   - PrimeVue: `<Button>`, `<Card>`, `<Dialog>`
   - shadcn/ui: Same names but different props/slots

2. **Styling**:
   - PrimeVue: CSS classes like `p-button`
   - shadcn/ui: Tailwind utility classes

3. **Props**:
   - PrimeVue: `label`, `icon`, `severity`
   - shadcn/ui: `variant`, `size`, children for content

4. **Icons**:
   - PrimeVue: PrimeIcons (`pi pi-check`)
   - shadcn/ui: lucide-vue-next components

5. **Forms**:
   - PrimeVue: FormKit integration
   - shadcn/ui: Native v-model with Vue

## Best Practices

1. **Consistent Spacing**: Use Tailwind's spacing scale (p-4, m-2, gap-6)
2. **Color Usage**: Use semantic color variables (text-primary, bg-muted)
3. **Component Composition**: Build complex UIs from simple components
4. **Accessibility**: Always include proper ARIA labels and keyboard support
5. **Performance**: Lazy load heavy components and optimize bundle size