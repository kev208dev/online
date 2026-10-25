import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createAdminGate, type PinCredential } from '../domain/admin';

const PIN_KEY = 'online-admin-pin-v1';

const credentials = {
  async load(): Promise<PinCredential | null> {
    const raw = await SecureStore.getItemAsync(PIN_KEY);
    if (!raw) return null;
    try {
      const value = JSON.parse(raw) as PinCredential;
      return typeof value.salt === 'string' && typeof value.digest === 'string' ? value : null;
    } catch { return null; }
  },
  async save(value: PinCredential): Promise<void> {
    await SecureStore.setItemAsync(PIN_KEY, JSON.stringify(value), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
};

export const adminGate = createAdminGate(
  credentials,
  (value) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
  process.env.EXPO_PUBLIC_ADMIN_SETUP_VERIFIER,
  Crypto.randomUUID,
);
