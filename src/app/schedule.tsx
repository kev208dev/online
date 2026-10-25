import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { Button, Card, Screen, SectionTitle, UI } from '../components/ui';
import { BRANCHES } from '../data/branches';
import { STORES } from '../data/stores';
import { STORE_CATALOG } from '../data/storeCatalog';
import { useDemo } from '../state/demo';

export default function ScheduleScreen() {
  const { state, removeLocal, moveLocal, visitLocal } = useDemo();
  const wait = state.queue.wait?.status === 'waiting' ? state.queue.wait : null;
  const stops = state.commerce.stops.filter((id) => STORES[id].branchId === wait?.branchId);
  const total = stops.reduce((sum, id) => sum + STORES[id].walkMinutes * 2 + STORE_CATALOG[id].stayMinutes, 0);
  const last = stops.at(-1);
  return <Screen title="방문 일정" subtitle="체험용">
    {wait ? <Card>
      <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{BRANCHES[wait.branchId].name}</Text>
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 25 }}>내 앞에 {wait.peopleAhead}명</Text>
      <Text style={{ color: UI.muted }}>대기번호 {wait.ticketNumber}번</Text>
      {wait.peopleAhead <= 3 && <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{wait.peopleAhead === 0 ? '입장 차례예요' : '돌아갈 준비를 해주세요'}</Text>}
      {!wait.leaveAllowed && <Text style={{ color: UI.muted }}>현장 대기줄을 유지해 주세요.</Text>}
    </Card> : <Card><Text style={{ color: UI.muted }}>홈에서 줄서기를 시작해 주세요.</Text></Card>}
    <SectionTitle>방문 예정 {stops.length}곳</SectionTitle>
    {!!stops.length && <Card>
      <Text style={{ color: UI.ink }}>방문 계획 약 {total}분</Text>
      <Text style={{ color: UI.muted }}>{last ? `마지막 매장에서 ${BRANCHES[wait!.branchId].name}까지 도보 약 ${STORES[last].walkMinutes}분` : ''}</Text>
    </Card>}
    {stops.map((id, index) => {
      const store = STORES[id];
      const visited = state.commerce.visited.includes(id);
      return <Card key={id}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Image source={store.image} style={{ width: 70, height: 70, borderRadius: 12 }} /><View style={{ flex: 1, gap: 3 }}><Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{index + 1}번째 · {visited ? '방문 완료' : '방문 예정'}</Text><Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 17 }}>{store.name}</Text><Text style={{ color: UI.muted, fontSize: 12 }}>도보 왕복 약 {store.walkMinutes * 2}분 · 체류 약 {STORE_CATALOG[id].stayMinutes}분</Text></View></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          <Button label="↑" secondary disabled={index === 0} onPress={() => moveLocal(id, -1)} />
          <Button label="↓" secondary disabled={index === stops.length - 1} onPress={() => moveLocal(id, 1)} />
          <Button label={visited ? '완료 취소' : '방문 완료'} secondary onPress={() => visitLocal(id)} />
          <Button label="삭제" secondary onPress={() => removeLocal(id)} />
        </View>
      </Card>;
    })}
    {!stops.length && <Text style={{ color: UI.muted }}>담아 둔 가게가 없어요.</Text>}
    <Button label="주변 가게 보기" onPress={() => router.push('/search')} />
  </Screen>;
}
