# Sidebar Components Documentation

This document provides comprehensive documentation for the sidebar components implemented in Checkify.so using shadcn/ui.

## Overview

The sidebar system provides a responsive, collapsible navigation interface with support for desktop and mobile layouts. The implementation follows shadcn/ui patterns and integrates seamlessly with the existing application architecture.

## Architecture

### Component Structure

```
components/ui/sidebar/
├── Sidebar.vue              # Main sidebar container
├── SidebarContent.vue       # Content wrapper
├── SidebarFooter.vue        # Footer section
├── SidebarGroup.vue         # Group container
├── SidebarGroupContent.vue  # Group content wrapper
├── SidebarGroupLabel.vue    # Group label
├── SidebarHeader.vue        # Header section
├── SidebarMenu.vue          # Menu container
├── SidebarMenuButton.vue    # Menu button component
├── SidebarMenuItem.vue      # Menu item wrapper
├── SidebarProvider.vue      # Context provider
├── SidebarSeparator.vue     # Visual separator
└── SidebarTrigger.vue       # Toggle trigger button

utils/
└── sidebar.ts               # Sidebar utilities and types
```

### Constants

Located in `lib/sidebar-constants.ts`:

```typescript
export const SIDEBAR_WIDTH = '20rem'          // 320px - expanded width
export const SIDEBAR_WIDTH_ICON = '3rem'      // 48px - collapsed width
export const SIDEBAR_KEYBOARD_SHORTCUT = 's'  // Keyboard shortcut
```

## Core Components

### SidebarProvider

The root component that provides sidebar context to all child components.

**Props:**
- `defaultOpen` (boolean): Initial open state
- `open` (boolean): Controlled open state
- `onOpenChange` (function): Callback when open state changes

**Provides:**
- `state`: Current sidebar state ('expanded' | 'collapsed')
- `open`: Whether sidebar is open
- `setOpen`: Function to update open state
- `openMobile`: Mobile sidebar state
- `setOpenMobile`: Function to update mobile state
- `isMobile`: Whether in mobile view
- `toggleSidebar`: Function to toggle sidebar

### Sidebar

Main sidebar container that handles responsive behavior.

**Props:**
- `side` ('left' | 'right'): Sidebar position (default: 'left')
- `variant` ('sidebar' | 'floating' | 'inset'): Visual variant
- `collapsible` ('offcanvas' | 'icon' | 'none'): Collapse behavior

**Features:**
- Responsive design with mobile sheet
- Keyboard shortcut support (Cmd/Ctrl + S)
- Smooth transitions
- Accessibility compliant

### SidebarMenu

Container for navigation items.

```vue
<SidebarMenu>
  <SidebarMenuItem v-for="item in items" :key="item.url">
    <SidebarMenuButton as-child>
      <NuxtLink :to="item.url">
        <Icon :name="item.icon" />
        <span>{{ item.title }}</span>
      </NuxtLink>
    </SidebarMenuButton>
  </SidebarMenuItem>
</SidebarMenu>
```

### SidebarMenuButton

Button component with hover and active states.

**Props:**
- `asChild` (boolean): Render as child element
- `isActive` (boolean): Active state
- `tooltip` (string | object): Tooltip configuration
- `class` (string): Additional CSS classes

**Features:**
- Icon + text layout
- Tooltip support in collapsed state
- Active state styling
- Keyboard navigation

## Implementation Example

### Basic Sidebar Setup

```vue
<template>
  <SidebarProvider>
    <div class="flex h-screen">
      <Sidebar>
        <SidebarHeader>
          <h2 class="text-lg font-semibold">Checkify</h2>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem v-for="item in navItems" :key="item.url">
                  <SidebarMenuButton as-child>
                    <NuxtLink :to="item.url">
                      <Icon :name="item.icon" />
                      <span>{{ item.title }}</span>
                    </NuxtLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </Sidebar>
      
      <main class="flex-1">
        <SidebarTrigger />
        <slot />
      </main>
    </div>
  </SidebarProvider>
</template>

<script setup>
const navItems = [
  { title: 'My Todo Lists', url: '/my-todo-lists', icon: 'lucide:list-checks' },
  { title: 'Connect Notion', url: '/connect-notion', icon: 'lucide:link' },
  { title: 'Settings', url: '/settings', icon: 'lucide:settings' }
]
</script>
```

### Advanced Features

#### Collapsible Groups

```vue
<SidebarGroup>
  <SidebarGroupLabel>
    <button @click="toggleGroup" class="flex items-center gap-2">
      <Icon :name="isOpen ? 'lucide:chevron-down' : 'lucide:chevron-right'" />
      <span>Projects</span>
    </button>
  </SidebarGroupLabel>
  <SidebarGroupContent v-show="isOpen">
    <!-- Group items -->
  </SidebarGroupContent>
</SidebarGroup>
```

#### Dynamic Active State

```vue
<script setup>
const route = useRoute()

const isActive = (url: string) => {
  return route.path === url
}
</script>

<template>
  <SidebarMenuButton :is-active="isActive(item.url)">
    <!-- Content -->
  </SidebarMenuButton>
</template>
```

## Styling

### CSS Variables

The sidebar system uses CSS custom properties for theming:

```css
:root {
  --sidebar-background: hsl(var(--background));
  --sidebar-foreground: hsl(var(--foreground));
  --sidebar-primary: hsl(var(--primary));
  --sidebar-primary-foreground: hsl(var(--primary-foreground));
  --sidebar-accent: hsl(var(--accent));
  --sidebar-accent-foreground: hsl(var(--accent-foreground));
  --sidebar-border: hsl(var(--border));
  --sidebar-ring: hsl(var(--ring));
}
```

### Responsive Behavior

- **Desktop**: Sidebar is always visible, can be toggled between expanded/collapsed
- **Mobile**: Sidebar appears as a sheet overlay, triggered by menu button

### Animation

Smooth transitions are applied to:
- Width changes (expand/collapse)
- Opacity (tooltip appearance)
- Transform (mobile sheet slide)

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Reduced motion support

## Best Practices

1. **Use Semantic HTML**: Leverage proper heading hierarchy and navigation landmarks
2. **Maintain Consistency**: Use the provided components rather than custom implementations
3. **Handle Loading States**: Show skeleton loaders while data is fetching
4. **Responsive Design**: Test on various screen sizes
5. **Performance**: Use `v-show` for frequently toggled content

## Migration from Previous UI

The sidebar replaces the previous navigation system with these improvements:

1. **Wider Default Width**: 320px (20rem) vs previous narrower width
2. **Better Text Visibility**: Accommodates longer button text
3. **Consistent Theming**: Uses shadcn/ui design tokens
4. **Mobile Optimization**: Dedicated mobile experience
5. **Keyboard Shortcuts**: Quick toggle with Cmd/Ctrl + S

## Testing

Test files are located in `test/components/`:

- `sidebar.test.ts`: Unit tests for sidebar constants
- Component tests should verify:
  - Toggle functionality
  - Responsive behavior
  - Keyboard navigation
  - Accessibility compliance

## Troubleshooting

### Common Issues

1. **Sidebar not toggling**: Check SidebarProvider is wrapping components
2. **Styling issues**: Ensure Tailwind classes are not purged
3. **Mobile not working**: Verify viewport meta tag is set
4. **Icons not showing**: Check Icon component and icon library setup