import { redirect } from 'next/navigation';
import { listTemplatesWithStatus } from '@/lib/admin/template-actions';
import { TemplateList } from './_components/TemplateList';

export const dynamic = 'force-dynamic';

export default async function AdminTemplatesPage() {
  const res = await listTemplatesWithStatus();

  if (!res.ok) {
    if (res.error === 'Không có quyền admin' || res.error === 'Chưa đăng nhập') {
      redirect('/vi/dashboard');
    }
    return (
      <main className="min-h-screen bg-stone-50/50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            Lỗi: {res.error ?? 'Không load được template'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50/50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Quản lý Thư viện Văn khấn
          </h1>
          <p className="mt-1 text-stone-500">
            Tạo, chỉnh sửa, theo dõi audio status của các văn khấn trong hệ thống.
          </p>
        </header>

        <TemplateList initialTemplates={res.data ?? []} />
      </div>
    </main>
  );
}