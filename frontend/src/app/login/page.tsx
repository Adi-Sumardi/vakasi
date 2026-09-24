"use client";

import Image from 'next/image';
import Link from 'next/link';
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Icon } from "@/components/ui/icon";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/types";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Alur nyata sistem ini, bukan basa-basi pemasaran. Langkah terakhir
 * berhenti di penerusan ke Sianggar: pencairan tidak terjadi di VAKASI
 * (FLOW.md section 8), jadi menjanjikannya di sini akan menyesatkan.
 */
const WORKFLOW_STEPS = [
  { icon: "event_available", label: "Kegiatan", desc: "TU mengajukan kegiatan dan pesertanya" },
  { icon: "calculate", label: "Honor", desc: "Nominal dihitung otomatis dari master tarif" },
  { icon: "verified", label: "Approval", desc: "Kepala Sekolah menyetujui dan menerbitkan SK" },
  { icon: "cloud_upload", label: "Pencairan", desc: "Diteruskan ke Sianggar untuk dibayarkan" },
];

const TRUST_POINTS = [
  { icon: "qr_code", label: "QR verifikasi publik di tiap SK" },
  { icon: "shield_check", label: "Jejak audit untuk setiap perubahan" },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);

    try {
      await login(values.email, values.password);
      router.push("/");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        return;
      }

      setFormError("Tidak dapat terhubung ke server. Coba lagi.");
    }
  }

  const submitting = form.formState.isSubmitting;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface p-space-base sm:p-space-xl antialiased">
      {/* Cahaya latar: memberi kedalaman pada halaman tanpa menambah
          gambar yang harus diunduh. aria-hidden karena murni dekoratif. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-24 h-[32rem] w-[32rem] rounded-full bg-secondary-container/50 blur-3xl" />
      </div>

      <main className="relative w-full max-w-5xl rounded-3xl bg-surface-container-lowest shadow-[0_30px_60px_-20px_rgba(11,28,48,0.28)] ring-1 ring-outline-variant/30 overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-500">
        {/* ---------- Panel merek ---------- */}
        <aside className="relative order-first md:order-last md:w-[46%] overflow-hidden bg-linear-to-br from-[#000a4d] via-primary to-primary-container text-white">
          {/* Cincin konsentris di belakang lambang — memberi titik fokus
              visual tanpa aset grafis tambahan. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -top-10 -right-6 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
          </div>

          <div className="relative flex h-full flex-col justify-between gap-space-xl p-space-lg sm:p-space-xl md:p-space-2xl">
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <Image
                  alt="Logo YAPI"
                  src="/logo.png"
                  width={44}
                  height={44}
                  priority
                  className="h-11 w-11 rounded-xl bg-white/95 object-contain p-1 shadow-sm"
                />
                <div className="flex flex-col leading-tight">
                  <span className="font-headline-sm text-headline-sm font-bold">VAKASI</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-white/70">
                    Yayasan Asrama Pelajar Islam
                  </span>
                </div>
              </div>

              {/* Judul panel hanya tampil di desktop: di mobile panel ini
                  berada di atas form, jadi apa pun yang ditambahkan di sini
                  mendorong kolom login keluar layar. */}
              <h2 className="hidden md:block font-headline-md text-headline-md font-bold leading-snug">
                Satu alur, dari kegiatan sampai honor cair.
              </h2>
            </div>

            {/* Timeline alur */}
            <ol className="hidden md:flex flex-col gap-space-md">
              {WORKFLOW_STEPS.map((step, idx) => (
                <li
                  key={step.label}
                  className="relative flex items-start gap-space-md animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                  style={{ animationDelay: `${200 + idx * 90}ms`, animationDuration: "500ms" }}
                >
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <span aria-hidden className="absolute left-5 top-11 h-7 w-px bg-white/25" />
                  )}
                  <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                    <Icon name={step.icon} className="text-[18px] text-white" />
                  </span>
                  <span className="flex flex-col pt-0.5">
                    <span className="font-label-lg text-label-lg font-semibold">{step.label}</span>
                    <span className="font-body-sm text-body-sm text-white/70">{step.desc}</span>
                  </span>
                </li>
              ))}
            </ol>

            <ul className="hidden md:flex flex-col gap-space-xs border-t border-white/15 pt-space-md">
              {TRUST_POINTS.map((point) => (
                <li key={point.label} className="flex items-center gap-space-sm font-body-sm text-body-sm text-white/75">
                  <Icon name={point.icon} className="text-[16px] text-white/90" />
                  <span>{point.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ---------- Panel form ---------- */}
        <div className="flex w-full flex-col justify-center gap-space-lg p-space-xl sm:p-space-2xl md:w-[54%]">
          <div className="flex flex-col gap-space-2xs">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
              Masuk ke akun Anda
            </span>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              Selamat datang kembali
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Kelola kegiatan dan honorarium sekolah dalam satu tempat.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-space-md" noValidate>
            <div>
              <label
                className="mb-space-2xs block font-label-md text-label-md font-semibold text-on-surface"
                htmlFor="email-input"
              >
                Email
              </label>
              <div className="group relative">
                <Icon
                  name="person"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-outline transition-colors group-focus-within:text-primary"
                />
                <input
                  id="email-input"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@sekolah.sch.id"
                  disabled={submitting}
                  aria-invalid={Boolean(form.formState.errors.email)}
                  className="h-12 w-full rounded-xl border border-outline-variant/50 bg-surface-container-low pl-11 pr-3.5 font-body-md text-body-md text-on-surface transition-all placeholder:text-outline focus:border-primary focus:bg-surface-container-lowest focus:outline-none focus:ring-4 focus:ring-primary/15 aria-[invalid=true]:border-error"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="mt-space-2xs font-body-sm text-body-sm text-error">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-space-2xs flex items-center justify-between">
                <label className="font-label-md text-label-md font-semibold text-on-surface" htmlFor="pwd-input">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-label-sm text-label-sm font-semibold text-primary hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="group relative">
                <Icon
                  name="lock"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-outline transition-colors group-focus-within:text-primary"
                />
                <input
                  id="pwd-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={submitting}
                  aria-invalid={Boolean(form.formState.errors.password)}
                  className="h-12 w-full rounded-xl border border-outline-variant/50 bg-surface-container-low pl-11 pr-11 font-body-md text-body-md text-on-surface transition-all placeholder:text-outline focus:border-primary focus:bg-surface-container-lowest focus:outline-none focus:ring-4 focus:ring-primary/15 aria-[invalid=true]:border-error"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md text-outline transition-colors hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <Icon name={showPassword ? "visibility" : "visibility_off"} className="text-[20px]" />
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-space-2xs font-body-sm text-body-sm text-error">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-error-container p-3 text-sm font-medium text-on-error-container animate-in fade-in slide-in-from-top-1"
              >
                <Icon name="error" className="mt-px text-lg text-error" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group mt-space-xs flex h-12 w-full cursor-pointer items-center justify-center gap-space-xs rounded-xl bg-linear-to-r from-primary to-primary-container font-label-lg text-label-lg font-bold text-white shadow-[0_8px_20px_-8px_var(--primary)] transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{submitting ? "Memproses…" : "Masuk"}</span>
              <Icon
                name="arrow_forward"
                className="text-[20px] text-white transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </form>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Belum punya akses? Hubungi Tata Usaha atau administrator sekolah Anda.
          </p>
        </div>
      </main>
    </div>
  );
}
