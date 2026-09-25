import Link from 'next/link';
import { PageHeader } from '@/components/common/page-header';

import { Icon } from '@/components/ui/icon';
import { Hint } from '@/components/common/hint';
import { PageTabs } from '@/components/common/page-tabs';
import { PaginationBar } from '@/components/common/pagination-bar';
import type { DocumentRow } from '@/lib/api/documents.server';
import { serverApiFetchPage, toQuery } from '@/lib/api/server';

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  sk_panitia: 'SK Panitia',
  surat_tugas: 'Surat Tugas',
  daftar_hadir: 'Daftar Hadir',
  rincian_anggaran: 'Rincian Anggaran',
  bukti_transfer: 'Bukti Transfer',
  lainnya: 'Lainnya',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_TABS = ['', 'sk_panitia', 'surat_tugas', 'daftar_hadir', 'rincian_anggaran', 'lainnya'];

export default async function DokumenPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }) {
  const { type = '', page } = await searchParams;
  const list = await serverApiFetchPage<DocumentRow>(`/api/v1/documents${toQuery({ document_type: type, page })}`);
  const documents = list.data;

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Arsip Dokumen' }]}
        title={<>Arsip Dokumen</>}
        description={<>SK Panitia, surat tugas, daftar hadir, dan dokumen lain dari semua kegiatan. Dokumen diunggah dari halaman detail kegiatan.</>}
      />

      <PageTabs
        active={type}
        tabs={TYPE_TABS.map((key) => ({
          key,
          label: key ? (DOCUMENT_TYPE_LABEL[key] ?? key) : 'Semua',
          href: `/dokumen${toQuery({ type: key })}`,
        }))}
      />

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {documents.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
            {type ? 'Belum ada dokumen jenis ini.' : 'Belum ada dokumen diunggah.'}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Dokumen</th>
                  <th className="px-space-base py-space-sm font-bold">Jenis</th>
                  <th className="px-space-base py-space-sm font-bold">Terkait</th>
                  <th className="px-space-base py-space-sm font-bold">Ukuran</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm font-medium text-on-surface">{d.file_name}</td>
                    <td className="px-space-base py-space-sm">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                        {DOCUMENT_TYPE_LABEL[d.document_type] ?? d.document_type}
                      </span>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">
                      {d.activity ? (
                        <Link href={`/kegiatan/${d.activity.id}`} className="text-primary font-semibold hover:underline">
                          {d.activity.activity_code}
                        </Link>
                      ) : d.payment ? (
                        <span>{d.payment.payment_number}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">{formatSize(d.file_size)}</td>
                    <td className="px-space-base py-space-sm text-center">
                      <Hint label="Unduh dokumen">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${d.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center p-1.5 rounded text-primary hover:bg-primary-fixed"
                        >
                          <Icon name="download" className="text-[18px]" />
                        </a>
                      </Hint>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar meta={list.meta} basePath="/dokumen" params={{ type: type || undefined }} />
      </div>
    </div>
  );
}
