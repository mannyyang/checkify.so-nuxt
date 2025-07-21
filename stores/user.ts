import { defineStore } from 'pinia';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

export interface NotionAuth {
  id: string
  user_id: string
  access_token: string
  token_type: string
  bot_id: string
  workspace_id: string
  workspace_name?: string
  workspace_icon?: string
  duplicated_template_id?: string
  created_at: string
  updated_at: string
}

interface UserState {
  user: User | null
  profile: UserProfile | null
  notionAuth: NotionAuth | null
  isLoading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    profile: null,
    notionAuth: null,
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: state => !!state.user,
    hasNotionAuth: state => !!state.notionAuth,
    userId: state => state.user?.id,
    userEmail: state => state.user?.email || state.profile?.email,
    stripeCustomerId: state => state.profile?.stripe_customer_id
  },

  actions: {
    setUser (user: User | null) {
      this.user = user;
    },

    setProfile (profile: UserProfile | null) {
      this.profile = profile;
    },

    setNotionAuth (notionAuth: NotionAuth | null) {
      this.notionAuth = notionAuth;
    },

    async fetchProfile () {
      if (!this.user?.id) { return; }

      this.isLoading = true;
      this.error = null;

      try {
        const response = await $fetch('/api/user/profile', {
          method: 'GET'
        });

        if (response && typeof response === 'object') {
          if ('data' in response && response.data && typeof response.data === 'object' && 'profile' in response.data) {
            this.setProfile((response.data as any).profile);
          } else if ('profile' in response) {
            this.setProfile((response as any).profile);
          }
        }
      } catch (error: any) {
        this.error = error.data?.message || 'Failed to fetch user profile';
        console.error('Error fetching profile:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchNotionAuth () {
      if (!this.user?.id) { return; }

      this.isLoading = true;
      this.error = null;

      try {
        const response = await $fetch('/api/notion/auth', {
          method: 'GET'
        });

        if (response && typeof response === 'object') {
          if ('data' in response && response.data && typeof response.data === 'object' && 'notionAuth' in response.data) {
            this.setNotionAuth((response.data as any).notionAuth);
          } else if ('notionAuth' in response) {
            this.setNotionAuth((response as any).notionAuth);
          }
        }
      } catch (error: any) {
        // It's okay if Notion auth doesn't exist yet
        if (error.statusCode !== 404) {
          this.error = error.data?.message || 'Failed to fetch Notion auth';
          console.error('Error fetching Notion auth:', error);
        }
      } finally {
        this.isLoading = false;
      }
    },

    async initialize () {
      const { $supabase } = useNuxtApp();

      // Get current user
      const { data: { user }, error } = await $supabase.auth.getUser();

      if (error || !user) {
        this.reset();
        return;
      }

      this.setUser(user);

      // Fetch profile and Notion auth in parallel
      await Promise.all([
        this.fetchProfile(),
        this.fetchNotionAuth()
      ]);
    },

    reset () {
      this.user = null;
      this.profile = null;
      this.notionAuth = null;
      this.isLoading = false;
      this.error = null;
    }
  }
});
