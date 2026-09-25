import { redirect } from 'next/navigation';

/** Menu digabung; tautan lama diarahkan ke halaman barunya. */
export default function LegacyPage() {
  redirect('/master-data/kegiatan-dana');
}
