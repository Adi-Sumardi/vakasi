<?php

namespace Database\Seeders;

use App\Models\ActivityType;
use App\Models\FundSource;
use App\Models\HonorRate;
use App\Models\HonorType;
use App\Models\Position;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $units = collect([
            ['code' => 'UNIT-KUR', 'name' => 'Kurikulum'],
            ['code' => 'UNIT-KESISWAAN', 'name' => 'Kesiswaan'],
            ['code' => 'UNIT-TU', 'name' => 'Tata Usaha'],
        ])->map(fn (array $u) => Unit::updateOrCreate(['code' => $u['code']], $u));

        collect([
            ['code' => 'POS-GURU', 'name' => 'Guru Mata Pelajaran'],
            ['code' => 'POS-WALI', 'name' => 'Wali Kelas'],
            ['code' => 'POS-STAF-TU', 'name' => 'Staf Tata Usaha'],
        ])->each(fn (array $p) => Position::updateOrCreate(['code' => $p['code']], $p));

        collect([
            ['code' => 'KEG-UJIAN', 'name' => 'Ujian Sekolah', 'description' => 'Ujian tengah/akhir semester dan ujian sekolah.'],
            ['code' => 'KEG-EKSKUL', 'name' => 'Ekstrakurikuler', 'description' => 'Kegiatan pembinaan minat bakat siswa.'],
            ['code' => 'KEG-PANITIA', 'name' => 'Kepanitiaan', 'description' => 'Kepanitiaan acara sekolah (PPDB, wisuda, lomba).'],
        ])->each(fn (array $t) => ActivityType::updateOrCreate(['code' => $t['code']], $t));

        collect([
            ['code' => 'DANA-BOS', 'name' => 'Dana BOS', 'description' => 'Bantuan Operasional Sekolah.'],
            ['code' => 'DANA-KOMITE', 'name' => 'Dana Komite', 'description' => 'Iuran komite sekolah.'],
        ])->each(fn (array $f) => FundSource::updateOrCreate(['code' => $f['code']], $f));

        $honorTypes = collect([
            ['code' => 'HONOR-PENGAWAS', 'name' => 'Honor Pengawas Ujian', 'unit' => 'JAM', 'rate' => 25000],
            ['code' => 'HONOR-KOREKSI', 'name' => 'Honor Koreksi Ujian', 'unit' => 'PAKET', 'rate' => 5000],
            ['code' => 'HONOR-PEMBINA', 'name' => 'Honor Pembina Ekskul', 'unit' => 'KEGIATAN', 'rate' => 150000],
            ['code' => 'HONOR-PANITIA', 'name' => 'Honor Panitia', 'unit' => 'KEGIATAN', 'rate' => 200000],
        ])->map(function (array $t) {
            $honorType = HonorType::updateOrCreate(
                ['code' => $t['code']],
                ['name' => $t['name'], 'unit' => $t['unit']],
            );

            HonorRate::updateOrCreate(
                ['honor_type_id' => $honorType->id, 'unit_id' => null, 'effective_from' => '2026-01-01'],
                ['rate' => $t['rate'], 'status' => 'active'],
            );

            return $honorType;
        });

        $this->command?->info('Master data seeded: '.$units->count().' units, '.$honorTypes->count().' honor types with rates.');
    }
}
