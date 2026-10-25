import { router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Screen, SharedConnectionNotice, UI } from '../components/ui';
import { BRANCHES } from '../data/branches';
import { useDemo } from '../state/demo';

export default function QueueScreen() {
  const { state, connection } = useDemo();
  const wait = state.queue.wait;
  return <Screen title="내 줄서기">
    <SharedConnectionNotice connection={connection} />
    {wait?.status === 'waiting' ? <Card>
      <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{BRANCHES[wait.branchId].name}</Text>
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 28 }}>{wait.ticketNumber}번</Text>
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold', fontSize: 20 }}>내 앞에 {wait.peopleAhead}명</Text>
      {wait.peopleAhead <= 3 && <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{wait.peopleAhead === 0 ? '입장 차례예요' : '돌아갈 준비를 해주세요'}</Text>}
      {!wait.leaveAllowed && <Text style={{ color: UI.muted }}>현장 대기줄을 유지해 주세요.</Text>}
      {wait.peopleAhead === 0 && <Button label="입장 QR 보기" onPress={() => router.push('/wallet')} />}
    </Card> : wait?.status === 'completed' ? <Card><Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold' }}>입장 인증 완료</Text></Card> : <Card><Text style={{ color: UI.muted }}>줄서기를 시작해 주세요.</Text></Card>}
    <Button label="주변 가게 보기" onPress={() => router.dismissTo('/search')} />
    <Button label="내 쿠폰 보기" secondary onPress={() => router.push('/wallet')} />
  </Screen>;
}
