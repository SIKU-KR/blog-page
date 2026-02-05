import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('API 라우트 호출됨');

  try {
    // 폼 데이터 추출
    const formData = await request.formData();
    const imageFile = formData.get('file');

    if (!imageFile) {
      console.error('이미지 파일 없음');
      return NextResponse.json(
        { success: false, error: { message: '이미지 파일이 없습니다' } },
        { status: 400 }
      );
    }

    console.log('이미지 정보:', {
      타입: typeof imageFile,
      인스턴스: imageFile instanceof File,
      파일이름: imageFile instanceof File ? imageFile.name : '파일 아님',
      파일크기: imageFile instanceof File ? imageFile.size : 0,
    });

    // 백엔드 서버로 전송 시도 (Cloudflare Workers)
    const API_URL = 'https://blog-server.peter012677.workers.dev';
    const cookieHeader = request.headers.get('cookie') || '';

    // 쿠키 정보 로깅
    console.log('쿠키 헤더:', cookieHeader);
    console.log('JSESSIONID 포함 여부:', cookieHeader.includes('JSESSIONID'));
    console.log('isLoggedIn 포함 여부:', cookieHeader.includes('isLoggedIn'));

    try {
      // 새로운 FormData 객체 생성
      const serverFormData = new FormData();
      serverFormData.append('file', imageFile);

      // 요청 헤더 설정
      const headers: HeadersInit = {
        Cookie: cookieHeader,
      };

      // Origin과 Referer 헤더 추가 (CORS 관련)
      headers['Origin'] = request.headers.get('origin') || 'https://localhost:3000';
      headers['Referer'] = request.headers.get('referer') || 'https://localhost:3000';

      // Accept 헤더 추가
      headers['Accept'] = 'application/json';

      // X-Requested-With 헤더 추가 (CSRF 보호 관련)
      headers['X-Requested-With'] = 'XMLHttpRequest';

      // 백엔드 서버로 요청 보내기
      console.log('백엔드 서버 요청 헤더:', headers);

      const response = await fetch(`${API_URL}/admin/images`, {
        method: 'POST',
        body: serverFormData,
        headers,
        credentials: 'include',
        mode: 'cors', // CORS 모드 명시적 설정
      });

      console.log('백엔드 응답 상태:', response.status);
      console.log('백엔드 응답 헤더:', Object.fromEntries(response.headers));

      // 응답 체크
      if (!response.ok) {
        let errorBody = '';
        try {
          // 우선 텍스트로 읽기 시도
          errorBody = await response.text();
          console.error('백엔드 오류 응답 (텍스트):', errorBody);

          // JSON 파싱 시도
          if (errorBody && errorBody.trim().startsWith('{')) {
            const errorJson = JSON.parse(errorBody);
            console.error('백엔드 오류 응답 (JSON):', errorJson);
          }
        } catch (readError) {
          console.error('응답 읽기 오류:', readError);
        }

        throw new Error(
          `백엔드 서버 오류: ${response.status} ${errorBody ? ` - ${errorBody.substring(0, 100)}` : ''}`
        );
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON 파싱 오류:', jsonError);
        const textResponse = await response.text();
        console.log('텍스트 응답:', textResponse);
        throw new Error('응답 형식 오류: JSON이 아닙니다');
      }

      console.log('백엔드 응답 데이터:', data);
      return NextResponse.json(data);
    } catch (uploadError) {
      console.error('백엔드 요청 오류:', uploadError);

      // 백엔드 요청 실패 시 테스트 응답으로 대체 (개발 중에만)
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경에서 테스트 응답 반환');
        return NextResponse.json({
          success: true,
          data: {
            url: `https://example.com/images/${imageFile instanceof File ? imageFile.name : 'image.jpg'}`,
            size: imageFile instanceof File ? imageFile.size : 0,
          },
        });
      }

      throw uploadError; // 프로덕션에서는 오류 전파
    }
  } catch (error) {
    console.error('업로드 프록시 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : '서버 오류',
          stack:
            process.env.NODE_ENV === 'development'
              ? error instanceof Error
                ? error.stack
                : ''
              : undefined,
        },
      },
      { status: 500 }
    );
  }
}
