import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, Field, Notice, Screen, SectionTitle } from '../components/ui';
import { useDemo } from '../state/demo';

export default function AdminSetupScreen() {
  const { admin, setAdminPin } = useDemo();
  const [setupCode, setSetupCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  if (admin.hasPin) return <Screen title="관리자 초기 설정" back><Notice text="관리자 PIN이 이미 설정됐어요." /><Button label="매장용으로 돌아가기" onPress={() => router.replace('/merchant')} /></Screen>;
  return <Screen title="관리자 초기 설정" back>
    <Card><SectionTitle>설정 코드 확인</SectionTitle>
      <Field value={setupCode} onChangeText={setSetupCode} placeholder="운영자 설정 코드" keyboardType="number-pad" secureTextEntry />
      <Field value={pin} onChangeText={setPin} placeholder="새 PIN (4~8자리)" keyboardType="number-pad" secureTextEntry />
      <Field value={confirm} onChangeText={setConfirm} placeholder="PIN 다시 입력" keyboardType="number-pad" secureTextEntry />
      <Button label="PIN 설정" onPress={async () => {
        if (pin !== confirm) { setMessage('PIN 확인이 일치하지 않아요'); return; }
        const reason = await setAdminPin(setupCode, pin);
        setSetupCode(''); setPin(''); setConfirm('');
        if (reason) setMessage(reason);
        else router.replace('/merchant');
      }} />
      {!!message && <Notice text={message} />}
    </Card>
  </Screen>;
}
