import { NextRequest } from 'next/server';

export interface RequestParams {
    locale: string;
    page: number;
    size: number;
    sort: string;
}

export function parseRequestParams(request: NextRequest): RequestParams {
    const searchParams = request.nextUrl.searchParams;

    return {
        locale: searchParams.get('locale') || 'ko',
        page: parseInt(searchParams.get('page') || '0', 10),
        size: parseInt(searchParams.get('size') || '10', 10),
        sort: searchParams.get('sort') || 'createdAt,desc',
    };
}
