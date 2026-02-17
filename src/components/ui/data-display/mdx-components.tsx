import type { MDXComponents } from 'mdx/types';

export const sharedMdxComponents: MDXComponents = {
  code: props => {
    const { children, ...rest } = props;
    // rehype-pretty-code가 처리한 코드 블록(data-theme)은 그대로 통과
    if ('data-theme' in rest) {
      return <code {...rest}>{children}</code>;
    }
    // 인라인 코드만 커스텀 스타일 적용
    return <code {...rest}>{children}</code>;
  },
};
