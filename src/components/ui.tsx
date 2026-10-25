import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarMetrics } from './tabBarMetrics';
import { STORES, type StoreId } from '../data/stores';
import { ORANGE } from '../design/canvas';

export const UI = { orange: ORANGE, ink: '#211c19', muted: '#786f69', pale: '#fff4eb', line: '#eee7e1', background: '#fffaf6' };
export function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}
export function Screen({ title, subtitle, children, back = false }: { title: string; subtitle?: string; children: ReactNode; back?: boolean }) {
  const insets = useSafeAreaInsets();
  const { bottom, height } = useTabBarMetrics();
  return <ScrollView style={{ flex: 1, backgroundColor: UI.background }} contentContainerStyle={{ paddingTop: insets.top + 15, paddingBottom: height + bottom + 32, paddingHorizontal: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
    {back && <Pressable onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingVertical: 8 }}><Text style={styles.back}>‹ 뒤로</Text></Pressable>}
    <View style={{ gap: 6 }}><Text style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>
    {children}
  </ScrollView>;
}
export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Button({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && { opacity: .45 }, pressed && { opacity: .75 }]} accessibilityRole="button">
    <Text style={[styles.buttonText, secondary && { color: ORANGE }]}>{label}</Text>
  </Pressable>;
}
export function QueueLeaveCheck({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return <View style={styles.queueLeaveCheck}>
    <Text style={styles.queueLeaveHeading}>[필수] 줄서기 취소 시 이용 제한 동의</Text>
    <Text style={styles.queueLeaveDescription}>줄서기를 취소하면 취소한 성심당 지점에는 3개월 동안 다시 줄설 수 없습니다. 다른 지점의 줄서기는 이용할 수 있습니다.</Text>
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel="줄서기 취소 시 해당 지점의 3개월 이용 제한에 동의합니다." style={styles.queueLeaveRow}>
      <View style={[styles.queueLeaveBox, checked && styles.queueLeaveBoxChecked]}>
        {checked && <Text style={styles.queueLeaveMark}>✓</Text>}
      </View>
      <Text style={styles.queueLeaveText}>줄서기 취소 시 해당 지점의 3개월 이용 제한에 동의합니다.</Text>
    </Pressable>
  </View>;
}
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected && { backgroundColor: ORANGE, borderColor: ORANGE }]}><Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text></Pressable>;
}
export function Notice({ text }: { text: string }) { return <View style={styles.notice}><Text style={styles.noticeText}>{text}</Text></View>; }
export function SharedConnectionNotice({ connection }: { connection: { mode: string; status: string } }) {
  if (connection.mode === 'local' || connection.status === 'connected') return null;
  return <Notice text={connection.status === 'revoked' ? '연결이 만료됐어요 · 설정에서 다시 연결해 주세요.' : '연결 끊김 · Mac과 Wi-Fi를 확인해 주세요.'} />;
}
export function Field({ value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, autoCapitalize = 'sentences' }: { value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'number-pad'; secureTextEntry?: boolean; autoCapitalize?: 'none' | 'sentences' }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} style={styles.input} placeholderTextColor="#9d958f" />;
}
export function StoreCard({ id, onPress }: { id: StoreId; onPress?: () => void }) {
  const store = STORES[id];
  return <Pressable onPress={onPress ?? (() => router.push({ pathname: '/search/detail', params: { id } }))} style={styles.store} accessibilityRole="button">
    <Image source={store.image} style={styles.storeImage} />
    <View style={{ flex: 1, gap: 5 }}><Text style={styles.storeName}>{store.name}</Text><Text style={styles.storeInfo}>{store.category} · 도보 약 {store.walkMinutes}분</Text><Text style={styles.storePerk}>{store.perk}</Text></View>
    <Text style={{ color: ORANGE, fontSize: 20 }}>›</Text>
  </Pressable>;
}
export function SectionTitle({ children }: { children: ReactNode }) { return <Text style={styles.section}>{children}</Text>; }

const styles = StyleSheet.create({
  title: { color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 28, lineHeight: 35 },
  subtitle: { color: UI.muted, fontFamily: 'Pretendard-Regular', fontSize: 14, lineHeight: 21 },
  back: { color: ORANGE, fontFamily: 'Pretendard-SemiBold', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: UI.line, gap: 12 },
  button: { minHeight: 52, borderRadius: 16, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  secondary: { backgroundColor: '#fff', borderColor: ORANGE, borderWidth: 1.5 },
  buttonText: { color: '#fff', fontFamily: 'Pretendard-SemiBold', fontSize: 16, textAlign: 'center' },
  queueLeaveCheck: { borderRadius: 14, borderWidth: 1.5, borderColor: ORANGE, backgroundColor: UI.pale, padding: 14, gap: 10 },
  queueLeaveHeading: { color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 15, lineHeight: 21 },
  queueLeaveDescription: { color: UI.ink, fontFamily: 'Pretendard-Regular', fontSize: 12, lineHeight: 19 },
  queueLeaveRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
  queueLeaveBox: { width: 25, height: 25, borderRadius: 6, borderWidth: 2, borderColor: ORANGE, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  queueLeaveBoxChecked: { backgroundColor: ORANGE },
  queueLeaveMark: { color: '#fff', fontSize: 18, fontFamily: 'Pretendard-Bold', lineHeight: 21 },
  queueLeaveText: { flex: 1, color: UI.ink, fontFamily: 'Pretendard-SemiBold', fontSize: 13, lineHeight: 19, textDecorationLine: 'underline', textDecorationColor: '#000000' },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: UI.line, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff' },
  chipText: { color: UI.ink, fontFamily: 'Pretendard-Medium', fontSize: 13 },
  notice: { backgroundColor: UI.pale, borderRadius: 14, padding: 14 },
  noticeText: { color: '#8c4a22', fontFamily: 'Pretendard-Medium', fontSize: 13, lineHeight: 19 },
  input: { backgroundColor: '#fff', borderColor: UI.line, borderWidth: 1, borderRadius: 13, minHeight: 50, paddingHorizontal: 14, color: UI.ink, fontFamily: 'Pretendard-Regular', fontSize: 16 },
  store: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: '#fff', borderColor: UI.line, borderWidth: 1, borderRadius: 17 },
  storeImage: { width: 74, height: 74, borderRadius: 12 },
  storeName: { color: UI.ink, fontFamily: 'Pretendard-SemiBold', fontSize: 16 },
  storeInfo: { color: UI.muted, fontFamily: 'Pretendard-Regular', fontSize: 12 },
  storePerk: { color: ORANGE, fontFamily: 'Pretendard-SemiBold', fontSize: 12 },
  section: { color: UI.ink, fontFamily: 'Pretendard-Bold', fontSize: 20 },
});
