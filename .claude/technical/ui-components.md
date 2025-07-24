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
│   ├── sidebar/          # Sidebar navigation components (see sidebar-components.md)
│   ├── skeleton/         # Skeleton loader component
│   ├── sonner/           # Toast notification component
│   └── tooltip/          # Tooltip components
├── AppSidebar.vue        # Main application sidebar
├── NavMain.vue           # Main navigation component
├── NavProjects.vue       # Documentation navigation
├── NavUser.vue           # User profile dropdown
└── TeamSwitcher.vue      # Workspace switcher
```

### Sidebar Constants

The sidebar system uses specific width constants defined in `lib/sidebar.ts`:

```typescript
// Sidebar width constants
export const SIDEBAR_WIDTH = '20rem' // 320px - expanded state
export const SIDEBAR_WIDTH_ICON = '3rem' // 48px - collapsed state
export const SIDEBAR_KEYBOARD_SHORTCUT = 's' // Toggle with Cmd+S
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

## Multi-Card Layout System

The application uses a multi-card layout system for better organization and information hierarchy.

### Enhanced Todo List Dashboard

The todo list page now features multiple cards for different information:

```vue
<template>
  <div class="space-y-6">
    <!-- Progress Card -->
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress :value="completionPercentage" />
        <p class="text-sm text-muted-foreground mt-2">
          {{ completedTodos }} of {{ totalTodos }} completed
        </p>
      </CardContent>
    </Card>

    <!-- Extraction Info Card -->
    <Card>
      <CardHeader>
        <CardTitle>Extraction Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Total Pages</span>
            <span class="font-medium">{{ metadata.totalPages }}</span>
          </div>
          <div class="flex justify-between">
            <span>Total Checkboxes</span>
            <span class="font-medium">{{ metadata.totalCheckboxes }}</span>
          </div>
          <div class="flex justify-between">
            <span>Pages with Todos</span>
            <span class="font-medium">{{ metadata.pagesWithCheckboxes }}</span>
          </div>
        </div>
        <div v-if="metadata.limits.reachedPageLimit" class="mt-4">
          <Alert variant="warning">
            <AlertDescription>
              Page limit reached ({{ metadata.limits.maxPages }} pages).
              <a href="/pricing" class="underline">Upgrade</a> to scan more pages.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>

    <!-- Settings Card -->
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <!-- Sync settings, preferences, etc. -->
      </CardContent>
    </Card>
  </div>
</template>
```

### Todo List Cards

The todo list view uses a sophisticated multi-card layout to organize todos by page:

### Layout Structure
```vue
<template>
  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card v-for="page in pages" :key="page.id">
      <CardHeader>
        <CardTitle>{{ page.title }}</CardTitle>
        <CardDescription>{{ page.checkboxes.length }} todos</CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Todo items -->
      </CardContent>
    </Card>
  </div>
</template>
```

### Responsive Behavior
- **Mobile**: Single column layout
- **Tablet**: 2 columns (md:grid-cols-2)
- **Desktop**: 3 columns (lg:grid-cols-3)
- **Wide screens**: Automatic grid adjustment

### Card States
```vue
<!-- Loading state -->
<Card v-if="loading" class="animate-pulse">
  <CardContent class="space-y-2">
    <Skeleton class="h-4 w-full" />
    <Skeleton class="h-4 w-3/4" />
  </CardContent>
</Card>

<!-- Empty state -->
<Card v-if="!page.checkboxes.length" class="border-dashed">
  <CardContent class="text-center py-8">
    <p class="text-muted-foreground">No todos in this page</p>
  </CardContent>
</Card>

<!-- Error state -->
<Card v-if="error" class="border-destructive">
  <CardContent class="text-center py-8">
    <AlertCircle class="w-8 h-8 mx-auto mb-2 text-destructive" />
    <p>Failed to load todos</p>
  </CardContent>
</Card>
```

## Loading States and Sync Feedback

### Loading Patterns
```vue
<template>
  <!-- Full page loading -->
  <div v-if="pending" class="flex items-center justify-center min-h-[400px]">
    <div class="text-center">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-4" />
      <p class="text-sm text-muted-foreground">Loading todos...</p>
    </div>
  </div>

  <!-- Inline loading indicator -->
  <Button :disabled="syncing">
    <Loader2 v-if="syncing" class="w-4 h-4 mr-2 animate-spin" />
    <RefreshCw v-else class="w-4 h-4 mr-2" />
    {{ syncing ? 'Syncing...' : 'Sync Now' }}
  </Button>

  <!-- Progress indicator for long operations -->
  <div v-if="extracting">
    <Progress :value="extractionProgress" class="w-full" />
    <p class="text-sm text-muted-foreground mt-2">
      Extracting {{ extractedPages }} of {{ totalPages }} pages...
    </p>
  </div>
</template>
```

### Sync Status Indicators
```vue
<template>
  <!-- Last sync time -->
  <div class="flex items-center gap-2 text-sm text-muted-foreground">
    <Clock class="w-4 h-4" />
    <span>Last synced {{ formatRelativeTime(lastSyncTime) }}</span>
  </div>

  <!-- Sync status badge -->
  <Badge :variant="syncStatus === 'success' ? 'default' : 'destructive'">
    {{ syncStatus === 'success' ? 'Synced' : 'Sync Failed' }}
  </Badge>

  <!-- Real-time sync indicator -->
  <div v-if="realtimeSync" class="flex items-center gap-2">
    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
    <span class="text-sm">Auto-sync enabled</span>
  </div>
</template>
```

## Sidebar Components

The sidebar navigation system has been completely redesigned using shadcn/ui components. 

### Sidebar Width Constants
```typescript
// Default sidebar widths
export const SIDEBAR_WIDTH = 265 // Collapsed: 265px
export const SIDEBAR_WIDTH_EXPANDED = 305 // Expanded: 305px
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b' // Toggle with Cmd+B

// Usage in layouts
<SidebarProvider defaultOpen={true}>
  <AppSidebar />
  <main :style="{ marginLeft: sidebarOpen ? '305px' : '265px' }">
    <!-- Content -->
  </main>
</SidebarProvider>
```

### Keyboard Shortcuts
The sidebar supports keyboard navigation:
- `Cmd/Ctrl + B`: Toggle sidebar open/closed
- `Arrow Keys`: Navigate between menu items
- `Enter`: Select current item
- `Escape`: Close sidebar on mobile

For detailed documentation on the sidebar implementation, including:
- Component architecture
- Implementation examples
- Responsive behavior
- Customization options
- Migration guide

Please refer to [sidebar-components.md](./sidebar-components.md).

## Branding and Visual Identity

### Checkify Logo
The Checkify logo is a custom design featuring:
- **Design**: Stylized checkbox icon with brand name
- **Colors**: Primary brand color with consistent theming
- **Usage**: Applied across app header, favicon, and marketing materials
- **Files**: Located in `public/` directory

### Visual Assets
```vue
<!-- Logo usage in header -->
<template>
  <div class="flex items-center gap-2">
    <img src="/logo.svg" alt="Checkify" class="h-8 w-8" />
    <span class="text-xl font-semibold">Checkify</span>
  </div>
</template>
```

### Brand Colors
- **Primary**: Used for CTAs, links, and active states
- **Secondary**: Supporting color for accents
- **Success**: Green for completed states
- **Warning**: Orange for warnings and limits
- **Error**: Red for errors and destructive actions

## Best Practices

1. **Consistent Spacing**: Use Tailwind's spacing scale (p-4, m-2, gap-6)
2. **Color Usage**: Use semantic color variables (text-primary, bg-muted)
3. **Component Composition**: Build complex UIs from simple components
4. **Accessibility**: Always include proper ARIA labels and keyboard support
5. **Performance**: Lazy load heavy components and optimize bundle size
6. **Branding**: Maintain consistent use of Checkify logo and colors
7. **Visual Hierarchy**: Use card layouts and proper spacing for organization