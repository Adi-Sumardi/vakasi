'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { login } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const SATKER_OPTIONS = [
  { value: '20108391', label: '20108391 - SMAN 1 Unggulan Nusantara' },
  { value: '20108392', label: '20108392 - SMKN 3 Rekayasa & Bisnis' },
  { value: '20108393', label: '20108393 - SMPN 5 Percontohan Kota' },
  { value: '20108394', label: '20108394 - Cabang Dinas Pendidikan Wilayah I' },
];

const ROLE_OPTIONS = [
  { value: 'tu', label: 'Staf Tata Usaha (TU) / Administrasi Sekolah' },
  { value: 'guru', label: 'Guru / Tenaga Pendidik (Penerima Vakasi & Honor)' },
  { value: 'panitia', label: 'Panitia Kegiatan Sekolah (Ujian, PPDB, Lomba, Ekskul)' },
];

export default function LoginPage() {
  const router = useRouter();
  const [authTab, setAuthTab] = useState<'password' | 'otp'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // OTP Simulation states
  const [otpChannel, setOtpChannel] = useState<'wa' | 'email' | 'sms'>('wa');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDestination, setOtpDestination] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);

    try {
      await login(values.email, values.password);
      router.push('/');
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        return;
      }

      setFormError('Tidak dapat terhubung ke server. Coba lagi.');
    }
  }

  function handleOtpDigitChange(index: number, value: string) {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen flex flex-col justify-center items-center p-space-base sm:p-space-xl">
      <main className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-[0_10px_15px_-3px_rgba(15,23,42,0.08)] p-space-xl sm:p-space-2xl border border-outline-variant/30">
        <div className="flex flex-col w-full gap-space-lg">
          {/* Header Section: Logo, Title, and System Pill */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-space-sm">
              <img
                alt="Portal VAKASI - Ekosistem Sianggar"
                className="h-10 w-auto object-contain"
                src="/logo.png"
              />
            </div>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-full bg-surface-container-low text-primary mb-space-xs">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="font-label-sm text-label-sm font-semibold tracking-wider uppercase">
                Portal Honorarium &amp; Kegiatan Sekolah
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Masuk ke Portal VAKASI Sekolah
            </h1>
            <p className="font-body-sm text-body-sm text-secondary mt-space-2xs max-w-sm">
              Sistem Administrasi &amp; Honorarium Tata Usaha, Guru, dan Panitia Sekolah.
            </p>
          </div>

          {/* Security & Institutional Assurance Badge Strip */}
          <div className="grid grid-cols-3 gap-space-xs p-space-xs bg-surface-container-low rounded-xl">
            <div className="flex items-center justify-center gap-space-xs p-space-xs text-center">
              <Icon name="verified_user" className="text-primary text-[18px]" />
              <span className="font-label-sm text-label-sm text-on-surface font-medium truncate">
                Dapodik &amp; BKN
              </span>
            </div>
            <div className="flex items-center justify-center gap-space-xs p-space-xs text-center">
              <Icon name="sync_saved_locally" className="text-tertiary text-[18px]" />
              <span className="font-label-sm text-label-sm text-on-surface font-medium truncate">
                SIPD / BOS Kemdikbud
              </span>
            </div>
            <div className="flex items-center justify-center gap-space-xs p-space-xs text-center">
              <Icon name="gavel" className="text-primary-container text-[18px]" />
              <span className="font-label-sm text-label-sm text-on-surface font-medium truncate">
                Juknis BOS TA 2025
              </span>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex p-space-2xs bg-surface-container rounded-lg" role="tablist">
            <button
              className={cn(
                'flex-1 py-space-xs px-space-sm rounded-lg font-label-md text-label-md text-center transition-all font-semibold flex items-center justify-center gap-space-xs',
                authTab === 'password'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              )}
              onClick={() => setAuthTab('password')}
              type="button"
            >
              <Icon name="mail" className="text-[18px]" />
              <span>Email &amp; Sandi</span>
            </button>
            <button
              className={cn(
                'flex-1 py-space-xs px-space-sm rounded-lg font-label-md text-label-md text-center transition-all font-semibold flex items-center justify-center gap-space-xs',
                authTab === 'otp'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              )}
              onClick={() => setAuthTab('otp')}
              type="button"
            >
              <Icon name="sms" className="text-[18px]" />
              <span>Kode OTP Instan</span>
            </button>
          </div>

          {/* Tab 1: Form Login Email & Sandi */}
          {authTab === 'password' && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-space-md" noValidate>
              {/* Satker Selector */}
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md uppercase tracking-wider text-secondary" htmlFor="satker-select">
                    Pilih Sekolah / Satuan Pendidikan
                  </label>
                  <span className="font-label-sm text-label-sm text-primary font-semibold">Aktif TA 2025</span>
                </div>
                <div className="relative">
                  <select
                    id="satker-select"
                    className="w-full h-10 px-space-md pl-9 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md appearance-none focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/40 transition-colors"
                    defaultValue="20108391"
                  >
                    {SATKER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Icon name="account_balance" className="absolute left-2.5 top-2.5 text-secondary pointer-events-none text-[20px]" />
                  <Icon name="expand_more" className="absolute right-2.5 top-2.5 text-secondary pointer-events-none text-[20px]" />
                </div>
              </div>

              {/* Role Selector */}
              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-md text-label-md uppercase tracking-wider text-secondary" htmlFor="role-select">
                  Peran Masuk (Otoritas Modul)
                </label>
                <div className="relative">
                  <select
                    id="role-select"
                    className="w-full h-10 px-space-md pl-9 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md appearance-none focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/40 transition-colors"
                    defaultValue="tu"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Icon name="badge" className="absolute left-2.5 top-2.5 text-secondary pointer-events-none text-[20px]" />
                  <Icon name="expand_more" className="absolute right-2.5 top-2.5 text-secondary pointer-events-none text-[20px]" />
                </div>
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md uppercase tracking-wider text-secondary" htmlFor="email-input">
                    Alamat Email Terdaftar
                  </label>
                  <span className="font-label-sm text-label-sm text-secondary font-mono">Belajar.id / Resmi</span>
                </div>
                <div className="relative">
                  <input
                    id="email-input"
                    type="email"
                    autoComplete="username"
                    placeholder="budi.santoso@sekolah.sch.id atau guru@belajar.id"
                    disabled={form.formState.isSubmitting}
                    className="w-full h-10 px-space-md pl-9 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline border border-outline-variant/40 focus:outline-none focus:bg-surface-container-lowest transition-colors"
                    {...form.register('email')}
                  />
                  <Icon name="alternate_email" className="absolute left-2.5 top-2.5 text-secondary text-[20px]" />
                </div>
                {form.formState.errors.email && (
                  <p className="font-body-sm text-body-sm text-error">{form.formState.errors.email.message}</p>
                )}
                <p className="font-body-sm text-body-sm text-secondary">
                  Gunakan akun email sekolah atau Belajar.id yang telah terdaftar di SIM.
                </p>
              </div>

              {/* Password Input with Toggle View */}
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md uppercase tracking-wider text-secondary" htmlFor="pwd-input">
                    Kata Sandi Akun
                  </label>
                  <a href="#" className="font-label-sm text-label-sm text-primary hover:underline font-semibold">
                    Kendala Akses?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="pwd-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi terdaftar"
                    disabled={form.formState.isSubmitting}
                    className="w-full h-10 px-space-md pl-9 pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline border border-outline-variant/40 focus:outline-none focus:bg-surface-container-lowest transition-colors"
                    {...form.register('password')}
                  />
                  <Icon name="lock" className="absolute left-2.5 top-2.5 text-secondary text-[20px]" />
                  <button
                    type="button"
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-secondary hover:text-on-surface transition-colors focus:outline-none"
                  >
                    <Icon name={showPassword ? 'visibility' : 'visibility_off'} className="text-[20px]" />
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="font-body-sm text-body-sm text-error">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Remember Session Checkbox */}
              <div className="flex items-center justify-between pt-space-xs">
                <label className="inline-flex items-center gap-space-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded bg-surface-container-low text-primary accent-primary focus:ring-0 focus:outline-none cursor-pointer"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface">Ingat sesi kerja saya di perangkat ini</span>
                </label>
                <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                  <Icon name="timer" className="text-[14px]" />8 Jam
                </span>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
                  <Icon name="error" className="text-error text-lg" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Primary Action: Submit Login */}
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full h-11 mt-space-xs rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-space-xs shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50"
              >
                <span>{form.formState.isSubmitting ? 'Memproses Masuk...' : 'Masuk ke Akun'}</span>
                <Icon name="arrow_forward" className="text-[20px]" />
              </button>
            </form>
          )}

          {/* Tab 2: OTP / Instant SSO Mode */}
          {authTab === 'otp' && (
            <div className="flex flex-col gap-space-md">
              {/* Satker & Role Info Banner */}
              <div className="flex flex-col gap-space-xs p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/40">
                <div className="flex items-center justify-between font-label-sm text-label-sm text-secondary">
                  <span className="flex items-center gap-1">
                    <Icon name="account_balance" className="text-[16px] text-primary" />
                    20108391 - SMAN 1 Unggulan
                  </span>
                  <span className="font-semibold text-primary">TA 2025</span>
                </div>
                <div className="text-body-sm text-on-surface-variant flex items-center gap-1">
                  <Icon name="badge" className="text-[16px] text-secondary" />
                  <span>Peran: <strong className="text-on-surface">Staf TU / Guru / Panitia Sekolah</strong></span>
                </div>
              </div>

              {/* OTP Channel Selection */}
              <div className="flex flex-col gap-space-2xs">
                <label className="font-label-md text-label-md uppercase tracking-wider text-secondary">
                  Tujuan Pengiriman Kode OTP
                </label>
                <div className="grid grid-cols-3 gap-space-xs">
                  <button
                    type="button"
                    onClick={() => setOtpChannel('wa')}
                    className={cn(
                      'flex items-center justify-center gap-space-xs p-space-xs rounded-lg font-label-md text-label-md transition-colors border',
                      otpChannel === 'wa'
                        ? 'bg-surface-container-lowest border-primary text-primary font-semibold shadow-xs'
                        : 'bg-surface-container border-transparent text-on-surface hover:bg-surface-container-high'
                    )}
                  >
                    <Icon name="chat" className="text-[18px] text-tertiary" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpChannel('email')}
                    className={cn(
                      'flex items-center justify-center gap-space-xs p-space-xs rounded-lg font-label-md text-label-md transition-colors border',
                      otpChannel === 'email'
                        ? 'bg-surface-container-lowest border-primary text-primary font-semibold shadow-xs'
                        : 'bg-surface-container border-transparent text-on-surface hover:bg-surface-container-high'
                    )}
                  >
                    <Icon name="mail" className="text-[18px] text-primary" />
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpChannel('sms')}
                    className={cn(
                      'flex items-center justify-center gap-space-xs p-space-xs rounded-lg font-label-md text-label-md transition-colors border',
                      otpChannel === 'sms'
                        ? 'bg-surface-container-lowest border-primary text-primary font-semibold shadow-xs'
                        : 'bg-surface-container border-transparent text-on-surface hover:bg-surface-container-high'
                    )}
                  >
                    <Icon name="sms" className="text-[18px] text-secondary" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>

              {/* Destination Input */}
              <div className="flex flex-col gap-space-2xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md uppercase tracking-wider text-secondary" htmlFor="otp-dest-input">
                    Nomor WhatsApp atau Email
                  </label>
                  <span className="font-label-sm text-label-sm text-tertiary font-semibold">Langsung Terverifikasi</span>
                </div>
                <div className="relative">
                  <input
                    id="otp-dest-input"
                    type="text"
                    value={otpDestination}
                    onChange={(e) => setOtpDestination(e.target.value)}
                    placeholder={otpChannel === 'email' ? 'guru@sekolah.sch.id' : '0812-3456-7890'}
                    className="w-full h-10 px-space-md pl-9 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline border border-outline-variant/40 focus:outline-none focus:bg-surface-container-lowest transition-colors font-mono"
                  />
                  <Icon name="send_to_mobile" className="absolute left-2.5 top-2.5 text-secondary text-[20px]" />
                </div>
                <p className="font-body-sm text-body-sm text-secondary">
                  Kode 6-digit akan dikirim secara instan tanpa perlu mengingat kata sandi.
                </p>
              </div>

              {/* CTA Request OTP */}
              <button
                type="button"
                onClick={() => setOtpSent(true)}
                className="w-full h-10 rounded-lg bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs shadow-xs transition-colors"
              >
                <Icon name="mark_email_read" className="text-[18px]" />
                <span>{otpSent ? 'Kode OTP Terkirim! Kirim Ulang' : 'Kirim Kode OTP via WhatsApp / Email'}</span>
              </button>

              {/* 6-Digit OTP Code Verification Preview Box */}
              <div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/40 flex flex-col gap-space-xs mt-space-2xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md uppercase tracking-wider text-secondary">
                    Masukkan 6 Digit Kode OTP
                  </label>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-mono">
                    <Icon name="timer" className="text-[14px]" />
                    <span>01:45</span>
                  </span>
                </div>
                <div className="flex gap-space-xs justify-between">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      placeholder="•"
                      className="w-10 h-11 text-center font-mono font-semibold text-headline-md rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-surface-container transition-colors"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between font-body-sm text-body-sm text-secondary pt-space-2xs">
                  <span>Tidak menerima kode?</span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(true)}
                    className="font-label-sm text-label-sm text-primary hover:underline font-semibold focus:outline-none"
                  >
                    Kirim Ulang
                  </button>
                </div>
              </div>

              {/* Submit OTP Login */}
              <button
                type="button"
                onClick={() => {
                  router.push('/');
                  router.refresh();
                }}
                className="w-full h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-space-xs shadow-xs transition-colors active:scale-[0.99]"
              >
                <span>Verifikasi &amp; Masuk ke Akun</span>
                <Icon name="login" className="text-[20px]" />
              </button>
            </div>
          )}

          {/* Divider Bar */}
          <div className="relative flex items-center justify-center my-space-2xs">
            <div className="w-full h-px bg-surface-container-high" />
            <span className="absolute bg-surface-container-lowest px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Fitur Administrasi Sekolah
            </span>
          </div>

          {/* System Highlights Grid: Micro Metrics & Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs text-left">
            <div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/40 flex flex-col gap-space-2xs">
              <Icon name="rule" className="text-primary text-[18px]" />
              <span className="font-label-md text-label-md font-semibold text-on-surface">Tarif Juknis BOS</span>
              <span className="font-body-sm text-body-sm text-secondary">Standar tarif honor panitia &amp; pengawas.</span>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/40 flex flex-col gap-space-2xs">
              <Icon name="receipt_long" className="text-tertiary text-[18px]" />
              <span className="font-label-md text-label-md font-semibold text-on-surface">SPJ Otomatis</span>
              <span className="font-body-sm text-body-sm text-secondary">Kuitansi honor guru &amp; tanda terima siap cetak.</span>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/40 flex flex-col gap-space-2xs">
              <Icon name="account_balance_wallet" className="text-primary-container text-[18px]" />
              <span className="font-label-md text-label-md font-semibold text-on-surface">CMS Bank Sekolah</span>
              <span className="font-body-sm text-body-sm text-secondary">Penyaluran transfer rekening honorer &amp; guru.</span>
            </div>
          </div>

          {/* Helpdesk & Support Line */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-space-xs text-secondary font-body-sm text-body-sm gap-2">
            <div className="flex items-center gap-space-xs">
              <Icon name="check_circle" className="text-[16px] text-tertiary" />
              <span>Server SIM Sekolah Terhubung</span>
            </div>
            <a href="#" className="font-label-sm text-label-sm text-primary hover:underline font-semibold flex items-center gap-1">
              <Icon name="support_agent" className="text-[16px]" />
              <span>Helpdesk TU Sekolah</span>
            </a>
          </div>
        </div>
      </main>

      <footer className="mt-space-lg text-center font-label-sm text-label-sm text-secondary">
        &copy; 2025 VAKASI Sekolah - Sistem Tata Kelola Honorarium Guru &amp; Panitia Sekolah.
      </footer>
    </div>
  );
}
