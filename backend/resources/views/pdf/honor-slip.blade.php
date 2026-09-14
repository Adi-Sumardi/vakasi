<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Slip Honor {{ $activity->activity_code }} - {{ $employee->name }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #1a1a1a; }
        .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 16px; }
        .header h1 { margin: 0; font-size: 16px; }
        .header p { margin: 2px 0 0; font-size: 11px; color: #444; }
        .title { text-align: center; text-decoration: underline; font-weight: bold; margin-bottom: 16px; font-size: 13px; }
        table.info { width: 100%; margin-bottom: 16px; }
        table.info td { padding: 2px 0; vertical-align: top; }
        table.info td.label { width: 140px; color: #444; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.items th, table.items td { border: 1px solid #999; padding: 6px 8px; }
        table.items th { background: #f0f0f0; text-align: left; font-size: 11px; }
        .text-right { text-align: right; }
        .total-row td { font-weight: bold; background: #f7f7f7; }
        .signature { margin-top: 40px; width: 100%; }
        .signature td { width: 50%; text-align: center; vertical-align: top; }
        .signature .space { height: 60px; }
        .footer-note { margin-top: 24px; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Yayasan Asrama Pelajar Islam</h1>
        <p>Slip Honorarium Kegiatan Sekolah</p>
    </div>

    <div class="title">SLIP HONOR</div>

    <table class="info">
        <tr>
            <td class="label">Nama Pegawai</td>
            <td>: {{ $employee->name }}</td>
            <td class="label">Kode Kegiatan</td>
            <td>: {{ $activity->activity_code }}</td>
        </tr>
        <tr>
            <td class="label">Kode Pegawai</td>
            <td>: {{ $employee->employee_code }}</td>
            <td class="label">Nama Kegiatan</td>
            <td>: {{ $activity->name }}</td>
        </tr>
        <tr>
            <td class="label">Unit</td>
            <td>: {{ $employee->unit?->name ?? '-' }}</td>
            <td class="label">Tanggal Kegiatan</td>
            <td>: {{ $activity->start_date?->format('d/m/Y') }} - {{ $activity->end_date?->format('d/m/Y') }}</td>
        </tr>
        @if ($employee->bank_name)
            <tr>
                <td class="label">Rekening</td>
                <td colspan="3">: {{ $employee->bank_name }} - {{ $employee->bank_account_number }} a.n. {{ $employee->bank_account_name }}</td>
            </tr>
        @endif
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Jenis Honor</th>
                <th class="text-right">Tarif</th>
                <th class="text-right">Volume</th>
                <th class="text-right">Gross</th>
                <th class="text-right">Pajak</th>
                <th class="text-right">Potongan</th>
                <th class="text-right">Netto</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($details as $detail)
                <tr>
                    <td>{{ $detail->honorType->name }}</td>
                    <td class="text-right">Rp {{ number_format($detail->rate_snapshot, 0, ',', '.') }}</td>
                    <td class="text-right">{{ $detail->volume }} {{ $detail->unit_snapshot }}</td>
                    <td class="text-right">Rp {{ number_format($detail->gross_amount, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($detail->tax_amount, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($detail->deduction_amount, 0, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($detail->net_amount, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="6" class="text-right">Total Diterima</td>
                <td class="text-right">Rp {{ number_format($totalNet, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <table class="signature">
        <tr>
            <td>
                Mengetahui,<br>Kepala Sekolah
                <div class="space"></div>
                (........................................)
            </td>
            <td>
                {{ now()->format('d F Y') }}<br>Penerima
                <div class="space"></div>
                ({{ $employee->name }})
            </td>
        </tr>
    </table>

    <p class="footer-note">Dicetak otomatis oleh sistem VAKASI pada {{ now()->format('d/m/Y H:i') }}.</p>
</body>
</html>
