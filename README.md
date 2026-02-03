# Routiners App (루티너스 앱)

현역 군인을 위한 피트니스 & 웰니스 모바일 애플리케이션

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Expo 54.0 / React Native 0.81 |
| Language | TypeScript 5.9 |
| UI | React 19.1, Lucide Icons |
| Navigation | Expo Router 6.0 |
| Authentication | Supabase Auth, Google Sign-In |
| State | React Hooks |
| WebView | react-native-webview (routiners-web 연동) |

## Project Structure

```
routiners-app/
├── app/                    # Expo Router 페이지
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Main entry (WebView)
│   └── auth/
│       └── callback.tsx    # OAuth callback
├── components/             # 재사용 컴포넌트
│   └── ui/                 # UI 컴포넌트
├── hooks/                  # Custom React Hooks
│   ├── use-auth.ts         # 인증 로직
│   ├── use-webview-*.ts    # WebView 관련 훅
│   └── use-image-picker.ts # 이미지 선택
├── lib/
│   ├── config/
│   │   └── env.ts          # 환경변수 설정
│   ├── supabase/
│   │   └── client.ts       # Supabase 클라이언트
│   ├── webview/            # WebView 브릿지 통신
│   │   ├── bridge.ts       # Native ↔ Web 통신
│   │   └── types.ts        # 공유 타입 (web과 동기화)
│   └── theme.ts            # 테마 설정
├── assets/                 # 이미지, 아이콘
├── plugins/                # Expo 커스텀 플러그인
└── scripts/                # 빌드 스크립트
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 또는 yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (Android 빌드용)
- Xcode (iOS 빌드용, macOS 필요)

### Installation

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 본인 환경에 맞게 수정
```

### Development

```bash
# Expo 개발 서버 시작
npm start

# Android 에뮬레이터에서 실행
npm run android

# iOS 시뮬레이터에서 실행 (macOS only)
npm run ios

# 웹 브라우저에서 실행
npm run web
```

### Build

EAS Build를 사용한 네이티브 빌드:

```bash
# EAS 로그인
eas login

# Development 빌드 (디버깅용)
eas build --profile development --platform android
eas build --profile development --platform ios

# Preview 빌드 (내부 테스트용)
eas build --profile preview --platform android

# Production 빌드
eas build --profile production --platform android
eas build --profile production --platform ios
```

로컬 빌드:

```bash
# Android 로컬 빌드
npm run android:clean

# iOS 로컬 빌드
npm run ios:clean
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_WEBVIEW_URL` | Web 앱 URL (개발: 로컬 IP, 프로덕션: Vercel URL) | Yes |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | Yes |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth Web Client ID | Yes |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo 개발 서버 시작 |
| `npm run android` | Android 앱 실행 |
| `npm run ios` | iOS 앱 실행 |
| `npm run web` | 웹 브라우저에서 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run sync:webview-types` | Web에서 WebView 타입 동기화 |

## Architecture

### WebView Bridge

앱은 WebView를 통해 `routiners-web`과 통신합니다:

```
┌─────────────────┐         ┌─────────────────┐
│  React Native   │ ←─────→ │   Next.js Web   │
│     (App)       │ Bridge  │     (WebView)   │
└─────────────────┘         └─────────────────┘
        │                           │
        │    postMessage / onMessage
        └───────────────────────────┘
```

- `lib/webview/bridge.ts`: 네이티브 기능 (카메라, 갤러리 등) 노출
- `lib/webview/types.ts`: 양쪽에서 공유하는 타입 정의

### Authentication Flow

1. 사용자가 Google 로그인 버튼 클릭
2. `@react-native-google-signin/google-signin`으로 Google OAuth 진행
3. ID Token을 Supabase에 전달
4. Supabase 세션 생성 및 WebView와 동기화

## Troubleshooting

### Metro Bundler 문제

```bash
# Metro 캐시 초기화
npx expo start --clear

# node_modules 재설치
rm -rf node_modules && npm install
```

### Android 빌드 실패

```bash
# Gradle 캐시 초기화
cd android && ./gradlew clean && cd ..

# 완전 재빌드
npm run android:clean
```

### WebView 연결 안됨

1. `EXPO_PUBLIC_WEBVIEW_URL`이 올바른지 확인
2. 개발 시 본인 PC의 로컬 IP 사용 (localhost X)
3. 같은 네트워크에 연결되어 있는지 확인

## Related Projects

- [routiners-web](../routiners-web) - Next.js 웹 애플리케이션
