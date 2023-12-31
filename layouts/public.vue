<script setup lang="ts">
import { computed, watch, ref } from 'vue';

import AppMenu from '~/components/app/AppMenu.vue';
const { layoutConfig, layoutState, isSidebarActive } = useLayout();
const themeStore = useThemeStore();

const containerClass = computed(() => {
  return {
    dark: themeStore.isDarkMode,
    // 'layout-overlay': layoutConfig.menuMode.value === 'overlay',
    // 'layout-static': layoutConfig.menuMode.value === 'static',
    // 'layout-static-inactive':
    //   layoutState.staticMenuDesktopInactive.value &&
    //   layoutConfig.menuMode.value === 'static',
    // 'layout-overlay-active': layoutState.overlayMenuActive.value,
    // 'layout-mobile-active': true,
    'p-input-filled': layoutConfig.inputStyle.value === 'filled',
    'p-ripple-disabled': !layoutConfig.ripple.value
  };
});
</script>

<template>
  <div class="public-layout">
    <Link rel="stylesheet" :href="themeStore.link" />
    <div class="layout-wrapper" :class="containerClass">
      <app-topbar />
      <div class="layout-sidebar">
        <app-menu />
      </div>
      <div class="layout-main-container">
        <div class="layout-main">
          <slot />
        </div>
        <app-footer />
      </div>
      <div class="layout-mask" />
    </div>
  </div>
</template>

<style lang="scss">
.public-layout {
  .layout-sidebar, .layout-menu-button {
    display: none;
  }
}
</style>
