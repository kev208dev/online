import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Chip, Field, Screen, StoreCard, UI } from '../../components/ui';
import { BRANCHES } from '../../data/branches';
import { storesForBranch, type Category } from '../../data/stores';
import { BRANCH_IDS } from '../../domain/queue';
import { useDemo } from '../../state/demo';

const categories: (Category | '전체')[] = ['전체', '카페', '식당', '소품샵', '기타'];
export default function NearbyScreen() {
  const { state, selectBranch } = useDemo();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | '전체'>('전체');
  const branchId = state.queue.selectedBranchId;
  const rows = storesForBranch(branchId).filter((store) => (category === '전체' || store.category === category) && store.name.includes(query.trim()));
  return <Screen title="주변 가게" back>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }} style={{ flexGrow: 0 }}>
      {BRANCH_IDS.map((id) => <Chip key={id} label={BRANCHES[id].name.replace('성심당 ', '')} selected={branchId === id} onPress={() => selectBranch(id)} />)}
    </ScrollView>
    <Field value={query} onChangeText={setQuery} placeholder="가게 이름 검색" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }} style={{ flexGrow: 0 }}>
      {categories.map((item) => <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}
    </ScrollView>
    <View style={{ gap: 12 }}>{rows.map((store) => <StoreCard key={store.id} id={store.id} />)}</View>
    {!rows.length && <Text style={{ color: UI.muted }}>검색 결과가 없어요.</Text>}
  </Screen>;
}
