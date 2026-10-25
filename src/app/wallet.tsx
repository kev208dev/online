import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Text, View } from 'react-native';
import { Card, formatTime, Notice, Screen, UI } from '../components/ui';
import { STORES } from '../data/stores';
import { useDemo } from '../state/demo';

export default function WalletScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { state, now } = useDemo();
  const coupons = [...state.coupons].sort((a,b) => b.issuedAt - a.issuedAt);
  return <Screen title="내 쿠폰" subtitle="발급한 시연용 혜택과 사용 내역을 확인하세요." back>
    <Notice text="이 기기에서만 인증되는 시연 쿠폰입니다. 매장 화면에서 코드를 확인하거나 QR을 스캔해 사용 처리할 수 있어요." />
    {coupons.length ? coupons.map((coupon) => {
      const status = coupon.usedAt ? '사용 완료' : coupon.expiresAt <= now ? '만료' : '사용 가능';
      return <Card key={coupon.code} style={code === coupon.code ? { borderColor: UI.orange, borderWidth: 2 } : undefined}>
        <Text style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>{STORES[coupon.storeId].name} · {status}</Text>
        <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 22 }}>{coupon.title}</Text>
        <Text style={{ color: UI.muted }}>{coupon.condition}</Text>
        {status === '사용 가능' && <View style={{ alignItems: 'center', paddingVertical: 10 }}><QRCode value={coupon.code} size={205} backgroundColor="#fff" color="#211c19" /></View>}
        <Text selectable style={{ color: UI.muted, fontSize: 11 }}>{coupon.code}</Text>
        <Text style={{ color: UI.muted, fontSize: 12 }}>발급 {formatTime(coupon.issuedAt)} · 만료 {formatTime(coupon.expiresAt)}</Text>
        {coupon.usedAt && <Text style={{ color: UI.muted }}>사용 {formatTime(coupon.usedAt)}</Text>}
      </Card>;
    }) : <Notice text="아직 발급한 쿠폰이 없어요." />}
  </Screen>;
}
