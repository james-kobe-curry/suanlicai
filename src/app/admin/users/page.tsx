import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { isAdmin } from '@/lib/api';
import UserAdminPanel from '@/components/UserAdminPanel';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!isAdmin(user)) redirect('/');

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-brand">Users Management</p>
        <h1 className="mt-1 text-xl font-semibold text-fg">用户管理</h1>
      </div>
      <UserAdminPanel />
    </div>
  );
}