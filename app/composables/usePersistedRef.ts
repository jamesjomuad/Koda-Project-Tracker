import type { Ref } from 'vue';

interface UsePersistedRefOptions<T> {
  /** Validate a parsed localStorage value; return null to fall back to the initial value. */
  validate?: (value: unknown) => T | null;
}

/**
 * A ref that persists to localStorage. Writes automatically on change;
 * null/undefined values remove the stored key.
 */
export function usePersistedRef<T>(
  key: string,
  initial: T | (() => T),
  options: UsePersistedRefOptions<T> = {},
): Ref<T> {
  const resolved = typeof initial === 'function' ? (initial as () => T)() : initial;
  const state = ref<T>(resolved) as Ref<T>;

  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as unknown;
        const value = options.validate ? options.validate(parsed) : (parsed as T);
        if (value !== null && value !== undefined) state.value = value;
      }
    } catch { /* ignore corrupt or inaccessible storage */ }
  }

  watch(state, (value) => {
    if (!import.meta.client) return;
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  });

  return state;
}