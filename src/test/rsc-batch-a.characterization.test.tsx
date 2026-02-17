import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EditLayout from '@/app/admin/posts/edit/layout';
import WriteLayout from '@/app/admin/posts/write/layout';
import AdminTable from '@/components/admin/AdminTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PostItem from '@/features/posts/components/PostItem';
import { dateUtils } from '@/lib/utils/date';
import { expectStructuralMatch } from './rsc-test-helpers';

describe('Batch A RSC migration characterization', () => {
  it('keeps admin edit and write layout wrappers structurally stable', () => {
    expectStructuralMatch(
      <EditLayout>
        <main>편집 화면</main>
      </EditLayout>,
      '<div class="min-h-screen bg-white"><main>편집 화면</main></div>'
    );

    expectStructuralMatch(
      <WriteLayout>
        <main>작성 화면</main>
      </WriteLayout>,
      '<div class="min-h-screen bg-white"><main>작성 화면</main></div>'
    );
  });

  it('keeps primitive markup stable for badge and button variants', () => {
    expectStructuralMatch(
      <Badge variant="primary" size="sm">
        새 글
      </Badge>,
      '<span class="inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 px-2 py-0.5 text-xs">새 글</span>'
    );

    expectStructuralMatch(
      <Button>저장</Button>,
      '<button class="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600 h-10 px-4 py-2">저장</button>'
    );
  });

  it('keeps post item article structure stable', () => {
    const post = {
      id: 101,
      slug: 'rsc-batch-a',
      title: 'RSC Batch A',
      summary: 'presentational conversion',
      createdAt: '2026-02-17T12:00:00+09:00',
      updatedAt: '2026-02-17T12:00:00+09:00',
    };

    expectStructuralMatch(
      <PostItem post={post} />,
      `<div style="margin-bottom: 64px;"><article><div><p>${dateUtils.format(post.createdAt)}</p></div><a href="/rsc-batch-a"><h2>RSC Batch A</h2></a><p>presentational conversion</p><div><a href="/rsc-batch-a">더 읽기</a></div></article></div>`,
      { ignoreAttributes: ['id', 'class'], normalizeWhitespace: true }
    );
  });

  it('keeps admin table title and empty-state behavior stable', () => {
    render(
      <AdminTable title="게시물 목록" columns={[{ key: 'title', label: '제목' }]} data={[]} />
    );

    expect(screen.getByRole('heading', { level: 2, name: '게시물 목록' })).toBeInTheDocument();
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument();
  });
});
