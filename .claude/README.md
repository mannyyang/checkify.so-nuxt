# Checkify.so Documentation

Welcome to the comprehensive documentation for Checkify.so - a powerful todo management tool that bridges Notion's organizational capabilities with a focused, distraction-free interface.

## 📚 Documentation Structure

### 🚀 Getting Started
- **[Quickstart Guide](./getting-started/quickstart.md)** - Get up and running in 5 minutes
- **[Authentication](./getting-started/authentication.md)** - Supabase auth setup and flow
- **[Development](./getting-started/development.md)** - Development environment and workflow

### 🎯 Features
- **[Features Overview](./features/overview.md)** - Complete feature list and benefits
- **[Notion Integration](./features/notion-integration.md)** - OAuth setup and API details
- **[Database Sync](./features/notion-sync-feature.md)** - Export todos to Notion database
- **[Webhook Integration](./features/webhook-integration.md)** - Bidirectional sync setup
- **[PostHog Integration](./features/posthog-integration.md)** - Analytics and feature flags
- **[Subscription Tiers](./features/subscription-tiers.md)** - Pricing and limits

### 🔧 Technical Reference
- **[Architecture](./technical/architecture.md)** - System design and tech stack
- **[Database Schema](./technical/database-schema.md)** - Tables, relationships, and queries
- **[API Reference](./technical/api-reference.md)** - Complete endpoint documentation
- **[UI Components](./technical/ui-components.md)** - Component library and patterns

### 📝 Additional Resources
- **[Changelog](./changelog.md)** - Version history and updates
- **[CLAUDE.md](../CLAUDE.md)** - AI assistant instructions

## 🎯 Quick Links

### For Developers
1. [Set up local environment](./getting-started/quickstart.md)
2. [Understand the architecture](./technical/architecture.md)
3. [Explore API endpoints](./technical/api-reference.md)
4. [Review database schema](./technical/database-schema.md)

### For Users
1. [Features overview](./features/overview.md)
2. [Connect Notion](./features/notion-integration.md)
3. [Set up sync](./features/notion-sync-feature.md)
4. [Configure webhooks](./features/webhook-integration.md)

### For Contributors
1. [Development workflow](./getting-started/development.md)
2. [Code style guide](./getting-started/development.md#code-style)
3. [Testing approach](./getting-started/development.md#testing)
4. [Submit changes](./getting-started/development.md#contributing)

## 🏗️ Architecture Overview

```
User → Nuxt 3 (SSR) → Supabase Auth → Google OAuth
                  ↓
            Authenticated
                  ↓
         Connect Notion → Notion OAuth
                  ↓
     Select Notion Databases → Store in Supabase
                  ↓
    Fetch & Display Todos ← → Bidirectional Sync with Notion
                  ↓
    PostHog Analytics & Feature Flags
```

## 🚦 Current Status

- **Version**: 2025.07.15
- **Stage**: Production
- **Notable Features**:
  - ✅ Notion OAuth integration
  - ✅ Real-time bidirectional sync
  - ✅ Database export functionality
  - ✅ Webhook support
  - ✅ PostHog analytics
  - ✅ Feature flag management
  - ✅ Modern UI with shadcn/ui components
  - ✅ Responsive design with Tailwind CSS v4
  - ✅ Client-side data fetching for better performance
  - ✅ Subscription tiers with smart limits
  - ✅ Full pagination support for large databases
  - ✅ Comprehensive test coverage

## 🛠️ Tech Stack

- **Frontend**: Nuxt 3, Vue 3, shadcn/ui, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Integration**: Notion API v2
- **Analytics**: PostHog
- **Deployment**: Vercel/Netlify compatible

## 🔐 Security & Privacy

- All data stored in your Supabase instance
- Notion tokens encrypted at rest
- Row-level security on all tables
- No data sharing with third parties
- Open source and auditable

## 🤝 Contributing

We welcome contributions! Please:
1. Read the [development guide](./getting-started/development.md)
2. Check existing issues and PRs
3. Follow the code style guidelines
4. Add tests for new features
5. Update documentation as needed

## 📞 Support

- **Documentation**: You're here! 
- **Issues**: [GitHub Issues](https://github.com/your-org/checkify/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/checkify/discussions)
- **Email**: support@checkify.so

## 📄 License

Checkify.so is open source software licensed under the MIT license. See the LICENSE file for details.

---

*Last updated: July 15, 2025*