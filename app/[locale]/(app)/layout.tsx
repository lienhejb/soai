import { createClient } from '@/lib/supabase/server';
import { AppHeader, BottomNav } from '../_components/AppShell';

function getInitials(name: string | null | undefined): string {
  if (!name) return 'NV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'NV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  // VN: chữ cái đầu họ + chữ cái đầu tên cuối
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return (first + last).toUpperCase();
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initials = 'NV';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    initials = getInitials(profile?.display_name);
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[var(--bg-paper)]">
      <AppHeader initials={initials} />
      <main className="pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}