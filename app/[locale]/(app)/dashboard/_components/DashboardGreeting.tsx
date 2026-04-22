interface Props {
  honorific: string;
  fullName: string;
  todayLunar: string;
}

export function DashboardGreeting({ honorific, fullName, todayLunar }: Props) {
  return (
    <div className="px-4 pb-4 pt-6">
      <h1 className="font-serif text-2xl font-medium leading-tight text-[var(--ink)]">
        Chào {honorific} {fullName},
      </h1>
      <p className="mt-1.5 text-sm text-[var(--muted)]">
        Hôm nay là ngày <span className="text-[var(--gold-deep)]">{todayLunar}</span> (Âm lịch)
      </p>
    </div>
  );
}
