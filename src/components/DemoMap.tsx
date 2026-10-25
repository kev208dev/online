import { AppleMaps } from 'expo-maps';
import { useEffect, useRef, useState } from 'react';
import { ImageBackground, Platform, Pressable, Text, View } from 'react-native';
import { BRANCHES } from '../data/branches';
import { BRANCH_IDS, type BranchId } from '../domain/queue';
import { images } from '../design/assets';
import { UI } from './ui';

const supportsAppleMap = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 17;
const supportsMarkerPress = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 18;

export function DemoMap({ selectedBranchId, onSelectBranch, height = 340 }: {
  selectedBranchId: BranchId;
  onSelectBranch: (id: BranchId) => void;
  height?: number;
}) {
  const map = useRef<AppleMaps.MapView>(null);
  const camera = useRef({ latitude: BRANCHES[selectedBranchId].latitude, longitude: BRANCHES[selectedBranchId].longitude, zoom: 15 });
  const [zoom, setZoom] = useState(15);
  const selected = BRANCHES[selectedBranchId];

  useEffect(() => {
    const next = { latitude: selected.latitude, longitude: selected.longitude, zoom: 15 };
    camera.current = next;
    void map.current?.setCameraPosition({ coordinates: { latitude: next.latitude, longitude: next.longitude }, zoom: 15 });
  }, [selected.latitude, selected.longitude]);

  const changeZoom = (delta: number) => {
    const next = Math.max(10, Math.min(19, camera.current.zoom + delta));
    camera.current = { ...camera.current, zoom: next };
    setZoom(next);
    void map.current?.setCameraPosition({ coordinates: { latitude: camera.current.latitude, longitude: camera.current.longitude }, zoom: next });
  };

  if (!supportsAppleMap) return <ImageBackground source={images.map} style={{ height, justifyContent: 'flex-end', padding: 12 }} resizeMode="cover">
    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 10 }}><Text style={{ color: UI.ink }}>지점은 아래 목록에서 선택해 주세요</Text></View>
  </ImageBackground>;

  return <View style={{ height, overflow: 'hidden', backgroundColor: '#f2f0e9' }}>
    <AppleMaps.View
      ref={map}
      style={{ flex: 1 }}
      cameraPosition={{ coordinates: { latitude: selected.latitude, longitude: selected.longitude }, zoom: 15 }}
      markers={BRANCH_IDS.map((id) => ({ id, title: BRANCHES[id].name, coordinates: { latitude: BRANCHES[id].latitude, longitude: BRANCHES[id].longitude }, tintColor: id === selectedBranchId ? UI.orange : '#614b3f', monogram: id === selectedBranchId ? '✓' : 'S' }))}
      onMarkerClick={supportsMarkerPress ? (marker) => { if (BRANCH_IDS.includes(marker.id as BranchId)) onSelectBranch(marker.id as BranchId); } : undefined}
      onCameraMove={(event) => {
        camera.current = { latitude: event.coordinates.latitude ?? selected.latitude, longitude: event.coordinates.longitude ?? selected.longitude, zoom: event.zoom };
        setZoom(event.zoom);
      }}
      uiSettings={{ compassEnabled: true, scaleBarEnabled: true }}
    />
    <View style={{ position: 'absolute', right: 14, bottom: 14, gap: 8 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="지도 확대" onPress={() => changeZoom(1)} style={{ width: 42, height: 42, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 27, color: UI.ink }}>+</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="지도 축소" onPress={() => changeZoom(-1)} style={{ width: 42, height: 42, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 27, color: UI.ink }}>−</Text></Pressable>
    </View>
    <Text accessibilityLabel={`지도 확대 수준 ${Math.round(zoom)}`} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}>{Math.round(zoom)}</Text>
  </View>;
}
