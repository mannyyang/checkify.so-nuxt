<script setup lang="ts">
import { LogIn } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="border-t bg-muted/30">
    <!-- CTA Section -->
    <section class="py-20 px-4">
      <div class="mx-auto max-w-4xl text-center">
        <h2 class="text-4xl md:text-5xl font-bold leading-tight mb-8">
          Notion + Checkify: Aggregate and Conquer your Todos
        </h2>
        
        <Button as-child size="lg" class="gap-2">
          <NuxtLink to="/my-todo-lists">
            <LogIn class="w-4 h-4" />
            Login to get started
          </NuxtLink>
        </Button>
      </div>
    </section>

    <!-- Footer Links -->
    <div class="border-t">
      <div class="mx-auto max-w-7xl px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Company Info -->
          <div class="space-y-4">
            <h3 class="font-semibold text-lg">Checkify.so</h3>
            <p class="text-sm text-muted-foreground">
              The simplest way to aggregate and manage all your Notion todos in one place.
            </p>
          </div>

          <!-- Product Links -->
          <div>
            <h4 class="font-semibold mb-4">Product</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/features" class="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/pricing" class="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/docs" class="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/blog" class="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Company Links -->
          <div>
            <h4 class="font-semibold mb-4">Company</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/about" class="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/contact" class="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </NuxtLink>
              </li>
              <li>
                <a href="/blog" class="text-muted-foreground hover:text-foreground transition-colors">
                  Updates
                </a>
              </li>
            </ul>
          </div>

          <!-- Legal Links -->
          <div>
            <h4 class="font-semibold mb-4">Legal</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/privacy-policy" class="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/terms-of-use" class="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Use
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="mt-12 pt-8 border-t">
          <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div class="text-sm text-muted-foreground">
              © {{ currentYear }} Checkify.so. All rights reserved.
            </div>
            <div class="flex items-center space-x-6">
              <!-- Social Links - You can add these later -->
              <a href="https://twitter.com/checkifyso" class="text-muted-foreground hover:text-foreground transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://github.com/checkifyso" class="text-muted-foreground hover:text-foreground transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Any specific footer styles if needed */
</style>