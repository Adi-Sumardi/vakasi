import { redirect } from 'next/navigation';

/**
 * The VAKASI payment module is off: honor is paid in Sianggar
 * (FLOW.md section 8). Old links and bookmarks land on where payment
 * progress now lives instead of an error.
 */
export default function PembayaranPage() {
  redirect('/pencairan');
}
