// Popups drawn over the current screen:
//   EntryQrPopup — Figma "iPhone 17 - 6" (입장할 차례에요!)
//   CouponPopup  — Figma "iPhone 17 - 7" (쿠폰이 발급 되었어요!)
// Both cards are centred on the screen like in the frames; card contents use
// the frame's coordinates relative to the card's top-left corner.
import { type ReactNode, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { images } from '../design/assets';
import { Box, Label, ORANGE, Photo, Span, useViewport } from '../design/canvas';
import { useWaiting } from '../state/waiting';

const CARD_X = 42;
const CARD_W = 319;
const QR_CROP = { w: 1.8679, h: 1.2425, left: -0.3208, top: -0.1147 };

function Popup({
  visible,
  onDismiss,
  cardHeight,
  /** Vertical offset of the card centre from the screen centre. */
  centerOffset,
  children,
}: {
  visible: boolean;
  onDismiss?: () => void;
  cardHeight: number;
  centerOffset: number;
  children: ReactNode;
}) {
  const { s, h } = useViewport();
  const cardY = (h - cardHeight) / 2 + centerOffset;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onDismiss ?? (() => {})}
    >
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          {
            top: -1 * s,
            backgroundColor: 'rgba(49,49,49,0.6)',
            borderWidth: 1 * s,
            borderColor: '#3e3e3e',
            // The web modal focuses this backdrop; don't draw a focus ring on it.
            outlineStyle: 'solid',
            outlineWidth: 0,
          },
        ]}
        onPress={onDismiss}
      />
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: CARD_X * s, top: cardY * s, width: CARD_W * s, height: cardHeight * s }}
      >
        <Box x={0} y={0} w={CARD_W} h={cardHeight} bg="#ffffff" radius={20} />
        {children}
      </View>
    </Modal>
  );
}

function TwoLineTitle({ y, first, second }: { y: number; first: string; second: string }) {
  return (
    <Label x={69 - CARD_X} y={y} size={22} weight="Bold" color={ORANGE}>
      {`${first}\n`}
      <Span color="#000000">{second}</Span>
    </Label>
  );
}

/** Center x of the card buttons' labels, relative to the card. */
const BUTTON_CX = 200.5 - CARD_X;

export function EntryQrPopup() {
  const { status, postpone, cancel } = useWaiting();
  // Card top in the frame is y 234.
  const top = 234;
  return (
    <Popup visible={status === 'called'} cardHeight={407} centerOffset={0.5}>
      <TwoLineTitle y={255 - top} first="입장할 차례에요!" second="아래 큐알을 제시해 주세요." />
      <Box x={72 - CARD_X} y={582.7861 - top} w={257} h={32.2139} bg={ORANGE} radius={12} onPress={cancel} />
      <Box x={72 - CARD_X} y={541.2471 - top} w={257} h={32.2139} radius={12} border={[1.5, ORANGE]} onPress={postpone} />
      <Label cx={BUTTON_CX} y={589.26 - top} size={16} weight="SemiBold" color="#ffffff">
        웨이팅 취소하기
      </Label>
      <Label cx={BUTTON_CX} y={548.72 - top} size={16} weight="SemiBold" color={ORANGE}>
        웨이팅 미루기
      </Label>
      <Label x={89 - CARD_X} y={517 - top} size={12} weight="Regular" color="rgba(0,0,0,0.5)">
        5분 안으로 도착하지 않으면 웨이팅이 <Span underline>취소</Span>돼요.
      </Label>
      <Photo x={111 - CARD_X} y={320 - top} w={180} h={180} source={images.qr} crop={QR_CROP} />
    </Popup>
  );
}

const COUPON_SECONDS = 4 * 60 + 59;

/** Mount it when the coupon is issued; the expiry countdown starts then. */
export function CouponPopup({ onDismiss }: { onDismiss: () => void }) {
  const [left, setLeft] = useState(COUPON_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => setLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Card top in the frame is y 260.
  const top = 260;
  return (
    <Popup visible onDismiss={onDismiss} cardHeight={389} centerOffset={17.5}>
      <TwoLineTitle y={280.35 - top} first="쿠폰이 발급 되었어요!" second="매장에 방문해 사용해 주세요." />
      <Box
        x={72 - CARD_X}
        y={595.9873 - top}
        w={257}
        h={31.348}
        radius={12}
        border={[1.5, ORANGE]}
        onPress={() => setLeft(COUPON_SECONDS)}
      />
      <Label cx={BUTTON_CX} y={603.26 - top} size={16} weight="SemiBold" color={ORANGE}>
        새로고침
      </Label>
      <Label cx={202 - CARD_X} y={351 - top} size={16} weight="SemiBold" color="rgba(0,0,0,0.7)">
        10,000원 이상 구매 시 15% 할인
      </Label>
      <Label x={156 - CARD_X} y={571.42 - top} size={12} weight="Regular" color="rgba(0,0,0,0.5)">
        {'만료까지 '}
        <Span underline>{`${Math.floor(left / 60)}분 ${left % 60}초`}</Span>
      </Label>
      <Photo x={111 - CARD_X} y={379 - top} w={180} h={180} source={images.qr} crop={QR_CROP} />
    </Popup>
  );
}
