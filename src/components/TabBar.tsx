import { router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ORANGE } from '../design/canvas';
import { useTabBarMetrics } from './tabBarMetrics';

const tabs = [
  { label: '홈', icon: '⌂', path: '/' },
  { label: '검색', icon: '⌕', path: '/search' },
  { label: '일정', icon: '▦', path: '/schedule' },
  { label: '설정', icon: '⚙', path: '/settings' },
] as const;
export function TabBar() {
  const path = usePathname();
  const { height } = useTabBarMetrics();
  return <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height, backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee7e1' }}>
    {tabs.map((tab) => {
      const selected = tab.path === '/' ? path === '/' : path.startsWith(tab.path);
      return <Pressable key={tab.label} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => router.dismissTo(tab.path)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: selected ? ORANGE : '#6e6863', fontSize: 25 }}>{tab.icon}</Text><Text style={{ color: selected ? ORANGE : '#6e6863', fontFamily: 'Pretendard-Medium', fontSize: 11 }}>{tab.label}</Text></Pressable>;
    })}
  </View>;
}
