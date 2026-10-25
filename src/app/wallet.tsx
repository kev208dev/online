import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Text, View } from 'react-native';
import { Card, Screen, SectionTitle, SharedConnectionNotice, UI } from '../components/ui';
import { BRANCHES } from '../data/branches';
import { STORES } from '../data/stores';
import { estimateQueueWait } from '../domain/queue';
import { useDemo } from '../state/demo';

export default function WalletScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { state, now, connection } = useDemo();
  const wait = state.queue.wait;
  const estimate = estimateQueueWait(state.queue);
  const coupons = [...state.commerce.coupons].sort((a, b) => b.issuedAt - a.issuedAt);
  return <Screen title="내 쿠폰·입장 QR" back>
    <SharedConnectionNotice connection={connection} />
    {wait?.status === 'waiting' && wait.peopleAhead === 0 && <Card>
      <Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold', fontSize: 20 }}>입장할 차례예요!</Text>
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold' }}>{BRANCHES[wait.branchId].name} · {wait.ticketNumber}번</Text>
      <View style={{ alignItems: 'center', paddingVertical: 12 }}><QRCode value={wait.entryCode} size={205} color={UI.ink} backgroundColor="#fff" /></View>
      <Text selectable style={{ color: UI.muted, textAlign: 'center', fontSize: 11 }}>{wait.entryCode}</Text>
    </Card>}
    {wait?.status === 'waiting' && wait.peopleAhead > 0 && <Card><Text style={{ color: UI.ink }}>입장 QR은 내 차례에 표시돼요.</Text><Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold', fontSize: 22 }}>앞에 {wait.peopleAhead}명</Text><Text style={{ color: UI.muted, fontSize: 13 }}>예상 대기 {estimate?.label}</Text></Card>}
    {wait?.status === 'completed' && <Card><Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold' }}>입장 인증 완료</Text></Card>}
    <SectionTitle>발급한 쿠폰 {coupons.length}</SectionTitle>
    {coupons.map((coupon) => {
      const status = coupon.usedAt ? '사용 완료' : coupon.expiresAt <= now ? '만료' : '사용 가능';
      return <Card key={coupon.code} style={code === coupon.code ? { borderColor: UI.orange, borderWidth: 2 } : undefined}>
        <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{STORES[coupon.storeId].name} · {status}</Text>
        <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 20 }}>{coupon.title}</Text>
        <Text style={{ color: UI.muted, fontSize: 12 }}>{coupon.condition}</Text>
        {status === '사용 가능' && <View style={{ alignItems: 'center', paddingVertical: 12 }}><QRCode value={coupon.code} size={205} color={UI.ink} backgroundColor="#fff" /></View>}
        <Text selectable style={{ color: UI.muted, fontSize: 11, textAlign: 'center' }}>{coupon.code}</Text>
      </Card>;
    })}
    {!coupons.length && <Text style={{ color: UI.muted }}>발급한 쿠폰이 없어요.</Text>}
  </Screen>;
}
