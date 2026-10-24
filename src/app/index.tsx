// 홈 — Figma "iPhone 17 - 4"
import { View } from 'react-native';

import { DetailButton, openStoreDetail } from '../components/common';
import { BigNumbers, positionParts, waitParts } from '../components/WaitTime';
import { icons, images } from '../design/assets';
import { Box, Fade, Icon, Label, ORANGE, Photo, Span, useViewport } from '../design/canvas';
import { Pinned, ScrollCanvas } from '../design/scroll';
import { useWaiting } from '../state/waiting';

const GREY_40 = 'rgba(0,0,0,0.4)';
const GREY_50 = 'rgba(0,0,0,0.5)';
const GREY_70 = 'rgba(0,0,0,0.7)';

export default function HomeScreen() {
  const { dy } = useViewport();
  const waiting = useWaiting();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollCanvas height={985}>
        <Photo x={0} y={0} w={402} h={361} source={images.sungsimdang} />

        <Label x={24} y={377} size={20} weight="SemiBold" color="#000000">
          성심당 본점
        </Label>
        <Icon svg={icons.pin} x={24} y={406} w={11} h={16} />
        <Label x={41} y={405} size={16} weight="Regular" color={GREY_50}>
          대전광역시 중구 대종로 480번길 15
        </Label>
        <Label x={41} y={426} size={16} weight="Regular" color={GREY_50}>
          매일 08:00 - 22:00
        </Label>

        <Box x={24} y={466} w={354} h={125} bg="#ffffff" radius={15} border={[1, 'rgba(0,0,0,0.3)']} />
        <Label x={41} y={480} size={20} weight="SemiBold" color={GREY_70}>
          나의 순서
        </Label>
        <BigNumbers x={41} y={511} parts={positionParts(waiting.position)} />
        <Label x={41} y={556} size={16} weight="Regular" color={GREY_40}>
          <Span color={GREY_70}>웨이팅 번호</Span> <Span color={ORANGE}>{waiting.waitingNumber}번</Span>
        </Label>
        <Label x={221} y={480} size={20} weight="SemiBold" color={GREY_70}>
          예상 대기 시간
        </Label>
        <BigNumbers x={221} y={511} parts={waitParts(waiting.hours, waiting.minutes)} />
        <Label x={221} y={556} size={16} weight="Regular" color={ORANGE}>
          {`${waiting.entryTime} `}
          <Span color={GREY_70}>입장 예정</Span>
        </Label>
        <Icon svg={icons.lineV} x={147} y={518} w={109} h={1} style={{ transform: [{ rotate: '90deg' }] }} />

        <Label x={118} y={672} size={20} weight="SemiBold" color="#000000">
          메이드바이 대전
        </Label>
        <Label x={118} y={764} size={20} weight="SemiBold" color="#000000">
          다다르다
        </Label>
        <Label x={118} y={700} size={16} weight="Regular" color={GREY_40}>
          소품샵 · 도보 2분
        </Label>
        <Label x={118} y={792} size={16} weight="Regular" color={GREY_40}>
          서점 · 도보 3분
        </Label>
        <Photo x={24} y={656} w={80} h={80} radius={7} border={[1, '#5e5e5e']} source={images.madeby} />
        <Photo x={24} y={748} w={80} h={80} radius={7} border={[1, '#5e5e5e']} source={images.dadareuda} />

        <Pinned>
          <Fade x={0} y={717 + dy} w={402} h={132} from="bottom" />
        </Pinned>

        <DetailButton y={682} onPress={openStoreDetail} />
        <DetailButton y={774} onPress={openStoreDetail} />

        <Label x={24} y={620} size={20} weight="Bold" color="#000000">
          기다리는 동안 이런 곳은 어때요?
        </Label>

        <Box x={293} y={321.2321} w={85} h={22.7679} bg="rgba(244,119,56,0.7)" radius={3.795} />
        <Label x={320.32} y={323.51} size={15.179} weight="Medium" color="#ffffff">
          베이커리
        </Label>
        <Icon svg={icons.bakeryWhite} x={299.0723} y={325.7859} w={15.9375} h={13.9449} />
        <Icon svg={icons.clock} x={23.45} y={429.45} w={12.1} h={12.1} />
      </ScrollCanvas>

      <Fade x={0} y={-1} w={402} h={77} from="top" />
    </View>
  );
}
