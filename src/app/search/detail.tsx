import { useLocalSearchParams, router } from 'expo-router';
import { Linking, Image, Text, View } from 'react-native';
import { Button, Card, Notice, Screen, UI } from '../../components/ui';
import { getStore } from '../../data/stores';
import { STORE_KEYS, waitRemaining, type StoreKey } from '../../domain/demo';
import { useDemo } from '../../state/demo';
import { useState } from 'react';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const key = Array.isArray(id) ? id[0] : id;
  const store = key && STORE_KEYS.includes(key as StoreKey) ? getStore(key) : null;
  const { state, now, add, remove, issue } = useDemo();
  const [message, setMessage] = useState('');
  if (!store) return <Screen title="매장을 찾을 수 없어요" back><Button label="검색으로 돌아가기" onPress={() => router.dismissTo('/search')} /></Screen>;
  const inPlan = state.stops.includes(store.id as StoreKey);
  const coupon = state.coupons.find((item) => item.storeId === store.id && item.waitId === state.wait?.id);
  const profile = state.profiles[store.id as StoreKey];
  const left = waitRemaining(state, now);
  return <Screen title={store.name} subtitle={`${store.category} · 성심당 본점에서 도보 약 ${store.walkMinutes}분`} back>
    <Image source={store.image} style={{ width: '100%', height: 265, borderRadius: 22 }} resizeMode="cover" />
    <Card><Text style={{ fontFamily: 'Pretendard-Bold', fontSize: 21, color: UI.ink }}>방문 정보</Text><Text style={{ color: UI.muted }}>{profile?.address ?? store.address}</Text><Text style={{ color: UI.muted }}>영업시간 · {profile?.hours ?? store.hours}</Text><Text style={{ color: UI.muted }}>시연 품목 예시 · {profile?.menu ?? store.demoMenu}</Text><Text style={{ color: UI.muted }}>예상 체류 {store.stay} · 왕복 이동 약 {store.walkMinutes * 2}분</Text><Button label="카카오맵에서 검색" secondary onPress={() => Linking.openURL(`https://map.kakao.com/link/search/${encodeURIComponent(store.name + ' 대전 은행동')}`)} /></Card>
    <Card><Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold', fontSize: 23 }}>{state.offers[store.id as StoreKey].title}</Text><Text style={{ color: UI.muted }}>{state.offers[store.id as StoreKey].condition}</Text><Notice text="시연용 혜택입니다. 실제 제휴 여부와 제공 조건은 확정되지 않았습니다." /></Card>
    {!!state.wait && <Notice text={`남은 예상 대기 ${left}분 · 복귀 여유 5분 포함. 현장 대기 규칙을 우선 확인해 주세요.`} />}
    <View style={{ gap: 9 }}>
      <Button label={inPlan ? '일정에서 제거' : '방문 일정에 담기'} secondary onPress={() => { if (inPlan) { remove(store.id as StoreKey); setMessage('일정에서 제거했어요'); } else setMessage(add(store.id as StoreKey) ?? '일정에 담았어요'); }} />
      <Button label={coupon ? '발급한 쿠폰 보기' : '시연 쿠폰 발급'} onPress={() => { if (coupon) { router.push('/wallet'); return; } const result = issue(store.id as StoreKey); if (result.reason) setMessage(result.reason); else router.push('/wallet'); }} />
    </View>
    {!!message && <Notice text={message} />}
  </Screen>;
}
