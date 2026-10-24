// Building blocks for laying out Figma frames 1:1.
//
// Every screen in the Figma file is a 402×874 "iPhone 17" frame with
// absolutely positioned layers. These helpers take the layer's Figma
// coordinates (design units) and scale them to the device width, so the
// rendered screen is the Figma frame scaled uniformly.
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentType, ReactNode } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Platform,
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import type { SvgProps } from 'react-native-svg';

export const DESIGN_WIDTH = 402;
export const DESIGN_HEIGHT = 874;

export const ORANGE = '#f47738';

/** Device points per Figma pixel. */
export function useScale() {
  const { width } = useWindowDimensions();
  return width / DESIGN_WIDTH;
}

/**
 * Screen height in design units, and how far the bottom edge sits from the
 * Figma frame's bottom edge. Bottom-anchored layers (tab bar, fades, CTA)
 * are shifted by `dy` so they stay glued to the bottom on any screen.
 */
export function useViewport() {
  const { width, height } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;
  const h = height / s;
  return { s, h, dy: h - DESIGN_HEIGHT };
}

type Frame = { x: number; y: number; w?: number; h?: number };

function frameStyle(s: number, { x, y, w, h }: Frame): ViewStyle {
  return {
    position: 'absolute',
    left: x * s,
    top: y * s,
    width: w === undefined ? undefined : w * s,
    height: h === undefined ? undefined : h * s,
  };
}

type BoxProps = Frame & {
  bg?: string;
  radius?: number;
  border?: [width: number, color: string];
  /** CSS box-shadow in design units: [offsetY, blur, color]. */
  shadow?: [offsetY: number, blur: number, color: string];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  onPress?: () => void;
};

/** A rectangle layer. */
export function Box({ bg, radius, border, shadow, style, children, onPress, ...frame }: BoxProps) {
  const s = useScale();
  const boxStyle: ViewStyle = {
    ...frameStyle(s, frame),
    backgroundColor: bg,
    borderRadius: radius === undefined ? undefined : radius * s,
    borderWidth: border ? border[0] * s : undefined,
    borderColor: border?.[1],
    boxShadow: shadow ? `0px ${shadow[0] * s}px ${shadow[1] * s}px 0px ${shadow[2]}` : undefined,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[boxStyle, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[boxStyle, style]}>{children}</View>;
}

/** An invisible tap target. */
export function Hit({ onPress, ...frame }: Frame & { onPress: () => void }) {
  const s = useScale();
  return <Pressable onPress={onPress} style={frameStyle(s, frame)} />;
}

export type Weight = 'Regular' | 'Medium' | 'SemiBold' | 'Bold';

export function font(weight: Weight) {
  return `Pretendard-${weight}`;
}

// Figma draws underlines at the font's own underline position. iOS and
// Android do that by default; browsers need to be told.
const underlineStyle = {
  textDecorationLine: 'underline',
  ...(Platform.OS === 'web' ? { textUnderlinePosition: 'from-font' } : null),
} as TextStyle;

type LabelProps = {
  /** Left edge. Use `cx` for centred text and `rx` for right-aligned text. */
  x?: number;
  cx?: number;
  rx?: number;
  y: number;
  size: number;
  weight: Weight;
  color: string;
  underline?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
};

/**
 * A text layer with Figma's "auto" (normal) line height.
 *
 * Text layers often sit on top of buttons (e.g. "상세 보기"), so they must not
 * catch taps. Android ignores `pointerEvents` on Text itself, so the text is
 * wrapped in a View that has it.
 */
export function Label({ x, cx, rx, y, size, weight, color, underline, style, children }: LabelProps) {
  const s = useScale();
  const wide = DESIGN_WIDTH * s;
  let position: ViewStyle;
  let textAlign: TextStyle['textAlign'];
  if (cx !== undefined) {
    position = { left: cx * s - wide / 2, width: wide };
    textAlign = 'center';
  } else if (rx !== undefined) {
    position = { right: (DESIGN_WIDTH - rx) * s, width: wide };
    textAlign = 'right';
  } else {
    position = { left: (x ?? 0) * s };
  }
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: y * s }, position]}>
      <Text
        allowFontScaling={false}
        style={[
          {
            fontFamily: font(weight),
            fontSize: size * s,
            color,
            includeFontPadding: false,
            textAlign,
          },
          underline && underlineStyle,
          style,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

/** Inline span inside a Label. */
export function Span({
  color,
  size,
  weight,
  underline,
  children,
}: {
  color?: string;
  size?: number;
  weight?: Weight;
  underline?: boolean;
  children: ReactNode;
}) {
  const s = useScale();
  return (
    <Text
      allowFontScaling={false}
      style={{
        color,
        fontSize: size === undefined ? undefined : size * s,
        fontFamily: weight ? font(weight) : undefined,
        ...(underline ? underlineStyle : null),
      }}
    >
      {children}
    </Text>
  );
}

type PhotoProps = Frame & {
  w: number;
  h: number;
  source: ImageSourcePropType;
  radius?: number;
  border?: [width: number, color: string];
  /**
   * Figma image crop: the image's size and offset as fractions of the
   * layer (e.g. width 1.76 = 176%). Without it the image fills the layer
   * like `object-fit: cover`.
   */
  crop?: { w: number; h: number; left: number; top: number };
};

/** An image-filled layer, with its stroke drawn on top like Figma does. */
export function Photo({ source, radius, border, crop, ...frame }: PhotoProps) {
  const s = useScale();
  const r = radius === undefined ? undefined : radius * s;
  const W = frame.w * s;
  const H = frame.h * s;
  return (
    <View pointerEvents="none" style={[frameStyle(s, frame), { borderRadius: r, overflow: 'hidden' }]}>
      {crop ? (
        <Image
          source={source}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            left: crop.left * W,
            top: crop.top * H,
            width: crop.w * W,
            height: crop.h * H,
          }}
        />
      ) : (
        <Image source={source} resizeMode="cover" style={{ width: W, height: H }} />
      )}
      {border && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: W,
            height: H,
            borderRadius: r,
            borderWidth: border[0] * s,
            borderColor: border[1],
          }}
        />
      )}
    </View>
  );
}

type IconProps = Frame & {
  /** SVG exported from Figma; w/h are its root width/height. */
  svg: ComponentType<SvgProps>;
  w: number;
  h: number;
  style?: StyleProp<ViewStyle>;
};

/** A vector layer exported from Figma as SVG. */
export function Icon({ svg: Svg, style, ...frame }: IconProps) {
  const s = useScale();
  return (
    <View pointerEvents="none" style={[frameStyle(s, frame), style]}>
      <Svg width={frame.w * s} height={frame.h * s} />
    </View>
  );
}

/**
 * Figma's white fade rectangle: white at one end, transparent at 88.776%.
 * `from` is the white end.
 */
export function Fade({ from, style, ...frame }: Frame & { w: number; h: number; from: 'top' | 'bottom'; style?: StyleProp<ViewStyle> }) {
  const s = useScale();
  return (
    <View pointerEvents="none" style={[frameStyle(s, frame), style]}>
      <LinearGradient
        colors={['#ffffff', 'rgba(255,255,255,0)']}
        locations={[0, 0.88776]}
        start={{ x: 0, y: from === 'top' ? 0 : 1 }}
        end={{ x: 0, y: from === 'top' ? 1 : 0 }}
        style={{ flex: 1 }}
      />
    </View>
  );
}
