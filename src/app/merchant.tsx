import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Chip, Field, Notice, Screen, SectionTitle, UI } from '../components/ui';
import { STORES } from '../data/stores';
import { STORE_KEYS, type StoreKey } from '../domain/demo';
import { useDemo } from '../state/demo';

export default function MerchantScreen() {
  const { state, now, redeem, offer, profile } = useDemo();
  const [id, setId] = useState<StoreKey>('madeby');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState(state.offers.madeby.title);
  const [condition, setCondition] = useState(state.offers.madeby.condition);
  const [menu, setMenu] = useState(state.profiles.madeby?.menu ?? STORES.madeby.demoMenu);
  const [hours, setHours] = useState(state.profiles.madeby?.hours ?? STORES.madeby.hours);
  const [address, setAddress] = useState(state.profiles.madeby?.address ?? STORES.madeby.address);
  const selected = state.offers[id];
  const coupons = state.coupons.filter((item) => item.storeId === id);
  const select = (next: StoreKey) => { setId(next); setTitle(state.offers[next].title); setCondition(state.offers[next].condition); setMenu(state.profiles[next]?.menu ?? STORES[next].demoMenu); setHours(state.profiles[next]?.hours ?? STORES[next].hours); setAddress(state.profiles[next]?.address ?? STORES[next].address); setMessage(''); };
  const verify = (value: string) => { const reason = redeem(id, value); setMessage(reason ?? '쿠폰 사용 처리가 완료됐어요'); };
  return <Screen title="매장용 시연" subtitle="이 기기에서 발급된 시연 쿠폰을 확인합니다." back>
    <Notice text="공유 서버가 없어 다른 기기의 쿠폰은 인증되지 않습니다. 실제 매장 관리자 계정이나 결제 시스템은 연결되지 않았습니다." />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{STORE_KEYS.map((key) => <Chip key={key} label={STORES[key].name} selected={id === key} onPress={() => select(key)} />)}</View>
    <Card><SectionTitle>{STORES[id].name} 쿠폰 인증</SectionTitle><Field value={code} onChangeText={setCode} placeholder="쿠폰 코드 입력" /><Button label="입력한 코드 사용 처리" onPress={() => verify(code)} /><Button label="QR 카메라로 스캔" secondary onPress={() => router.push({ pathname: '/merchant-scanner', params: { id } })} />{!!message && <Notice text={message} />}</Card>
    <Card><SectionTitle>이 기기의 발급/사용 기록</SectionTitle><Text style={{ color: UI.muted }}>발급 {coupons.length}장 · 사용 {coupons.filter((item) => item.usedAt).length}장</Text>{coupons.map((item) => <View key={item.code} style={{ borderTopWidth: 1, borderColor: UI.line, paddingTop: 10, gap: 5 }}><Text style={{ color: UI.ink }}>{item.title} · {item.usedAt ? '사용 완료' : item.expiresAt <= now ? '만료' : '사용 가능'}</Text><Text selectable style={{ color: UI.muted, fontSize: 11 }}>{item.code}</Text>{!item.usedAt && item.expiresAt > now && <Button label="이 쿠폰 시연 인증" secondary onPress={() => verify(item.code)} />}</View>)}</Card>
    <Card><SectionTitle>시연 혜택 관리</SectionTitle><Field value={title} onChangeText={setTitle} placeholder="혜택 이름" /><Field value={condition} onChangeText={setCondition} placeholder="발급 조건" /><Button label={selected.enabled ? '혜택 비활성화' : '혜택 활성화'} secondary onPress={() => offer(id, title || selected.title, condition || selected.condition, !selected.enabled)} /><Button label="혜택 내용 저장" onPress={() => { if (!title.trim() || !condition.trim()) { setMessage('혜택 이름과 조건을 입력해 주세요'); return; } offer(id, title, condition, selected.enabled); setMessage('시연 혜택을 저장했어요'); }} /></Card>
    <Card><SectionTitle>매장 정보 관리</SectionTitle><Field value={menu} onChangeText={setMenu} placeholder="시연 품목" /><Field value={hours} onChangeText={setHours} placeholder="영업시간" /><Field value={address} onChangeText={setAddress} placeholder="주소" /><Button label="매장 정보 저장" onPress={() => { if (!menu.trim() || !hours.trim() || !address.trim()) { setMessage('매장 정보를 모두 입력해 주세요'); return; } profile(id, { menu, hours, address }); setMessage('매장 정보를 저장했어요'); }} /></Card>
    {!!message && <Notice text={message} />}
  </Screen>;
}
