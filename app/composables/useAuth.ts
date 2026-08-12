export interface AuthUser {
  username: string;
}

interface SessionResponse {
  user: AuthUser | null;
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth.user', () => null);
  const loading = useState<boolean>('auth.loading', () => true);

  /** Refreshes the current session from the server (used on app boot). */
  async function fetchSession(): Promise<void> {
    loading.value = true;
    try {
      // useRequestFetch forwards the incoming request's cookies during SSR,
      // so the session check works identically on server and client.
      const rf = useRequestFetch();
      const data = await rf<SessionResponse>('/api/auth/session');
      user.value = data.user;
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function login(username: string, password: string): Promise<void> {
    const data = await $fetch<SessionResponse>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    user.value = data.user;
  }

  async function logout(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' });
    user.value = null;
  }

  return { user, loading, login, logout, fetchSession };
}