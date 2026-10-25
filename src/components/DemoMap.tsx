import { router } from 'expo-router';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import { STORES } from '../data/stores';
import { STORE_KEYS } from '../domain/demo';
import { images } from '../design/assets';
import { UI } from './ui';

const WIDTH = 1480;
const HEIGHT = 1386;
export function DemoMap() {
  return <View style={{ gap: 7 }}>
    <ImageBackground source={images.map} resizeMode="stretch" style={{ width: '100%', aspectRatio: WIDTH / HEIGHT, borderRadius: 15, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: `${648.6 / WIDTH * 100}%`, top: `${761.8 / HEIGHT * 100}%`, backgroundColor: UI.ink, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color: '#fff', fontFamily: 'Pretendard-SemiBold', fontSize: 11 }}>성심당</Text></View>
      {STORE_KEYS.filter((id) => !!STORES[id].mapPosition).map((id) => {
        const point = STORES[id].mapPosition!;
        return <Pressable key={id} accessibilityLabel={`${STORES[id].name} 상세 보기`} onPress={() => router.push({ pathname: '/search/detail', params: { id } })} style={{ position: 'absolute', left: `${point.x / WIDTH * 100}%`, top: `${point.y / HEIGHT * 100}%`, backgroundColor: UI.orange, borderColor: '#fff', borderWidth: 2, borderRadius: 999, minWidth: 38, minHeight: 38, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontFamily: 'Pretendard-Bold', fontSize: 15 }}>●</Text></Pressable>;
      })}
    </ImageBackground>
    <Text style={{ color: UI.muted, fontSize: 12 }}>● 주황색은 시연 지도에 표시된 로컬 가게입니다. 정확한 위치는 상세에서 확인하세요.</Text>
  </View>;
}
