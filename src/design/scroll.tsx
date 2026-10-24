import { createContext, type ReactNode, useContext, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useViewport } from './canvas';

const ScrollY = createContext<Animated.Value | null>(null);

/**
 * A vertically scrolling Figma frame. `height` is the scrollable content
 * height in design units; at rest the screen shows the frame exactly as
 * designed.
 */
export function ScrollCanvas({ height, children }: { height: number; children: ReactNode }) {
  const { s, h } = useViewport();
  const [scrollY] = useState(() => new Animated.Value(0));
  return (
    <ScrollY.Provider value={scrollY}>
      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
      >
        <View style={{ height: Math.max(height, h) * s }}>{children}</View>
      </Animated.ScrollView>
    </ScrollY.Provider>
  );
}

/**
 * Keeps its layers fixed to the viewport while they stay at their Figma
 * stacking position among the scrolling layers (e.g. a fade that sits
 * between the list and its buttons).
 */
export function Pinned({ children }: { children: ReactNode }) {
  const scrollY = useContext(ScrollY);
  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        transform: [{ translateY: scrollY ?? 0 }],
      }}
    >
      {children}
    </Animated.View>
  );
}
