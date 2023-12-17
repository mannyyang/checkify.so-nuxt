<script setup lang="ts">
definePageMeta({
  layout: 'public'
});

const runtimeConfig = useRuntimeConfig();
const supabase = useSupabaseClient();

const redirectUrl = computed(() => {
  return `${runtimeConfig.public.BASE_URL}/confirm`;
});

async function signInWithGoogle() {
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
        src="/layout/images/logo-green.png"
        alt="Checkify logo"
        class="mb-5 w-6rem flex-shrink-0"
      />
      <div style="border-radius: 56px; padding: 0.3rem">
        <div
          class="w-full surface-card py-8 px-5 sm:px-8"
          style="border-radius: 53px"
        >
          <div class="text-center mb-10">
            <div class="text-3xl font-medium mb-3">Welcome!</div>
            <span class="font-medium">Sign in to continue</span>
          </div>

          <div>
            <Button
              class="w-full"
              label="Sign in with Google"
              @click="signInWithGoogle"
            >
              <template #icon>
                <img
                  class="w-7 h-7 mr-2"
                  alt="Google sign-in"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/24px-Google_%22G%22_logo.svg.png"
                />
              </template>
            </Button>
          </div>
        </div>
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
