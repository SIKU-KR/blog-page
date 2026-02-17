'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface RedirectHandlerProps {
  redirectPath: string;
}

const RedirectHandler = ({ redirectPath }: RedirectHandlerProps) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== redirectPath) {
      router.replace(redirectPath);
    }
  }, [redirectPath, router, pathname]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">페이지를 이동하고 있습니다...</p>
      </div>
    </div>
  );
};

export default RedirectHandler;
