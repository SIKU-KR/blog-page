# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 기반 개인 기술 블로그 프론트엔드 (https://bumsiku.kr). React 19, TypeScript, TailwindCSS 사용. 백엔드 API(`https://api.bumsiku.kr`)와 통신하며, 자체 API 라우트를 통한 BFF(Backend for Frontend) 패턴도 사용. next-intl 기반 한국어/영어 i18n 지원.

## Development Commands

```bash
npm run dev              # HTTP 개발 서버 (localhost:3000)
npm run dev:https        # HTTPS 개발 서버 (인증 쿠키 테스트용)
npm run build            # 타입 체크 + 프로덕션 빌드
npm run lint             # ESLint 검사
npm run format           # Prettier 포맷팅 (자동 수정)
npm run format:check     # Prettier 포맷팅 검사만
```

## Architecture Overview

### Core Layers

```
src/
├── app/                    # Next.js App Router (페이지 + API 라우트)
├── features/               # Feature-based 모듈 (posts, auth)
├── components/             # UI 컴포넌트 (admin, blog, layout, ui)
├── shared/                 # 공유 인프라 (Zod 스키마, SWR 설정, CVA variants)
├── lib/                    # API 클라이언트, 서비스 레이어, 유틸리티
├── hooks/                  # 전역 커스텀 훅
├── i18n/                   # next-intl 국제화 설정
└── types/                  # 전역 타입 정의
```

### Routing Structure

i18n prefix(`[locale]`)를 사용하며, 한국어는 prefix 없음(`as-needed`), 영어는 `/en` prefix.

- `app/[locale]/page.tsx` — 홈 (무한 스크롤 포스트 목록)
- `app/[locale]/[slug]/page.tsx` — 포스트 상세 (이전 `/posts/:slug`에서 301 리다이렉트)
- `app/admin/` — 관리자 대시보드 (posts CRUD, vectors, write/edit)
- `app/login/page.tsx` — 로그인
- `app/api/` — API 라우트 핸들러 (posts, auth, admin, upload, health)

### Dual API Client (Singleton)

`src/lib/api/client.ts`에서 두 개의 Axios 클라이언트를 관리:
- **adminClient**: 60초 타임아웃, JWT 자동 주입 (Authorization 헤더)
- **publicClient**: 30초 타임아웃, 인증 불필요

요청 인터셉터로 JWT 주입, 응답 인터셉터로 401 시 자동 로그아웃, exponential backoff 재시도(최대 3회).

`src/lib/api/index.ts`에서 통합 `api` 객체로 export:

```typescript
import { api } from '@/lib/api';
// api.posts, api.tags, api.comments, api.images, api.auth, api.ai, api.embedding
```

### Server-Side Service Layer

`src/lib/services/`에 서버사이드 비즈니스 로직이 위치. API 라우트에서 호출됨:
- **PostService**: 포스트 CRUD (Drizzle ORM → PostgreSQL/Supabase)
- **AIService**: AI 요약/슬러그 생성/번역
- **EmbeddingService**: 벡터 임베딩 (pgvector)
- **ImageService**: Supabase Storage 이미지 업로드
- **AuthService**: 인증 로직
- **SitemapService**: 동적 사이트맵 생성

DB: Drizzle ORM + PostgreSQL (Supabase). `posts` 테이블에 slug+locale unique 인덱스.

### Authentication

**클라이언트 사이드 JWT 기반** (cookie 미들웨어 아님):
- 토큰 저장: `localStorage` key `'admin_token'`
- JWT 파싱: `jose` 라이브러리 (`src/lib/api/auth.ts`)
- 만료 체크: `decoded.exp * 1000 < Date.now()`
- 라우트 보호: `useAuthGuard` 훅 (`src/hooks/useAuthGuard.ts`)이 JWT 없거나 만료 시 `/login`으로 리다이렉트
- 글로벌 에러 처리: SWR config에서 401 응답 시 자동 리다이렉트

### State Management

**SWR** — 서버 상태 (전역 설정: `src/shared/lib/swr.ts`):
- `revalidateOnFocus: false`, `keepPreviousData: true`, deduping 2초
- 조회 훅: `features/posts/hooks/` (usePostsQuery, useInfinitePosts 등)
- Mutation 훅: `features/posts/mutations/` (낙관적 업데이트 + 캐시 롤백)

**Zustand** — 로컬 UI 상태 (`features/posts/store/editorStore.ts`):
- 에디터 콘텐츠 (title, content, summary, slug, scheduledAt)
- 로딩/모달/피드백 상태
- 성능 최적화된 셀렉터: useEditorContent, useEditorLoading, useEditorModals

### i18n (next-intl)

- 설정: `src/i18n/routing.ts` — locales: `['ko', 'en']`, prefix: `'as-needed'`
- 메시지: `/messages/ko.json`, `/messages/en.json`
- 서버: `setRequestLocale()` in layout/page
- 클라이언트: `useTranslations()`, `useLocale()` 훅

### Feature-Based Module Pattern

`features/` 내 각 도메인은 독립 모듈:

```
features/posts/
├── components/    # PostList, PostItem, RelatedPosts, ShareButton
├── hooks/         # SWR 조회 훅 (usePostsQuery, useInfinitePosts)
├── mutations/     # 변경 훅 (useCreatePost, useUpdatePost, useDeletePost)
├── store/         # Zustand 에디터 스토어
└── types/         # 포스트 관련 타입
```

**규칙**: features 간 직접 import 금지. 공유 필요 시 `shared/`를 통해.

### Type Validation

Zod 스키마(`shared/types/schemas/`)로 런타임 검증 + TypeScript 타입 추론(`z.infer<>`). react-hook-form에 `zodResolver`로 통합.

### UI 패턴

- **CVA variants**: `shared/ui/variants/` (button, input, badge)
- **cn() utility**: `shared/lib/cn.ts` (clsx + tailwind-merge)
- **아이콘**: lucide-react
- **마크다운 에디터**: @uiw/react-md-editor (admin)
- **마크다운 렌더링**: react-markdown + rehype-raw + rehype-sanitize + react-syntax-highlighter

## Key Global Hooks

| 훅 | 위치 | 용도 |
|---|---|---|
| `useAuthGuard` | `hooks/useAuthGuard.ts` | Admin 라우트 보호 |
| `useDraftManagement` | `hooks/useDraftManagement.ts` | localStorage 자동 저장 |
| `useIntersectionObserver` | `hooks/useIntersectionObserver.ts` | 무한 스크롤 |
| `useDebounce` | `hooks/useDebounce.ts` | 값 디바운스 |
| `useMediaQuery` | `hooks/useMediaQuery.ts` | 반응형 분기 |
| `useImageUpload` | `hooks/useImageUpload.ts` | 이미지 업로드 처리 |

## Code Style Rules

- **Early returns**: 가독성을 위해 early return 패턴 사용
- **Tailwind only**: CSS 대신 Tailwind 클래스만 사용 (globals.css 제외)
- **Event handlers**: `handle` 접두사 (handleClick, handleKeyDown)
- **Accessibility**: tabindex, aria-label 등 접근성 속성 필수
- **Consts over functions**: `const toggle = () => {}` 형태 선호
- **No placeholders**: TODO 주석, 미완성 코드 금지
- **Path alias**: `@/*` → `./src/*`

## Common Pitfalls

- Features 간 직접 import 하지 말 것 → `shared/`를 통해 공유
- Mutation 없이 직접 `api.posts.create()` 호출 금지 → SWR 캐시 무효화 안 됨
- Zod 스키마 없이 `interface`만 정의 금지 → 런타임 검증 불가
- CSS/style 속성 사용 금지 → Tailwind 클래스 사용
- 포스트 URL은 `/posts/:slug`가 아닌 `/:slug` (301 리다이렉트 설정됨)
- 한국어 라우트는 prefix 없음 (`/`), 영어는 `/en/` prefix

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://api.bumsiku.kr
```

`NEXT_PUBLIC_` 접두사가 있어야 클라이언트에서 접근 가능.

## Production Build Notes

`next.config.mjs`:
- `removeConsole`: 프로덕션에서 모든 console.* 제거
- `serverActions.bodySizeLimit`: 20MB (이미지 업로드용)
- `removeImports`: 마크다운 에디터 최적화 (next-remove-imports)
- Supabase Storage 이미지 도메인 허용 (`*.supabase.co`)
- `/posts/:slug*` → `/:slug*` 301 리다이렉트
