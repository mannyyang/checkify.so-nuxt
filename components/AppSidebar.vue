<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'

import {
  BookOpen,
} from 'lucide-vue-next'
import NavMain from '@/components/NavMain.vue'
import NavProjects from '@/components/NavProjects.vue'
import NavUser from '@/components/NavUser.vue'
import TeamSwitcher from '@/components/TeamSwitcher.vue'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

import { CheckSquare, Key, Book, LogIn, LogOut, Home, FileText } from 'lucide-vue-next'

const user = useSupabaseUser();

// Navigation data for Checkify
const data = {
  user: computed(() => {
    if (!user.value) return null;
    
    return {
      name: user.value.user_metadata?.full_name || user.value.user_metadata?.name || user.value.email?.split('@')[0] || 'User',
      email: user.value.email || '',
      avatar: user.value.user_metadata?.avatar_url || user.value.user_metadata?.picture || '',
    };
  }),
  teams: [
    {
      name: 'Checkify.so',
      logo: CheckSquare,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: Home,
      isActive: true,
    },
    {
      title: 'My Todo Lists',
      url: '/my-todo-lists',
      icon: CheckSquare,
    },
  ],
  projects: [
    {
      name: 'Connect Notion',
      url: '/docs/connect-notion',
      icon: BookOpen,
    },
    {
      name: 'Create a Todo List',
      url: '/docs/create-todo-list',
      icon: BookOpen,
    },
    {
      name: 'Privacy Policy',
      url: '/privacy-policy',
      icon: FileText,
    },
    {
      name: 'Terms of Use',
      url: '/terms-of-use',
      icon: FileText,
    },
  ],
}

</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <TeamSwitcher :teams="data.teams" />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navMain" />
      <NavProjects :projects="data.projects" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser v-if="data.user.value" :user="data.user.value" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
