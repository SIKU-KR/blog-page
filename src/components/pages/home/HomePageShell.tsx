import BlogSection from '@/components/sections/BlogSection';
import HeroSection from '@/components/sections/HeroSection';
import Divider from '@/components/ui/Divider';
import Container from '@/components/ui/Container';
import type { PostSummary } from '@/types';

interface HomePageShellProps {
  posts: PostSummary[];
  totalElements: number;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const HomePageShell = ({
  posts,
  totalElements,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: HomePageShellProps) => {
  return (
    <Container size="md">
      <HeroSection
        title="안녕하세요, SIKU(시쿠)입니다."
        subtitle="건국대학교 컴퓨터공학부 4학년 재학중이며,\n다양한 경험과 배움을 제것으로 만들고자 포스팅에 기록하고 있습니다."
        imageSrc="/profile.jpg"
        profileAlt="프로필 이미지"
      />

      <div className="py-2">
        <BlogSection
          posts={posts}
          totalPosts={totalElements}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
        />
      </div>
    </Container>
  );
};

export default HomePageShell;
