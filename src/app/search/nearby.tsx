// 주변 가게 — Figma "iPhone 17 - 8"
import type { ComponentType } from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { BackHeader, openStoreDetail } from '../../components/common';
import { icons, images } from '../../design/assets';
import { Box, Hit, Icon, Label, ORANGE, Photo } from '../../design/canvas';
import { ScrollCanvas } from '../../design/scroll';

type Store = {
  /** Top of the 102×102 thumbnail. */
  y: number;
  image: number;
  category: string;
  /** Category label position (it varies slightly per row in the design). */
  categoryX: number;
  categoryY: number;
  icon: { svg: ComponentType<SvgProps>; x: number; y: number; w: number; h: number };
  name: string;
  info: string;
  perk: string;
  perkWidth: number;
};

const cup = (y: number) => ({ svg: icons.cup, x: 136.5, y, w: 15, h: 13 });

const STORES: Store[] = [
  {
    y: 168,
    image: images.madeby,
    category: '소품샵',
    categoryX: 154,
    categoryY: 173,
    icon: { svg: icons.bagOrange, x: 137, y: 174, w: 12.8444, h: 15.8667 },
    name: '메이드바이 대전',
    info: '도보 2분 · 예상 체류시간 10~20분',
    perk: '15% 할인 쿠폰',
    perkWidth: 95,
  },
  {
    y: 285,
    image: images.redbutton,
    category: '기타',
    categoryX: 155,
    categoryY: 291,
    icon: { svg: icons.shapes, x: 137, y: 292, w: 17, h: 17 },
    name: '레드버튼 대전은행점',
    info: '도보 3분 · 예상 체류시간 30~45분',
    perk: '추가시간 10분 제공',
    perkWidth: 120,
  },
  {
    y: 407,
    image: images.dadareuda,
    category: '카페',
    categoryX: 154,
    categoryY: 413,
    icon: cup(415.5),
    name: '다다르다',
    info: '도보 4분 · 예상 체류시간 15~20분',
    perk: '음료 한 잔 무료',
    perkWidth: 95,
  },
  {
    y: 529,
    image: images.modif,
    category: '카페',
    categoryX: 154,
    categoryY: 535,
    icon: cup(537.5),
    name: '모디프 커피',
    info: '도보 5분 · 예상 체류시간 10~20분',
    perk: '10% 할인 쿠폰',
    perkWidth: 95,
  },
  {
    y: 651,
    image: images.ajeossi,
    category: '식당',
    categoryX: 154,
    categoryY: 657,
    icon: { svg: icons.food, x: 137, y: 659, w: 15, h: 15 },
    name: '아저씨 돈까스',
    info: '도보 5분 · 예상 체류시간 30~45분',
    perk: '캔 음료 하나 무료',
    perkWidth: 107,
  },
  {
    y: 773,
    image: images.ajeossi2,
    category: '카페',
    categoryX: 154,
    categoryY: 779,
    icon: cup(782.5),
    name: '아저씨 돈까스',
    info: '도보 5분 · 예상 체류시간 30~45분',
    perk: '캔 음료 하나 무료',
    perkWidth: 107,
  },
];

const FILTERS = [
  { label: '전체', x: 113, w: 47, textX: 123 },
  { label: '카페', x: 165, w: 47, textX: 175 },
  { label: '식당', x: 217, w: 47, textX: 227 },
  { label: '소품샵', x: 269, w: 60, textX: 278 },
  { label: '기타', x: 334, w: 45, textX: 343 },
];

function StoreRow({ store }: { store: Store }) {
  const { y, icon } = store;
  return (
    <>
      <Photo x={24} y={y} w={102} h={102} radius={7} border={[1, '#5e5e5e']} source={store.image} />
      <Label x={137} y={y + 27} size={20} weight="SemiBold" color="#000000">
        {store.name}
      </Label>
      <Label x={137} y={y + 51} size={16} weight="Regular" color="rgba(0,0,0,0.4)">
        {store.info}
      </Label>
      <Label x={store.categoryX} y={store.categoryY} size={16} weight="Medium" color="#000000">
        {store.category}
      </Label>
      <Box x={137} y={y + 76} w={store.perkWidth} h={21} bg="rgba(244,119,56,0.2)" radius={30} border={[1, ORANGE]} />
      <Label x={143} y={y + 78} size={14} weight="Medium" color={ORANGE}>
        {store.perk}
      </Label>
      <Icon svg={icon.svg} x={icon.x} y={icon.y} w={icon.w} h={icon.h} />
      <Hit x={24} y={y} w={354} h={102} onPress={openStoreDetail} />
    </>
  );
}

export default function NearbyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollCanvas height={974}>
        <Box x={24} y={122} w={77} h={25} bg="#ffffff" radius={30} border={[1.2, 'rgba(0,0,0,0.7)']} />
        <Icon svg={icons.sort} x={32.4} y={128.4} w={13.2} h={11.7} />
        <Label x={51} y={125} size={16} weight="Medium" color="#4d4d4d">
          거리순
        </Label>
        {FILTERS.map((f, i) => (
          <Box
            key={f.label}
            x={f.x}
            y={122}
            w={f.w}
            h={25}
            radius={30}
            bg={i === 0 ? ORANGE : undefined}
            border={[1, ORANGE]}
          />
        ))}
        {FILTERS.map((f, i) => (
          <Label key={f.label} x={f.textX} y={125} size={16} weight="Medium" color={i === 0 ? '#ffffff' : ORANGE}>
            {f.label}
          </Label>
        ))}

        {STORES.map((store) => (
          <StoreRow key={store.y} store={store} />
        ))}
      </ScrollCanvas>

      <BackHeader title="주변 가게" shadow={[1, 'rgba(0,0,0,0.1)']} />
    </View>
  );
}
