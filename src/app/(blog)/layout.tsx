import Header from '@/components/layout/Header';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-grow pt-24 pb-6">{children}</main>
    </>
  );
}
