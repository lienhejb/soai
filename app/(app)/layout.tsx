import { AppHeader, BottomNav } from '../_components/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-[var(--bg-paper)]">
      <AppHeader />
      <main className="pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
