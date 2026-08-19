'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold text-line">500</p>
      <h1 className="mt-4 text-xl font-semibold text-fg">服务器异常</h1>
      <p className="mt-2 text-sm text-fg3">页面加载时发生错误，请稍后重试</p>
      <button onClick={reset} className="btn-primary mt-6">
        重新加载
      </button>
    </div>
  );
}