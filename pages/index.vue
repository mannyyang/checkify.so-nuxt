<script setup lang="ts">
import { Button } from '~/components/ui/button';
import { LogIn } from 'lucide-vue-next';

definePageMeta({
  layout: 'public'
});
</script>

<template>
  <section class="hero">
    <div
      class="flex flex-col lg:flex-row items-center px-4 py-16 max-w-7xl mx-auto space-y-4 lg:space-y-0"
    >
      <div class="w-full lg:w-1/2 text-center lg:text-left">
        <h1 class="text-5xl font-bold leading-tight">
          Don't Let Your To-Dos Drown in Notion's Digital Depths
        </h1>
        <p class="mt-4 text-lg text-gray-600">
          Tired of hunting for scattered to-dos across countless Notion pages?
          Simply aggregate all your tasks in one place, gaining instant clarity
          and control over your workflow.
        </p>
        <NuxtLink to="/my-todo-lists" class="inline-block mt-8">
          <Button size="lg" class="gap-2">
            <LogIn class="w-4 h-4" />
            Login to get started
          </Button>
        </NuxtLink>
      </div>
      <div class="w-full lg:w-1/2 lg:ml-10">
        <img
          class="max-w-full p-6"
          src="/hero-section.png"
          alt="Notion integration with other tools"
        >
      </div>
    </div>
  </section>

  <section class="flex flex-col md:flex-row w-full py-16 px-4">
    <div class="md:w-1/2 pr-8 pb-4 md:pb-0">
      <h2 class="mb-4">
        Synced Todos & Metrics
      </h2>
      <p class="mt-2 text-lg">
        Todo's are now synced with your notion blocks as in if you check a todo
        in the view, it will be reflected in your notion page.
      </p>
      <p class="mt-2 text-lg">
        See how you're doing with metrics. View status with a clean progress
        bar.
      </p>
    </div>
    <div class="md:w-1/2">
      <video
        class="max-w-full b-1 b-solid b-black b-rounded"
        autoplay
        loop
        muted
      >
        <source src="/recording/synced-todos.mov?url" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
  </section>

  <section class="flex flex-col md:flex-row w-full py-16 px-4">
    <div class="md:w-1/2">
      <video
        class="max-w-full b-1 b-solid b-black b-rounded"
        width="100%"
        autoplay
        loop
        muted
      >
        <source src="/recording/manual-refresh.mov?url" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
    <div class="md:w-1/2 pl-8 pb-4 md:pb-0">
      <h2 class="mb-4">
        Refreshing Todos
      </h2>
      <p class="mt-2 text-lg">
        Todo's are synced every hour, but a manual refresh button is included.
      </p>
    </div>
  </section>

  <section class="flex flex-col md:flex-row w-full py-16 px-4">
    <div class="md:w-1/2 pr-8 pb-4 md:pb-0">
      <h2 class="mb-4">
        Hide completed tasks
      </h2>
      <p class="mt-2 text-lg">
        Hide completed tasks for a focused and clean view.
      </p>
    </div>
    <div class="md:w-1/2">
      <video
        class="max-w-full b-1 b-solid b-black b-rounded"
        width="100%"
        autoplay
        loop
        muted
      >
        <source src="/recording/hide-completed.mov?url" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
  </section>

  <section class="hero">
    <div class="w-full p-20 text-center">
      <h1 class="text-5xl font-bold leading-tight">
        Notion + Checkify: Aggregate and Conquer your Todos
      </h1>

      <NuxtLink to="/my-todo-lists" class="inline-block mt-8">
        <Button size="lg" class="gap-2">
          <LogIn class="w-4 h-4" />
          Login to get started
        </Button>
      </NuxtLink>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t py-8 px-4 mt-20">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
      <div class="text-sm text-muted-foreground">
        © 2024 Checkify.so. All rights reserved.
      </div>
      <div class="flex space-x-6 text-sm">
        <NuxtLink to="/privacy-policy" class="text-muted-foreground hover:text-foreground transition-colors">
          Privacy Policy
        </NuxtLink>
        <NuxtLink to="/terms-of-use" class="text-muted-foreground hover:text-foreground transition-colors">
          Terms of Use
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>

<style scoped></style>
