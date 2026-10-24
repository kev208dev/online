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
| iPhone 17 - 5 | 가게 상세 (각 가게의 "상세 보기") | `src/app/search/detail.tsx` |
| iPhone 17 - 7 | 쿠폰 발급 팝업 ("쿠폰 받고 지금 방문하기") | `src/components/Popups.tsx` |
| iPhone 17 - 6 | 입장 QR 팝업 (대기 시간 종료 시) | `src/components/Popups.tsx` |

하단 바는 홈 · 검색 · 일정 · 설정 순서입니다. 일정과 설정은 아직 디자인이 없어서 눌러도 이동하지 않습니다.

## 구현 방식

- 모든 화면은 Figma 프레임(402×874)의 레이어 좌표를 그대로 사용하고, 기기 너비에 맞춰 같은 비율로 확대·축소합니다(`src/design/canvas.tsx`).
- 이미지와 아이콘은 Figma에서 내보낸 원본 파일입니다(`assets/images`, `assets/icons`). 글꼴은 디자인과 같은 Pretendard입니다.
- 하단 바, 하단 버튼처럼 화면 아래에 붙은 요소는 화면 높이가 달라도 아래에 붙어 있고, 화면보다 긴 내용은 스크롤됩니다.
