import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Chip, Field, Notice, Screen, SectionTitle, UI } from '../components/ui';
import { BRANCHES } from '../data/branches';
import { storesForBranch } from '../data/stores';
import { BRANCH_IDS, type BranchId } from '../domain/queue';
import type { StoreId } from '../data/storeCatalog';
import { useDemo } from '../state/demo';

export default function MerchantScreen() {
  const { state, admin, unlockAdmin, lockAdmin, setCount, advance, verifyEntry, redeemLocal } = useDemo();
  const [pin, setPin] = useState('');
  const [branchId, setBranchId] = useState<BranchId>('main');
  const [storeId, setStoreId] = useState<StoreId>('madeby');
  const [count, setCountText] = useState('');
  const [entryCode, setEntryCode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [message, setMessage] = useState('');
  const shops = storesForBranch(branchId);

  if (!admin.hasPin) return <Screen title="매장용" back>
    <Card><SectionTitle>관리자 설정 필요</SectionTitle><Text style={{ color: UI.muted }}>설정 코드를 가진 운영자만 초기 PIN을 만들 수 있습니다.</Text><Button label="초기 설정" onPress={() => router.push('/admin-setup')} /></Card>
  </Screen>;

  if (!admin.unlocked) return <Screen title="매장용" back>
    <Card><SectionTitle>관리자 PIN</SectionTitle><Field value={pin} onChangeText={setPin} placeholder="PIN 입력" keyboardType="number-pad" secureTextEntry /><Button label="잠금 해제" onPress={async () => { const reason = await unlockAdmin(pin); setPin(''); setMessage(reason ?? '잠금을 해제했어요'); }} />{!!message && <Notice text={message} />}</Card>
  </Screen>;

  return <Screen title="매장용" back>
    <View style={{ alignItems: 'flex-end' }}><Button label="잠그기" secondary onPress={() => { lockAdmin(); setMessage(''); }} /></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{BRANCH_IDS.map((id) => <Chip key={id} label={BRANCHES[id].name.replace('성심당 ', '')} selected={branchId === id} onPress={() => { setBranchId(id); setStoreId(storesForBranch(id)[0].id); setCountText(''); setMessage(''); }} />)}</View>
    <Card>
      <SectionTitle>{BRANCHES[branchId].name} 줄서기</SectionTitle>
      <Text style={{ color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 28 }}>{state.queue.queueCounts[branchId]}명</Text>
      <Text style={{ color: UI.muted }}>다음 발급 번호 {state.queue.nextTicketNumbers[branchId]}번</Text>
      <Field value={count} onChangeText={setCountText} placeholder="전체 대기 인원" keyboardType="number-pad" />
      <Button label="전체 인원 저장" secondary onPress={() => { if (!count.trim()) { setMessage('전체 대기 인원을 입력해 주세요'); return; } const reason = setCount(branchId, Number(count)); setMessage(reason ?? '전체 인원을 저장했어요'); }} />
      <Button label="앞사람 처리" onPress={() => { const reason = advance(branchId); setMessage(reason ?? '앞사람을 처리했어요'); }} />
      <Text style={{ color: UI.muted, fontSize: 12 }}>전체 인원 수정은 발급 번호와 개인 순서를 바꾸지 않습니다.</Text>
    </Card>
    <Card>
      <SectionTitle>입장 인증</SectionTitle>
      <Field value={entryCode} onChangeText={setEntryCode} placeholder="입장 코드 입력" autoCapitalize="none" />
      <Button label="입장 코드 확인" onPress={() => setMessage(verifyEntry(branchId, entryCode) ?? '입장 인증이 완료됐어요')} />
      <Button label="입장 QR 스캔" secondary onPress={() => router.push({ pathname: '/merchant-scanner', params: { mode: 'entry', branchId } })} />
    </Card>
    <Card>
      <SectionTitle>쿠폰 인증</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{shops.map((shop) => <Chip key={shop.id} label={shop.name} selected={shop.id === storeId} onPress={() => setStoreId(shop.id)} />)}</View>
      <Field value={couponCode} onChangeText={setCouponCode} placeholder="쿠폰 코드 입력" autoCapitalize="none" />
      <Button label="쿠폰 사용 처리" onPress={() => setMessage(redeemLocal(storeId, couponCode) ?? '쿠폰 사용 처리가 완료됐어요')} />
      <Button label="쿠폰 QR 스캔" secondary onPress={() => router.push({ pathname: '/merchant-scanner', params: { mode: 'coupon', storeId } })} />
    </Card>
    {!!message && <Notice text={message} />}
  </Screen>;
}
