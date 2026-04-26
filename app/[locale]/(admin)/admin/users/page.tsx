import { listUsersWithStats, getAdminUserStats } from '@/lib/admin/user-actions';
import { UsersTable } from './_components/UsersTable';
import { StatCards } from './_components/StatCards';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const [users, stats] = await Promise.all([
    listUsersWithStats(),
    getAdminUserStats(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Quản lý người dùng</h1>
        <p className="mt-1 text-sm text-stone-500">
          Tổng {stats.total_users} tài khoản · {stats.total_admins} admin
        </p>
      </div>

      <StatCards stats={stats} />
      <UsersTable users={users} />
    </div>
  );
}