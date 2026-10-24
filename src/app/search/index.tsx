// 검색 — Figma "iPhone 17 - 1"
import { router } from 'expo-router';
import { View } from 'react-native';

import { DetailButton, openStoreDetail } from '../../components/common';
import { icons, images } from '../../design/assets';
import { Box, Fade, Icon, Label, ORANGE, Photo, useViewport } from '../../design/canvas';
import { Pinned, ScrollCanvas } from '../../design/scroll';
import { useWaiting } from '../../state/waiting';

const GREY_40 = 'rgba(0,0,0,0.4)';
const MAP_CROP = { w: 1.76, h: 1.355, left: -0.3646, top: -0.354 };

export default function SearchScreen() {
  const { dy } = useViewport();
  const waiting = useWaiting();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollCanvas height={874}>
        <Photo x={0} y={-12} w={402} h={489} source={images.map} crop={MAP_CROP} />
        <Box x={0} y={360} w={402} h={489} bg="#ffffff" radius={30} shadow={[-2, 15, 'rgba(0,0,0,0.1)']} />
        <Label x={132} y={760} size={16} weight="Regular" color="rgba(0,0,0,0.7)" underline>
          주변 가게 더 찾아보기
        </Label>

        <Box x={24} y={61} w={92} h={34} bg="#ffffff" radius={12} />
        <Label x={50} y={69} size={16} weight="Medium" color="#000000">
          은행동
        </Label>
        <Icon svg={icons.pinSmall} x={34} y={70} w={10} h={14.6667} />
        <Icon svg={icons.mapPinBig} x={142} y={116} w={43} h={63.0667} />
        <Icon svg={icons.chevronDown} x={96.9} y={76.9} w={10.2} h={5.2} />

        <Label x={24} y={536} size={20} weight="Bold" color="#000000">
          기다리는 동안 이런 곳은 어때요?
        </Label>
        <Icon svg={icons.lineH} x={24} y={515.3} w={354} h={0.7} />

        <Label x={24} y={380} size={20} weight="Bold" color={ORANGE}>
          현재 웨이팅 중이에요
        </Label>
        <Label x={118} y={432} size={20} weight="SemiBold" color="#000000">
          성심당 본점
        </Label>
        <Label x={118} y={460} size={16} weight="Regular" color={GREY_40}>
          {`현재 ${waiting.position}번째 · ${waiting.totalMinutes}분 남음`}
        </Label>
        <Photo x={24} y={416} w={80} h={80} radius={7} border={[1.5, ORANGE]} source={images.sungsimdang} />
        <Box x={303} y={442} w={75} h={27} bg={ORANGE} radius={12} onPress={() => router.dismissTo('/')} />
        <Label cx={341} y={446} size={16} weight="SemiBold" color="#ffffff">
          대기 확인
        </Label>

        <Pinned>
          <Fade x={0} y={717 + dy} w={402} h={132} from="bottom" />
        </Pinned>

        <Label x={118} y={588} size={20} weight="SemiBold" color="#000000">
          메이드바이 대전
        </Label>
        <Label x={118} y={680} size={20} weight="SemiBold" color="#000000">
          다다르다
        </Label>
        <Label x={118} y={616} size={16} weight="Regular" color={GREY_40}>
          소품샵 · 도보 2분
        </Label>
        <Label x={118} y={708} size={16} weight="Regular" color={GREY_40}>
          카페 · 도보 4분
        </Label>
        <Photo x={24} y={572} w={80} h={80} radius={7} border={[1, '#5e5e5e']} source={images.madeby} />
        <Photo x={24} y={664} w={80} h={80} radius={7} border={[1, '#5e5e5e']} source={images.dadareuda} />
        <DetailButton y={598} onPress={openStoreDetail} />
        <DetailButton y={690} onPress={openStoreDetail} />

        {/* Tap area for "주변 가게 더 찾아보기". */}
        <Box x={124} y={752} w={153} h={35} onPress={() => router.push('/search/nearby')} />
      </ScrollCanvas>

      <Fade x={0} y={0} w={402} h={74} from="top" />
    </View>
  );
}
