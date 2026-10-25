import * as SecureStore from 'expo-secure-store';
import { createLanSessionStore } from './lanSession';

export const lanSessionStore = createLanSessionStore({
  getItemAsync: (key) => SecureStore.getItemAsync(key),
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  deleteItemAsync: (key) => SecureStore.deleteItemAsync(key),
});
