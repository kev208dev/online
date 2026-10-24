import { useFonts } from 'expo-font';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { EntryQrPopup } from '../components/Popups';
import { TabBar } from '../components/TabBar';
import { WaitingProvider } from '../state/waiting';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
  });

  if (!fontsLoaded) return null;

  return (
    <WaitingProvider>
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <StatusBar style="dark" />
        {/* The Figma frames have no Android navigation bar; swipe up to reveal it. */}
        <NavigationBar hidden />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#ffffff' } }}>
          <Stack.Screen name="index" />
          {/* 홈 ↔ 검색 is a tab switch, so it does not slide. */}
          <Stack.Screen name="search/index" options={{ animation: 'none' }} />
          <Stack.Screen name="search/nearby" />
          <Stack.Screen name="search/detail" />
        </Stack>
        <TabBar />
        <EntryQrPopup />
      </View>
    </WaitingProvider>
  );
}
