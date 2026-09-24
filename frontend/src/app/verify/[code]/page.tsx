import Image from 'next/image';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { Icon } from '@/components/ui/icon';
import { API_URL } from '@/lib/api/config';

type VerificationMember = {
  name: string;
  role: string;
};

type VerificationResult = {
  activity_code: string;
  approval_document_number: string | null;
  name: string;
  activity_type: string | null;
  fund_source: string | null;
  unit: string | null;
  location: string | null;
  status: string;
  start_date: string;
  end_date: string;
  approved_at: string | null;
  approved_by: string | null;
  members: VerificationMember[];
};

/**
 * Public verification page for the QR code generated on Kepala
 * Sekolah approval — see FLOW.md section 8. Deliberately outside
 * (dashboard) and excluded from proxy.ts's auth redirect: anyone
 * scanning the printed slip/QR (Sianggar, Sianggar, an auditor) lands
 * here without a VAKASI account. Calls the backend's public endpoint
 * directly with a plain fetch — no cookies, no serverApiFetch.
 */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const response = await fetch(`${API_URL}/api/v1/public/verify/${encodeURIComponent(code)}`, {
    cache: 'no-store',
  });
  const json = await response.json().catch(() => null);
  const result: VerificationResult | null = response.ok ? json?.data : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-space-lg bg-surface">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant/30 overflow-hidden">
        <div className="p-space-xl text-center border-b border-outline-variant/30">
          <Image
            alt="Logo VAKASI"
            src="/logo.png"
            width={40}
            height={40}
            priority
            className="h-10 w-auto object-contain mx-auto mb-space-sm"
          />
          <h1 className="font-headline-sm text-headline-sm text-primary font-bold">VAKASI</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Verifikasi Approval Kegiatan</p>
        </div>

        <div className="p-space-xl">
          {result ? (
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm text-tertiary">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
                  <Icon name="verified" className="text-xl" />
                </div>
                <div>
                  <div className="font-label-lg text-label-lg font-bold text-on-surface">Approval Terverifikasi</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">Data ini tercatat resmi di sistem VAKASI.</div>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-space-sm font-body-sm text-body-sm border-t border-outline-variant/30 pt-space-md">
                {result.approval_document_number && (
                  <div>
                    <dt className="text-on-surface-variant text-xs uppercase tracking-wider">No. Dokumen Approval</dt>
                    <dd className="text-primary font-bold font-mono">{result.approval_document_number}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-on-surface-variant text-xs uppercase tracking-wider">Kode Kegiatan</dt>
                  <dd className="text-on-surface font-semibold font-mono">{result.activity_code}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant text-xs uppercase tracking-wider">Nama Kegiatan</dt>
                  <dd className="text-on-surface font-medium">{result.name}</dd>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div>
                    <dt className="text-on-surface-variant text-xs uppercase tracking-wider">Jenis Kegiatan</dt>
                    <dd className="text-on-surface font-medium">{result.activity_type ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant text-xs uppercase tracking-wider">Sumber Dana</dt>
                    <dd className="text-on-surface font-medium">{result.fund_source ?? '-'}</dd>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div>
                    <dt className="text-on-surface-variant text-xs uppercase tracking-wider">Unit</dt>
                    <dd className="text-on-surface font-medium">{result.unit ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant text-xs uppercase tracking-wider">Status</dt>
                    <dd className="mt-1"><StatusBadge status={result.status} /></dd>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div>
                    <dt className="text-on-surface-variant text-xs uppercase tracking-wider">Tanggal Kegiatan</dt>
                    <dd className="text-on-surface font-medium">{result.start_date} - {result.end_date}</dd>
                  </div>
                  <div>
                    <dt className="text-on-surface-variant text-xs uppercase tracking-wider">Lokasi</dt>
                    <dd className="text-on-surface font-medium">{result.location ?? '-'}</dd>
                  </div>
                </div>
                {result.approved_by && (
                  <div>
                    <dt className="text-on-surface-variant text-xs uppercase tracking-wider">Disetujui oleh</dt>
                    <dd className="text-on-surface font-medium">{result.approved_by}</dd>
                  </div>
                )}
                {result.members.length > 0 && (
                  <div>
                    <dt className="text-on-surface-variant text-xs uppercase tracking-wider mb-1">
                      Peserta / Penerima Honor ({result.members.length})
                    </dt>
                    <dd>
                      <ul className="flex flex-col gap-1">
                        {result.members.map((member, idx) => (
                          <li key={idx} className="flex items-center justify-between border-b border-outline-variant/20 last:border-0 py-1">
                            <span className="text-on-surface font-medium">{member.name}</span>
                            <span className="text-on-surface-variant text-xs">{member.role}</span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-space-sm text-center py-space-lg">
              <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                <Icon name="error" className="text-xl" />
              </div>
              <div>
                <div className="font-label-lg text-label-lg font-bold text-on-surface">Kode Tidak Ditemukan</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
                  Kode verifikasi ini tidak valid atau kegiatan belum disetujui Kepala Sekolah.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
