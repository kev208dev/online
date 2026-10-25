import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Field, Notice, Screen } from '../components/ui';
import { STORE_CATALOG, type StoreId } from '../data/storeCatalog';
import { BRANCH_IDS, type BranchId } from '../domain/queue';
import { scannerFeedback } from '../domain/scannerFeedback';
import { useDemo } from '../state/demo';

export default function MerchantScanner() {
  const { mode, branchId, storeId } = useLocalSearchParams<{ mode?: string; branchId?: string; storeId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const { admin, connection, verifyEntry, redeemLocal } = useDemo();
  const [result, setResult] = useState('');
  const [code, setCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const scanning = useRef(false);
  const validBranch = BRANCH_IDS.includes(branchId as BranchId);
  const validStore = !!storeId && storeId in STORE_CATALOG;
  const valid = mode === 'entry' ? validBranch : mode === 'coupon' && validStore;
  const verify = async (value: string, source: 'scan' | 'manual') => {
    if (busy) return;
    setBusy(true);
    try {
      const reason = mode === 'entry' ? await verifyEntry(branchId as BranchId, value) : await redeemLocal(storeId as StoreId, value);
      const feedback = scannerFeedback(mode === 'entry' ? 'entry' : 'coupon', reason);
      setResult(source === 'scan' && feedback.kind === 'success' ? '' : feedback.message);
      if (source === 'scan' && feedback.kind === 'success') { setSuccessMessage(feedback.message); setSuccessVisible(true); }
      if (!reason) setCode('');
    } finally { setBusy(false); }
  };
  if (!admin.unlocked) return <Screen title="관리자 잠금" back><Button label="매장용으로 돌아가기" onPress={() => router.replace('/merchant')} /></Screen>;
  if (connection.mode === 'customer' || (connection.mode === 'merchant' && connection.status !== 'connected')) return <Screen title="매장용 연결 확인" back><Notice text="Mac 연결을 확인해 주세요." /><Button label="매장용으로 돌아가기" onPress={() => router.replace('/merchant')} /></Screen>;
  if (!valid) return <Screen title="인증 대상 오류" back><Button label="매장용으로 돌아가기" onPress={() => router.replace('/merchant')} /></Screen>;
  return <><Screen title={mode === 'entry' ? '입장 QR 인증' : '쿠폰 QR 인증'} back>
    {!permission?.granted ? <Button label="카메라 권한 허용" onPress={() => { void requestPermission(); }} /> : <View style={{ height: 350, borderRadius: 20, overflow: 'hidden' }}><CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : ({ data }) => { if (scanning.current) return; scanning.current = true; setScanned(true); void verify(data, 'scan'); }} /></View>}
    <Field value={code} onChangeText={setCode} placeholder="코드 직접 입력" autoCapitalize="none" />
    <Button label={busy ? '확인 중…' : '코드 확인'} disabled={busy || !code.trim()} onPress={() => { void verify(code, 'manual'); }} />
    {!!result && <Notice text={result} />}
    {permission && !permission.granted && !permission.canAskAgain && <Notice text="카메라 권한이 없어도 코드를 직접 입력할 수 있어요." />}
    {scanned && <Button label="다시 스캔" secondary onPress={() => { scanning.current = false; setScanned(false); setResult(''); }} />}
  </Screen>
    <Modal visible={successVisible} transparent animationType="fade" onRequestClose={() => setSuccessVisible(false)}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.checkCircle} accessibilityLabel="인증 완료"><Text style={styles.check}>✓</Text></View>
          <Text style={styles.title}>인증 완료</Text>
          <Text style={styles.message}>{successMessage}</Text>
          <Pressable accessibilityRole="button" onPress={() => setSuccessVisible(false)} style={styles.confirm}><Text style={styles.confirmText}>확인</Text></Pressable>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  dialog: { width: '100%', maxWidth: 320, borderRadius: 24, backgroundColor: '#fff', padding: 28, alignItems: 'center', gap: 12 },
  checkCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#24A968', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  check: { color: '#fff', fontSize: 43, fontWeight: '700', lineHeight: 52 },
  title: { color: '#211c19', fontSize: 23, fontWeight: '700' },
  message: { color: '#786f69', fontSize: 14, textAlign: 'center' },
  confirm: { alignSelf: 'stretch', backgroundColor: '#24A968', borderRadius: 14, minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
