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

const WORKFLOW_STEPS = [
  { icon: "event_available", label: "Kegiatan", desc: "TU membuat pengajuan kegiatan" },
  { icon: "payments", label: "Honor", desc: "Sistem hitung honor otomatis" },
  { icon: "verified", label: "Approval", desc: "Kepala Sekolah menyetujui" },
  { icon: "account_balance_wallet", label: "Pembayaran", desc: "Keuangan mencairkan dana" },
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

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-space-base sm:p-space-xl antialiased">
      <main className="w-full max-w-4xl bg-surface-container-lowest rounded-3xl shadow-[0_20px_25px_-5px_rgba(15,23,42,0.1)] border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row">
        {/* Left: form */}
        <div className="w-full md:w-[55%] p-space-xl sm:p-space-2xl flex flex-col justify-center gap-space-lg">
          <div className="flex items-center gap-space-sm">
            <Image
              alt="Logo VAKASI"
              src="/logo.png"
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-xl object-contain bg-surface-container-low p-1"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary font-bold leading-tight">
                VAKASI
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Sistem Manajemen Honorarium Kegiatan
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-space-2xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              Selamat datang kembali
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Masuk untuk mengelola kegiatan dan honorarium sekolah Anda.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-space-md" noValidate>
            <div>
              <label
                className="font-label-md text-label-md text-on-surface font-semibold block mb-space-2xs"
                htmlFor="email-input"
              >
                Email
              </label>
              <div className="relative">
                <Icon
                  name="person"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]"
                />
                <input
                  id="email-input"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@sekolah.sch.id"
                  disabled={form.formState.isSubmitting}
                  className="w-full h-12 pl-10 pr-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="font-body-sm text-body-sm text-error mt-space-2xs">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-space-2xs">
                <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="pwd-input">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-label-sm text-label-sm text-primary hover:underline font-semibold"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Icon
                  name="lock"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]"
                />
                <input
                  id="pwd-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={form.formState.isSubmitting}
                  className="w-full h-12 pl-10 pr-10 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  aria-label="Tampilkan atau sembunyikan password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors focus:outline-none"
                >
                  <Icon name={showPassword ? "visibility" : "visibility_off"} className="text-[20px]" />
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="font-body-sm text-body-sm text-error mt-space-2xs">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
                <Icon name="error" className="text-error text-lg" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full h-12 mt-space-xs rounded-xl bg-primary hover:bg-primary-container text-white font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span>{form.formState.isSubmitting ? "Memproses..." : "Login"}</span>
              <Icon name="arrow_forward" className="text-[20px] text-white" />
            </button>
          </form>
        </div>

        {/* Right: illustration */}
        <div className="hidden md:flex md:w-[45%] bg-linear-to-br from-secondary-container/40 to-surface-container-lowest p-space-2xl flex-col items-center justify-center gap-space-xl">
          <div className="text-center flex flex-col gap-space-xs">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              Honorarium &amp; Kegiatan Sekolah
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
              Satu alur terpadu dari pengajuan kegiatan sampai pencairan honor, transparan dan mudah diaudit.
            </p>
          </div>

          <div className="w-full max-w-xs bg-surface-container-lowest rounded-2xl shadow-md p-space-lg flex flex-col gap-space-md">
            {WORKFLOW_STEPS.map((step, idx) => (
              <div key={step.label} className="flex items-start gap-space-md relative">
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <span className="absolute left-4.75 top-10 w-px h-8 bg-outline-variant/50" />
                )}
                <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 z-10">
                  <Icon name={step.icon} className="text-[20px]" />
                </div>
                <div className="flex flex-col pt-1.5">
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">{step.label}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
