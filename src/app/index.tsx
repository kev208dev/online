import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useTabBarMetrics } from '../components/tabBarMetrics';
import { Button, Chip, QueueLeaveCheck, SectionTitle, SharedConnectionNotice, StoreCard, UI } from '../components/ui';
import { BRANCHES } from '../data/branches';
import { BRANCH_IDS, estimateQueueWait } from '../domain/queue';
import { homeView } from '../domain/homeView';
import { joinAndOpenQueue } from '../flows/join';
import { images } from '../design/assets';
import { useDemo } from '../state/demo';

const branchPhotos = {
  main: images.sungsimdang,
  station: images.sungsimdangStation,
  dcc: images.sungsimdangDcc,
  lotte: images.sungsimdangLotte,
};

export default function HomeScreen() {
  const { state, connection, join, selectBranch, cancel } = useDemo();
  const [leaveAllowed, setLeaveAllowed] = useState(false);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState('');
  const { width } = useWindowDimensions();
  const tab = useTabBarMetrics();
  const overview = homeView(state.queue);
  const selectedId = overview.selectedBranchId;
  const wait = state.queue.wait;
  const active = overview.activeWait;
  const waitEstimate = estimateQueueWait(state.queue);
  const branch = BRANCHES[active?.branchId ?? selectedId];
  const shops = overview.stores;

  return <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: tab.height + tab.bottom + 36 }}>
    <View style={{ width, height: Math.min(360, width * 0.9), backgroundColor: '#f4ede5' }}>
      <Image source={branchPhotos[selectedId]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
    <View style={{ paddingHorizontal: 24, paddingTop: 17, gap: 15 }}>
      <SharedConnectionNotice connection={connection} />
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
          <Text style={{ color: UI.muted, fontSize: 12 }}>{active ? `${branch.name} · 내 앞 ${active.peopleAhead}명` : '줄서기 전'}</Text>
          {waitEstimate && <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold', fontSize: 12 }}>{waitEstimate.minutes === 0 ? '입장 차례예요' : `예상 대기 ${waitEstimate.label}`}</Text>}
        </View>
        <View style={{ flex: 1, paddingLeft: 18 }}>
          <Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold', fontSize: 17 }}>선택 지점 대기 인원</Text>
          <Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold', fontSize: 35 }}>{overview.queueCount}명</Text>
          <Text style={{ color: UI.muted, fontSize: 12 }}>앱 내 관리 기준</Text>
        </View>
      </View>
      {!active && <View style={{ gap: 9 }}>
        <QueueLeaveCheck checked={leaveAllowed} onPress={() => setLeaveAllowed(!leaveAllowed)} />
        <Button label={`${BRANCHES[selectedId].name} 줄서기`} disabled={!leaveAllowed || joining || (connection.mode !== 'local' && (connection.mode !== 'customer' || connection.status !== 'connected'))} onPress={async () => {
          setJoining(true);
          try {
            const reason = await joinAndOpenQueue(() => join(selectedId, leaveAllowed), (path) => router.dismissTo(path), leaveAllowed);
            if (reason) setMessage(reason);
          } finally { setJoining(false); }
        }} />
      </View>}
      {active && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5, paddingVertical: 5 }}>
        <Text onPress={() => active.peopleAhead === 0 ? router.push('/wallet') : router.dismissTo('/schedule')} style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{active.peopleAhead === 0 ? '입장 QR 보기 ›' : '내 줄서기 보기 ›'}</Text>
        <Text onPress={() => Alert.alert('줄서기 취소', '줄서기를 취소할까요?', [{ text: '아니요', style: 'cancel' }, { text: '취소하기', style: 'destructive', onPress: async () => { const reason = await cancel(); setMessage(reason ?? '줄서기를 취소했어요'); } }])} style={{ color: UI.muted, textDecorationLine: 'underline' }}>줄서기 취소</Text>
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
