# Checkify.so

A modern web application that aggregates todo lists from Notion, providing a cleaner, more focused interface for managing your tasks. Built with Nuxt 3, PrimeVue, and Supabase.

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
- **Responsive Design**: Works on desktop and mobile devices
- **Multi-language**: English and German support

## 🚀 Tech Stack

- **Framework**: [Nuxt 3](https://nuxt.com/) (SSR disabled, running as SPA)
- **UI Library**: [PrimeVue 3.40.x](https://primevue.org/) with Sakai theme
- **Database & Auth**: [Supabase](https://supabase.com/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Styling**: [UnoCSS](https://unocss.dev/)
- **Forms**: [FormKit](https://formkit.com/) with PrimeVue integration
- **Editor**: [TipTap](https://tiptap.dev/)
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
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   BASE_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   
   The app requires the following tables in Supabase:
   - `profiles` - User profiles
   - `notion_access_token` - Notion OAuth tokens
   - `notion_access_token_user` - User-token relationships
   - `notion_database` - Connected Notion databases
   - `todo_list` - User's todo lists
   - `page` - Cached Notion pages
   - `todo` - Individual todo items

5. **Configure Notion Integration**
   
   - Create a Notion integration at https://www.notion.so/my-integrations
   - Set up OAuth with redirect URL: `{BASE_URL}/api/connect-notion`
   - Add client ID and secret to your environment

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

- [Architecture Overview](.claude/architecture.md)
- [Authentication Guide](.claude/authentication.md)
- [Notion Integration](.claude/notion-integration.md)
- [API Reference](.claude/api-reference.md)
- [UI Components](.claude/ui-components.md)
- [Development Guide](.claude/development.md)
- [Database Schema](.claude/database-schema.md)

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

- Built on top of the [Nuxt-Sakai](https://github.com/primefaces/sakai-nuxt) theme
- Inspired by the need for better todo management in Notion
- Thanks to the Nuxt, PrimeVue, and Supabase communities