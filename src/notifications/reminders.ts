import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import type { QueueState } from '../domain/queue';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function notifyQueueAdvance(state: QueueState, previousAhead: number | undefined) {
  const wait = state.wait;
  if (!wait || wait.status !== 'waiting' || previousAhead === undefined) return;
  const called = previousAhead > 0 && wait.peopleAhead === 0;
  const returnSoon = previousAhead > 3 && wait.peopleAhead <= 3;
  if (!called && !returnSoon) return;
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('online-queue', {
      name: '줄서기 안내',
      importance: AndroidImportance.HIGH,
    });
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: called ? '입장할 차례예요' : '매장으로 돌아갈 준비를 해주세요',
      body: called ? '앱의 입장 QR을 확인해 주세요.' : `앞에 ${wait.peopleAhead}명이 남았어요.`,
      data: { kind: 'queue-advance', branchId: wait.branchId },
    },
    trigger: null,
  });
}
