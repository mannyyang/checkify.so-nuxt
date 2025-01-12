<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
const { layoutConfig, onMenuToggle } = useLayout();
const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const router = useRouter();

onMounted(() => {
  bindOutsideClickListener();
});
onBeforeUnmount(() => {
  unbindOutsideClickListener();
});
const logoUrl = computed(() => {
  return `/layout/images/${
    layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'
  }.svg`;
});

const onTopBarMenuButton = () => {
  topbarMenuActive.value = !topbarMenuActive.value;
};

const onSettingsClick = () => {
  topbarMenuActive.value = false;
  router.push('/utilities/documentation');
};

const topbarMenuClasses = computed(() => {
  return {
    'layout-topbar-menu-mobile-active': topbarMenuActive.value
  };
});

const bindOutsideClickListener = () => {
  if (!outsideClickListener.value) {
    outsideClickListener.value = (event) => {
      if (isOutsideClicked(event)) {
        topbarMenuActive.value = false;
      }
    };

    document.addEventListener('click', outsideClickListener.value);
  }
};

const unbindOutsideClickListener = () => {
  if (outsideClickListener.value) {
    document.removeEventListener('click', outsideClickListener);
    outsideClickListener.value = null;
  }
};

const isOutsideClicked = (event) => {
  if (!topbarMenuActive.value) {
    return;
  }
  const sidebarEl = document.querySelector('.layout-topbar-menu');
  const topbarEl = document.querySelector('.layout-topbar-menu-button');

  return !(
    sidebarEl.isSameNode(event.target) ||
    sidebarEl.contains(event.target) ||
    topbarEl.isSameNode(event.target) ||
    topbarEl.contains(event.target)
  );
};

const emit = defineEmits(['menuToggle']);

const themeStore = useThemeStore();
const op = ref<any>(null);

function toggle(event: any) {
  op.value.toggle(event);
}

function redirectToGithub(event: any) {
  window.open('https://github.com/sfxcode/nuxt3-primevue-starter', '_blank');
}
</script>

<template>
  <div class="layout-topbar">
    <NuxtLink to="/" class="layout-topbar-logo">
      <img
        src="/layout/images/logo-green.png"
        alt="Checkify logo"
        class="w-7 h-7 mr-4"
      />
      <span style="color: var(--primary-color)">Checkify.so</span>
    </NuxtLink>

    <button
      class="p-link layout-menu-button layout-topbar-button"
      @click="onMenuToggle()"
    >
      <i class="pi pi-bars" />
    </button>

    <button
      class="p-link layout-topbar-menu-button layout-topbar-button"
      @click="onTopBarMenuButton()"
    >
      <i class="pi pi-ellipsis-v" />
    </button>

    <div class="layout-topbar-menu" :class="topbarMenuClasses">
      <!-- <button class="p-link layout-topbar-button" @click="onTopBarMenuButton()">
        <i class="pi pi-calendar" />
        <span>Calendar</span>
      </button> -->
      <NuxtLink to="/my-todo-lists">
        <button class="p-link layout-topbar-button">
          <i class="pi pi-user" />
          <span>Profile</span>
        </button>
      </NuxtLink>

      <!-- <button class="p-link layout-topbar-button" @click="toggle">
        <i class="pi pi-cog" />
        <span>Settings</span>
      </button> -->
      <!-- <button class="p-link layout-topbar-button" @click="redirectToGithub">
        <i class="pi pi-github" />
        <span>Github</span>
      </button> -->
    </div>
    <client-only>
      <!-- For settings button -->
      <OverlayPanel
        id="overlay_panel"
        ref="op"
        append-to="body"
        style="width: 200px"
      >
        <div class="field-radiobutton">
          <RadioButton
            id="lara-dark"
            v-model="themeStore.themeName"
            name="layoutColorMode"
            value="lara-dark"
            @change="themeStore.setTheme('lara-dark')"
          />
          <label>Lara Dark</label>
        </div>
        <div class="field-radiobutton">
          <RadioButton
            id="lara-light"
            v-model="themeStore.themeName"
            name="layoutColorMode"
            value="lara-light"
            @change="themeStore.setTheme('lara-light')"
          />
          <label>Lara Light</label>
        </div>

        <h6>Primary Color</h6>
        <div class="flex">
          <div
            style="
              width: 2rem;
              height: 2rem;
              border-radius: 6px;
              background-color: #10b981;
            "
            class="bg-purple-500 mr-3 cursor-pointer"
            @click="themeStore.setColor('teal')"
          />
          <div
            style="
              width: 2rem;
              height: 2rem;
              border-radius: 6px;
              background-color: #3b82f6;
            "
            class="bg-blue-500 mr-3 cursor-pointer"
            @click="themeStore.setColor('blue')"
          />
          <div
            style="
              width: 2rem;
              height: 2rem;
              border-radius: 6px;
              background-color: #6366f1;
            "
            class="bg-green-500 mr-3 cursor-pointer"
            @click="themeStore.setColor('indigo')"
          />
          <div
            style="
              width: 2rem;
              height: 2rem;
              border-radius: 6px;
              background-color: #8b5cf6;
            "
            class="bg-yellow-300 mr-3 cursor-pointer"
            @click="themeStore.setColor('purple')"
          />
        </div>
      </OverlayPanel>
    </client-only>
  </div>
</template>

<style lang="scss" scoped></style>
