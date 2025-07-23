<script setup lang="ts">
import { Button } from '~/components/ui/button';
import { LogIn, ArrowRight } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import MarketingNav from './MarketingNav.vue';

const isVisible = ref(false);

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 100);
});
</script>

<template>
  <MarketingNav />
  <section class="relative overflow-hidden">
    <!-- Background gradients -->
    <div
      aria-hidden="true"
      class="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
    >
      <div class="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
      <div class="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
      <div class="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
    </div>

    <div class="relative pt-24 md:pt-36">
      <div
        aria-hidden="true"
        class="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
      />
      
      <div class="mx-auto max-w-7xl px-6">
        <div class="text-center">
          <!-- Animated announcement banner -->
          <div
            :class="[
              'inline-block transition-all duration-1000 transform',
              isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'
            ]"
          >
            <NuxtLink
              to="/blog/launch"
              class="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
            >
              <span class="text-foreground text-sm">
                New: Notion sync is now live
              </span>
              <span class="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>
              
              <div class="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                <div class="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                  <span class="flex size-6">
                    <ArrowRight class="m-auto size-3" />
                  </span>
                  <span class="flex size-6">
                    <ArrowRight class="m-auto size-3" />
                  </span>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- Main headline -->
          <h1
            :class="[
              'mt-8 text-balance text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] font-bold leading-tight transition-all duration-1000 delay-200 transform',
              isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'
            ]"
          >
            Don't Let Your To-Dos Drown in Notion's Digital Depths
          </h1>
          
          <!-- Subheadline -->
          <p
            :class="[
              'mx-auto mt-8 max-w-2xl text-balance text-lg text-gray-600 dark:text-gray-400 transition-all duration-1000 delay-300 transform',
              isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'
            ]"
          >
            Tired of hunting for scattered to-dos across countless Notion pages?
            Simply aggregate all your tasks in one place, gaining instant clarity
            and control over your workflow.
          </p>

          <!-- CTA Buttons -->
          <div
            :class="[
              'mt-12 flex flex-col items-center justify-center gap-2 md:flex-row transition-all duration-1000 delay-400 transform',
              isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'
            ]"
          >
            <div class="bg-foreground/10 rounded-[14px] border p-0.5">
              <Button
                as-child
                size="lg"
                class="rounded-xl px-5 text-base"
              >
                <NuxtLink to="/my-todo-lists">
                  <LogIn class="w-4 h-4 mr-2" />
                  <span class="text-nowrap">Login to get started</span>
                </NuxtLink>
              </Button>
            </div>
            
            <Button
              as-child
              size="lg"
              variant="ghost"
              class="h-10.5 rounded-xl px-5"
            >
              <a 
                href="#features" 
                @click.prevent="$event.target.closest('a').nextElementSibling?.scrollIntoView({ behavior: 'smooth' })"
              >
                <span class="text-nowrap">See How It Works</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      <!-- Hero Image/Video Section -->
      <div
        :class="[
          'relative mt-8 overflow-hidden px-4 sm:mt-12 md:mt-20 transition-all duration-1000 delay-500 transform',
          isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'
        ]"
      >
        <div class="relative mx-auto max-w-7xl">
          <div class="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
            <!-- Scattered todos image -->
            <div class="flex-1 max-w-2xl">
              <div class="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative overflow-hidden rounded-2xl border p-2 shadow-lg shadow-zinc-950/15 ring-1 transform transition-all duration-300 hover:scale-[1.02]">
                <img
                  class="w-full rounded-xl"
                  src="/scattered-todos.png"
                  alt="Scattered todos across multiple Notion pages"
                />
              </div>
            </div>
            
            <!-- Arrow pointing from scattered to aggregated -->
            <div class="flex items-center justify-center flex-shrink-0">
              <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-xl"></div>
                <ArrowRight class="w-8 h-8 lg:w-12 lg:h-12 text-primary animate-bounce-horizontal" />
              </div>
            </div>
            
            <!-- Aggregated todos image -->
            <div class="flex-1 max-w-2xl">
              <div class="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative overflow-hidden rounded-2xl border p-2 shadow-lg shadow-zinc-950/15 ring-1 transform transition-all duration-300 hover:scale-[1.02]">
                <img
                  class="w-full rounded-xl"
                  src="/aggregated-todos.png"
                  alt="All todos aggregated in one Notion database by Checkify"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.inset-shadow-2xs {
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
}

.dark .dark\:inset-shadow-white\/20 {
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
}

.h-10\.5 {
  height: 2.625rem;
}

@keyframes bounce-horizontal {
  0%, 100% {
    transform: translateX(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateX(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

.animate-bounce-horizontal {
  animation: bounce-horizontal 1s infinite;
}
</style>