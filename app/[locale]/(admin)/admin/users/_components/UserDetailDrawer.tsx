'use client';

import { useEffect, useState } from 'react';
import { getUserDetail, type AdminUserDetail } from '@/lib/admin/user-actions';

export function UserDetailDrawer({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getUserDetail(userId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Lỗi không xác định');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Khóa scroll body khi mở
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-bold text-stone-900">Chi tiết người dùng</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          {loading && <div className="text-stone-500">Đang tải...</div>}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          {data && <DetailContent data={data} />}
        </div>
      </div>
    </div>
  );
}

function DetailContent({ data }: { data: AdminUserDetail }) {
  return (
    <>
      {/* Profile section */}
      <Section title="Thông tin cá nhân">
        <Field label="Email" value={data.email} mono />
        <Field label="ID" value={data.id} mono small />
        <Field label="Tên hiển thị" value={data.display_name} />
        <Field label="Số điện thoại" value={data.phone} />
        <Field label="Địa chỉ" value={data.address} />
        <Field label="Giới tính" value={data.gender} />
        <Field label="Năm sinh" value={data.birth_year?.toString() ?? null} />
        <Field label="Vai trò" value={data.role} />
        <Field label="Locale" value={data.locale} />
        <Field label="Country" value={data.country_code} />
        <Field label="Timezone" value={data.timezone} />
        <Field label="Default voice ID" value={data.default_voice_id} mono small />
      </Section>

      <Section title="Hoạt động">
        <Field label="Đăng ký" value={fmtDateTime(data.created_at)} />
        <Field label="Onboarded" value={fmtDateTime(data.onboarded_at)} />
        <Field label="Last sign-in" value={fmtDateTime(data.last_sign_in_at)} />
        <Field label="Last active" value={fmtDateTime(data.last_active_at)} />
        <Field label="Updated" value={fmtDateTime(data.updated_at)} />
      </Section>

      <Section title="Thống kê">
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Số sớ" value={data.so_count} />
          <StatBox label="Voice clones" value={data.voice_count} />
          <StatBox label="Dynamic audio" value={data.dynamic_count} />
        </div>
      </Section>

      <Section title={`Voice clones (${data.voice_profiles.length})`}>
        {data.voice_profiles.length === 0 ? (
          <p className="text-sm text-stone-500">Chưa có voice clone</p>
        ) : (
          <div className="space-y-2">
            {data.voice_profiles.map((v) => (
              <div
                key={v.id}
                className="rounded-lg border border-stone-200 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-stone-900">{v.display_name}</div>
                  <span className="text-xs text-stone-500">
                    {fmtDateTime(v.created_at)}
                  </span>
                </div>
                <div className="mt-1 flex gap-2 text-xs text-stone-600">
                  <span>Provider: {v.provider}</span>
                  <span>·</span>
                  <span>Status: {v.status}</span>
                  <span>·</span>
                  <span>Visibility: {v.visibility}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Sớ gen gần đây (${data.recent_renders.length})`}>
        {data.recent_renders.length === 0 ? (
          <p className="text-sm text-stone-500">Chưa gen sớ nào</p>
        ) : (
          <div className="space-y-2">
            {data.recent_renders.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-stone-200 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-stone-900">
                    {r.template_title ?? r.template_slug ?? '(template không xác định)'}
                  </div>
                  <span className="text-xs text-stone-500">{fmtDateTime(r.created_at)}</span>
                </div>
                <div className="mt-1 flex gap-2 text-xs text-stone-600">
                  <span>Voice: {r.voice_key}</span>
                  {r.duration_ms != null && (
                    <>
                      <span>·</span>
                      <span>{(r.duration_ms / 1000).toFixed(1)}s</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <span className="w-32 shrink-0 text-stone-500">{label}:</span>
      <span
        className={`flex-1 break-all ${mono ? 'font-mono' : ''} ${
          small ? 'text-xs' : ''
        } ${value ? 'text-stone-900' : 'text-stone-400'}`}
      >
        {value || '—'}
      </span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-center">
      <div className="text-2xl font-bold text-stone-900">{value}</div>
      <div className="mt-1 text-xs text-stone-500">{label}</div>
    </div>
  );
}

function fmtDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}