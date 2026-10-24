// Bottom bar from the Figma frames ("하단 바"): 홈, 검색, 일정, 설정.
// 일정 and 설정 are not designed yet, so their buttons do nothing.
import { router, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';

import { icons } from '../design/assets';
import { DESIGN_WIDTH, Icon, useViewport } from '../design/canvas';

const BAR_HEIGHT = 75;

// Tap areas split halfway between the icons (icons sit at x 55, 146, 233, 318).
const TABS = [
  { x: 0, w: 116, onPress: goHome },
  { x: 116, w: 87, onPress: goSearch },
  { x: 203, w: 85, onPress: () => {} },
  { x: 288, w: DESIGN_WIDTH - 288, onPress: () => {} },
];

function goHome() {
  router.dismissTo('/');
}

function goSearch() {
  router.dismissTo('/search');
}

export function TabBar() {
  const { s } = useViewport();
  const pathname = usePathname();
  const onHome = pathname === '/';

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: BAR_HEIGHT * s,
        backgroundColor: '#ffffff',
        boxShadow: `0px ${-2 * s}px ${15 * s}px 0px rgba(0,0,0,0.1)`,
      }}
    >
      <Icon svg={onHome ? icons.tabBarHome : icons.tabBarSearch} x={55} y={20} w={292} h={30.0931} />
      {TABS.map((tab, i) => (
        <Pressable
          key={i}
          accessibilityRole="tab"
          onPress={tab.onPress}
          style={{ position: 'absolute', left: tab.x * s, top: 0, width: tab.w * s, height: BAR_HEIGHT * s }}
        />
      ))}
    </View>
  );
}
