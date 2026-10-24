# online

Figma 파일 `2026 스타텁톤`의 앱 화면을 그대로 옮긴 Expo(React Native) 앱입니다.

## 실행

```bash
npm install
npx expo start
```

휴대폰에 **Expo Go** 앱을 설치하고 터미널에 나온 QR 코드를 찍으면 바로 실행됩니다.

### 입장 QR 팝업 바로 보기

대기 시간은 디자인 값(2시간 9분)부터 실제 시간으로 줄어들고, 0이 되면 입장 QR 팝업(17-6)이 지금 보고 있는 화면 위에 뜹니다. 기다리지 않고 확인하려면 대기 시간을 초 단위로 줄여서 실행하세요.

```bash
EXPO_PUBLIC_WAIT_SECONDS=15 npx expo start
```

## 화면

| Figma 프레임 | 화면 | 파일 |
| --- | --- | --- |
| iPhone 17 - 4 | 홈 (기본 화면) | `src/app/index.tsx` |
| iPhone 17 - 1 | 검색 | `src/app/search/index.tsx` |
| iPhone 17 - 8 | 주변 가게 (검색 → "주변 가게 더 찾아보기") | `src/app/search/nearby.tsx` |
| iPhone 17 - 5 | 가게 상세 (가게 칸이나 "상세 보기"를 누르면 그 가게의 상세) | `src/app/search/detail.tsx` |
| iPhone 17 - 7 | 쿠폰 발급 팝업 ("쿠폰 받고 지금 방문하기") | `src/components/Popups.tsx` |
| iPhone 17 - 6 | 입장 QR 팝업 (대기 시간 종료 시) | `src/components/Popups.tsx` |

하단 바는 홈 · 검색 · 일정 · 설정 순서입니다. 일정과 설정은 아직 디자인이 없어서 눌러도 이동하지 않습니다.

- 검색 화면과 상세 화면의 지도는 손가락으로 끌어서 움직일 수 있습니다(`src/design/map.tsx`).
- 가게 정보는 `src/data/stores.ts` 한 곳에 있습니다. 디자인에 없는 가게의 주소·영업시간 중 확인되지 않은 것은 임시 문구이니 실제 정보로 바꿔 주세요.
- 안드로이드 하단 네비게이션 바는 숨겨져 있고, 화면 아래에서 위로 쓸어 올리면 잠깐 나타납니다.

## 구현 방식

- 모든 화면은 Figma 프레임(402×874)의 레이어 좌표를 그대로 사용하고, 기기 너비에 맞춰 같은 비율로 확대·축소합니다(`src/design/canvas.tsx`).
- 이미지와 아이콘은 Figma에서 내보낸 원본 파일입니다(`assets/images`, `assets/icons`). 글꼴은 디자인과 같은 Pretendard입니다.
- 하단 바, 하단 버튼처럼 화면 아래에 붙은 요소는 화면 높이가 달라도 아래에 붙어 있고, 화면보다 긴 내용은 스크롤됩니다.

## 활용 기술

| QR 코드 (react-native-qrcode-svg) | React Native | Http |
| --- | --- | --- |
| 입장 · 쿠폰 QR 생성 | 안드로이드 / iOS 멀티 플랫폼 지원 | 지도 API 호출 |
| 매장 QR 스캔 인증 (expo-camera) | UI 구성 | 주변 가게 정보 GET |
| 시간 제한 1회용 QR (JWT 토큰 서명) | 웨이팅 · 쿠폰 상태 관리 | 웨이팅 정보 POST |

지금 구현되어 있는 것은 React Native 칸입니다. QR은 아직 고정 이미지(`assets/images/qr.png`)이고, 웨이팅은 서버 없이 시간만 줄어드는 시뮬레이션, 지도는 고정 이미지라서 QR과 Http 칸은 앞으로 붙일 기술입니다.
