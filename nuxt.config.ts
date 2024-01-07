import pkg from './package.json';

export default defineNuxtConfig({
  devtools: true,
  ssr: false,
  runtimeConfig: {
    public: {
      APP_VERSION: pkg.version,
      APP_NAME: pkg.name,
      APP_MODE: process.env?.NODE_ENV,
      BASE_URL: process.env?.BASE_URL
    }
  },
  modules: [
    'nuxt-primevue',
    '@formkit/nuxt',
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxtjs/supabase'
  ],
  content: {
    highlight: {
      theme: 'one-dark-pro',
      preload: ['json', 'js', 'ts', 'html', 'css', 'vue']
    }
    // Options
  },
  i18n: {
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'en',
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'de', file: 'de.json', name: 'German' }
    ],

    vueI18n: './vue-i18n.options.ts'
  },
  primevue: {
    components: {
      exclude: ['Chart']
    },
    options: {
      ripple: true
    }
  },
  css: [
    'primevue/resources/primevue.css',
    'primeicons/primeicons.css',
    '@sfxcode/formkit-primevue/dist/sass/formkit-primevue.scss'
  ],
  build: {
    transpile: ['nuxt', 'primevue', 'formkit-primevue']
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
      ]
    }
  }
});
