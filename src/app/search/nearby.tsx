// 주변 가게 — Figma "iPhone 17 - 8"
import type { ComponentType } from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { BackHeader, openStoreDetail } from '../../components/common';
import { type Store, STORES } from '../../data/stores';
import { icons } from '../../design/assets';
import { Box, Hit, Icon, Label, ORANGE, Photo } from '../../design/canvas';
import { ScrollCanvas } from '../../design/scroll';

/** Where each store's row sits in the 17-8 frame. */
type Row = {
  store: Store;
  /** Top of the 102×102 thumbnail. */
  y: number;
  /** Category label position (it varies slightly per row in the design). */
  categoryX: number;
  categoryY: number;
  icon: { svg: ComponentType<SvgProps>; x: number; y: number; w: number; h: number };
  perkWidth: number;
};

const cup = (y: number) => ({ svg: icons.cup, x: 136.5, y, w: 15, h: 13 });

const ROWS: Row[] = [
  {
    store: STORES.madeby,
    y: 168,
    categoryX: 154,
    categoryY: 173,
    icon: { svg: icons.bagOrange, x: 137, y: 174, w: 12.8444, h: 15.8667 },
    perkWidth: 95,
  },
  {
    store: STORES.redbutton,
    y: 285,
    categoryX: 155,
    categoryY: 291,
    icon: { svg: icons.shapes, x: 137, y: 292, w: 17, h: 17 },
    perkWidth: 120,
  },
  { store: STORES.dadareuda, y: 407, categoryX: 154, categoryY: 413, icon: cup(415.5), perkWidth: 95 },
  { store: STORES.modif, y: 529, categoryX: 154, categoryY: 535, icon: cup(537.5), perkWidth: 95 },
  {
    store: STORES.ajeossi,
    y: 651,
    categoryX: 154,
    categoryY: 657,
    icon: { svg: icons.food, x: 137, y: 659, w: 15, h: 15 },
    perkWidth: 107,
  },
  { store: STORES.ajeossi2, y: 773, categoryX: 154, categoryY: 779, icon: cup(782.5), perkWidth: 107 },
];

const FILTERS = [
  { label: '전체', x: 113, w: 47, textX: 123 },
  { label: '카페', x: 165, w: 47, textX: 175 },
  { label: '식당', x: 217, w: 47, textX: 227 },
  { label: '소품샵', x: 269, w: 60, textX: 278 },
  { label: '기타', x: 334, w: 45, textX: 343 },
];

function StoreRow({ row }: { row: Row }) {
  const { store, y, icon } = row;
  return (
    <>
      <Photo x={24} y={y} w={102} h={102} radius={7} border={[1, '#5e5e5e']} source={store.image} />
      <Label x={137} y={y + 27} size={20} weight="SemiBold" color="#000000">
        {store.name}
      </Label>
      <Label x={137} y={y + 51} size={16} weight="Regular" color="rgba(0,0,0,0.4)">
        {`도보 ${store.walkMinutes}분 · 예상 체류시간 ${store.stay}`}
      </Label>
      <Label x={row.categoryX} y={row.categoryY} size={16} weight="Medium" color="#000000">
        {store.category}
      </Label>
      <Box x={137} y={y + 76} w={row.perkWidth} h={21} bg="rgba(244,119,56,0.2)" radius={30} border={[1, ORANGE]} />
      <Label x={143} y={y + 78} size={14} weight="Medium" color={ORANGE}>
        {store.perk}
      </Label>
      <Icon svg={icon.svg} x={icon.x} y={icon.y} w={icon.w} h={icon.h} />
      <Hit x={24} y={y} w={354} h={102} onPress={() => openStoreDetail(store.id)} />
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

        {ROWS.map((row) => (
          <StoreRow key={row.store.id} row={row} />
        ))}
      </ScrollCanvas>

      <BackHeader title="주변 가게" shadow={[1, 'rgba(0,0,0,0.1)']} />
    </View>
  );
}
