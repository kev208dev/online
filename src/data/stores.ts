import { images } from '../design/assets';
import type { BranchId } from '../domain/queue';
import { STORE_CATALOG, STORE_IDS, storesForBranch as catalogForBranch, type StoreCategory, type StoreId, type StoreListing } from './storeCatalog';

export type { StoreId } from './storeCatalog';
export type Category = StoreCategory;
export type Store = StoreListing & { image: number; stay: string; perk: string };

const FIGMA_PHOTOS: Partial<Record<StoreId, number>> = {
  madeby: images.madeby,
  redbutton: images.redbutton,
  dadareuda: images.dadareuda,
  modif: images.modif,
  ajeossi: images.ajeossi,
};

// Only stores with corresponding Figma assets get their own photo. Others use
// a neutral map graphic so we do not imply an unrelated shop image is theirs.
export const STORES: Record<StoreId, Store> = Object.fromEntries(STORE_IDS.map((id) => {
  const listing = STORE_CATALOG[id];
  return [id, {
    ...listing,
    image: FIGMA_PHOTOS[id] ?? images.map,
    stay: `${listing.stayMinutes}분 내외`,
    perk: listing.exampleBenefit,
  }];
})) as Record<StoreId, Store>;

export function storesForBranch(branchId: BranchId): Store[] {
  return catalogForBranch(branchId).map((listing) => STORES[listing.id]);
}
