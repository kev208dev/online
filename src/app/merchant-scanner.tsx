import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Field, Notice, Screen } from '../components/ui';
import { STORE_CATALOG, type StoreId } from '../data/storeCatalog';
import { BRANCH_IDS, type BranchId } from '../domain/queue';
import { useDemo } from '../state/demo';

export default function MerchantScanner() {
  const { mode, branchId, storeId } = useLocalSearchParams<{ mode?: string; branchId?: string; storeId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const { admin, verifyEntry, redeemLocal } = useDemo();
  const [result, setResult] = useState('');
  const [code, setCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const scanning = useRef(false);
  const validBranch = BRANCH_IDS.includes(branchId as BranchId);
  const validStore = !!storeId && storeId in STORE_CATALOG;
  const valid = mode === 'entry' ? validBranch : mode === 'coupon' && validStore;
  const verify = (value: string) => {
    const reason = mode === 'entry' ? verifyEntry(branchId as BranchId, value) : redeemLocal(storeId as StoreId, value);
    setResult(reason ?? (mode === 'entry' ? '입장 인증이 완료됐어요' : '쿠폰 사용 처리가 완료됐어요'));
  };
  if (!admin.unlocked) return <Screen title="관리자 잠금" back><Button label="매장용으로 돌아가기" onPress={() => router.replace('/merchant')} /></Screen>;
  if (!valid) return <Screen title="인증 대상 오류" back><Button label="매장용으로 돌아가기" onPress={() => router.replace('/merchant')} /></Screen>;
  return <Screen title={mode === 'entry' ? '입장 QR 인증' : '쿠폰 QR 인증'} back>
    {!permission?.granted ? <Button label="카메라 권한 허용" onPress={() => { void requestPermission(); }} /> : <View style={{ height: 350, borderRadius: 20, overflow: 'hidden' }}><CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : ({ data }) => { if (scanning.current) return; scanning.current = true; setScanned(true); verify(data); }} /></View>}
    <Field value={code} onChangeText={setCode} placeholder="코드 직접 입력" autoCapitalize="none" />
    <Button label="코드 확인" onPress={() => verify(code)} />
    {!!result && <Notice text={result} />}
    {permission && !permission.granted && !permission.canAskAgain && <Notice text="카메라 권한이 없어도 코드를 직접 입력할 수 있어요." />}
    {scanned && <Button label="다시 스캔" secondary onPress={() => { scanning.current = false; setScanned(false); setResult(''); }} />}
  </Screen>;
}
