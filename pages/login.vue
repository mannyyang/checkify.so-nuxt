<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

definePageMeta({
  layout: 'public'
});

const runtimeConfig = useRuntimeConfig();
const supabase = useSupabaseClient();

const redirectUrl = computed(() => {
  return `${runtimeConfig.public.BASE_URL}/confirm`;
});

async function signInWithGoogle () {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl.value
    }
  });
}
</script>

<template>
  <div
    class="surface-ground flex items-center justify-center min-h-screen min-w-screen overflow-hidden"
  >
    <div class="flex flex-col items-center justify-center">
      <img
        src="/checkify-logo.png"
        alt="Checkify logo"
        class="mb-5 w-24 h-24 flex-shrink-0"
      >
      <div style="border-radius: 56px; padding: 0.3rem">
        <div
          class="w-full surface-card py-8 px-5 sm:px-8"
          style="border-radius: 53px"
        >
          <div class="text-center mb-10">
            <div class="text-3xl font-medium mb-3">
              Welcome!
            </div>
            <span class="font-medium">Sign in to continue</span>
          </div>

          <div>
            <Button
              class="w-full"
              @click="signInWithGoogle"
            >
              <img
                class="w-5 h-5 mr-2"
                alt="Google sign-in"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/24px-Google_%22G%22_logo.svg.png"
              >
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="absolute bottom-0 left-0 right-0 py-4 px-4">
      <div class="flex justify-center space-x-6 text-sm">
        <NuxtLink to="/privacy-policy" class="text-muted-foreground hover:text-foreground transition-colors">
          Privacy Policy
        </NuxtLink>
        <NuxtLink to="/terms-of-use" class="text-muted-foreground hover:text-foreground transition-colors">
          Terms of Use
        </NuxtLink>
      </div>
    </div>
  </div>
  <!--
  <div class="w-screen h-screen flex justify-center items-center">
    <Card>
      <template #content>
        <h1 class="p-8">Login to Checkify.so</h1>
        <div class="p-8">
          <Button
            class="w-full"
            label="Login with Google"
            @click="signInWithGoogle"
          >
            <template #icon>
              <img
                class="w-7 h-7 mr-2"
                alt="Google sign-in"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png"
              />
            </template>
          </Button>
        </div>
      </template>
    </Card>
  </div> -->
</template>
