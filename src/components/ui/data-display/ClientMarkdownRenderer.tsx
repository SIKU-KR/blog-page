'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { proseClasses } from './prose-classes';
import { compileMarkdownAction } from '@/lib/actions/markdown';

interface ClientMarkdownRendererProps {
  content: string;
  className?: string;
}

export default function ClientMarkdownRenderer({
  content,
  className = '',
}: ClientMarkdownRendererProps) {
  const [html, setHtml] = useState('');
  const [isPending, startTransition] = useTransition();
  const latestRequestId = useRef(0);

  useEffect(() => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    startTransition(async () => {
      const result = await compileMarkdownAction(content);

      if (requestId === latestRequestId.current) {
        setHtml(result);
      }
    });
  }, [content]);

  if (isPending && !html) {
    return (
      <div className={`${proseClasses} ${className}`.trim()}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${proseClasses} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
