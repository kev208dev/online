import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useViewport } from '../design/canvas';

export function useTabBarMetrics() {
  const insets = useSafeAreaInsets();
  const { s } = useViewport();
  const height = Platform.OS === 'ios' ? 62 : 75 * s;
  const bottom = Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 0;
  return { height, bottom, extraInset: Math.max(0, height + bottom - 75 * s) };
}
