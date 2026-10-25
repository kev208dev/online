import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { DemoMap } from '../../components/DemoMap';
import { Button, Card, Chip, Field, Notice, Screen, SectionTitle, StoreCard, UI } from '../../components/ui';
import { STORES, type Category } from '../../data/stores';
import { STORE_KEYS } from '../../domain/demo';
import { useDemo } from '../../state/demo';

const categories: (Category | '전체')[] = ['전체', '소품샵', '카페', '식당', '기타'];
export default function SearchScreen() {
  const { state } = useDemo();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | '전체'>('전체');
  const [sort, setSort] = useState<'walk' | 'name'>('walk');
  const rows = STORE_KEYS.filter((id) => (category === '전체' || STORES[id].category === category) && STORES[id].name.includes(query.trim())).sort((a,b) => sort === 'walk' ? STORES[a].walkMinutes - STORES[b].walkMinutes : STORES[a].name.localeCompare(STORES[b].name, 'ko'));
  return <Screen title="은행동 탐색" subtitle="성심당 본점 주변 로컬 상점을 살펴보세요.">
    <Card><Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold' }}>성심당 본점 주변 · 시연 지도</Text><DemoMap /></Card>
    <Field value={query} onChangeText={setQuery} placeholder="가게 이름 검색" />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{categories.map((item) => <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><SectionTitle>주변 가게 {rows.length}</SectionTitle><Chip label={sort === 'walk' ? '거리순' : '이름순'} selected={false} onPress={() => setSort(sort === 'walk' ? 'name' : 'walk')} /></View>
    {state.wait && !state.wait.leaveAllowed && <Notice text="줄을 떠나면 순번을 잃는 경우에는 주변 가게 방문을 권하지 않아요." />}
    {rows.length ? rows.map((id) => <StoreCard key={id} id={id} />) : <Notice text="검색 조건에 맞는 가게가 없어요." />}
    <Button label="내 방문 일정" secondary onPress={() => router.push('/schedule')} />
  </Screen>;
}
