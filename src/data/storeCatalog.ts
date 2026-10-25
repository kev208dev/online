import type { BranchId } from '../domain/queue.ts';

export type StoreId = 'madeby' | 'redbutton' | 'dadareuda' | 'modif' | 'ajeossi'
  | 'cafejosun' | 'andorin' | 'cafe042' | 'occalguksu' | 'dosolo' | 'ruinh';
export type StoreCategory = '소품샵' | '카페' | '식당' | '기타';
export type StoreListing = {
  id: StoreId;
  branchId: BranchId;
  name: string;
  category: StoreCategory;
  address: string;
  walkMinutes: number;
  stayMinutes: number;
};

// Addresses are discovery leads, not a claim of partnership or real-time opening.
// Do not attach an unverified point coordinate to a store marker.
export const STORE_CATALOG: Record<StoreId, StoreListing> = {
  madeby: { id: 'madeby', branchId: 'main', name: '메이드바이 대전', category: '소품샵', address: '대전광역시 중구 중교로73번길 14', walkMinutes: 2, stayMinutes: 20 },
  redbutton: { id: 'redbutton', branchId: 'main', name: '레드버튼 대전은행점', category: '기타', address: '대전광역시 중구 은행동', walkMinutes: 3, stayMinutes: 45 },
  dadareuda: { id: 'dadareuda', branchId: 'main', name: '다다르다', category: '카페', address: '대전광역시 중구 중교로73번길 6', walkMinutes: 4, stayMinutes: 20 },
  modif: { id: 'modif', branchId: 'main', name: '모디프 커피', category: '카페', address: '대전광역시 중구 은행동', walkMinutes: 5, stayMinutes: 20 },
  ajeossi: { id: 'ajeossi', branchId: 'main', name: '아저씨 돈까스', category: '식당', address: '대전광역시 중구 중앙로164번길 22-7', walkMinutes: 5, stayMinutes: 45 },
  cafejosun: { id: 'cafejosun', branchId: 'station', name: '카페조선', category: '카페', address: '대전광역시 동구 대전로813번길 5', walkMinutes: 3, stayMinutes: 20 },
  andorin: { id: 'andorin', branchId: 'station', name: '안도르인', category: '카페', address: '대전광역시 동구 대전로815번길 7', walkMinutes: 4, stayMinutes: 20 },
  cafe042: { id: 'cafe042', branchId: 'dcc', name: '카페042', category: '카페', address: '대전광역시 유성구 엑스포로 107', walkMinutes: 2, stayMinutes: 20 },
  occalguksu: { id: 'occalguksu', branchId: 'dcc', name: '오씨칼국수 도룡점', category: '식당', address: '대전광역시 유성구 엑스포로151번길 19', walkMinutes: 9, stayMinutes: 40 },
  dosolo: { id: 'dosolo', branchId: 'lotte', name: '도솔로커피', category: '카페', address: '대전광역시 서구 도솔로388번길 36', walkMinutes: 5, stayMinutes: 20 },
  ruinh: { id: 'ruinh', branchId: 'lotte', name: '륀에이치', category: '카페', address: '대전광역시 서구 괴정동 427-9', walkMinutes: 5, stayMinutes: 20 },
};

export const STORE_IDS = Object.keys(STORE_CATALOG) as StoreId[];
export function storesForBranch(branchId: BranchId): StoreListing[] {
  return STORE_IDS.map((id) => STORE_CATALOG[id]).filter((store) => store.branchId === branchId);
}
