<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Position;
use App\Models\Unit;
use App\Models\User;
use App\Services\Exceptions\BusinessValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Bulk-loads the employee master from a CSV exported by Excel, so a
 * school's whole staff does not have to be typed in one form at a time.
 *
 * All-or-nothing: every row is validated first and nothing is written
 * unless all of them pass, so a half-imported sheet never leaves the
 * master in a state nobody can reason about. Rows are matched on
 * kode_pegawai — re-importing a corrected sheet updates in place.
 */
class EmployeeImportService
{
    /** Column order of the template (EmployeeImportService::template). */
    public const COLUMNS = [
        'kode_pegawai', 'nama', 'nip', 'nuptk', 'jenis',
        'kode_unit', 'kode_jabatan', 'bank', 'nama_rekening', 'no_rekening',
    ];

    public const MAX_ROWS = 2000;

    public function __construct(private readonly AuditService $auditService) {}

    public function template(): string
    {
        return implode(';', self::COLUMNS)."\n"
            ."PGW-0001;Budi Santoso;197001012000031001;;guru;SD;GURU;BSI;Budi Santoso;7001234567\n";
    }

    /**
     * @return array{created: int, updated: int}
     */
    public function import(string $contents, User $actor): array
    {
        $rows = $this->parse($contents);

        if ($rows === []) {
            throw new BusinessValidationException('file', 'File tidak berisi data pegawai.');
        }

        if (count($rows) > self::MAX_ROWS) {
            throw new BusinessValidationException('file', 'Maksimal '.self::MAX_ROWS.' baris per file.');
        }

        $units = Unit::pluck('id', 'code')->mapWithKeys(fn ($id, $code) => [mb_strtoupper($code) => $id]);
        $positions = Position::pluck('id', 'code')->mapWithKeys(fn ($id, $code) => [mb_strtoupper($code) => $id]);
        $scopedUnitId = $actor->scopedUnitId();

        $errors = [];
        $records = [];
        $seenCodes = [];

        foreach ($rows as $line => $row) {
            $messages = Validator::make($row, [
                'kode_pegawai' => ['required', 'string', 'max:50'],
                'nama' => ['required', 'string', 'max:255'],
                'nip' => ['nullable', 'string', 'max:50'],
                'nuptk' => ['nullable', 'string', 'max:50'],
                'jenis' => ['required', 'in:guru,tu,tendik,panitia'],
                'kode_unit' => ['required', 'string'],
                'kode_jabatan' => ['required', 'string'],
                'bank' => ['nullable', 'string', 'max:100'],
                'nama_rekening' => ['nullable', 'string', 'max:255'],
                'no_rekening' => ['nullable', 'string', 'max:50'],
            ], [], [
                'kode_pegawai' => 'kode_pegawai', 'jenis' => 'jenis',
            ])->errors()->all();

            $unitId = $units[mb_strtoupper((string) $row['kode_unit'])] ?? null;
            $positionId = $positions[mb_strtoupper((string) $row['kode_jabatan'])] ?? null;

            if ($row['kode_unit'] !== '' && ! $unitId) {
                $messages[] = "kode_unit \"{$row['kode_unit']}\" tidak ditemukan di master Unit.";
            }

            if ($row['kode_jabatan'] !== '' && ! $positionId) {
                $messages[] = "kode_jabatan \"{$row['kode_jabatan']}\" tidak ditemukan di master Jabatan.";
            }

            if ($unitId && $scopedUnitId !== null && $unitId !== $scopedUnitId) {
                $messages[] = 'Anda hanya dapat mengimpor pegawai untuk unit Anda sendiri.';
            }

            $code = (string) $row['kode_pegawai'];

            if ($code !== '' && isset($seenCodes[$code])) {
                $messages[] = "kode_pegawai \"{$code}\" muncul lebih dari sekali (juga di baris {$seenCodes[$code]}).";
            }

            $seenCodes[$code] = $line;

            if ($messages !== []) {
                $errors["baris_{$line}"] = $messages;

                continue;
            }

            $records[] = [
                'employee_code' => $code,
                'name' => $row['nama'],
                'nip' => $row['nip'] ?: null,
                'nuptk' => $row['nuptk'] ?: null,
                'employee_type' => $row['jenis'],
                'unit_id' => $unitId,
                'position_id' => $positionId,
                'bank_name' => $row['bank'] ?: null,
                'bank_account_name' => $row['nama_rekening'] ?: null,
                'bank_account_number' => $row['no_rekening'] ?: null,
            ];
        }

        if ($errors !== []) {
            throw new BusinessValidationException(
                'file',
                count($errors).' baris bermasalah. Perbaiki lalu unggah ulang; tidak ada data yang disimpan.',
                $errors,
            );
        }

        return DB::transaction(function () use ($records, $actor) {
            $created = 0;
            $updated = 0;

            foreach ($records as $record) {
                $employee = Employee::firstOrNew(['employee_code' => $record['employee_code']]);
                $employee->exists ? $updated++ : $created++;
                $employee->fill($record + ($employee->exists ? [] : ['status' => 'active']))->save();
            }

            $this->auditService->log('employee.imported', Employee::class, null, [], [
                'created' => $created,
                'updated' => $updated,
                'by' => $actor->id,
            ]);

            return ['created' => $created, 'updated' => $updated];
        });
    }

    /**
     * Excel in an Indonesian locale saves CSV with ";" and often a UTF-8
     * BOM; both are handled so the user can save straight from Excel.
     *
     * @return array<int, array<string, string>> keyed by spreadsheet line number
     */
    private function parse(string $contents): array
    {
        $contents = preg_replace('/^\xEF\xBB\xBF/', '', $contents);
        $lines = preg_split('/\r\n|\n|\r/', trim($contents));
        $headerLine = array_shift($lines) ?? '';
        $delimiter = substr_count($headerLine, ';') >= substr_count($headerLine, ',') ? ';' : ',';

        $header = array_map(fn ($h) => mb_strtolower(trim($h)), str_getcsv($headerLine, $delimiter, '"', ''));
        $missing = array_diff(self::COLUMNS, $header);

        if ($missing !== []) {
            throw new BusinessValidationException(
                'file',
                'Kolom berikut tidak ada di baris judul: '.implode(', ', $missing).'. Gunakan template yang disediakan.',
            );
        }

        $rows = [];

        foreach ($lines as $index => $line) {
            if (trim($line, " \t;,") === '') {
                continue;
            }

            $values = str_getcsv($line, $delimiter, '"', '');
            $row = [];

            foreach (self::COLUMNS as $column) {
                $position = array_search($column, $header, true);
                $row[$column] = trim((string) ($values[$position] ?? ''));
            }

            // +2: line 1 is the header, and spreadsheets count from 1.
            $rows[$index + 2] = $row;
        }

        return $rows;
    }
}
