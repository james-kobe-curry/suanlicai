import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold text-line">404</p>
      <h1 className="mt-4 text-xl font-semibold text-fg">页面不存在</h1>
      <p className="mt-2 text-sm text-fg3">您访问的页面未找到或已被移除</p>
      <Link href="/" className="btn-primary mt-6 inline-block">
        返回首页
      </Link>
    </div>
  );
}