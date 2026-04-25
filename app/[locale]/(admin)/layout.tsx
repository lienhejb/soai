import { Link } from '@/i18n/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50/50">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-stone-900">SoAI</span>
              <span className="rounded-md bg-stone-900 px-2 py-0.5 text-xs font-medium text-white">
                Admin
              </span>
            </Link>

            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link
                href="/admin"
                className="rounded-md px-3 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/templates"
                className="rounded-md px-3 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                Văn khấn
              </Link>
            </nav>
          </div>

          <Link
            href="/dashboard"
            className="text-sm text-stone-500 hover:text-stone-900"
          >
            ← Về app
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}