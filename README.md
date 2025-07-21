# Checkify.so

A modern web application that aggregates todo lists from Notion, providing a cleaner, more focused interface for managing your tasks. Built with Nuxt 3, shadcn/ui, and Supabase.

## 🎯 Project Goal

Checkify.so solves a common problem with Notion: while it's great for organizing information, managing todos scattered across different pages can be cumbersome. This app:

- **Aggregates all your Notion todos** into a single, clean interface
- **Syncs bidirectionally** - check off items here, and they update in Notion
- **Provides a distraction-free** todo management experience
- **Maintains Notion as your source of truth** while offering a better task interface

## ✨ Features

- **Notion Integration**: OAuth-based connection to your Notion workspace
- **Real-time Sync**: Bidirectional checkbox synchronization with Notion
- **Multi-database Support**: Connect multiple Notion databases
- **Clean UI**: Focused todo interface without Notion's complexity
- **Authentication**: Secure login with Google via Supabase
- **Subscription Tiers**: Free, Pro ($6.99/mo), and Max ($19.99/mo) plans
- **Responsive Design**: Works on desktop and mobile devices
- **Multi-language**: English and German support

## 🚀 Tech Stack

- **Framework**: [Nuxt 3](https://nuxt.com/) (SSR enabled with client-side data fetching)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) - Modern component library built on Radix UI
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Payments**: [Stripe](https://stripe.com/) - Subscription management
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [lucide-vue-next](https://lucide.dev/)
- **Analytics**: [PostHog](https://posthog.com/)
- **Testing**: [Vitest](https://vitest.dev/)

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm package manager
- Supabase account
- Notion integration app (for OAuth)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/checkify.so-nuxt.git
   cd checkify.so-nuxt
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # App
   BASE_URL=http://localhost:3000
   
   # Stripe (for subscription features)
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   STRIPE_PRICE_ID_PRO=price_xxxxx
   STRIPE_PRICE_ID_MAX=price_xxxxx
   ```

4. **Set up Supabase**
   
   The app requires the following tables in Supabase:
   - `user_profiles` - User profiles with subscription and billing data
   - `notion_access_token` - Notion OAuth tokens
   - `notion_access_token_user` - User-token relationships
   - `notion_database` - Connected Notion databases
   - `todo_list` - User's todo lists
   - `page` - Cached Notion pages
   - `todo` - Individual todo items

5. **Configure Notion Integration**
   
   - Create a Notion integration at https://www.notion.so/my-integrations
   - Set up OAuth with redirect URL: `{BASE_URL}/api/connect-notion`
   - Add the following to your `.env` file:
     ```env
     NOTION_OAUTH_CLIENT_ID=your_notion_client_id
     NOTION_OAUTH_CLIENT_SECRET=your_notion_client_secret
     ```

## 🏃‍♂️ Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test:unit

# Run tests with UI
pnpm test:ui

# Lint code
pnpm lint

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📚 Documentation

For detailed documentation, see the `.claude/` directory:

- [Architecture Overview](.claude/technical/architecture.md)
- [Authentication Guide](.claude/getting-started/authentication.md)
- [Notion Integration](.claude/features/notion-integration.md)
- [Stripe Integration](.claude/features/stripe-integration.md)
- [API Reference](.claude/technical/api-reference.md)
- [UI Components](.claude/technical/ui-components.md)
- [Development Guide](.claude/getting-started/development.md)
- [Database Schema](.claude/technical/database-schema.md)
- [Subscription Tiers](.claude/features/subscription-tiers.md)

## 🚢 Deployment

The app is configured for deployment on Netlify:

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Build command: `pnpm build`
4. Publish directory: `.output/public`

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- UI components powered by [shadcn/ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/)
- Inspired by the need for better todo management in Notion
- Thanks to the Nuxt, Vue, and Supabase communities