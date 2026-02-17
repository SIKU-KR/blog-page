import type {
  Post,
  GetPostsResponse,
  CreatePostRequest,
  UpdatePostRequest,
  AdminPostsResponse,
} from '@/types';
import { logger } from '@/lib/utils/logger';
import { AdminPostsContractSchema, PostListContractSchema } from '@/shared/schemas';
import { APIClient, API_ENDPOINTS } from './client';
import { parseBoundaryContract } from './contractValidation';

export class PostsService {
  private client: APIClient;

  constructor(client: APIClient) {
    this.client = client;
  }

  async getList(
    page: number = 0,
    size: number = 5,
    sort: string = 'createdAt,desc'
  ): Promise<GetPostsResponse['data']> {
    try {
      logger.debug('게시물 목록 요청', { page, size, sort });
      const response = await this.client.request<GetPostsResponse['data']>({
        url: API_ENDPOINTS.POSTS,
        method: 'GET',
        domain: 'public',
        params: {
          page,
          size,
          sort,
        },
      });
      const validatedResponse = parseBoundaryContract(
        response,
        PostListContractSchema,
        'PostsService.getList'
      );
      logger.debug('게시물 목록 응답', validatedResponse);
      return validatedResponse;
    } catch (error) {
      logger.error('게시물 목록 조회 오류', error);
      throw error;
    }
  }

  async getAdminList(
    page: number = 0,
    size: number = 10,
    sort: string = 'createdAt,desc',
    search?: string,
    state?: string
  ): Promise<AdminPostsResponse> {
    try {
      logger.debug('관리자 게시물 목록 요청', { page, size, sort, search, state });
      const response = await this.client.request<AdminPostsResponse>({
        url: API_ENDPOINTS.ADMIN_POSTS,
        method: 'GET',
        params: {
          page,
          size,
          sort,
          ...(search && { search }),
          ...(state && { state }),
        },
      });
      const validatedResponse = parseBoundaryContract(
        response,
        AdminPostsContractSchema,
        'PostsService.getAdminList'
      );
      logger.debug('관리자 게시물 목록 응답', validatedResponse);
      return validatedResponse;
    } catch (error) {
      logger.error('관리자 게시물 목록 조회 오류', error);
      throw error;
    }
  }

  async getOne(postId: number): Promise<Post> {
    try {
      logger.debug('게시물 상세 요청', { postId });
      const response = await this.client.request<Post>({
        url: `${API_ENDPOINTS.POSTS}/${postId}`,
        method: 'GET',
        domain: 'public',
      });
      logger.debug('게시물 상세 응답', response);
      return response;
    } catch (error) {
      logger.error('게시물 상세 조회 오류', error);
      throw error;
    }
  }

  async getAdminOne(postId: number): Promise<Post> {
    try {
      logger.debug('관리자 게시물 상세 요청', { postId });
      const response = await this.client.request<Post>({
        url: `${API_ENDPOINTS.ADMIN_POSTS}/${postId}`,
        method: 'GET',
        domain: 'admin',
      });
      logger.debug('관리자 게시물 상세 응답', response);
      return response;
    } catch (error) {
      logger.error('관리자 게시물 상세 조회 오류', error);
      throw error;
    }
  }

  async getBySlug(slug: string): Promise<Post> {
    try {
      logger.debug('게시물 슬러그 요청', { slug });
      const response = await this.client.request<Post>({
        url: `${API_ENDPOINTS.POSTS}/${slug}`,
        method: 'GET',
        domain: 'public',
      });
      logger.debug('게시물 슬러그 응답', response);
      return response;
    } catch (error) {
      logger.error('게시물 슬러그 조회 오류', error);
      throw error;
    }
  }

  async create(data: CreatePostRequest): Promise<Post> {
    try {
      logger.debug('게시물 생성 요청', data);
      const response = await this.client.request<Post>({
        url: API_ENDPOINTS.ADMIN_POSTS,
        method: 'POST',
        data,
      });
      logger.debug('게시물 생성 응답', response);
      return response;
    } catch (error) {
      logger.error('게시물 생성 오류', error);
      throw error;
    }
  }

  async update(postId: number, data: UpdatePostRequest): Promise<Post> {
    try {
      logger.debug('게시물 수정 요청', { postId, data });
      const response = await this.client.request<Post>({
        url: `${API_ENDPOINTS.ADMIN_POSTS}/${postId}`,
        method: 'PUT',
        data,
      });
      logger.debug('게시물 수정 응답', response);
      return response;
    } catch (error) {
      logger.error('게시물 수정 오류', error);
      throw error;
    }
  }

  async delete(postId: number): Promise<string> {
    try {
      logger.debug('게시물 삭제 요청', { postId });
      const response = await this.client.request<string>({
        url: `${API_ENDPOINTS.ADMIN_POSTS}/${postId}`,
        method: 'DELETE',
      });
      logger.debug('게시물 삭제 응답', response);
      return response;
    } catch (error) {
      logger.error('게시물 삭제 오류', error);
      throw error;
    }
  }

  async getSitemap(): Promise<string[]> {
    try {
      logger.debug('사이트맵 요청');
      const response = await this.client.request<string[]>({
        url: '/api/sitemap',
        method: 'GET',
        domain: 'public', // Public API 사용
      });
      logger.debug('사이트맵 응답', response);
      return response;
    } catch (error) {
      logger.error('사이트맵 조회 오류', error);
      throw error;
    }
  }
}
