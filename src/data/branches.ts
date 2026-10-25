import type { BranchId } from '../domain/queue';

export type Branch = {
  id: BranchId;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

// Coordinates mark the verified venue/station building, not a claimed
// entrance or a live queue check-in point.
export const BRANCHES: Record<BranchId, Branch> = {
  main: {
    id: 'main', name: '성심당 본점', address: '대전광역시 중구 대종로480번길 15',
    latitude: 36.3277303, longitude: 127.4272865,
  },
  station: {
    id: 'station', name: '성심당 대전역점', address: '대전광역시 동구 중앙로 215',
    latitude: 36.3313521, longitude: 127.4333650,
  },
  dcc: {
    id: 'dcc', name: '성심당 DCC점', address: '대전광역시 유성구 엑스포로 107',
    latitude: 36.3749910, longitude: 127.3917771,
  },
  lotte: {
    id: 'lotte', name: '성심당 롯데백화점 대전점', address: '대전광역시 서구 계룡로 598',
    latitude: 36.3406837, longitude: 127.3895557,
  },
};
