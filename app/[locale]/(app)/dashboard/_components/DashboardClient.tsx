'use client';

import { useState } from 'react';
import { DashboardGreeting } from './DashboardGreeting';
import { HeroEventCard } from './HeroEventCard';
import { UpcomingEvents } from './UpcomingEvents';
import { SoLibrary } from './SoLibrary';
import { EditProfileModal } from './EditProfileModal';
import type { UpcomingEvent, UserSo } from './types';

interface Props {
  honorific: string;
  fullName: string;
  isAdmin: boolean;
  todayLunar: string;
  heroEvent: UpcomingEvent;
  suggestedTemplateSlug?: string;
  suggestedTemplateTitle?: string;
  otherEvents: UpcomingEvent[];
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
  heroEvent,
  suggestedTemplateSlug,
  suggestedTemplateTitle,
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
        todayLunar={todayLunar}
        onEdit={() => setEditOpen(true)}
        isAdmin={isAdmin}
      />

      <HeroEventCard
        event={heroEvent}
        suggestedTemplateSlug={suggestedTemplateSlug}
        suggestedTemplateTitle={suggestedTemplateTitle}
      />

      <UpcomingEvents events={otherEvents} />

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