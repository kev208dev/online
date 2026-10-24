// 상세 보기 — Figma "iPhone 17 - 5"; the coupon popup is "iPhone 17 - 7".
// The frame is 메이드바이 대전's page; every store uses the same layout with
// its own details (see src/data/stores.ts).
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BackHeader } from '../../components/common';
import { CouponPopup } from '../../components/Popups';
import { CATEGORY_TAG_ICONS, getStore } from '../../data/stores';
import { icons, images } from '../../design/assets';
import { Box, Fade, Icon, Label, ORANGE, Photo, useViewport } from '../../design/canvas';
import { PanMap } from '../../design/map';
import { Pinned, ScrollCanvas } from '../../design/scroll';

const GREY_50 = 'rgba(0,0,0,0.5)';
const MAP_CROP = { w: 1.76, h: 1.355, left: -0.3646, top: -0.354 };

// Category tag on the photo, right-aligned at x 378 like 17-5's "소품샵".
const TAG_RIGHT = 378;
const TAG_Y = 321.3333;
const TAG_H = 22.6667;
const TAG_TEXT_SIZE = 15.111;
const TAG_PADDING_LEFT = 6.0449;
const TAG_PADDING_RIGHT = 3.82;

const BADGE_X = 38;
const BADGE_W = 68.2002;

export default function StoreDetailScreen() {
  const { dy } = useViewport();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const store = getStore(id);
  const [couponVisible, setCouponVisible] = useState(false);

  const tagIcon = CATEGORY_TAG_ICONS[store.category];
  const tagW = TAG_PADDING_LEFT + tagIcon.w + store.category.length * TAG_TEXT_SIZE + TAG_PADDING_RIGHT;
  const tagX = TAG_RIGHT - tagW;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollCanvas height={1257}>
        <Photo x={0} y={109} w={402} h={252} source={store.image} />
        {/* The frame's map is centred on 메이드바이; other stores centre on themselves. */}
        <PanMap
          x={24}
          y={589}
          w={355}
          h={518}
          radius={15}
          border={[1, '#b3b3b3']}
          source={images.map}
          crop={MAP_CROP}
          focus={store.id === 'madeby' ? undefined : store.mapPosition}
        />

        <Pinned>
          <Fade x={0} y={717 + dy} w={402} h={132} from="bottom" />
        </Pinned>

        <Box x={24} y={461} w={354} h={108} bg="#ffffff" radius={15} border={[1, '#b3b3b3']} />
        <Label x={24} y={377} size={20} weight="SemiBold" color="#000000">
          {store.name}
        </Label>
        <Icon svg={icons.pin} x={24} y={406} w={11} h={16} />
        <Box x={35} y={601} w={155} h={30} bg="rgba(255,255,255,0.9)" radius={5} />
        <Icon svg={icons.routePin} x={41} y={606} w={14} h={20.3636} />
        <Label x={61} y={608} size={14} weight="Medium" color="#000000">
          {`찾아가는 길 · 도보 ${store.walkMinutes}분`}
        </Label>
        <Label x={39} y={405} size={16} weight="Regular" color={GREY_50}>
          {store.address}
        </Label>

        <Icon svg={icons.couponBadge} x={BADGE_X} y={475} w={BADGE_W} h={31} />
        <Label cx={BADGE_X + BADGE_W / 2} y={475.07} size={24.8} weight="SemiBold" color={ORANGE}>
          {store.coupon.badge}
        </Label>
        <Label x={38} y={512} size={20} weight="SemiBold" color="#000000">
          {store.coupon.title}
        </Label>
        <Label x={38} y={537} size={16} weight="Regular" color="rgba(0,0,0,0.4)">
          {store.coupon.condition}
        </Label>

        <Box x={tagX} y={TAG_Y} w={tagW} h={TAG_H} bg="rgba(244,119,56,0.7)" radius={3.778} />
        <Label rx={374.18} y={323.6} size={TAG_TEXT_SIZE} weight="Medium" color="#ffffff">
          {store.category}
        </Label>
        <Icon
          svg={tagIcon.svg}
          x={tagX + TAG_PADDING_LEFT}
          y={TAG_Y + (TAG_H - tagIcon.h) / 2}
          w={tagIcon.w}
          h={tagIcon.h}
        />
        <Label x={41} y={426} size={16} weight="Regular" color={GREY_50}>
          {store.hours}
        </Label>
        <Icon svg={icons.clock} x={23.45} y={429.45} w={12.1} h={12.1} />
      </ScrollCanvas>

      <BackHeader title="상세 보기" shadow={[2, 'rgba(0,0,0,0.25)']} />

      <Box x={24} y={736 + dy} w={355} h={49} bg={ORANGE} radius={12} onPress={() => setCouponVisible(true)} />
      <Label x={108} y={749 + dy} size={20} weight="SemiBold" color="#ffffff">
        쿠폰 받고 지금 방문하기
      </Label>

      {couponVisible && <CouponPopup line={store.coupon.popup} onDismiss={() => setCouponVisible(false)} />}
    </View>
  );
}
