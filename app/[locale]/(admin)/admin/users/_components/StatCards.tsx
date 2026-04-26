import type { AdminUserStats } from '@/lib/admin/user-actions';

export function StatCards({ stats }: { stats: AdminUserStats }) {
  const items = [
    { label: 'Tổng người dùng', value: stats.total_users, color: 'text-stone-900' },
    { label: 'Admin', value: stats.total_admins, color: 'text-amber-600' },
    { label: 'Mới 7 ngày', value: stats.new_7d, color: 'text-emerald-600' },
    { label: 'Mới 30 ngày', value: stats.new_30d, color: 'text-blue-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wider text-stone-500">
            {it.label}
          </div>
          <div className={`mt-2 text-3xl font-bold ${it.color}`}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}