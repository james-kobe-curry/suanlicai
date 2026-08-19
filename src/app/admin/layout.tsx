import AdminNav from '@/components/AdminNav';

/** 管理控制台布局：左侧边栏导航 + 右侧内容区 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex items-start gap-8">
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-20">
          <AdminNav />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="lg:hidden">
          <AdminNav />
        </div>
        {children}
      </div>
      {/* 覆盖根布局 main 的 max-w-5xl，管理端需要全宽 */}
      <style>{`main{max-width:none!important}`}</style>
    </div>
  );
}
