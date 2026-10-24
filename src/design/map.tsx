// The map image layer (17-1, 17-5), draggable like a real map.
//
// In Figma the map is an image fill cropped to the layer (see Photo's
// `crop`). At rest this shows exactly that crop; dragging moves the image
// within its own bounds, so its edges never come into view.
import { type ComponentType, useState } from 'react';
import { Animated, Image, type ImageSourcePropType, PanResponder, type PanResponderGestureState, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { useScale } from './canvas';

type Point = { x: number; y: number };

type MapPin = {
  svg: ComponentType<SvgProps>;
  w: number;
  h: number;
  /** Image pixel the pin's tip (bottom centre) points at. */
  at: Point;
};

type PanMapProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  source: ImageSourcePropType;
  /** The design crop: image size and offset as fractions of the layer. */
  crop: { w: number; h: number; left: number; top: number };
  radius?: number;
  border?: [width: number, color: string];
  /** Image pixel to centre on at rest, instead of the design crop. */
  focus?: Point;
  /** Pins that move with the map. */
  pins?: MapPin[];
};

const clamp = (v: number, min: number) => Math.min(0, Math.max(min, v));

export function PanMap({ x, y, w, h, source, crop, radius, border, focus, pins }: PanMapProps) {
  const s = useScale();
  const W = w * s;
  const H = h * s;
  const imageW = crop.w * W;
  const imageH = crop.h * H;
  const pixels = Image.resolveAssetSource(source);
  // Device points per image pixel.
  const kx = imageW / (pixels?.width ?? imageW);
  const ky = imageH / (pixels?.height ?? imageH);

  // The app is portrait-only, so the layer size (and with it the drag
  // bounds) is fixed for the life of the screen.
  const [{ pan, responder }] = useState(() => {
    const minX = W - imageW;
    const minY = H - imageH;
    let offset: Point = focus
      ? { x: clamp(W / 2 - focus.x * kx, minX), y: clamp(H / 2 - focus.y * ky, minY) }
      : { x: crop.left * W, y: crop.top * H };
    const value = new Animated.ValueXY(offset);
    const moved = (g: PanResponderGestureState) => ({
      x: clamp(offset.x + g.dx, minX),
      y: clamp(offset.y + g.dy, minY),
    });
    const end = (_: unknown, g: PanResponderGestureState) => {
      offset = moved(g);
    };
    return {
      pan: value,
      responder: PanResponder.create({
        // Claim every touch on the map so the screen's ScrollView doesn't
        // scroll while the map is being dragged.
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => value.setValue(moved(g)),
        onPanResponderRelease: end,
        onPanResponderTerminate: end,
      }),
    };
  });

  const r = radius === undefined ? undefined : radius * s;
  return (
    <View
      {...responder.panHandlers}
      style={{ position: 'absolute', left: x * s, top: y * s, width: W, height: H, borderRadius: r, overflow: 'hidden' }}
    >
      <Animated.View
        style={{ position: 'absolute', width: imageW, height: imageH, transform: pan.getTranslateTransform() }}
      >
        <Image source={source} resizeMode="stretch" style={{ width: imageW, height: imageH }} />
        {pins?.map(({ svg: Svg, w: pw, h: ph, at }, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{ position: 'absolute', left: at.x * kx - (pw * s) / 2, top: at.y * ky - ph * s }}
          >
            <Svg width={pw * s} height={ph * s} />
          </View>
        ))}
      </Animated.View>
      {border && (
        <View
          pointerEvents="none"
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
