'use client';

import { useState } from 'react';
import { DashboardGreeting } from './DashboardGreeting';
import { HeroEventCard } from './HeroEventCard';
import { UpcomingEventsBanner } from './UpcomingEventsBanner';
import { SoLibrary } from './SoLibrary';
import { EditProfileModal } from './EditProfileModal';
import type { ComputedEvent } from '@/lib/lunar';
import type { UserSo } from './types';

interface Props {
  honorific: string;
  fullName: string;
  isAdmin: boolean;
  todaySolar: string;
  todayLunar: string;
  availableTemplates: Array<{ id: string; slug: string; title: string }>;
  heroEvent: ComputedEvent | null;
  otherEvents: ComputedEvent[];
  userSos: UserSo[];
  initialProfile: {
    display_name: string;
    gender: 'male' | 'female' | null;
    birth_year: number | null;
    address: string;
  };
}

export function DashboardClient({
  honorific,
  fullName,
  isAdmin,
  todayLunar,
  todaySolar,
  heroEvent,
  availableTemplates,
  otherEvents,
  userSos,
  initialProfile,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
  <DashboardGreeting
    honorific={honorific}
    fullName={fullName}
    todaySolar={todaySolar}
    todayLunar={todayLunar}
    onEdit={() => setEditOpen(true)}
    isAdmin={isAdmin}
  />

  {heroEvent ? (
    <HeroEventCard
      event={heroEvent}
      suggestedTemplateSlug={heroEvent.target_slug}
      suggestedTemplateTitle={heroEvent.title}
      availableTemplates={availableTemplates}
    />
  ) : (
    <div className="mx-5 rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center">
      <p className="text-sm text-stone-500">Không có sự kiện nào trong 30 ngày tới</p>
    </div>
  )}

  <UpcomingEventsBanner events={otherEvents} />

  <SoLibrary sos={userSos} />

  <EditProfileModal
    open={editOpen}
    onClose={() => setEditOpen(false)}
    initial={initialProfile}
    onSaved={() => {}}
  />
</>
  );
}