import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Notice, Screen } from '../components/ui';
import { STORE_KEYS, type StoreKey } from '../domain/demo';
import { useDemo } from '../state/demo';

export default function MerchantScanner() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const storeId = STORE_KEYS.includes(id as StoreKey) ? id as StoreKey : 'madeby';
  const [permission, requestPermission] = useCameraPermissions();
  const { redeem } = useDemo();
  const [result, setResult] = useState('');
  const [scanned, setScanned] = useState(false);
  const scanning = useRef(false);
  return <Screen title="쿠폰 QR 인증" subtitle="고객이 제시한 시연 QR을 카메라에 맞춰 주세요." back>
    {!permission?.granted ? <Button label="카메라 권한 허용" onPress={() => { requestPermission(); }} /> : <View style={{ height: 350, borderRadius: 20, overflow: 'hidden' }}><CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : ({ data }) => { if (scanning.current) return; scanning.current = true; setScanned(true); const reason = redeem(storeId, data); setResult(reason ?? '쿠폰 사용 처리가 완료됐어요'); }} /></View>}
    {!!result && <Notice text={result} />}
    {permission && !permission.granted && !permission.canAskAgain && <Notice text="기기 설정에서 카메라 권한을 허용해 주세요. 매장용 화면에서는 쿠폰 코드를 직접 입력할 수 있어요." />}
    {scanned && <Button label="다시 스캔" secondary onPress={() => { scanning.current = false; setScanned(false); setResult(''); }} />}
  </Screen>;
}
