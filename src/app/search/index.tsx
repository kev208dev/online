import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DemoMap } from '../../components/DemoMap';
import { Button, Chip, QueueLeaveCheck, SectionTitle, StoreCard, UI } from '../../components/ui';
import { useTabBarMetrics } from '../../components/tabBarMetrics';
import { BRANCHES } from '../../data/branches';
import { storesForBranch } from '../../data/stores';
import { BRANCH_IDS } from '../../domain/queue';
import { joinAndOpenQueue } from '../../flows/join';
import { useDemo } from '../../state/demo';

export default function SearchScreen() {
  const { state, selectBranch, joinSelected } = useDemo();
  const [leaveAllowed, setLeaveAllowed] = useState(false);
  const [message, setMessage] = useState('');
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tab = useTabBarMetrics();
  const branchId = state.queue.selectedBranchId;
  const active = state.queue.wait?.status === 'waiting' ? state.queue.wait : null;
  const wait = state.queue.wait?.status === 'waiting' && state.queue.wait.branchId === branchId ? state.queue.wait : null;
  const rows = storesForBranch(branchId);
  const mapHeight = Math.max(290, Math.min(430, height * 0.44));
  return <View style={{ flex: 1, backgroundColor: '#fff' }}>
    <DemoMap selectedBranchId={branchId} onSelectBranch={selectBranch} height={mapHeight} />
    <View style={{ position: 'absolute', top: insets.top + 8, left: 20, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }}><Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold' }}>{BRANCHES[branchId].name}⌄</Text></View>
    <ScrollView style={{ flex: 1, marginTop: -21, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: tab.height + tab.bottom + 36, gap: 14 }}>
      <View style={{ width: 42, height: 4, borderRadius: 99, backgroundColor: '#ded9d4', alignSelf: 'center' }} />
      <Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold', fontSize: 19 }}>{wait ? '현재 웨이팅 중이에요' : '주변 가게를 둘러보세요'}</Text>
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold' }}>{BRANCHES[branchId].name} · {wait ? `앞에 ${wait.peopleAhead}명` : `${state.queue.queueCounts[branchId]}명 대기`}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }} style={{ flexGrow: 0 }}>
        {BRANCH_IDS.map((id) => <Chip key={id} label={BRANCHES[id].name.replace('성심당 ', '')} selected={branchId === id} onPress={() => { selectBranch(id); setMessage(''); }} />)}
      </ScrollView>
      {active ? <View style={{ gap: 8 }}>
        {active.branchId !== branchId && <Text style={{ color: UI.muted, fontSize: 12 }}>현재 {BRANCHES[active.branchId].name}에 줄서기 중이에요.</Text>}
        <Button label="내 줄서기 보기" secondary onPress={() => router.dismissTo('/schedule')} />
      </View> : <View style={{ gap: 8 }}>
        <QueueLeaveCheck checked={leaveAllowed} onPress={() => setLeaveAllowed(!leaveAllowed)} />
        <Button label={`${BRANCHES[branchId].name} 줄서기`} onPress={() => {
          const reason = joinAndOpenQueue(() => joinSelected(leaveAllowed), (path) => router.dismissTo(path));
          if (reason) setMessage(reason);
        }} />
      </View>}
      {!!message && <Text style={{ color: UI.orange, fontSize: 13 }}>{message}</Text>}
      <SectionTitle>기다리는 동안 이런 곳은 어때요?</SectionTitle>
      {rows.slice(0, 2).map((store) => <StoreCard key={store.id} id={store.id} />)}
      <Text onPress={() => router.push('/search/nearby')} style={{ color: UI.muted, textDecorationLine: 'underline', textAlign: 'center', paddingVertical: 12 }}>주변 가게 더 찾아보기</Text>
    </ScrollView>
  </View>;
}
