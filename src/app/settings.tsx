import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Alert, Text } from 'react-native';
import { Button, Card, Notice, Screen, SectionTitle, UI } from '../components/ui';
import { useDemo } from '../state/demo';

export default function SettingsScreen() {
  const { state, alerts, reset } = useDemo();
  const setAlerts = async () => {
    if (state.alertsEnabled) { alerts(false); return; }
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (granted) alerts(true);
    else Alert.alert('알림을 켤 수 없어요', '기기 설정에서 알림을 허용해 주세요. 앱 안의 복귀 안내는 계속 표시됩니다.');
  };
  return <Screen title="설정" subtitle="ONLINE 시연 환경과 혜택을 관리하세요.">
    <Card><SectionTitle>내 이용 정보</SectionTitle><Button label="쿠폰함 보기" onPress={() => router.push('/wallet')} /><Button label="매장용 시연 화면" secondary onPress={() => router.push('/merchant')} /></Card>
    <Card><SectionTitle>복귀 알림</SectionTitle><Text style={{ color: UI.muted }}>수동 예상시간 기준으로 앵커 매장 복귀를 알려드려요.</Text><Button label={state.alertsEnabled ? '기기 알림 끄기' : '기기 알림 켜기'} secondary onPress={setAlerts} /></Card>
    <Notice text="이 앱은 시연용입니다. 실제 대기 순번·매장 호출·제휴 혜택 제공·매출 데이터와 연결되지 않습니다." />
    <Button label="데모 데이터 초기화" secondary onPress={() => Alert.alert('데모 데이터 초기화', '대기 기록, 일정, 발급한 쿠폰과 시연 혜택 수정 내역을 이 기기에서 삭제할까요?', [{ text: '아니요', style: 'cancel' }, { text: '초기화', style: 'destructive', onPress: reset }])} />
  </Screen>;
}
