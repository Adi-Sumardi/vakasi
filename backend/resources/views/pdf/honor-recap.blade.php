<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Rekap Honor {{ $activity->activity_code }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #1a1a1a; }
        .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 16px; }
        .header h1 { margin: 0; font-size: 16px; }
        .header p { margin: 2px 0 0; font-size: 11px; color: #444; }
        .title { text-align: center; text-decoration: underline; font-weight: bold; margin-bottom: 4px; font-size: 13px; }
        .doc-number { text-align: center; font-size: 11px; color: #444; margin-bottom: 16px; }
        table.info { width: 100%; margin-bottom: 16px; }
        table.info td { padding: 2px 0; vertical-align: top; }
        table.info td.label { width: 120px; color: #444; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.items th, table.items td { border: 1px solid #999; padding: 5px 6px; font-size: 11px; }
        table.items th { background: #f0f0f0; text-align: left; font-size: 10px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row td { font-weight: bold; background: #f7f7f7; }
        .signature { margin-top: 32px; width: 100%; }
        .signature td { width: 50%; text-align: center; vertical-align: top; }
        .signature .space { height: 60px; }
        .qr-box { margin-top: 20px; text-align: center; }
        .qr-box img { width: 90px; height: 90px; }
        .qr-box p { margin: 4px 0 0; font-size: 9px; color: #666; }
        .footer-note { margin-top: 20px; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Yayasan Asrama Pelajar Islam</h1>
        <p>Rekapitulasi Honorarium Kegiatan</p>
    </div>

    <div class="title">REKAP HONOR KEGIATAN</div>
    @if ($activity->approval_document_number)
        <div class="doc-number">Nomor: {{ $activity->approval_document_number }}</div>
    @endif

    <table class="info">
        <tr>
            <td class="label">Kode Kegiatan</td>
            <td>: {{ $activity->activity_code }}</td>
            <td class="label">Unit</td>
            <td>: {{ $activity->unit?->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Nama Kegiatan</td>
            <td>: {{ $activity->name }}</td>
            <td class="label">Jenis Kegiatan</td>
            <td>: {{ $activity->activityType?->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Tanggal</td>
            <td>: {{ $activity->start_date?->format('d/m/Y') }} &ndash; {{ $activity->end_date?->format('d/m/Y') }}</td>
            <td class="label">Sumber Dana</td>
            <td>: {{ $activity->fundSource?->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Lokasi</td>
            <td>: {{ $activity->location ?: '-' }}</td>
            <td class="label">Disetujui</td>
            <td>: {{ $activity->approved_at?->format('d/m/Y') ?? '-' }}</td>
        </tr>
    </table>

    {{-- Satu kolom nominal saja: alur ini khusus honor/upah panitia,
         pajak dan potongan lain tidak terlibat. --}}
    <table class="items">
        <thead>
            <tr>
                <th style="width: 22px;" class="text-center">No</th>
                <th>Nama Penerima</th>
                <th>Peran</th>
                <th>Jenis Honor</th>
                <th class="text-right">Tarif</th>
                <th class="text-center">Vol</th>
                <th class="text-right">Nominal</th>
                <th>Rekening</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($lines as $index => $line)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $line['employee_name'] }}</td>
                    <td>{{ $line['role_name'] ?? '-' }}</td>
                    <td>{{ $line['honor_type'] ?? '-' }}</td>
                    <td class="text-right">{{ number_format($line['rate'], 0, ',', '.') }}</td>
                    <td class="text-center">{{ $line['volume'] }} {{ $line['unit'] }}</td>
                    <td class="text-right">{{ number_format($line['amount'], 0, ',', '.') }}</td>
                    <td>
                        @if ($line['bank_name'])
                            {{ $line['bank_name'] }}<br>{{ $line['bank_account_number'] }}
                        @else
                            -
                        @endif
                    </td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="6" class="text-right">TOTAL</td>
                <td class="text-right">{{ number_format($totalAmount, 0, ',', '.') }}</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <p style="font-size: 11px;">
        Terbilang: <em>{{ $terbilang }} rupiah</em>
    </p>

    <table class="signature">
        <tr>
            <td>
                Dibuat oleh,<br>Tata Usaha
                <div class="space"></div>
                <strong>{{ $activity->creator?->name ?? '________________' }}</strong>
            </td>
            <td>
                Disetujui oleh,<br>Kepala Sekolah
                <div class="space"></div>
                <strong>{{ $approverName ?? '________________' }}</strong>
            </td>
        </tr>
    </table>

    @if ($qrCodeDataUri)
        <div class="qr-box">
            <img src="{{ $qrCodeDataUri }}" alt="QR verifikasi">
            <p>Pindai untuk memverifikasi keaslian dokumen ini</p>
        </div>
    @endif

    <p class="footer-note">
        Dokumen ini dihasilkan otomatis oleh VAKASI pada {{ now()->format('d/m/Y H:i') }} dan menjadi lampiran
        pengajuan pencairan di Sianggar. Keasliannya dapat diverifikasi melalui QR di atas.
    </p>
</body>
</html>
