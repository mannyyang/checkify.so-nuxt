# Development Guide

*Last updated: January 2025*

This guide covers everything you need to know to develop, test, and deploy Checkify.so.

## Development Setup

### Prerequisites

1. **System Requirements**
   - Node.js 22+ (required by package.json)
   - pnpm 8+ package manager
   - Git
   - A code editor (VS Code recommended)

2. **External Services**
   - Supabase account (free tier works)
   - Notion developer account
   - Netlify account (for deployment)
   - Stripe account (for payment features)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/checkify.so-nuxt.git
   cd checkify.so-nuxt
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   # Supabase Configuration (Required)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   
   # Application (Required)
   BASE_URL=http://localhost:3000
   
   # Notion OAuth (Required for Notion integration)
   NOTION_OAUTH_CLIENT_ID=your-notion-oauth-client-id
   NOTION_OAUTH_CLIENT_SECRET=your-notion-oauth-client-secret
   
   # Stripe (Required for subscription features)
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   STRIPE_PRICE_ID_PRO=price_xxxxx     # Price ID for Pro tier ($6.99/mo)
   STRIPE_PRICE_ID_MAX=price_xxxxx     # Price ID for Max tier ($19.99/mo)
   ```

4. **Database Setup**
   
   Run these SQL commands in your Supabase SQL editor:
   
   ```sql
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   
   -- Create tables (see database-schema.md for full schema)
   -- These are created automatically by Supabase Auth and your app
   ```

### Running the Development Server

```bash
# Start the development server
pnpm dev

# The app will be available at http://localhost:3000
```

### Development Commands

```bash
# Development server with HMR
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Generate static site
pnpm generate

# Run linter
pnpm lint

# Run linter with auto-fix
pnpm lint:fix

# Type checking
pnpm typecheck
```

## Code Style & Standards

### ESLint Configuration

The project uses ESLint with the Nuxt recommended configuration:

```javascript
// .eslintrc.js
export default {
  extends: '@nuxt/eslint-config',
  rules: {
    // Custom rules
    'vue/multi-word-component-names': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}
```

### Code Formatting

- Use 2 spaces for indentation
- Single quotes for strings
- No semicolons (except where required)
- Trailing commas in multi-line objects/arrays

### Vue/Nuxt Conventions

1. **Component Structure**
   ```vue
   <script setup lang="ts">
   // UI component imports
   import { Button } from '@/components/ui/button'
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
   
   // Icon imports
   import { Settings, User } from 'lucide-vue-next'
   
   // Vue imports
   import { ref, computed, onMounted } from 'vue'
   
   // Props & Emits
   const props = defineProps<{
     title: string
     loading?: boolean
   }>()
   const emit = defineEmits<{
     click: [value: string]
   }>()
   
   // Reactive state
   const state = ref<string>('')
   
   // Computed properties
   const computedValue = computed(() => state.value.toUpperCase())
   
   // Methods
   const handleClick = () => {
     emit('click', state.value)
   }
   
   // Lifecycle hooks
   onMounted(() => {
     // Component mounted
   })
   </script>
   
   <template>
     <Card>
       <CardHeader>
         <CardTitle>{{ props.title }}</CardTitle>
       </CardHeader>
       <CardContent>
         <Button @click="handleClick" :disabled="props.loading">
           <Settings class="w-4 h-4 mr-2" />
           Click me
         </Button>
       </CardContent>
     </Card>
   </template>
   ```

2. **File Naming**
   - Components: PascalCase (e.g., `TodoList.vue`)
   - Composables: camelCase with 'use' prefix (e.g., `useAuth.ts`)
   - API routes: kebab-case (e.g., `todo-list.post.ts`)

### UI Development with shadcn/ui

1. **Adding New Components**
   ```bash
   # Use the shadcn-vue CLI to add components
   npx shadcn-vue@latest add [component-name]
   
   # Example: Add a Table component
   npx shadcn-vue@latest add table
   ```

2. **Component Usage**
   ```vue
   <script setup lang="ts">
   import { Button } from '@/components/ui/button'
   import { toast } from 'vue-sonner'
   
   const handleClick = () => {
     toast.success('Action completed!')
   }
   </script>
   
   <template>
     <Button variant="outline" size="sm" @click="handleClick">
       Click me
     </Button>
   </template>
   ```

3. **Styling with Tailwind CSS**
   ```vue
   <template>
     <!-- Use Tailwind utility classes -->
     <div class="flex items-center gap-4 p-4 bg-card rounded-lg border">
       <h3 class="text-lg font-semibold">Title</h3>
       <p class="text-sm text-muted-foreground">Description</p>
     </div>
   </template>
   ```

4. **Icon Usage**
   ```vue
   <script setup lang="ts">
   import { Home, Settings, User } from 'lucide-vue-next'
   </script>
   
   <template>
     <Button>
       <Home class="w-4 h-4 mr-2" />
       Home
     </Button>
   </template>
   ```

## Testing

### Unit Testing with Vitest

1. **Running Tests**
   ```bash
   # Run all tests
   pnpm test:unit
   
   # Run tests in watch mode
   pnpm test:unit:watch
   
   # Run tests with UI
   pnpm test:ui
   
   # Generate coverage report
   pnpm test:coverage
   ```

2. **Writing Tests**
   
   Create test files with `.spec.ts` or `.test.ts` extension:
   
   ```typescript
   // components/NotionBlock.spec.ts
   import { describe, it, expect } from 'vitest'
   import { mount } from '@vue/test-utils'
   import NotionBlock from './NotionBlock.vue'
   
   describe('NotionBlock', () => {
     it('renders todo checkbox', () => {
       const wrapper = mount(NotionBlock, {
         props: {
           block: {
             type: 'to_do',
             to_do: {
               checked: false,
               rich_text: [{ plain_text: 'Test todo' }]
             }
           }
         }
       })
       
       expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
       expect(wrapper.text()).toContain('Test todo')
     })
   })
   ```

3. **Testing Best Practices**
   - Test user interactions, not implementation details
   - Use `data-testid` for reliable element selection
   - Mock external dependencies
   - Test edge cases and error states

### E2E Testing (Future)

Consider implementing E2E tests with:
- Playwright
- Cypress
- Nuxt Test Utils

## Debugging

### Vue DevTools

1. Install Vue DevTools browser extension
2. Open DevTools and navigate to Vue tab
3. Inspect component hierarchy, props, and state

### Server-Side Debugging

1. **Console Logging**
   ```typescript
   export default defineEventHandler(async (event) => {
     console.log('Request:', event.node.req.url)
     console.log('User:', event.context.user)
     // Your logic
   })
   ```

2. **Node.js Debugging**
   ```json
   // .vscode/launch.json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Nuxt",
     "runtimeExecutable": "pnpm",
     "runtimeArgs": ["dev"],
     "port": 9229
   }
   ```

### Common Issues & Solutions

1. **Hydration Mismatch**
   - Ensure consistent data between server and client
   - Use `ClientOnly` wrapper for client-only components
   - Check for browser-only APIs in SSR context

2. **API Route 404**
   - Verify file naming convention
   - Check method suffix (.get, .post, etc.)
   - Ensure proper exports

3. **TypeScript Errors**
   - Run `pnpm typecheck` to identify issues
   - Update type definitions
   - Check for missing imports

## Performance Optimization

### Build Optimization

1. **Analyze Bundle Size**
   ```bash
   pnpm analyze
   ```

2. **Code Splitting**
   - Use dynamic imports for large components
   - Lazy load routes
   - Split vendor chunks

3. **Image Optimization**
   - Use Nuxt Image module
   - Serve WebP format
   - Implement lazy loading

### Runtime Performance

1. **Component Performance**
   - Use `v-memo` for expensive lists
   - Implement virtual scrolling for long lists
   - Debounce/throttle event handlers

2. **API Performance**
   - Implement caching strategies
   - Use pagination
   - Batch API requests

## Deployment

### Netlify Deployment

1. **netlify.toml Configuration**
   ```toml
   [build]
     command = "pnpm build"
     publish = ".output/public"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

2. **Environment Variables**
   - Set in Netlify dashboard
   - Use different values for staging/production
   - Never commit sensitive data

3. **Deployment Process**
   ```bash
   # Manual deployment
   pnpm build
   netlify deploy --prod
   
   # Or use Git integration
   git push origin main
   ```

### Other Deployment Options

1. **Vercel**
   ```json
   // vercel.json
   {
     "buildCommand": "pnpm build",
     "outputDirectory": ".output/public"
   }
   ```

2. **Docker**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY . .
   RUN npm install -g pnpm
   RUN pnpm install
   RUN pnpm build
   EXPOSE 3000
   CMD ["node", ".output/server/index.mjs"]
   ```

## Monitoring & Logging

### Error Tracking

Consider implementing:
- Sentry for error tracking
- LogRocket for session replay
- Custom error logging service

### Performance Monitoring

- Lighthouse CI in build pipeline
- Web Vitals tracking
- Custom performance metrics

### Analytics

- Privacy-friendly analytics (Plausible, Fathom)
- Custom event tracking
- User behavior insights

## Security Best Practices

### Environment Variables

1. **Never commit secrets**
   ```bash
   # .gitignore
   .env
   .env.*
   ```

2. **Use appropriate keys**
   - Client-side: Only public keys
   - Server-side: Service keys

### Input Validation

Always validate and sanitize user input:

```typescript
import { z } from 'zod'

const todoSchema = z.object({
  text: z.string().min(1).max(500),
  completed: z.boolean()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = todoSchema.parse(body)
  // Use validated data
})
```

### CORS & CSP

Configure security headers:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  security: {
    headers: {
      crossOriginEmbedderPolicy: 'unsafe-none',
      contentSecurityPolicy: {
        'img-src': ['self', 'data:', 'https:']
      }
    }
  }
})
```

## Troubleshooting Guide

### Development Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Dependency Issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules .nuxt .output
   pnpm install
   ```

3. **Build Failures**
   - Check Node version
   - Verify environment variables
   - Review build logs

### Production Issues

1. **Deployment Failures**
   - Check build logs
   - Verify environment variables
   - Test locally with production build

2. **Runtime Errors**
   - Enable detailed logging
   - Check browser console
   - Review server logs

## Contributing

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linter and tests
6. Submit pull request

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] No console.logs in production code
- [ ] Security best practices followed
- [ ] Performance impact considered