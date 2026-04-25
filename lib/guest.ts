// lib/guest.ts
// Server-only helper cho guest mode trên public SEO pages.
// Guest user là 1 row cố định trong auth.users + profiles, dùng để cache
// dynamic_audio cross-guest (mọi visitor chưa login share chung 1 row).

import "server-only";

export const GUEST_USER_ID = process.env.GUEST_USER_ID;

if (!GUEST_USER_ID) {
  throw new Error(
    "GUEST_USER_ID env var is missing. Set it in .env.local and Vercel."
  );
}

export const GUEST_PROFILE = {
  id: GUEST_USER_ID,
  display_name: "Nguyễn Văn A",
  address: "Hà Nội",
  family_surname: "Nguyễn",
} as const;