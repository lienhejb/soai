'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { sendOtp, verifyOtp } from '@/lib/auth/actions';
import { clearDraft, loadDraft } from '@/lib/draft';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = 'email' | 'otp';

export function AuthModal({ open, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock scroll khi mở modal
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Reset state khi đóng
  useEffect(() => {
    if (!open) {
      setStep('email');
      setToken('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await sendOtp(email);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Không gửi được mã');
      return;
    }
    setStep('otp');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (token.length !== 6) {
      setError('Mã OTP gồm 6 chữ số');
      return;
    }
    setError(null);
    setLoading(true);
    const draft = loadDraft();
    const res = await verifyOtp(email, token, draft);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Mã không đúng');
      return;
    }
    clearDraft();
    router.push('/dashboard');
    router.refresh();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          aria-label="Đóng"
        >
          ✕
        </button>

        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <LotusMark />
          <span className="font-serif text-2xl tracking-widest text-stone-800">
            SoAI
          </span>
        </div>

        {step === 'email' ? (
          <EmailStep
            email={email}
            setEmail={setEmail}
            onSubmit={handleSendOtp}
            loading={loading}
            error={error}
          />
        ) : (
          <OtpStep
            email={email}
            token={token}
            setToken={setToken}
            onSubmit={handleVerifyOtp}
            onBack={() => { setStep('email'); setError(null); setToken(''); }}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

function EmailStep({
  email, setEmail, onSubmit, loading, error,
}: {
  email: string;
  setEmail: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-bold text-stone-800">
          Đăng nhập / Đăng ký
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Để lưu giữ Gia Đạo mãi mãi
        </p>
      </div>

      {/* Google - Sắp có */}
      <button
        type="button"
        disabled
        className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-stone-50 py-3 text-stone-400 cursor-not-allowed"
      >
        <GoogleIcon />
        <span className="font-medium">Tiếp tục với Google</span>
        <span className="text-xs">(Sắp có)</span>
      </button>

      <div className="my-4 flex items-center gap-3 text-xs text-stone-400">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="tracking-wider">HOẶC TIẾP TỤC VỚI EMAIL</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative">
  <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Ví dụ: alex@gmail.com"
    required
    autoFocus
    autoComplete="email"
    className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-12 pr-4 text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
  />

  {/* Suggestions dropdown */}
  {email.length > 0 && !email.includes('@') && (
    <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
      {['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'].map((domain) => (
        <button
          key={domain}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setEmail(`${email}@${domain}`);
          }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-stone-700 transition hover:bg-amber-50"
        >
          <span className="text-stone-400">{email}</span>
          <span className="font-medium text-amber-600">@{domain}</span>
        </button>
      ))}
    </div>
  )}
</div>

        {error && (
          <p className="text-sm text-rose-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 font-bold tracking-widest text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 disabled:cursor-not-allowed disabled:bg-none disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none disabled:translate-y-0"
        >
          {loading ? 'ĐANG GỬI...' : 'GỬI MÃ ĐĂNG NHẬP'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-stone-400">
        Bằng việc tiếp tục, bạn đồng ý với{' '}
        <a href="#" className="text-amber-600 hover:underline">Điều khoản</a>
        {' '}và{' '}
        <a href="#" className="text-amber-600 hover:underline">Chính sách bảo mật</a>
      </p>
    </>
  );
}

function OtpStep({
  email, token, setToken, onSubmit, onBack, loading, error,
}: {
  email: string;
  token: string;
  setToken: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-bold text-stone-800">
          Nhập mã xác minh
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Mã 6 chữ số đã gửi đến
        </p>
        <p className="mt-1 text-sm font-medium text-stone-800">
          {email}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          required
          autoFocus
          className="w-full rounded-xl border border-stone-200 bg-white py-4 text-center font-serif text-3xl tracking-[0.5em] text-stone-800 placeholder:text-stone-300 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
        />

        {error && (
          <p className="text-sm text-rose-600 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || token.length !== 6}
          className="w-full rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 font-bold tracking-widest text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40 disabled:cursor-not-allowed disabled:bg-none disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none disabled:translate-y-0"
        >
          {loading ? 'ĐANG XÁC MINH...' : 'XÁC MINH'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-stone-500 hover:text-stone-800 transition"
        >
          ← Đổi email khác
        </button>
      </form>
    </>
  );
}

// ===== Icons =====

function LotusMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3c1.5 3 1.5 6 0 9-1.5-3-1.5-6 0-9z" fill="#d97706" opacity="0.9" />
      <path d="M4 10c3 0 5.5 2 7 5-3 0-5.5-2-7-5z" fill="#d97706" opacity="0.7" />
      <path d="M20 10c-3 0-5.5 2-7 5 3 0 5.5-2 7-5z" fill="#d97706" opacity="0.7" />
      <circle cx="12" cy="16" r="1.5" fill="#d97706" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MailIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}