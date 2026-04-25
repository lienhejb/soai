// lib/guest.ts
// Server-only helper cho guest mode trên public SEO pages.

import "server-only";

/**
 * Lấy GUEST_USER_ID từ env. Throw lazy — chỉ khi function được gọi,
 * không phải lúc module load. Tránh fail build time khi env chưa set.
 */
export function getGuestUserId(): string {
  const id = process.env.GUEST_USER_ID;
  if (!id) {
    throw new Error(
      "GUEST_USER_ID env var is missing. Set it in .env.local and Vercel."
    );
  }
  return id;
}

export const GUEST_PROFILE = {
  display_name: "Nguyễn Văn A",
  address: "Hà Nội",
  family_surname: "Nguyễn",
} as const;