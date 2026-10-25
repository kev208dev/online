import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { router, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ORANGE } from '../design/canvas';
import { useTabBarMetrics } from './tabBarMetrics';

const TABS = [
  { label: '홈', symbol: 'house.fill', path: '/' },
  { label: '검색', symbol: 'magnifyingglass', path: '/search' },
  { label: '일정', symbol: 'calendar', path: '/schedule' },
  { label: '설정', symbol: 'gearshape', path: '/settings' },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { bottom, height } = useTabBarMetrics();
  const supportsGlass = isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  const Surface = supportsGlass ? GlassView : View;
  if (!TABS.some((tab) => tab.path === pathname)) return null;

  return (
    <Surface
      {...(supportsGlass ? { glassEffectStyle: 'regular' as const, colorScheme: 'light' as const } : {})}
      style={[styles.bar, { bottom, height }, !supportsGlass && styles.fallback]}
    >
      {TABS.map((tab) => {
        const selected = pathname === tab.path;
        const color = selected ? ORANGE : '#333333';
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => router.dismissTo(tab.path)}
            style={({ pressed }) => [styles.tab, selected && styles.selected, pressed && styles.pressed]}
          >
            <SymbolView name={tab.symbol} tintColor={color} size={23} style={styles.symbol} />
            <Text maxFontSizeMultiplier={1.3} style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </Surface>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 16, right: 16, borderRadius: 32, flexDirection: 'row', padding: 5 },
  fallback: { backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dddddd' },
  tab: { flex: 1, borderRadius: 27, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 44 },
  selected: { backgroundColor: 'rgba(244,119,56,0.14)' },
  pressed: { backgroundColor: 'rgba(244,119,56,0.23)' },
  symbol: { width: 25, height: 25 },
  label: { fontFamily: 'Pretendard-SemiBold', fontSize: 10, lineHeight: 13 },
});
