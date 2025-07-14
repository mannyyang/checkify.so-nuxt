import pkg from './package.json';
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-13',
  devtools: true,
  ssr: true,
  runtimeConfig: {
    public: {
      APP_VERSION: pkg.version,
      APP_NAME: pkg.name,
      APP_MODE: process.env?.NODE_ENV,
      BASE_URL: process.env?.BASE_URL
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
    highlight: {
      theme: 'one-dark-pro',
      preload: ['json', 'js', 'ts', 'html', 'css', 'vue']
    }
    // Options
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
      exclude: [
        '/',
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
