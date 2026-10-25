import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarMetrics } from './tabBarMetrics';
import { STORES, type StoreId } from '../data/stores';
import { type StoreKey } from '../domain/demo';
import { ORANGE } from '../design/canvas';
import { useDemo } from '../state/demo';

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
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, selected && { backgroundColor: ORANGE, borderColor: ORANGE }]}><Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text></Pressable>;
}
export function Notice({ text }: { text: string }) { return <View style={styles.notice}><Text style={styles.noticeText}>{text}</Text></View>; }
export function Field({ value, onChangeText, placeholder, keyboardType = 'default' }: { value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'number-pad' }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} style={styles.input} placeholderTextColor="#9d958f" />;
}
export function StoreCard({ id, onPress }: { id: StoreId; onPress?: () => void }) {
  const store = STORES[id];
  const { state } = useDemo();
  const offer = state.offers[id as StoreKey];
  return <Pressable onPress={onPress ?? (() => router.push({ pathname: '/search/detail', params: { id } }))} style={styles.store} accessibilityRole="button">
    <Image source={store.image} style={styles.storeImage} />
    <View style={{ flex: 1, gap: 5 }}><Text style={styles.storeName}>{store.name}</Text><Text style={styles.storeInfo}>{store.category} · 도보 {store.walkMinutes}분 · 방문 {store.stay}</Text><Text style={styles.storePerk}>{offer?.enabled ? `${offer.title} · 시연 혜택` : '현재 시연 혜택 없음'}</Text></View>
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
