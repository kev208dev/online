import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, UI } from '../../components/ui';
import { BRANCHES } from '../../data/branches';
import { STORES } from '../../data/stores';
import { STORE_CATALOG, type StoreId } from '../../data/storeCatalog';
import { images } from '../../design/assets';
import { useDemo } from '../../state/demo';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const key = Array.isArray(id) ? id[0] : id;
  const store = key && key in STORE_CATALOG ? STORES[key as StoreId] : null;
  const { state, addLocal, removeLocal, issueLocal } = useDemo();
  const [message, setMessage] = useState('');
  const insets = useSafeAreaInsets();
  if (!store) return <View style={{ flex: 1, paddingTop: insets.top + 20, paddingHorizontal: 24 }}><Button label="가게 목록으로" onPress={() => router.dismissTo('/search')} /></View>;
  const planned = state.commerce.stops.includes(store.id);
  const coupon = state.commerce.coupons.find((item) => item.storeId === store.id && item.waitId === state.queue.wait?.id);
  const wait = state.queue.wait;
  const canVisit = wait?.status === 'waiting' && wait.branchId === store.branchId && wait.leaveAllowed && wait.peopleAhead > 0;
  return <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: insets.bottom + 34 }}>
    <View style={{ paddingTop: insets.top + 9, paddingBottom: 15, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={{ color: UI.ink, fontSize: 28 }}>‹</Text></Pressable>
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold', fontSize: 19 }}>상세 보기</Text>
    </View>
    <View style={{ height: 250, backgroundColor: '#eee9e3' }}>
      <Image source={store.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      {store.image === images.map && <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,.85)', padding: 8 }}><Text style={{ color: UI.muted, textAlign: 'center' }}>매장 사진 준비 중</Text></View>}
      <Text style={{ position: 'absolute', right: 20, top: 12, backgroundColor: UI.orange, color: '#fff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, fontSize: 12 }}>체험용</Text>
    </View>
    <View style={{ paddingHorizontal: 24, paddingTop: 18, gap: 17 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 20 }}>{store.name}</Text>
        <Text style={{ color: UI.muted, fontSize: 13 }}>📍 {store.address}</Text>
        <Text style={{ color: UI.muted, fontSize: 13 }}>{BRANCHES[store.branchId].name}에서 도보 약 {store.walkMinutes}분</Text>
      </View>
      <View style={{ borderColor: '#b8b2ac', borderWidth: 1, borderRadius: 15, padding: 17, gap: 6 }}>
        <Text style={{ color: UI.orange, fontFamily: 'Pretendard-Bold', fontSize: 23 }}>체험</Text>
        <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 17 }}>앱 내 방문 쿠폰</Text>
        <Text style={{ color: UI.muted, fontSize: 13 }}>실제 할인 없음 · 이 기기에서만 인증</Text>
      </View>
      <View style={{ backgroundColor: UI.background, borderRadius: 15, padding: 16, gap: 7 }}>
        <Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold' }}>찾아가는 길 · 도보 약 {store.walkMinutes}분</Text>
        <Text style={{ color: UI.muted, fontSize: 12 }}>예상 체류 {store.stay} · 복귀 도보 약 {store.walkMinutes}분</Text>
        <Text onPress={() => { void Linking.openURL(`https://map.kakao.com/link/search/${encodeURIComponent(store.name + ' ' + store.address)}`); }} style={{ color: UI.orange, fontFamily: 'Pretendard-SemiBold' }}>지도에서 찾기 ›</Text>
      </View>
      <Button label={planned ? '일정에서 제거' : '방문 일정에 담기'} secondary onPress={() => { if (planned) { removeLocal(store.id); setMessage('일정에서 제거했어요'); } else setMessage(addLocal(store.id) ?? '일정에 담았어요'); }} />
      <Button label={coupon ? '쿠폰 보기' : '쿠폰 발급'} disabled={!canVisit && !coupon} onPress={() => { if (coupon) { router.push({ pathname: '/wallet', params: { code: coupon.code } }); return; } const result = issueLocal(store.id); if (result.reason) setMessage(result.reason); else router.push({ pathname: '/wallet', params: { code: result.state.coupons[0].code } }); }} />
      {!canVisit && !coupon && <Text style={{ color: UI.muted, fontSize: 12, textAlign: 'center' }}>이 지점에서 줄서기 중일 때 발급할 수 있어요.</Text>}
      {!!message && <Text style={{ color: UI.orange, fontSize: 13 }}>{message}</Text>}
    </View>
  </ScrollView>;
}
