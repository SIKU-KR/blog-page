import type {
  AdminPostSummaryContract,
  AdminPostsContract,
  AuthSessionContract,
  PostListContract,
  PostSummaryContract,
} from '@/shared/schemas';

// 관련 게시물 타입
export interface RelatedPost {
  id: number;
  slug: string;
  title: string;
  score: number;
}

// 게시물 관련 타입
export interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  canonicalPath?: string;
  relatedPosts?: RelatedPost[];
}

export type PostSummary = PostSummaryContract;

// Admin API 전용 타입 (scheduled 상태 포함)
export type AdminPostSummary = AdminPostSummaryContract;

export type AdminPostsResponse = AdminPostsContract;

// API 에러 관련 타입
export interface ErrorInfo {
  code: number;
  message: string;
}

export interface ErrorResponse {
  success: boolean;
  error: ErrorInfo;
}

// API 요청 관련 타입
export interface CreatePostRequest {
  title: string;
  slug: string;
  content: string;
  summary: string;
  state: 'draft' | 'published';
  /** ISO 8601 형식. 미래 날짜면 예약 발행 */
  createdAt?: string;
}

export interface UpdatePostRequest {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  state: 'draft' | 'published'; // Required by new backend
  /** ISO 8601 형식. 미래 날짜면 예약 발행, 재예약 가능 */
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type AuthSessionResponse = AuthSessionContract;

// API 응답 관련 타입
export type PostListResponse = PostListContract;

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: ErrorInfo;
}

export type GetPostsResponse = APIResponse<PostListResponse>;

// 이미지 업로드 관련 타입
export interface UploadImageResponse {
  url: string;
  key: string; // R2 storage key (new backend)
}

// 정렬 관련 타입
export type SortOption = 'createdAt,desc' | 'createdAt,asc';

export interface SortOptionInfo {
  value: SortOption;
  label: string;
  description: string;
}
