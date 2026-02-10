import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import AdminHeader from '@/components/layout/AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const messages = await getMessages({ locale: 'ko' });

  return (
    <NextIntlClientProvider locale="ko" messages={messages}>
      <div className="min-h-screen bg-white">
        <AdminHeader />
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
