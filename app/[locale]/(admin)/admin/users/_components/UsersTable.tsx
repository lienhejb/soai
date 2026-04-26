'use client';

import { useState } from 'react';
import type { AdminUserRow } from '@/lib/admin/user-actions';
import { UserDetailDrawer } from './UserDetailDrawer';

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr className="text-left text-xs uppercase tracking-wider text-stone-500">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Tên hiển thị</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Đăng ký</th>
                <th className="px-4 py-3 text-right">Sớ</th>
                <th className="px-4 py-3 text-right">Voice</th>
                <th className="px-4 py-3 text-right">Dynamic</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-700">{u.email}</td>
                  <td className="px-4 py-3 text-stone-900">
                    {u.display_name || <span className="text-stone-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-stone-600">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-right font-mono text-stone-700">{u.so_count}</td>
                  <td className="px-4 py-3 text-right font-mono text-stone-700">{u.voice_count}</td>
                  <td className="px-4 py-3 text-right font-mono text-stone-700">{u.dynamic_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setOpenId(u.id)}
                      aria-label="Xem chi tiết"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-stone-500">
                    Chưa có user nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openId && <UserDetailDrawer userId={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
      User
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}