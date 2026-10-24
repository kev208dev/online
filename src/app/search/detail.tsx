// 상세 보기 — Figma "iPhone 17 - 5"; the coupon popup is "iPhone 17 - 7".
import { useState } from 'react';
import { View } from 'react-native';

import { BackHeader } from '../../components/common';
import { CouponPopup } from '../../components/Popups';
import { icons, images } from '../../design/assets';
import { Box, Fade, Icon, Label, ORANGE, Photo, useViewport } from '../../design/canvas';
import { Pinned, ScrollCanvas } from '../../design/scroll';

const GREY_50 = 'rgba(0,0,0,0.5)';
const MAP_CROP = { w: 1.76, h: 1.355, left: -0.3646, top: -0.354 };

export default function StoreDetailScreen() {
  const { dy } = useViewport();
  const [couponVisible, setCouponVisible] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollCanvas height={1257}>
        <Photo x={0} y={109} w={402} h={252} source={images.madeby} />
        <Photo x={24} y={589} w={355} h={518} radius={15} border={[1, '#b3b3b3']} source={images.map} crop={MAP_CROP} />

        <Pinned>
          <Fade x={0} y={717 + dy} w={402} h={132} from="bottom" />
        </Pinned>

        <Box x={24} y={461} w={354} h={108} bg="#ffffff" radius={15} border={[1, '#b3b3b3']} />
        <Label x={24} y={377} size={20} weight="SemiBold" color="#000000">
          메이드바이 대전
        </Label>
        <Icon svg={icons.pin} x={24} y={406} w={11} h={16} />
        <Box x={35} y={601} w={155} h={30} bg="rgba(255,255,255,0.9)" radius={5} />
        <Icon svg={icons.routePin} x={41} y={606} w={14} h={20.3636} />
        <Label x={61} y={608} size={14} weight="Medium" color="#000000">
          찾아가는 길 · 도보 2분
        </Label>
        <Label x={39} y={405} size={16} weight="Regular" color={GREY_50}>
          대전광역시 중구 중교로 73번길 14
        </Label>

        <Icon svg={icons.couponBadge} x={38} y={475} w={68.2002} h={31} />
        <Label x={46.27} y={475.07} size={24.8} weight="SemiBold" color={ORANGE}>
          15%
        </Label>
        <Label x={38} y={512} size={20} weight="SemiBold" color="#000000">
          지금 방문하면 15% 쿠폰 발급
        </Label>
        <Label x={38} y={537} size={16} weight="Regular" color="rgba(0,0,0,0.4)">
          10,000원 이상 구매 시
        </Label>

        <Box x={310} y={321.3333} w={68} h={22.6667} bg="rgba(244,119,56,0.7)" radius={3.778} />
        <Label rx={374.18} y={323.6} size={15.111} weight="Medium" color="#ffffff">
          소품샵
        </Label>
        <Icon svg={icons.bagWhite} x={316.0449} y={324.3555} w={12.8444} h={15.8667} />
        <Label x={41} y={426} size={16} weight="Regular" color={GREY_50}>
          매일 11:00 - 22:00
        </Label>
        <Icon svg={icons.clock} x={23.45} y={429.45} w={12.1} h={12.1} />
      </ScrollCanvas>

      <BackHeader title="상세 보기" shadow={[2, 'rgba(0,0,0,0.25)']} />

      <Box x={24} y={736 + dy} w={355} h={49} bg={ORANGE} radius={12} onPress={() => setCouponVisible(true)} />
      <Label x={108} y={749 + dy} size={20} weight="SemiBold" color="#ffffff">
        쿠폰 받고 지금 방문하기
      </Label>

      {couponVisible && <CouponPopup onDismiss={() => setCouponVisible(false)} />}
    </View>
  );
}
