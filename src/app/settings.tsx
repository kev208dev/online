import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { Button, Card, Screen, SectionTitle, UI } from '../components/ui';
import { useDemo } from '../state/demo';

export default function SettingsScreen() {
  const { state, alerts, admin, reset } = useDemo();
  const setAlerts = async () => {
    if (state.alertsEnabled) { alerts(false); return; }
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (granted) alerts(true);
    else Alert.alert('알림을 켤 수 없어요', '기기 설정에서 알림을 허용해 주세요.');
  };
  return <Screen title="설정" subtitle="체험용">
    <Card><SectionTitle>내 이용 정보</SectionTitle><Button label="쿠폰함 보기" onPress={() => router.push('/wallet')} /><Button label="매장용" secondary onPress={() => router.push('/merchant')} /></Card>
    <Card><SectionTitle>순번 알림</SectionTitle><Text style={{ color: UI.muted }}>이 기기에서 앞사람을 처리할 때 알림을 보냅니다.</Text><Button label={state.alertsEnabled ? '알림 끄기' : '알림 켜기'} secondary onPress={() => { void setAlerts(); }} /></Card>
    {admin.unlocked && <Button label="이 기기 데이터 초기화" secondary onPress={() => Alert.alert('데이터 초기화', '줄서기와 쿠폰을 이 기기에서 삭제할까요?', [{ text: '아니요', style: 'cancel' }, { text: '초기화', style: 'destructive', onPress: reset }])} />}
  </Screen>;
}
