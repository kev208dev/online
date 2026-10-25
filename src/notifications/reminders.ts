import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { reminderAt, type DemoState } from '../domain/demo';

const IDENTIFIER = 'online-return-reminder';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function syncReminder(state: DemoState) {
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
  if (!state.alertsEnabled || !state.wait) return;
  const when = reminderAt(state);
  if (!when || when <= Date.now()) return;
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('online-return', {
      name: '복귀 안내',
      importance: AndroidImportance.HIGH,
    });
  }
  await Notifications.scheduleNotificationAsync({
    identifier: IDENTIFIER,
    content: {
      title: '성심당 본점으로 돌아갈 시간이에요',
      body: '직접 입력한 예상 대기시간 기준입니다. 매장의 실제 순서를 확인해 주세요.',
      data: { kind: 'return-reminder' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(when), ...(Platform.OS === 'android' ? { channelId: 'online-return' } : {}) },
  });
}
