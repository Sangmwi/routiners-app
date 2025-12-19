# 🔧 로컬 빌드 환경변수 관리

## 핵심 정리

**로컬 빌드 (USB 설치)에서 환경변수:**
- ✅ **빌드 전에 `.env` 파일 수정 가능**
- ✅ **빌드 시점에 환경변수가 앱에 포함됨**
- ❌ **설치 후에는 환경변수 변경 불가** (재빌드 필요)

---

## 로컬 빌드 환경변수 설정 방법

### 1. 환경변수 파일 생성/수정

**우선순위 (높은 순서):**
1. `.env.local` (최우선) - 로컬 전용, Git에 커밋되지 않음
2. `.env.development.local` / `.env.production.local`
3. `.env.development` / `.env.production`
4. `.env` (기본값)

**권장: `.env.local` 사용**
```bash
# 프로젝트 루트에 .env.local 파일 생성 (최우선)
EXPO_PUBLIC_WEBVIEW_URL=http://localhost:3000
```

또는 기본 `.env` 파일:
```bash
# .env 파일 생성
EXPO_PUBLIC_WEBVIEW_URL=http://localhost:3000
```

### 2. 빌드 전에 환경변수 확인

```bash
# 환경변수가 제대로 로드되는지 확인
npx expo start
# 또는
npm start
```

### 3. 빌드 실행

```bash
# Android 빌드 (환경변수 포함)
npm run android
# 또는
npx expo run:android
```

**중요**: 빌드 시점의 `.env` 파일 값이 APK에 포함됩니다.

---

## 환경변수 변경 시나리오

### 시나리오 1: 개발 중 URL 변경

```bash
# 1. .env 파일 수정
EXPO_PUBLIC_WEBVIEW_URL=http://192.168.0.100:3000

# 2. 재빌드
npm run android

# 3. 새 APK 설치
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 시나리오 2: 프로덕션 URL로 변경

```bash
# 1. .env 파일 수정
EXPO_PUBLIC_WEBVIEW_URL=https://app.example.com

# 2. 재빌드
npm run android

# 3. 새 APK 설치
```

---

## 로컬 빌드 vs EAS Build 비교

| 항목 | 로컬 빌드 | EAS Build |
|------|----------|-----------|
| 환경변수 소스 | `.env` 파일 | `eas.json` 또는 EAS Secrets |
| 변경 방법 | `.env` 수정 후 재빌드 | EAS Secrets 수정 후 재빌드 |
| 빌드 후 변경 | ❌ 불가능 | ❌ 불가능 |
| 런타임 변경 | ❌ 불가능 | ❌ 불가능 |

**공통점**: 둘 다 빌드 시점에 환경변수가 고정됩니다.

---

## 실제 사용 예시

### 현재 프로젝트 설정

1. **.env 파일 생성**
   ```env
   EXPO_PUBLIC_WEBVIEW_URL=http://localhost:3000
   ```

2. **빌드**
   ```bash
   npm run android
   ```

3. **APK 설치**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

4. **URL 변경이 필요하면**
   ```bash
   # .env 수정
   EXPO_PUBLIC_WEBVIEW_URL=https://new-url.com
   
   # 재빌드
   npm run android
   
   # 재설치
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 주의사항 ⚠️

1. **빌드 후 환경변수 변경 불가**
   - 이미 설치된 앱의 환경변수는 변경할 수 없습니다
   - 변경하려면 재빌드 후 재설치 필요

2. **.env 파일은 Git에 커밋하지 않기**
   - `.env.example`만 커밋
   - 각 개발자가 자신의 `.env` 파일 관리

3. **개발/프로덕션 환경 분리**
   - 개발: `.env` (localhost)
   - 프로덕션: EAS Build + Secrets (실제 도메인)

---

## 요약

**질문**: USB로 로컬 설치할 때 환경변수 못 바꾸는거지?

**답변**: 
- ✅ **빌드 전에 `.env` 파일 수정 가능** → 재빌드하면 반영됨
- ❌ **설치 후에는 변경 불가** → 재빌드 + 재설치 필요

**결론**: 환경변수는 빌드 시점에 고정되므로, 변경하려면 재빌드해야 합니다.

