'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { apiUpload } from '@/lib/api/client';
import { ApiError } from '@/lib/api/types';

/**
 * Bulk import from an Excel sheet saved as CSV. The server applies all
 * rows or none, and on failure returns one message list per row, which
 * are shown here so the user can fix the sheet and upload it again.
 */
export function EmployeeImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowErrors, setRowErrors] = useState<[string, string[]][]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setRowErrors([]);

    try {
      const form = new FormData();
      form.append('file', file);
      await apiUpload<{ created: number; updated: number }>('/api/v1/employees/import', form);
      toast.success('Import pegawai berhasil.');
      setOpen(false);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
        setRowErrors(Object.entries(error.errors).filter(([key]) => key.startsWith('baris_')));
      } else {
        toast.error('Gagal mengimpor pegawai.');
      }
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 px-3 inline-flex items-center gap-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/40 font-label-md text-label-md font-semibold"
      >
        <Icon name="upload_file" className="text-sm" />
        Import Excel
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-xl border border-outline-variant/40 shadow-xl max-h-[90vh] overflow-y-auto flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Import Pegawai</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-on-surface-variant hover:text-on-surface" aria-label="Tutup">
                <Icon name="close" />
              </button>
            </div>

            <ol className="list-decimal pl-5 flex flex-col gap-space-2xs font-body-sm text-body-sm text-on-surface-variant">
              <li>
                Unduh{' '}
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/employees/import/template`}
                  className="text-primary font-semibold hover:underline"
                >
                  template CSV
                </a>{' '}
                dan buka di Excel.
              </li>
              <li>
                Isi satu baris per pegawai. <code>kode_unit</code> dan <code>kode_jabatan</code> memakai kode di menu Unit &amp; Jabatan;{' '}
                <code>jenis</code> diisi guru, tu, tendik, atau panitia.
              </li>
              <li>Simpan sebagai CSV, lalu unggah di sini. Pegawai dengan kode yang sudah ada akan diperbarui.</li>
            </ol>

            <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
              className="self-start flex items-center gap-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold disabled:opacity-50"
            >
              <Icon name="upload_file" className="text-sm text-white" />
              {busy ? 'Mengimpor...' : 'Pilih file CSV'}
            </button>

            {rowErrors.length > 0 && (
              <div className="flex flex-col gap-space-xs p-space-md rounded-lg bg-error-container/40 text-on-error-container font-body-sm text-body-sm max-h-64 overflow-y-auto">
                <strong>Tidak ada data yang disimpan. Perbaiki baris berikut:</strong>
                <ul className="flex flex-col gap-1">
                  {rowErrors.map(([row, messages]) => (
                    <li key={row}>
                      <span className="font-semibold">Baris {row.replace('baris_', '')}:</span> {messages.join(' ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
