import { normalizeLanUrl, type LanSession } from './lanClient.ts';

const KEY = 'online-lan-session-v1';
type SecureStorage = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

export function createLanSessionStore(storage: SecureStorage) {
  return {
    async load(): Promise<LanSession | null> {
      const raw = await storage.getItemAsync(KEY);
      if (!raw) return null;
      try {
        const value = JSON.parse(raw) as LanSession;
        if (!value.token || (value.role !== 'customer' && value.role !== 'merchant')) return null;
        return { baseUrl: normalizeLanUrl(value.baseUrl), token: value.token, role: value.role };
      } catch { return null; }
    },
    async save(session: LanSession): Promise<void> {
      const value = { baseUrl: normalizeLanUrl(session.baseUrl), token: session.token, role: session.role };
      if (!value.token || (value.role !== 'customer' && value.role !== 'merchant')) throw new Error('연결 정보를 확인해 주세요');
      await storage.setItemAsync(KEY, JSON.stringify(value));
    },
    clear(): Promise<void> { return storage.deleteItemAsync(KEY); },
  };
}
