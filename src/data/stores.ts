// The stores recommended while waiting at 성심당 본점.
//
// Names, categories, walking/stay times and perks are the ones in the Figma
// store lists. Only 메이드바이 대전 has a designed detail screen (17-5), so
// its address, hours and coupon copy come from there; the other stores'
// details are filled in from public listings where they could be found.
// Replace the placeholders below once the real details are known.
import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

import { icons, images } from '../design/assets';

export type StoreId = 'madeby' | 'redbutton' | 'dadareuda' | 'modif' | 'ajeossi' | 'ajeossi2';

export type Category = '소품샵' | '카페' | '식당' | '기타';

export type Store = {
  id: StoreId;
  name: string;
  image: number;
  category: Category;
  walkMinutes: number;
  /** Expected stay, e.g. "10~20분". */
  stay: string;
  /** Short perk shown as a chip in the store list. */
  perk: string;
  address: string;
  hours: string;
  demoMenu: string;
  coupon: {
    /** Text inside the ticket-shaped badge, e.g. "15%". */
    badge: string;
    title: string;
    condition: string;
    /** Line in the coupon popup (17-7). */
    popup: string;
  };
  /** Where the store is on assets/images/map.png, in image pixels. */
  mapPosition?: { x: number; y: number };
};

const ADDRESS_TBD = '대전광역시 중구 은행동';
const HOURS_TBD = '영업시간 정보 준비 중';
const WAITING = '웨이팅 중 방문 시';

/** Coupon copy for perks that have no designed detail screen. */
function waitingCoupon(badge: string, perk: string, popupPerk = perk) {
  return { badge, title: `지금 방문하면 ${perk}`, condition: WAITING, popup: `${WAITING} ${popupPerk}` };
}

export const STORES: Record<StoreId, Store> = {
  madeby: {
    id: 'madeby',
    name: '메이드바이 대전',
    image: images.madeby,
    category: '소품샵',
    walkMinutes: 2,
    stay: '10~20분',
    perk: '15% 할인 쿠폰',
    address: '대전광역시 중구 중교로 73번길 14',
    hours: '매일 11:00 - 22:00',
    demoMenu: '디자인 문구 · 생활 소품',
    coupon: {
      badge: '15%',
      title: '지금 방문하면 15% 쿠폰 발급',
      condition: '10,000원 이상 구매 시',
      popup: '10,000원 이상 구매 시 15% 할인',
    },
    mapPosition: { x: 690, y: 893 },
  },
  redbutton: {
    id: 'redbutton',
    name: '레드버튼 대전은행점',
    image: images.redbutton,
    category: '기타',
    walkMinutes: 3,
    stay: '30~45분',
    perk: '추가시간 10분 제공',
    address: ADDRESS_TBD,
    hours: HOURS_TBD,
    demoMenu: '보드게임 이용',
    coupon: waitingCoupon('10분', '추가시간 10분 제공', '추가시간 10분'),
  },
  dadareuda: {
    id: 'dadareuda',
    name: '다다르다',
    image: images.dadareuda,
    category: '카페',
    walkMinutes: 4,
    stay: '15~20분',
    perk: '음료 한 잔 무료',
    address: '대전광역시 중구 중교로 73번길 6',
    hours: '매일 12:00 - 20:00',
    demoMenu: '커피 · 차',
    coupon: waitingCoupon('무료', '음료 한 잔 무료'),
    mapPosition: { x: 805, y: 1100 },
  },
  modif: {
    id: 'modif',
    name: '모디프 커피',
    image: images.modif,
    category: '카페',
    walkMinutes: 5,
    stay: '10~20분',
    perk: '10% 할인 쿠폰',
    address: ADDRESS_TBD,
    hours: HOURS_TBD,
    demoMenu: '커피 · 음료',
    coupon: waitingCoupon('10%', '10% 쿠폰 발급', '10% 할인'),
  },
  ajeossi: {
    id: 'ajeossi',
    name: '아저씨 돈까스',
    image: images.ajeossi,
    category: '식당',
    walkMinutes: 5,
    stay: '30~45분',
    perk: '캔 음료 하나 무료',
    address: '대전광역시 중구 중앙로 164번길 22-7',
    hours: HOURS_TBD,
    demoMenu: '돈까스 메뉴',
    coupon: waitingCoupon('무료', '캔 음료 하나 무료'),
    mapPosition: { x: 963, y: 285 },
  },
  // The Figma list repeats 아저씨 돈까스 with another photo and "카페".
  ajeossi2: {
    id: 'ajeossi2',
    name: '아저씨 돈까스',
    image: images.ajeossi2,
    category: '카페',
    walkMinutes: 5,
    stay: '30~45분',
    perk: '캔 음료 하나 무료',
    address: '대전광역시 중구 중앙로 164번길 22-7',
    hours: HOURS_TBD,
    demoMenu: '돈까스 메뉴',
    coupon: waitingCoupon('무료', '캔 음료 하나 무료'),
    mapPosition: { x: 963, y: 285 },
  },
};

export function getStore(id: string | string[] | undefined): Store {
  const key = Array.isArray(id) ? id[0] : id;
  return key && key in STORES ? STORES[key as StoreId] : STORES.madeby;
}

/** White category icons for the orange tag on a store photo (17-4, 17-5). */
export const CATEGORY_TAG_ICONS: Record<Category, { svg: ComponentType<SvgProps>; w: number; h: number }> = {
  소품샵: { svg: icons.bagWhite, w: 12.8444, h: 15.8667 },
  카페: { svg: icons.cupWhite, w: 15, h: 13 },
  식당: { svg: icons.foodWhite, w: 15, h: 15 },
  기타: { svg: icons.shapesWhite, w: 17, h: 17 },
};
