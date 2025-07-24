<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Menu, X, LogIn } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';

const menuItems = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Docs', href: '/docs' },
];

const menuState = ref(false);
const isScrolled = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const toggleMenu = () => {
  menuState.value = !menuState.value;
};

const handleNavClick = (href: string) => {
  if (href.startsWith('#')) {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      menuState.value = false;
    }
  }
};
</script>

<template>
  <header>
    <nav
      :data-state="menuState ? 'active' : ''"
      class="fixed z-20 w-full px-2 group"
    >
      <div
        :class="[
          'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
          isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5'
        ]"
      >
        <div class="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
          <div class="flex w-full justify-between lg:w-auto">
            <NuxtLink
              to="/"
              aria-label="home"
              class="flex items-center space-x-2"
            >
              <img
                src="/checkify-logo.png"
                alt="Checkify logo"
                class="h-8 w-8"
              />
              <span class="text-xl font-bold">Checkify.so</span>
            </NuxtLink>

            <button
              @click="toggleMenu"
              :aria-label="menuState ? 'Close Menu' : 'Open Menu'"
              class="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
            >
              <Menu 
                :class="[
                  'm-auto size-6 duration-200',
                  menuState && 'rotate-180 scale-0 opacity-0'
                ]"
              />
              <X 
                :class="[
                  'absolute inset-0 m-auto size-6 duration-200',
                  !menuState ? '-rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                ]"
              />
            </button>
          </div>

          <div class="absolute inset-0 m-auto hidden size-fit lg:block">
            <ul class="flex gap-8 text-sm">
              <li v-for="(item, index) in menuItems" :key="index">
                <a
                  v-if="item.href.startsWith('#')"
                  :href="item.href"
                  @click.prevent="handleNavClick(item.href)"
                  class="text-muted-foreground hover:text-accent-foreground block duration-150 cursor-pointer"
                >
                  <span>{{ item.name }}</span>
                </a>
                <NuxtLink
                  v-else
                  :to="item.href"
                  class="text-muted-foreground hover:text-accent-foreground block duration-150"
                >
                  <span>{{ item.name }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div
            :class="[
              'bg-background mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent',
              menuState && 'block lg:flex'
            ]"
          >
            <div class="lg:hidden">
              <ul class="space-y-6 text-base">
                <li v-for="(item, index) in menuItems" :key="index">
                  <a
                    v-if="item.href.startsWith('#')"
                    :href="item.href"
                    @click.prevent="handleNavClick(item.href)"
                    class="text-muted-foreground hover:text-accent-foreground block duration-150 cursor-pointer"
                  >
                    <span>{{ item.name }}</span>
                  </a>
                  <NuxtLink
                    v-else
                    :to="item.href"
                    class="text-muted-foreground hover:text-accent-foreground block duration-150"
                  >
                    <span>{{ item.name }}</span>
                  </NuxtLink>
                </li>
              </ul>
            </div>
            <div class="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
              <Button
                as-child
                variant="outline"
                size="sm"
              >
                <NuxtLink to="/login">
                  <span>Login</span>
                </NuxtLink>
              </Button>
              <Button
                as-child
                size="sm"
              >
                <NuxtLink to="/my-todo-lists">
                  <LogIn class="w-4 h-4 mr-2" />
                  <span>Dashboard</span>
                </NuxtLink>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
/* Group state handling for menu animations */
.group[data-state="active"] .group-data-\[state\=active\]\:block {
  display: block;
}

.group[data-state="active"] .group-data-\[state\=active\]\:scale-100 {
  transform: scale(1);
}

.group[data-state="active"] .group-data-\[state\=active\]\:opacity-100 {
  opacity: 1;
}

.group[data-state="active"] .group-data-\[state\=active\]\:rotate-0 {
  transform: rotate(0deg);
}

.group[data-state="active"] .group-data-\[state\=active\]\:scale-0 {
  transform: scale(0);
}

.group[data-state="active"] .group-data-\[state\=active\]\:opacity-0 {
  opacity: 0;
}

.group[data-state="active"] .group-data-\[state\=active\]\:rotate-180 {
  transform: rotate(180deg);
}
</style>