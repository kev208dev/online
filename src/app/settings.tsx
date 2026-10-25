import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, Card, Chip, Field, Notice, Screen, SectionTitle, UI } from '../components/ui';
import { useDemo } from '../state/demo';
import type { LanRole } from '../state/lanClient';

export default function SettingsScreen() {
  const { state, alerts, admin, reset, connection, connectCustomer, connectMerchant, disconnectLan } = useDemo();
  const [role, setRole] = useState<LanRole>('customer');
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const status = connection.status === 'local' ? '이 기기만 사용 중'
    : connection.status === 'connected' ? '연결됨'
      : connection.status === 'connecting' ? '연결 중'
        : connection.status === 'revoked' ? '연결 만료' : '연결 끊김';
  const connect = async () => {
    setBusy(true);
    try {
      const reason = await (role === 'customer' ? connectCustomer(address, code) : connectMerchant(address, code));
      setMessage(reason ?? 'Mac과 연결됐어요');
      if (!reason) setCode('');
    } finally { setBusy(false); }
  };
  const setAlerts = async () => {
    if (state.alertsEnabled) { alerts(false); return; }
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (granted) alerts(true);
    else Alert.alert('알림을 켤 수 없어요', '기기 설정에서 알림을 허용해 주세요.');
  };
  return <Screen title="설정">
    <Card><SectionTitle>내 이용 정보</SectionTitle><Button label="쿠폰함 보기" onPress={() => router.push('/wallet')} /><Button label="매장용" secondary onPress={() => router.push('/merchant')} /></Card>
    <Card>
      <SectionTitle>두 폰 연결</SectionTitle>
      <Text style={{ color: connection.status === 'connected' ? UI.orange : UI.muted }}>{status}{connection.mode !== 'local' ? ` · ${connection.mode === 'customer' ? '고객폰' : '매장폰'}` : ''}</Text>
      {connection.mode === 'local' ? <>
        <Text style={{ color: UI.muted, fontSize: 12 }}>두 폰과 Mac을 같은 Wi-Fi에 연결해 주세요.</Text>
        <Text style={{ color: UI.ink, fontFamily: 'Pretendard-SemiBold' }}>이 폰의 역할</Text>
        <Text style={{ color: UI.muted, fontSize: 12 }}>Mac에 표시된 해당 역할의 연결 코드를 입력하세요.</Text>
        <Chip label="고객폰" selected={role === 'customer'} onPress={() => setRole('customer')} />
        <Chip label="매장폰" selected={role === 'merchant'} onPress={() => setRole('merchant')} />
        <Field value={address} onChangeText={setAddress} placeholder="Mac 주소 · 192.168.0.12:8787" autoCapitalize="none" />
        <Field value={code} onChangeText={setCode} placeholder="연결 코드" autoCapitalize="none" secureTextEntry />
        <Button label={busy ? '연결 중…' : '연결하기'} disabled={busy || !address.trim() || !code.trim()} onPress={() => { void connect(); }} />
      </> : <>
        {connection.status !== 'connected' && <Text style={{ color: UI.muted, fontSize: 12 }}>공유 작업이 중지됐어요. Mac과 Wi-Fi를 확인하거나 연결을 해제한 뒤 다시 연결해 주세요.</Text>}
        <Button label="연결 해제" secondary disabled={busy} onPress={() => Alert.alert('연결 해제', '이 기기에 남아 있는 이전 로컬 기록으로 돌아갈까요? Mac의 기록은 유지됩니다.', [
          { text: '유지', style: 'cancel' },
          { text: '연결 해제', onPress: () => { setBusy(true); void disconnectLan().then((reason) => setMessage(reason ?? '연결을 해제했어요')).finally(() => setBusy(false)); } },
        ])} />
      </>}
      {!!message && <Notice text={message} />}
    </Card>
    {connection.mode === 'local' && <Card><SectionTitle>순번 알림</SectionTitle><Text style={{ color: UI.muted }}>이 기기에서 앞사람을 처리할 때 알림을 보냅니다.</Text><Button label={state.alertsEnabled ? '알림 끄기' : '알림 켜기'} secondary onPress={() => { void setAlerts(); }} /></Card>}
    {admin.unlocked && connection.mode === 'local' && <Button label="이 기기 데이터 초기화" secondary onPress={() => Alert.alert('데이터 초기화', '줄서기와 쿠폰을 이 기기에서 삭제할까요?', [{ text: '아니요', style: 'cancel' }, { text: '초기화', style: 'destructive', onPress: reset }])} />}
  </Screen>;
}
