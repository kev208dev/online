import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useTabBarMetrics } from '../components/tabBarMetrics';
import { Button, Chip, SectionTitle, StoreCard, UI } from '../components/ui';
import { BRANCHES } from '../data/branches';
import { storesForBranch } from '../data/stores';
import { BRANCH_IDS } from '../domain/queue';
import { images } from '../design/assets';
import { useDemo } from '../state/demo';

const branchPhotos = {
  main: images.sungsimdang,
  station: images.sungsimdangStation,
  dcc: images.sungsimdangDcc,
  lotte: images.sungsimdangLotte,
};

export default function HomeScreen() {
  const { state, join, selectBranch, cancel } = useDemo();
  const [leaveAllowed, setLeaveAllowed] = useState(false);
  const [message, setMessage] = useState('');
  const { width } = useWindowDimensions();
  const tab = useTabBarMetrics();
  const selectedId = state.queue.selectedBranchId;
  const wait = state.queue.wait;
  const active = wait?.status === 'waiting' ? wait : null;
  const branch = BRANCHES[active?.branchId ?? selectedId];
  const nearbyBranchId = active?.branchId ?? selectedId;
  const shops = storesForBranch(nearbyBranchId);

  return <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: tab.height + tab.bottom + 36 }}>
    <View style={{ width, height: Math.min(360, width * 0.9), backgroundColor: '#f4ede5' }}>
      <Image source={branchPhotos[selectedId]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      <Text style={{ position: 'absolute', right: 18, bottom: 16, color: '#fff', backgroundColor: UI.orange, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, fontSize: 12 }}>체험용</Text>
    </View>
    <View style={{ paddingHorizontal: 24, paddingTop: 17, gap: 15 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 19 }}>{BRANCHES[selectedId].name}</Text>
        <Text style={{ color: UI.muted, fontSize: 13 }}>📍 {BRANCHES[selectedId].address}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }} style={{ flexGrow: 0 }}>
        {BRANCH_IDS.map((id) => <Chip key={id} label={BRANCHES[id].name.replace('성심당 ', '')} selected={selectedId === id} onPress={() => { selectBranch(id); setMessage(''); }} />)}
      </ScrollView>
      <View style={{ borderColor: '#b8b2ac', borderWidth: 1, borderRadius: 16, paddingVertical: 17, paddingHorizontal: 16, flexDirection: 'row' }}>
        <View style={{ flex: 1, paddingRight: 12, borderRightColor: '#ddd8d2', borderRightWidth: 1 }}>
          <Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold', fontSize: 17 }}>나의 순서</Text>
          <Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold', fontSize: 35 }}>{active ? `${active.ticketNumber}번` : '—'}</Text>
          <Text style={{ color: UI.muted, fontSize: 12 }}>{active ? `${branch.name} · 앞에 ${active.peopleAhead}명` : '줄서기 전'}</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: 18 }}>
          <Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold', fontSize: 17 }}>현재 대기 인원</Text>
          <Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold', fontSize: 35 }}>{state.queue.queueCounts[active?.branchId ?? selectedId]}명</Text>
          <Text style={{ color: UI.muted, fontSize: 12 }}>앱 내 관리 기준</Text>
        </View>
      </View>
      {!active && <View style={{ gap: 9 }}>
        <Pressable onPress={() => setLeaveAllowed(!leaveAllowed)} accessibilityRole="checkbox" accessibilityState={{ checked: leaveAllowed }} style={{ paddingVertical: 4 }}><Text style={{ color: UI.ink, fontSize: 13 }}>{leaveAllowed ? '☑' : '☐'} 현장에서 대기줄 이탈 가능 여부를 확인했어요</Text></Pressable>
        <Button label={`${BRANCHES[selectedId].name} 줄서기`} onPress={() => setMessage(join(selectedId, leaveAllowed) ?? '줄서기를 시작했어요')} />
      </View>}
      {active && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5, paddingVertical: 5 }}>
        <Text onPress={() => router.push(active.peopleAhead === 0 ? '/wallet' : '/schedule')} style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{active.peopleAhead === 0 ? '입장 QR 보기 ›' : '내 일정 보기 ›'}</Text>
        <Text onPress={() => Alert.alert('줄서기 취소', '이 기기의 줄서기를 취소할까요?', [{ text: '아니요', style: 'cancel' }, { text: '취소하기', style: 'destructive', onPress: () => { cancel(); setMessage('줄서기를 취소했어요'); } }])} style={{ color: UI.muted, textDecorationLine: 'underline' }}>줄서기 취소</Text>
      </View>}
      {wait?.status === 'completed' && <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>입장 인증 완료</Text>}
      {!!message && <Text style={{ color: UI.orange, fontSize: 13 }}>{message}</Text>}
      <View style={{ paddingTop: 12, gap: 13 }}>
        <SectionTitle>기다리는 동안 이런 곳은 어때요?</SectionTitle>
        {shops.slice(0, 4).map((store) => <StoreCard key={store.id} id={store.id} />)}
        <Text onPress={() => router.push('/search')} style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold', textAlign: 'center', padding: 10 }}>주변 가게 더 보기 ›</Text>
      </View>
    </View>
  </ScrollView>;
}
