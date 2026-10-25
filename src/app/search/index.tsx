import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DemoMap } from '../../components/DemoMap';
import { Chip, Field, SectionTitle, StoreCard, UI } from '../../components/ui';
import { useTabBarMetrics } from '../../components/tabBarMetrics';
import { BRANCHES } from '../../data/branches';
import { storesForBranch, type Category } from '../../data/stores';
import { BRANCH_IDS } from '../../domain/queue';
import { useDemo } from '../../state/demo';

const categories: (Category | '전체')[] = ['전체', '소품샵', '카페', '식당', '기타'];
export default function SearchScreen() {
  const { state, selectBranch } = useDemo();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | '전체'>('전체');
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tab = useTabBarMetrics();
  const branchId = state.queue.selectedBranchId;
  const rows = storesForBranch(branchId).filter((store) => (category === '전체' || store.category === category) && store.name.includes(query.trim()));
  const mapHeight = Math.max(280, Math.min(430, height * 0.45));
  return <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <DemoMap selectedBranchId={branchId} onSelectBranch={selectBranch} height={mapHeight} />
    <View style={{ position: 'absolute', top: insets.top + 8, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 18 }}>주변 가게 탐색</Text><Text style={{ color: UI.orange, fontSize: 11 }}>체험용</Text>
    </View>
    <ScrollView style={{ flex: 1, marginTop: -21, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: tab.height + tab.bottom + 36, gap: 16 }} keyboardShouldPersistTaps="handled">
      <View style={{ width: 42, height: 4, borderRadius: 99, backgroundColor: '#ded9d4', alignSelf: 'center' }} />
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 22 }}>{BRANCHES[branchId].name}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }} style={{ flexGrow: 0 }}>
        {BRANCH_IDS.map((id) => <Chip key={id} label={BRANCHES[id].name.replace('성심당 ', '')} selected={branchId === id} onPress={() => selectBranch(id)} />)}
      </ScrollView>
      <Field value={query} onChangeText={setQuery} placeholder="가게 이름 검색" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }} style={{ flexGrow: 0 }}>
        {categories.map((item) => <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}
      </ScrollView>
      <SectionTitle>주변 가게 {rows.length}</SectionTitle>
      {rows.map((store) => <StoreCard key={store.id} id={store.id} />)}
      {!rows.length && <Text style={{ color: UI.muted }}>검색 결과가 없어요.</Text>}
      <Text onPress={() => router.push('/schedule')} style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold', textAlign: 'center', paddingVertical: 10 }}>내 일정 보기</Text>
    </ScrollView>
  </View>;
}
