<?php

namespace Database\Seeders;

use App\Models\FundSource;
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
            ['code' => 'DANA-BOS', 'name' => 'Dana BOS', 'description' => 'Bantuan Operasional Sekolah.'],
            ['code' => 'DANA-KOMITE', 'name' => 'Dana Komite', 'description' => 'Iuran komite sekolah.'],
        ])->each(fn (array $f) => FundSource::updateOrCreate(['code' => $f['code']], $f));

        // Jenis kegiatan, jenis honor, dan tarif berasal dari SK Yayasan:
        // lihat SkYayasan2016Seeder.
        $this->command?->info('Master data seeded: '.$units->count().' units.');
    }
}
