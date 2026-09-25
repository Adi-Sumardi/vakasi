'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { uploadActivityDocument } from '@/lib/api/documents';
import { SK_PANITIA, type ActivityDocument } from '@/lib/api/activities';

const DOCUMENT_TYPES = [
  { value: SK_PANITIA, label: 'SK Panitia' },
  { value: 'surat_tugas', label: 'Surat Tugas' },
  { value: 'daftar_hadir', label: 'Daftar Hadir' },
  { value: 'rincian_anggaran', label: 'Rincian Anggaran' },
  { value: 'lainnya', label: 'Lainnya' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ActivityDocuments({
  activityId,
  documents,
  canUpload,
}: {
  activityId: number;
  documents: ActivityDocument[];
  canUpload: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const fileInput = useRef<HTMLInputElement>(null);
  const hasSkPanitia = documents.some((d) => d.document_type === SK_PANITIA);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await uploadActivityDocument(activityId, documentType, file);
      toast.success('Dokumen berhasil diunggah.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengunggah dokumen.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30">
      <div className="flex items-center justify-between mb-space-md">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
          Dokumen ({documents.length})
        </h2>
        {canUpload && (
          <div className="flex items-center gap-space-xs">
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
            >
              {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={handleUpload}
              className="hidden"
              id="doc-upload-input"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-sm text-label-sm font-semibold disabled:opacity-50"
            >
              <Icon name="upload_file" className="text-sm text-white" />
              <span>{busy ? 'Mengunggah...' : 'Unggah'}</span>
            </button>
          </div>
        )}
      </div>

      {canUpload && !hasSkPanitia && (
        <div className="flex items-start gap-space-xs mb-space-md p-space-sm rounded-lg bg-error-container/40 text-on-error-container font-body-sm text-body-sm">
          <Icon name="error" className="text-[18px] shrink-0" />
          <span>
            Unggah <strong>SK Panitia</strong> yang sudah ditandatangani. Kegiatan tidak bisa diajukan tanpa SK
            Panitia, dan dokumen ini ikut dikirim ke Sianggar setelah disetujui.
          </span>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">Belum ada dokumen diunggah.</p>
      ) : (
        <div className="flex flex-col gap-space-xs">
          {documents.map((d) => (
            <a
              key={d.id}
              href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${d.id}/download`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
            >
              <Icon name="description" className="text-primary text-[20px]" />
              <div className="flex-1 min-w-0">
                <div className="font-label-md text-label-md font-medium text-on-surface truncate">{d.file_name}</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  {DOCUMENT_TYPES.find((t) => t.value === d.document_type)?.label ?? d.document_type} &bull; {formatSize(d.file_size)}
                </div>
              </div>
              <Icon name="download" className="text-outline text-[18px]" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
