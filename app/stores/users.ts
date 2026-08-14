import { defineStore } from 'pinia';
import type { User } from '#shared/types/user';
import { extractApiError } from '~/utils/api';

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([]);

  async function fetchUsers(): Promise<void> {
    try {
      users.value = await $fetch<User[]>('/api/users');
    } catch (e) {
      console.error('Failed to fetch users:', extractApiError(e).message);
    }
  }

  return {
    users,
    fetchUsers,
  };
});