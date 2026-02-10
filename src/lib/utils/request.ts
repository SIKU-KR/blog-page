import { NextRequest } from 'next/server';

export interface RequestParams {
    locale: string;
    page: number;
    size: number;
    sort: string;
    search?: string;
    state?: string;
}

export function parseRequestParams(request: NextRequest): RequestParams {
    const searchParams = request.nextUrl.searchParams;

    const params: RequestParams = {
        locale: searchParams.get('locale') || 'ko',
        page: parseInt(searchParams.get('page') || '0', 10),
        size: parseInt(searchParams.get('size') || '10', 10),
        sort: searchParams.get('sort') || 'createdAt,desc',
    };

    const search = searchParams.get('search');
    if (search) params.search = search;

    const state = searchParams.get('state');
    if (state) params.state = state;

    return params;
}
