# 🔐 Expo 환경변수 관리 가이드

## Expo 환경변수 규칙

Expo에서는 **`EXPO_PUBLIC_`** 접두사가 붙은 환경변수만 클라이언트에서 접근 가능합니다.
- ✅ `EXPO_PUBLIC_WEBVIEW_URL` → 클라이언트에서 접근 가능
- ❌ `SECRET_KEY` → 클라이언트에서 접근 불가 (서버 전용)

---

## 방법 1: .env 파일 사용 (로컬 개발)

### 환경변수 파일 우선순위

Expo는 다음 순서로 환경변수 파일을 로드합니다 (높은 우선순위부터):

1. **`.env.local`** (최우선) - 로컬 개발용, Git에 커밋되지 않음
2. **`.env.development.local`** / **`.env.production.local`** - 환경별 로컬 설정
3. **`.env.development`** / **`.env.production`** - 환경별 설정
4. **`.env`** (기본값) - 공통 설정

### 1. .env 파일 생성

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# 또는 로컬 전용 설정 (최우선)
cp .env.example .env.local
```

### 2. .env 파일에 값 설정

**`.env` (기본값)**
```env
EXPO_PUBLIC_WEBVIEW_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**`.env.local` (로컬 전용, 최우선)**
```env
# .env의 값을 덮어씁니다
EXPO_PUBLIC_WEBVIEW_URL=http://192.168.0.100:3000
```

### 3. 코드에서 사용

```typescript
// ✅ 올바른 방법
const webviewUrl = process.env.EXPO_PUBLIC_WEBVIEW_URL;

// ❌ 잘못된 방법 (접두사 없음)
const secret = process.env.SECRET_KEY; // undefined
```

### 4. .gitignore 확인

`.env` 파일은 이미 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

---

## 방법 2: app.json의 extra 필드 (빌드 시 포함)

### app.json 수정

```json
{
  "expo": {
    "extra": {
      "webviewUrl": process.env.EXPO_PUBLIC_WEBVIEW_URL,
      "supabaseUrl": process.env.EXPO_PUBLIC_SUPABASE_URL,
      "supabaseAnonKey": process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
}
```

### 코드에서 사용

```typescript
import Constants from 'expo-constants';

const webviewUrl = Constants.expoConfig?.extra?.webviewUrl;
```

**단점**: `app.json`은 JSON이므로 함수나 환경변수 직접 참조 불가. 빌드 스크립트 필요.

---

## 방법 3: EAS Build 환경변수 (프로덕션)

### eas.json에 환경변수 설정

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_WEBVIEW_URL": "http://localhost:3000"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_WEBVIEW_URL": "https://staging.example.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_WEBVIEW_URL": "https://app.example.com"
      }
    }
  }
}
```

### EAS Secrets 사용 (권장)

더 안전한 방법은 EAS Secrets를 사용하는 것입니다:

```bash
# 환경변수 설정
eas secret:create --scope project --name EXPO_PUBLIC_WEBVIEW_URL --value https://app.example.com

# 빌드 프로필별로 다른 값 설정
eas secret:create --scope project --name EXPO_PUBLIC_WEBVIEW_URL --value https://staging.example.com --type string
```

빌드 시 자동으로 주입됩니다.

---

## 방법 4: 빌드 스크립트로 app.json 동적 생성

### scripts/generate-app-config.js 생성

```javascript
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const appConfig = {
  expo: {
    // ... 기존 설정
    extra: {
      webviewUrl: process.env.EXPO_PUBLIC_WEBVIEW_URL || 'http://localhost:3000',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};

fs.writeFileSync(
  path.join(__dirname, '../app.config.json'),
  JSON.stringify(appConfig, null, 2)
);
```

### package.json에 스크립트 추가

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-app-config.js",
    "build:android": "npm run prebuild && eas build --platform android"
  }
}
```

---

## 추천 방법 ⭐

### 개발 환경
- **.env 파일** 사용
- `EXPO_PUBLIC_` 접두사 필수
- `process.env.EXPO_PUBLIC_*`로 접근

### 프로덕션 빌드
- **EAS Secrets** 사용 (가장 안전)
- 또는 **eas.json의 env 필드** 사용
- 빌드 프로필별로 다른 값 설정 가능

---

## 현재 프로젝트 적용

현재 `lib/webview/constants.ts`에서 사용 중:
```typescript
const url = process.env.EXPO_PUBLIC_WEBVIEW_URL || FALLBACK_URL;
```

### 설정 방법:

1. **로컬 개발**
   ```bash
   # .env 파일 생성
   EXPO_PUBLIC_WEBVIEW_URL=http://localhost:3000
   ```

2. **EAS Build**
   ```bash
   # EAS Secrets 설정
   eas secret:create --scope project --name EXPO_PUBLIC_WEBVIEW_URL --value https://your-domain.com
   ```

3. **빌드 시 자동 적용**
   - EAS Build는 자동으로 Secrets를 환경변수로 주입
   - 코드 수정 불필요

---

## 주의사항 ⚠️

1. **민감한 정보는 절대 `EXPO_PUBLIC_` 접두사 사용 금지**
   - API 키, 비밀번호 등은 서버에서만 관리

2. **.env 파일은 Git에 커밋하지 않기**
   - `.env.example`만 커밋

3. **빌드 후 환경변수 변경 불가**
   - 빌드 시점의 값이 앱에 포함됨
   - 변경하려면 재빌드 필요

