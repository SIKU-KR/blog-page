import { APIClient } from './client';
import { AIService } from './ai';
import { PostsService } from './posts';
import { ImagesService, AuthService as AdminAuthService } from './admin';
import { AuthService } from './auth';
import { EmbeddingService } from './embedding';

// APIClient 인스턴스 생성
const apiClient = APIClient.getInstance();

// 서비스 인스턴스들 생성
const postsService = new PostsService(apiClient);
const aiService = new AIService(apiClient);
const imagesService = new ImagesService(apiClient);
const adminAuthService = new AdminAuthService(apiClient);
const authService = new AuthService(apiClient);
const embeddingService = new EmbeddingService(apiClient);

// 통합된 API 객체 생성
export const api = {
  posts: postsService,
  images: imagesService,
  adminAuth: adminAuthService,
  auth: authService,
  embedding: embeddingService,
  ai: aiService,
};
