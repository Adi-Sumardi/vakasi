'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/format';
import { ApiError } from '@/lib/api/types';
import type { ActivityType, FundSource, HonorType, Unit } from '@/lib/api/master-data';
import type { Employee } from '@/lib/api/employees';
import {
  addActivityMember,
  calculateHonor,
  createActivity,
  removeActivityMember,
  submitActivity,
  type ActivityMember,
  type HonorDetail,
} from '@/lib/api/activities';

type Props = {
  activityTypes: ActivityType[];
  units: Unit[];
  fundSources: FundSource[];
  honorTypes: HonorType[];
  employees: Employee[];
};

const STEPS = ['Informasi & Anggaran', 'Peserta & Honor', 'Review & Submit'] as const;

export function CreateActivityWizard({ activityTypes, units, fundSources, honorTypes, employees }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [activityId, setActivityId] = useState<number | null>(null);
  const [activityCode, setActivityCode] = useState<string | null>(null);
  const [info, setInfo] = useState({
    name: '',
    activity_type_id: activityTypes[0]?.id ?? 0,
    unit_id: units[0]?.id ?? 0,
    fund_source_id: fundSources[0]?.id ?? 0,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    location: '',
    budget_amount: 1000000,
    description: '',
    pic_employee_id: 0,
  });

  const [members, setMembers] = useState<ActivityMember[]>([]);
  const [memberForm, setMemberForm] = useState({ employee_id: employees[0]?.id ?? 0, role_name: '' });

  const [honorForm, setHonorForm] = useState<Record<number, { honor_type_id: number; volume: number }>>({});
  const [honorDetails, setHonorDetails] = useState<HonorDetail[]>([]);
  const [honorTotals, setHonorTotals] = useState({ gross_amount: 0, tax_amount: 0, net_amount: 0 });

  async function handleCreateActivity(e: React.FormEvent) {
    e.preventDefault();

    if (info.end_date < info.start_date) {
      toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    if (Number(info.budget_amount) <= 0) {
      toast.error('Anggaran kegiatan harus lebih besar dari Rp 0.');
      return;
    }

    setSubmitting(true);
    try {
      const activity = await createActivity({
        ...info,
        activity_type_id: Number(info.activity_type_id),
        unit_id: Number(info.unit_id),
        fund_source_id: Number(info.fund_source_id),
        budget_amount: Number(info.budget_amount),
        pic_employee_id: info.pic_employee_id ? Number(info.pic_employee_id) : null,
      });
      setActivityId(activity.id);
      setActivityCode(activity.activity_code);
      toast.success(`Kegiatan ${activity.activity_code} berhasil dibuat sebagai DRAFT.`);
      setStep(1);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal membuat kegiatan.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!activityId || !memberForm.role_name.trim()) {
      toast.error('Peran penugasan wajib diisi.');
      return;
    }
    try {
      const member = await addActivityMember(activityId, {
        employee_id: Number(memberForm.employee_id),
        role_name: memberForm.role_name,
      });
      setMembers((prev) => [...prev, member]);
      setHonorForm((prev) => ({
        ...prev,
        [member.employee.id]: { honor_type_id: honorTypes[0]?.id ?? 0, volume: 1 },
      }));
      setMemberForm({ employee_id: employees[0]?.id ?? 0, role_name: '' });
      toast.success('Peserta ditambahkan.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menambahkan peserta.');
    }
  }

  async function handleRemoveMember(member: ActivityMember) {
    if (!activityId) return;
    try {
      await removeActivityMember(activityId, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setHonorForm((prev) => {
        const next = { ...prev };
        delete next[member.employee.id];
        return next;
      });
      setHonorDetails((prev) => prev.filter((d) => d.employee.id !== member.employee.id));
      toast.success('Peserta dihapus.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menghapus peserta.');
    }
  }

  async function handleCalculateHonor() {
    if (!activityId || members.length === 0) return;
    try {
      const result = await calculateHonor(
        activityId,
        members.map((m) => ({
          employee_id: m.employee.id,
          honor_type_id: honorForm[m.employee.id]?.honor_type_id ?? honorTypes[0]?.id ?? 0,
          volume: honorForm[m.employee.id]?.volume ?? 1,
        }))
      );
      setHonorDetails(result.items);
      setHonorTotals(result);
      toast.success('Honor berhasil dihitung.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menghitung honor.');
    }
  }

  async function handleSubmitActivity() {
    if (!activityId) return;
    setSubmitting(true);
    try {
      await submitActivity(activityId);
      toast.success('Kegiatan berhasil disubmit untuk approval Kepala Sekolah.');
      router.push(`/kegiatan/${activityId}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal submit kegiatan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl">
        <div className="flex flex-col gap-space-2xs">
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Buat Pengajuan Kegiatan &amp; Honorarium
          </h1>
          {activityCode && (
            <span className="px-space-sm py-space-2xs rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-label-sm font-semibold w-fit">
              DRAFT #{activityCode}
            </span>
          )}
        </div>
      </div>

      <div className="w-full bg-surface-container-lowest rounded-xl p-space-md mb-space-xl shadow-xs border border-outline-variant/30">
        <div className="grid grid-cols-3 gap-space-sm">
          {STEPS.map((label, idx) => (
            <div
              key={label}
              className={cn(
                'flex items-center gap-space-sm p-space-xs rounded-lg',
                step === idx ? 'bg-primary-fixed' : ''
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-label-md text-label-md font-bold',
                  idx < step ? 'bg-tertiary-container text-on-tertiary' : step === idx ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                )}
              >
                {idx < step ? <Icon name="check" className="text-sm" /> : idx + 1}
              </div>
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <form onSubmit={handleCreateActivity} className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col gap-space-md">
          <div>
            <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Nama Kegiatan</label>
            <input
              required
              value={info.name}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              placeholder="Contoh: Ujian Tengah Semester Ganjil"
              className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Jenis Kegiatan</label>
              <select
                value={info.activity_type_id}
                onChange={(e) => setInfo({ ...info, activity_type_id: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
              >
                {activityTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Unit</label>
              <select
                value={info.unit_id}
                onChange={(e) => setInfo({ ...info, unit_id: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
              >
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Sumber Dana</label>
              <select
                value={info.fund_source_id}
                onChange={(e) => setInfo({ ...info, fund_source_id: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
              >
                {fundSources.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Tanggal Mulai</label>
              <input
                type="date"
                required
                value={info.start_date}
                onChange={(e) => setInfo({ ...info, start_date: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Tanggal Selesai</label>
              <input
                type="date"
                required
                min={info.start_date}
                value={info.end_date}
                onChange={(e) => setInfo({ ...info, end_date: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Anggaran (Rp)</label>
              <input
                type="number"
                required
                min={1}
                value={info.budget_amount}
                onChange={(e) => setInfo({ ...info, budget_amount: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm font-mono focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Lokasi (opsional)</label>
              <input
                value={info.location}
                onChange={(e) => setInfo({ ...info, location: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Penanggung Jawab / PIC (opsional)</label>
              <select
                value={info.pic_employee_id}
                onChange={(e) => setInfo({ ...info, pic_employee_id: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
              >
                <option value={0}>— Tidak ditentukan —</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="self-end px-space-xl py-space-sm rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold transition-all shadow-xs disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan & Lanjut ke Peserta'}
          </button>
        </form>
      )}

      {step === 1 && activityId && (
        <div className="flex flex-col gap-space-lg">
          <form onSubmit={handleAddMember} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col sm:flex-row gap-space-sm items-end">
            <div className="flex-1 w-full">
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Pegawai</label>
              <select
                value={memberForm.employee_id}
                onChange={(e) => setMemberForm({ ...memberForm, employee_id: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
              >
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Peran Penugasan</label>
              <input
                required
                value={memberForm.role_name}
                onChange={(e) => setMemberForm({ ...memberForm, role_name: e.target.value })}
                placeholder="Pengawas / Panitia / Koreksi"
                className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-space-lg rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold shrink-0"
            >
              Tambah
            </button>
          </form>

          {members.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
              <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm border-b border-outline-variant/30">
                  <tr>
                    <th className="px-space-base py-space-sm font-bold">Nama / Peran</th>
                    <th className="px-space-base py-space-sm font-bold">Jenis Honor</th>
                    <th className="px-space-base py-space-sm text-center font-bold">Volume</th>
                    <th className="px-space-base py-space-sm text-right font-bold">Gross</th>
                    <th className="px-space-base py-space-sm text-right font-bold">Netto</th>
                    <th className="px-space-base py-space-sm w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {members.map((m) => {
                    const detail = honorDetails.find((d) => d.employee.id === m.employee.id);
                    return (
                      <tr key={m.id}>
                        <td className="px-space-base py-space-sm">
                          <div className="font-label-md text-label-md font-semibold text-on-surface">{m.employee.name}</div>
                          <div className="text-outline text-xs">{m.role_name}</div>
                        </td>
                        <td className="px-space-base py-space-sm">
                          <select
                            value={honorForm[m.employee.id]?.honor_type_id ?? honorTypes[0]?.id}
                            onChange={(e) =>
                              setHonorForm((prev) => ({
                                ...prev,
                                [m.employee.id]: { ...prev[m.employee.id], honor_type_id: Number(e.target.value), volume: prev[m.employee.id]?.volume ?? 1 },
                              }))
                            }
                            className="h-8 px-2 rounded bg-surface-container-low border border-outline-variant/40 text-on-surface text-body-sm focus:outline-none"
                          >
                            {honorTypes.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.unit})</option>)}
                          </select>
                        </td>
                        <td className="px-space-base py-space-sm text-center">
                          <input
                            type="number"
                            min={1}
                            value={honorForm[m.employee.id]?.volume ?? 1}
                            onChange={(e) =>
                              setHonorForm((prev) => ({
                                ...prev,
                                [m.employee.id]: { ...prev[m.employee.id], honor_type_id: prev[m.employee.id]?.honor_type_id ?? honorTypes[0]?.id ?? 0, volume: Number(e.target.value) },
                              }))
                            }
                            className="w-16 h-8 text-center rounded bg-surface-container-low border border-outline-variant/40 font-mono text-body-sm focus:outline-none"
                          />
                        </td>
                        <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell">
                          {detail ? formatRupiah(detail.gross_amount) : '—'}
                        </td>
                        <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell text-primary font-bold">
                          {detail ? formatRupiah(detail.net_amount) : '—'}
                        </td>
                        <td className="px-space-base py-space-sm text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m)}
                            title="Hapus peserta"
                            className="p-1 rounded text-error hover:bg-error-container transition-colors"
                          >
                            <Icon name="close" className="text-base" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-space-md border-t border-outline-variant/30 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCalculateHonor}
                  className="px-space-lg py-space-sm rounded-lg bg-tertiary hover:bg-tertiary-container text-white font-label-md text-label-md font-semibold"
                >
                  Hitung Honor
                </button>
                {honorDetails.length > 0 && (
                  <div className="text-right">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total Netto</div>
                    <div className="font-currency-display text-headline-sm text-primary font-bold">
                      {formatRupiah(honorTotals.net_amount)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={honorDetails.length === 0}
              onClick={() => setStep(2)}
              className="px-space-xl py-space-sm rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold shadow-xs disabled:opacity-50"
            >
              Lanjut: Review &amp; Submit
            </button>
          </div>
        </div>
      )}

      {step === 2 && activityId && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col gap-space-md max-w-2xl">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Ringkasan Pengajuan</h2>
          <div className="grid grid-cols-2 gap-space-sm font-body-sm text-body-sm">
            <span className="text-on-surface-variant">Kegiatan</span>
            <span className="text-on-surface font-medium">{info.name}</span>
            <span className="text-on-surface-variant">Jumlah Peserta</span>
            <span className="text-on-surface font-medium">{members.length} orang</span>
            <span className="text-on-surface-variant">Total Honor Netto</span>
            <span className="text-primary font-bold font-currency-cell text-currency-cell">{formatRupiah(honorTotals.net_amount)}</span>
            <span className="text-on-surface-variant">Anggaran Kegiatan</span>
            <span className="text-on-surface font-medium font-currency-cell text-currency-cell">{formatRupiah(info.budget_amount)}</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Setelah disubmit, pengajuan akan masuk ke antrean approval Kepala Sekolah dan tidak dapat diubah sampai disetujui atau ditolak.
          </p>
          <div className="flex justify-end gap-space-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-space-lg py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold border border-outline-variant/40"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleSubmitActivity}
              disabled={submitting}
              className="px-space-xl py-space-sm rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
