import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, formatTime, Notice, Screen, SectionTitle, UI } from '../components/ui';
import { STORES } from '../data/stores';
import { itineraryBudget, reminderAt, returnGuidance, STORE_TIMES, waitRemaining } from '../domain/demo';
import { useDemo } from '../state/demo';

export default function ScheduleScreen() {
  const { state, now, remove, move, visit, current } = useDemo();
  const left = waitRemaining(state, now);
  const budget = itineraryBudget(state.stops.filter((id) => !state.visited.includes(id)));
  const departure = reminderAt(state);
  const guidance = returnGuidance(state, now);
  let elapsed = 0;
  return <Screen title="방문 일정" subtitle="웨이팅 중 둘러볼 곳을 정리해 보세요.">
    {!state.wait ? <Notice text="홈에서 예상 대기시간을 먼저 등록하면 방문 계획을 만들 수 있어요." /> : <Card>
      <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>성심당 본점 복귀 계획</Text>
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 24 }}>{left}분 남음</Text>
      <Text style={{ color: UI.muted }}>예상 종료 {formatTime(state.wait.endsAt)} · 일정 소요 약 {budget}분</Text>
      {guidance === 'expired' ? <Notice text="예상 대기시간이 지났어요. 성심당에서 실제 순서를 확인해 주세요." /> : !state.wait.leaveAllowed ? <Notice text="현장 줄을 떠날 수 없는 경우에는 방문 일정을 만들지 않습니다." /> : guidance === 'return-now' || budget > left ? <Notice text="지금 성심당 본점으로 돌아가세요. 실제 매장 호출 시각과 다를 수 있어요." /> : <Notice text={state.stops.length ? `복귀 출발 권고 ${departure ? formatTime(departure) : '-'} · 현재 방문 중인 매장을 선택하면 복귀 도보 시간을 반영해요.` : '방문할 가게를 추가해 보세요.'} />}
      {!!state.currentStoreId && <Button label="성심당 근처로 돌아왔어요" secondary onPress={() => current(null)} />}
    </Card>}
    <SectionTitle>방문 예정 {state.stops.length}곳</SectionTitle>
    {state.stops.length ? state.stops.map((id, index) => {
      const store = STORES[id];
      const start = now + elapsed * 60_000;
      const duration = STORE_TIMES[id].walkMinutes * 2 + STORE_TIMES[id].stayMinutes;
      if (!state.visited.includes(id)) elapsed += duration;
      return <Card key={id}>
        <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{index + 1}번째 · {state.visited.includes(id) ? '방문 완료' : `${formatTime(start)}쯤 출발`}</Text>
        <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 19 }}>{store.name}</Text>
        <Text style={{ color: UI.muted }}>도보 왕복 약 {STORE_TIMES[id].walkMinutes * 2}분 · 체류 약 {STORE_TIMES[id].stayMinutes}분</Text>
        {!state.visited.includes(id) && <Text style={{ color: UI.muted }}>방문 예정 · 예상 종료 {formatTime(now + elapsed * 60_000)}</Text>}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Button label={state.currentStoreId === id ? '현재 위치 해제' : '현재 방문 중'} secondary onPress={() => current(state.currentStoreId === id ? null : id)} />
          <Button label="↑" secondary disabled={index === 0} onPress={() => move(id, -1)} />
          <Button label="↓" secondary disabled={index === state.stops.length - 1} onPress={() => move(id, 1)} />
          <Button label={state.visited.includes(id) ? '완료 취소' : '방문 완료'} secondary onPress={() => visit(id)} />
          <Button label="삭제" secondary onPress={() => remove(id)} />
        </View>
      </Card>;
    }) : <Notice text="아직 담은 가게가 없어요. 검색에서 주변 매장을 살펴보세요." />}
    <Button label="가게 추가하기" onPress={() => router.push('/search')} />
  </Screen>;
}
