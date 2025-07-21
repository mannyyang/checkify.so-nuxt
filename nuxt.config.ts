import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-13',
  devtools: { enabled: true },
  ssr: true,
  app: {
    head: {
      script: [
        {
          src: 'https://cloud.umami.is/script.js',
          defer: true,
          'data-website-id': '0a308b81-ba46-4f8e-af5e-b4b3224967e9'
        }
      ]
    }
  },
  runtimeConfig: {
    // Private keys (server-side only)
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    // Public keys (available on client)
    public: {
      APP_VERSION: pkg.version,
      APP_NAME: pkg.name,
      APP_MODE: process.env?.NODE_ENV,
      BASE_URL: process.env?.BASE_URL,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      stripePriceIdPro: process.env.STRIPE_PRICE_ID_PRO,
      stripePriceIdMax: process.env.STRIPE_PRICE_ID_MAX
    }
  },
  modules: [
    'shadcn-nuxt',
    '@pinia/nuxt',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxtjs/supabase'
  ],
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
  content: {
    // Content module configuration
  },
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  build: {
    transpile: ['nuxt']
  },
  sourcemap: {
    client: false,
    server: true
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: [
        '/',
        '/pricing',
        '/privacy-policy',
        '/terms-of-use',
        '/checkboxes',
        '/todo-list/*',
        '/docs/*',
        '/test-content',
        '/api/_content/*'
      ]
    }
  }
});
