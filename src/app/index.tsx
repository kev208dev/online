import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Button, Card, Chip, Field, formatTime, Notice, Screen, SectionTitle, StoreCard, UI } from '../components/ui';
import { eligibleStores, reminderAt, returnGuidance, waitRemaining } from '../domain/demo';
import { images } from '../design/assets';
import { useDemo } from '../state/demo';

export default function HomeScreen() {
  const { state, now, ready, start, finish } = useDemo();
  const [minutes, setMinutes] = useState('60');
  const [leaveAllowed, setLeaveAllowed] = useState(false);
  const [message, setMessage] = useState('');
  const left = waitRemaining(state, now);
  const guidance = returnGuidance(state, now);
  const departure = reminderAt(state);
  const recommendations = eligibleStores(state, now);
  if (!ready) return <Screen title="ONLINE"><Text>시연 데이터를 불러오는 중이에요.</Text></Screen>;
  return <Screen title="기다림이 동네의 기회로" subtitle="성심당 본점 대기 중 은행동의 가게를 발견해 보세요.">
    <Image source={images.sungsimdang} style={{ width: '100%', height: 230, borderRadius: 22 }} resizeMode="cover" />
    {!state.wait ? <Card>
      <SectionTitle>대기시간 기록 시작</SectionTitle>
      <Text style={{ color: UI.muted, lineHeight: 21 }}>앵커 매장 · 성심당 본점{'\n'}대전 중구 대종로480번길 15</Text>
      <Text style={{ color: UI.ink }}>예상 대기시간</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {[30, 60, 90, 120].map((value) => <Chip key={value} label={`${value}분`} selected={minutes === String(value)} onPress={() => setMinutes(String(value))} />)}
      </View>
      <Field value={minutes} onChangeText={setMinutes} placeholder="예상 대기시간(분)" keyboardType="number-pad" />
      <Pressable onPress={() => setLeaveAllowed(!leaveAllowed)} accessibilityRole="checkbox" accessibilityState={{ checked: leaveAllowed }} style={{ paddingVertical: 8 }}><Text style={{ color: UI.ink, lineHeight: 22 }}>{leaveAllowed ? '☑' : '☐'} 이 매장은 줄을 떠나도 되는지 확인했어요</Text></Pressable>
      <Notice text="실제 웨이팅 접수가 아닙니다. 예상시간은 직접 입력한 값이며, 매장 운영 방침을 현장에서 확인해 주세요." />
      <Button label="대기시간 기록 시작" onPress={() => { const reason = start(Number(minutes), leaveAllowed); if (reason) setMessage(reason); else setMessage(''); }} />
      {!!message && <Text style={{ color: '#b42318' }}>{message}</Text>}
    </Card> : <Card>
      <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>성심당 본점 · 수동 대기 기록</Text>
      <Text style={{ fontFamily: 'Pretendard-Bold', fontSize: 38, color: UI.ink }}>{left > 0 ? `${left}분 남음` : '예상시간 경과'}</Text>
      <Text style={{ color: UI.muted }}>예상 종료 {formatTime(state.wait.endsAt)}</Text>
      {guidance === 'expired' ? <Notice text="예상 대기시간이 지났어요. 입장이 확정된 것은 아니니 매장에서 현재 순서를 확인해 주세요." /> : !state.wait.leaveAllowed ? <Notice text="줄을 떠나면 순번을 잃을 수 있어요. 현장에서 대기해 주세요." /> : guidance === 'return-now' ? <Notice text="지금 성심당 본점으로 돌아가세요. 직접 입력한 예상시간에 따른 안내입니다." /> : <Notice text={`복귀 여유 5분을 포함해 방문할 곳을 추천해요. 현재 일정 ${state.stops.length}곳. ${departure ? `${formatTime(departure)}쯤 복귀 출발` : ''}`} />}
      <Button label="내 방문 일정 보기" onPress={() => router.push('/schedule')} />
      <Notice text="기록 종료는 앱의 일정·쿠폰만 끝냅니다. 성심당의 실제 대기 접수나 순번은 변경하지 않습니다." />
      <Button label="앱 기록만 종료" secondary onPress={finish} />
    </Card>}
    <SectionTitle>은행동 로컬 가게</SectionTitle>
    {state.wait?.leaveAllowed && recommendations.length ? recommendations.map((id) => <StoreCard key={id} id={id} />) : <Notice text={state.wait ? '현재 대기시간이나 외출 조건에 맞는 방문 추천이 없어요. 매장 근처에서 대기해 주세요.' : '대기시간을 기록하면 이동·체류시간에 맞는 가게를 추천해 드려요.'} />}
    <Button label="주변 가게 모두 보기" secondary onPress={() => router.push('/search')} />
  </Screen>;
}
