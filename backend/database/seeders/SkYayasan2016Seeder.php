<?php

namespace Database\Seeders;

use App\Models\ActivityType;
use App\Models\HonorRate;
use App\Models\HonorType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Master data dari SK Pengurus YPI Al Azhar nomor 251-267/I/KEP/YPIA-P/1437.2016
 * (ditetapkan 23 Rabiul Awal 1437 H / 4 Januari 2016 M).
 *
 * SK bernomor ganjil (dan 255) mengatur susunan panitia, SK genap mengatur
 * besaran insentifnya. Jenis kegiatan diambil dari judul SK, jenis honor dan
 * tarif dari lampiran insentif. Tarif yang tidak berupa satu angka pasti
 * (rentang, "maksimal", "sesuai IDK", "sesuai kebijakan sekolah", persentase
 * pendapatan PMB) sengaja tidak dimasukkan karena honor engine menghitung
 * tarif tetap x volume.
 *
 * Scan SK dilampirkan ke setiap tarif bila folder sumber tersedia. Folder
 * diatur lewat SK_YAPI_DIR (default storage/app/sk-yapi), dengan nama berkas
 * "{nomor}-I-KEP-(YPIA-P)-1437.2016.pdf".
 *
 * Aman dijalankan ulang: semua baris di-upsert berdasarkan kode.
 */
class SkYayasan2016Seeder extends Seeder
{
    private const DECREE_DATE = '2016-01-04';

    /** @var array<int, array{code: string, name: string, decrees: array<int, int>}> */
    private const ACTIVITY_TYPES = [
        ['code' => 'KEG-RAKER', 'name' => 'Rapat Kerja Pegawai', 'decrees' => [251, 252]],
        ['code' => 'KEG-PEMBINAAN-AWAL', 'name' => 'Pembinaan Awal Pegawai', 'decrees' => [253, 254]],
        ['code' => 'KEG-SERTIFIKASI-PIMPINAN', 'name' => 'Sertifikasi Calon Pimpinan', 'decrees' => [253, 254]],
        ['code' => 'KEG-MABIT', 'name' => 'Mabit', 'decrees' => [256, 257]],
        ['code' => 'KEG-AKHIRUSSANAH', 'name' => 'Akhirussanah', 'decrees' => [256, 257]],
        ['code' => 'KEG-FIELD-TRIP', 'name' => 'Field Trip / Outing Class', 'decrees' => [258, 259]],
        ['code' => 'KEG-STUDI-WISATA', 'name' => 'Studi Wisata Kelas 9 dan 12', 'decrees' => [258, 259]],
        ['code' => 'KEG-MOS', 'name' => 'Masa Orientasi Murid Kelas 7 dan 10', 'decrees' => [258, 259]],
        ['code' => 'KEG-PAMERAN', 'name' => 'Pameran Pendidikan', 'decrees' => [258, 259]],
        ['code' => 'KEG-CAREER-DAY', 'name' => 'Career Day', 'decrees' => [258, 259]],
        ['code' => 'KEG-UTS', 'name' => 'Ulangan Tengah Semester', 'decrees' => [260, 261]],
        ['code' => 'KEG-UAS-UKK', 'name' => 'Ujian Semester / Ujian Kenaikan Kelas', 'decrees' => [260, 261]],
        ['code' => 'KEG-US-UN', 'name' => 'Ujian Sekolah dan Ujian Nasional', 'decrees' => [260, 261]],
        ['code' => 'KEG-TRY-OUT', 'name' => 'Try Out', 'decrees' => [262, 263]],
        ['code' => 'KEG-PENGAYAAN-MATERI', 'name' => 'Pengayaan Materi (IMU, Bimbingan Belajar, Sukses UN, TAPAS)', 'decrees' => [262, 263]],
        ['code' => 'KEG-PEMBINAAN-PRESTASI', 'name' => 'Pembinaan Prestasi (OSN, UKA, OLKA, IMSO)', 'decrees' => [262, 263]],
        ['code' => 'KEG-PRESTASI-NONAKADEMIK', 'name' => 'Pembinaan Prestasi Non Akademik', 'decrees' => [262, 263]],
        ['code' => 'KEG-KLINIK-AKADEMIK', 'name' => 'Klinik Akademik', 'decrees' => [262, 263]],
        ['code' => 'KEG-PMB', 'name' => 'Penerimaan Murid Baru (PMB)', 'decrees' => [264, 265]],
        ['code' => 'KEG-PHBI-PHBN', 'name' => 'Peringatan Hari Besar Islam dan Hari Besar Nasional', 'decrees' => [266, 267]],
    ];

    /**
     * Per SK insentif: [kode, nama, satuan, tarif, keterangan?].
     *
     * @var array<int, array<int, array{0: string, 1: string, 2: string, 3: int, 4?: string}>>
     */
    private const RATES = [
        252 => [
            ['RAKER-UNIT-KETUA', 'Raker Unit/Sekolah · Ketua', 'KEGIATAN', 250000],
            ['RAKER-UNIT-SEKRETARIS', 'Raker Unit/Sekolah · Sekretaris', 'KEGIATAN', 150000],
            ['RAKER-UNIT-BENDAHARA', 'Raker Unit/Sekolah · Bendahara', 'KEGIATAN', 150000],
            ['RAKER-UNIT-SEKSI', 'Raker Unit/Sekolah · Seksi', 'KEGIATAN', 125000, 'Per orang Ka. Seksi, maksimal 4 seksi.'],
            ['RAKER-UNIT-ANGGOTA', 'Raker Unit/Sekolah · Anggota Seksi', 'KEGIATAN', 100000, 'Per orang.'],
            ['RAKER-UNIT-PU', 'Raker Unit/Sekolah · Pembantu Umum', 'KEGIATAN', 75000, 'Per orang.'],
            ['RAKER-PUSAT-KETUA', 'Raker Sekretariat/Direktorat · Ketua', 'KEGIATAN', 300000],
            ['RAKER-PUSAT-SEKRETARIS', 'Raker Sekretariat/Direktorat · Sekretaris', 'KEGIATAN', 200000],
            ['RAKER-PUSAT-BENDAHARA', 'Raker Sekretariat/Direktorat · Bendahara', 'KEGIATAN', 200000],
            ['RAKER-PUSAT-SEKSI', 'Raker Sekretariat/Direktorat · Seksi', 'KEGIATAN', 175000, 'Per orang Ka. Seksi.'],
            ['RAKER-PUSAT-ANGGOTA', 'Raker Sekretariat/Direktorat · Anggota Seksi', 'KEGIATAN', 150000, 'Per orang.'],
            ['RAKER-PUSAT-PU', 'Raker Sekretariat/Direktorat · Pembantu Umum', 'KEGIATAN', 100000, 'Per orang.'],
        ],
        254 => [
            ['PAP-KETUA', 'Pembinaan Awal Pegawai · Ketua', 'KEGIATAN', 1000000],
            ['PAP-SEKRETARIS', 'Pembinaan Awal Pegawai · Sekretaris', 'KEGIATAN', 500000],
            ['PAP-BENDAHARA', 'Pembinaan Awal Pegawai · Bendahara', 'KEGIATAN', 500000],
            ['PAP-ANGGOTA', 'Pembinaan Awal Pegawai · Anggota', 'KEGIATAN', 400000],
            ['PAP-PEMATERI', 'Pembinaan Awal Pegawai · Pemateri', 'JAM/MAPEL', 275000, 'Per jam/mata pelajaran.'],
            ['PAP-KOREKSI', 'Pembinaan Awal Pegawai · Koreksi Hasil Ujian', 'ORANG/MAPEL', 5000, 'Per orang/mata pelajaran.'],
            ['PAP-PENGAWAS', 'Pembinaan Awal Pegawai · Pengawas Ujian', 'KEGIATAN', 20000],
            ['PAP-PU', 'Pembinaan Awal Pegawai · Pembantu Umum', 'KEGIATAN', 200000],
            ['SCP-KETUA', 'Sertifikasi Calon Pimpinan · Ketua', 'KEGIATAN', 1000000],
            ['SCP-SEKRETARIS', 'Sertifikasi Calon Pimpinan · Sekretaris', 'KEGIATAN', 500000],
            ['SCP-BENDAHARA', 'Sertifikasi Calon Pimpinan · Bendahara', 'KEGIATAN', 500000],
            ['SCP-ANGGOTA', 'Sertifikasi Calon Pimpinan · Anggota', 'KEGIATAN', 400000],
            ['SCP-PEMATERI', 'Sertifikasi Calon Pimpinan · Pemateri', 'KEGIATAN', 275000],
            ['SCP-KOREKSI', 'Sertifikasi Calon Pimpinan · Koreksi Hasil Ujian', 'HASIL UJIAN', 5000, 'Per hasil ujian.'],
            ['SCP-PENGAWAS', 'Sertifikasi Calon Pimpinan · Pengawas Ujian', 'KEGIATAN', 25000],
            ['SCP-PU', 'Sertifikasi Calon Pimpinan · Pembantu Umum', 'KEGIATAN', 200000],
        ],
        255 => [
            ['NS-UNIT-GURU', 'Narasumber Tingkat Unit · Pegawai/Guru', 'PAKET MATERI', 200000, 'Narasumber internal yang juga panitia kegiatan diberi 1/2 tarif.'],
            ['NS-UNIT-ESELON4', 'Narasumber Tingkat Unit · Pejabat Eselon 4', 'PAKET MATERI', 250000, 'Narasumber internal yang juga panitia kegiatan diberi 1/2 tarif.'],
            ['NS-UNIT-ESELON3', 'Narasumber Tingkat Unit · Pejabat Eselon 3', 'PAKET MATERI', 300000, 'Narasumber internal yang juga panitia kegiatan diberi 1/2 tarif.'],
            ['NS-UNIT-ESELON2', 'Narasumber Tingkat Unit · Pejabat Eselon 2', 'PAKET MATERI', 350000, 'Narasumber internal yang juga panitia kegiatan diberi 1/2 tarif.'],
            ['NS-UNIT-ESELON1', 'Narasumber Tingkat Unit · Pejabat Eselon 1', 'PAKET MATERI', 400000, 'Narasumber internal yang juga panitia kegiatan diberi 1/2 tarif.'],
            ['NS-UNIT-EKSTERNAL', 'Narasumber Tingkat Unit · Narasumber Eksternal', 'PAKET MATERI', 500000],
            ['NS-YYS-GURU', 'Narasumber Tingkat Yayasan · Pegawai/Guru', 'PAKET MATERI', 250000],
            ['NS-YYS-ESELON4', 'Narasumber Tingkat Yayasan · Pejabat Eselon 4', 'PAKET MATERI', 300000],
            ['NS-YYS-ESELON3', 'Narasumber Tingkat Yayasan · Pejabat Eselon 3', 'PAKET MATERI', 350000],
            ['NS-YYS-ESELON2', 'Narasumber Tingkat Yayasan · Pejabat Eselon 2', 'PAKET MATERI', 400000],
            ['NS-YYS-ESELON1', 'Narasumber Tingkat Yayasan · Pejabat Eselon 1', 'PAKET MATERI', 450000],
        ],
        257 => [
            ['MABIT-KOORDINATOR', 'Mabit · Koordinator', 'KEGIATAN', 100000],
            ['MABIT-ANGGOTA', 'Mabit · Anggota', 'KEGIATAN', 75000],
            ['MABIT-PU', 'Mabit · Pembantu Umum', 'KEGIATAN', 50000, '1 orang per kelas.'],
            ['AKHIR-KETUA', 'Akhirussanah · Ketua', 'KEGIATAN', 300000],
            ['AKHIR-SEKRETARIS', 'Akhirussanah · Sekretaris', 'KEGIATAN', 200000],
            ['AKHIR-BENDAHARA', 'Akhirussanah · Bendahara', 'KEGIATAN', 200000],
            ['AKHIR-SEKSI', 'Akhirussanah · Seksi', 'KEGIATAN', 150000, 'Maksimal 5 seksi.'],
            ['AKHIR-ANGGOTA', 'Akhirussanah · Anggota', 'KEGIATAN', 100000],
            ['AKHIR-PU', 'Akhirussanah · Pembantu Umum', 'KEGIATAN', 75000, 'Maksimal 3 orang.'],
        ],
        259 => [
            ['FT-KOORDINATOR', 'Field Trip · Koordinator Kegiatan', 'KEGIATAN', 100000],
            ['FT-ANGGOTA', 'Field Trip · Anggota', 'KEGIATAN', 25000],
            ['SW-KETUA', 'Studi Wisata · Ketua', 'KEGIATAN', 300000],
            ['SW-SEKRETARIS', 'Studi Wisata · Sekretaris', 'KEGIATAN', 200000],
            ['SW-BENDAHARA', 'Studi Wisata · Bendahara', 'KEGIATAN', 200000],
            ['SW-ANGGOTA', 'Studi Wisata · Anggota/Pendamping', 'KEGIATAN', 100000],
            ['SW-PEMBIMBING', 'Studi Wisata · Pembimbing Materi', 'KEGIATAN', 100000],
            ['SW-LKS', 'Studi Wisata · Pembuat LKS', 'KEGIATAN', 100000],
            ['SW-PENGUJI-KT', 'Studi Wisata · Penguji Karya Tulis', 'MURID', 20000, 'Per murid.'],
            ['SW-PU', 'Studi Wisata · Pembantu Umum', 'KEGIATAN', 75000, 'Per orang, maksimal 3 orang.'],
            ['MOS-KETUA', 'Masa Orientasi Murid · Ketua', 'KEGIATAN', 200000],
            ['MOS-SEKRETARIS', 'Masa Orientasi Murid · Sekretaris', 'KEGIATAN', 125000],
            ['MOS-BENDAHARA', 'Masa Orientasi Murid · Bendahara', 'KEGIATAN', 125000],
            ['MOS-ANGGOTA', 'Masa Orientasi Murid · Anggota', 'KEGIATAN', 100000],
            ['MOS-PEMATERI', 'Masa Orientasi Murid · Pemateri Guru', 'SESI/KELAS', 50000, 'Per sesi per kelas.'],
            ['MOS-PU', 'Masa Orientasi Murid · Pembantu Umum', 'KEGIATAN', 75000, 'Maksimal 3 orang.'],
            ['PAMERAN-KETUA', 'Pameran Pendidikan · Ketua', 'KEGIATAN', 200000],
            ['PAMERAN-SEKRETARIS', 'Pameran Pendidikan · Sekretaris', 'KEGIATAN', 125000],
            ['PAMERAN-BENDAHARA', 'Pameran Pendidikan · Bendahara', 'KEGIATAN', 125000],
            ['PAMERAN-SEKSI', 'Pameran Pendidikan · Seksi', 'KEGIATAN', 100000],
            ['PAMERAN-ANGGOTA', 'Pameran Pendidikan · Anggota', 'KEGIATAN', 100000, 'Per orang.'],
            ['PAMERAN-PU', 'Pameran Pendidikan · Pembantu Umum', 'KEGIATAN', 75000, 'Per orang, maksimal 3 orang.'],
            ['CD-KOORDINATOR', 'Career Day · Koordinator Kegiatan', 'KEGIATAN', 100000],
            ['CD-ANGGOTA', 'Career Day · Anggota', 'KEGIATAN', 25000],
        ],
        261 => [
            ['UTS-KETUA', 'UTS · Ketua Pelaksana', 'KEGIATAN', 200000],
            ['UTS-SEKRETARIS', 'UTS · Sekretaris', 'KEGIATAN', 100000],
            ['UTS-BENDAHARA', 'UTS · Bendahara', 'KEGIATAN', 100000],
            ['UTS-ANGGOTA', 'UTS · Anggota', 'KEGIATAN', 75000],
            ['UTS-PENGUJI-SMP-SMA', 'UTS · Penguji Lisan/Praktek (SMP dan SMA)', 'MURID', 1000, 'Per murid.'],
            ['UTS-PENGUJI-SD', 'UTS · Penguji Lisan/Praktek (SD)', 'MURID', 500, 'Per murid.'],
            ['UTS-PENGAWAS', 'UTS · Pengawas Ujian', 'KALI MENGAWAS', 5000, 'Per orang/kali mengawas.'],
            ['UTS-KOREKSI', 'UTS · Koreksi Hasil Ujian', 'MATA UJI/MURID', 1000, 'Per mata uji/murid.'],
            ['UTS-PEMBUAT-SOAL', 'UTS · Pembuat Soal', 'SOAL/MAPEL', 100000, 'Per soal/mata pelajaran.'],
            ['UTS-PENELAAH-SOAL', 'UTS · Penelaah Soal', 'SOAL/MAPEL', 25000, 'Per soal/mata pelajaran.'],
            ['UTS-EDITOR-SOAL', 'UTS · Editor Soal', 'SOAL/MAPEL', 5000, 'Per soal/mata pelajaran.'],
            ['UTS-PENGGANDAAN', 'UTS · Penggandaan Soal', 'BIDANG STUDI/JENJANG', 2500, 'Per bidang studi/jenjang.'],
            ['UTS-PU', 'UTS · Pembantu Umum', 'KEGIATAN', 75000, 'Per orang (rasio kelas 2:1).'],
            ['UAS-KETUA', 'Ujian Semester/UKK · Ketua Pelaksana', 'KEGIATAN', 300000],
            ['UAS-SEKRETARIS', 'Ujian Semester/UKK · Sekretaris', 'KEGIATAN', 150000],
            ['UAS-BENDAHARA', 'Ujian Semester/UKK · Bendahara', 'KEGIATAN', 150000],
            ['UAS-ANGGOTA', 'Ujian Semester/UKK · Anggota', 'KEGIATAN', 125000],
            ['UAS-PENGUJI-SMP-SMA', 'Ujian Semester/UKK · Penguji Lisan/Praktek (SMP dan SMA)', 'MURID', 1000, 'Per murid.'],
            ['UAS-PENGUJI-SD', 'Ujian Semester/UKK · Penguji Lisan/Praktek (SD)', 'MURID', 500, 'Per murid.'],
            ['UAS-PENGAWAS', 'Ujian Semester/UKK · Pengawas Ujian', 'KALI MENGAWAS', 10000, 'Per orang/kali mengawas.'],
            ['UAS-KOREKSI', 'Ujian Semester/UKK · Koreksi Hasil Ujian', 'MATA UJI/MURID', 1000, 'Per mata uji/murid (scanner).'],
            ['UAS-PEMBUAT-SOAL', 'Ujian Semester/UKK · Pembuat Soal', 'SOAL/MAPEL', 125000, 'Per soal/mata pelajaran.'],
            ['UAS-PENELAAH-SOAL', 'Ujian Semester/UKK · Penelaah Soal', 'SOAL/MAPEL', 25000, 'Per soal/mata pelajaran.'],
            ['UAS-PENGGANDAAN', 'Ujian Semester/UKK · Penggandaan Soal', 'BIDANG STUDI/JENJANG', 2500, 'Per bidang studi/jenjang.'],
            ['UAS-PU', 'Ujian Semester/UKK · Pembantu Umum', 'KEGIATAN', 75000, 'Per orang (rasio 1:2).'],
            ['USUN-KETUA', 'US/UN · Ketua Pelaksana', 'KEGIATAN', 400000],
            ['USUN-SEKRETARIS', 'US/UN · Sekretaris', 'KEGIATAN', 200000],
            ['USUN-BENDAHARA', 'US/UN · Bendahara', 'KEGIATAN', 200000],
            ['USUN-ANGGOTA', 'US/UN · Anggota', 'KEGIATAN', 200000],
            ['USUN-PENGUJI', 'US/UN · Penguji Lisan/Praktek', 'MURID', 2000, 'Per murid/penguji.'],
            ['USUN-PENGAWAS-LUAR', 'US/UN · Pengawas dari Luar', 'HARI', 50000, 'Per orang/hari.'],
            ['USUN-PENGAWAS-DINAS', 'US/UN · Pengawas Diknas/Depag', 'HARI', 250000, 'Per orang/hari.'],
            ['USUN-PENULIS-IJAZAH', 'US/UN · Penulis Ijazah', 'IJAZAH', 10000, 'Per ijazah.'],
            ['USUN-PENANDATANGAN-IJAZAH', 'US/UN · Penandatangan Ijazah', 'IJAZAH', 1000, 'Per ijazah.'],
            ['USUN-KEAMANAN', 'US/UN · Petugas Keamanan', 'KEGIATAN', 100000, 'Per orang, maksimal 2 orang.'],
            ['USUN-PEMBUAT-SOAL', 'US/UN · Pembuat Soal Sekolah', 'SOAL/MAPEL', 125000, 'Per soal/mata pelajaran.'],
            ['USUN-PENELAAH-MULOK', 'US/UN · Penelaah Soal Mulok', 'SOAL/MAPEL', 50000, 'Per soal/mata pelajaran.'],
            ['USUN-PIAGAM', 'US/UN · Penulisan Piagam Non Ijazah', 'IJAZAH', 1500, 'Per ijazah.'],
            ['USUN-PU', 'US/UN · Pembantu Umum', 'KEGIATAN', 100000, 'Per orang, maksimal 4 orang.'],
        ],
        263 => [
            ['TO-KETUA', 'Try Out · Ketua Pelaksana', 'KEGIATAN', 500000],
            ['TO-SEKRETARIS', 'Try Out · Sekretaris', 'KEGIATAN', 200000],
            ['TO-BENDAHARA', 'Try Out · Bendahara', 'KEGIATAN', 200000],
            ['TO-ANGGOTA', 'Try Out · Anggota', 'KEGIATAN', 200000, 'Maksimal 3 orang.'],
            ['TO-PEMBUAT-SOAL', 'Try Out · Pembuat Soal', 'SOAL/MAPEL', 75000, 'Per soal/mata pelajaran.'],
            ['TO-PENGAWAS', 'Try Out · Pengawas', 'ORANG/MAPEL', 10000, 'Per orang/mata pelajaran.'],
            ['TO-PENGETIK-SOAL', 'Try Out · Pengetik Soal', 'SOAL/MAPEL', 5000, 'Per soal/mata pelajaran.'],
            ['PM-KETUA', 'Pengayaan Materi · Ketua Pelaksana', 'KEGIATAN', 200000],
            ['PM-SEKRETARIS', 'Pengayaan Materi · Sekretaris', 'KEGIATAN', 100000],
            ['PM-BENDAHARA', 'Pengayaan Materi · Bendahara', 'KEGIATAN', 100000],
            ['PM-ANGGOTA', 'Pengayaan Materi · Anggota', 'KEGIATAN', 100000],
            ['PM-PEMBUAT-MODUL', 'Pengayaan Materi · Pembuat Modul', 'MODUL/SEMESTER', 150000, 'Per modul per semester.'],
            ['PM-PU', 'Pengayaan Materi · Pembantu Umum', 'SEMESTER', 75000, 'Per orang per semester, maksimal 2 orang.'],
            ['PP-KOORDINATOR', 'Pembinaan Prestasi · Koordinator', 'SEMESTER', 200000, 'Per semester.'],
            ['PP-ANGGOTA', 'Pembinaan Prestasi · Anggota', 'SEMESTER', 150000, 'Per semester.'],
            ['PPNA-KOORDINATOR', 'Pembinaan Prestasi Non Akademik · Koordinator (SD)', 'SEMESTER', 200000, 'Per semester.'],
            ['PPNA-ANGGOTA', 'Pembinaan Prestasi Non Akademik · Anggota', 'SEMESTER', 150000, 'Per semester.'],
            ['KLINIK-KOORDINATOR', 'Klinik Akademik · Koordinator', 'SEMESTER', 200000, 'Per semester.'],
            ['KLINIK-ANGGOTA', 'Klinik Akademik · Anggota', 'SEMESTER', 150000, 'Per semester.'],
        ],
        265 => [
            ['PMB-PENGUJI', 'PMB Sekolah · Penguji Lisan/Praktek', 'CALON MURID', 5000, 'Per calon murid.'],
            ['PMB-PENGAWAS', 'PMB Sekolah · Pengawas Ujian', 'KALI MENGAWAS', 25000, 'Per orang/mengawas.'],
            ['PMB-KOREKSI', 'PMB Sekolah · Koreksi Hasil Ujian', 'MATA UJI/CALON MURID', 1500, 'Per mata uji/calon murid.'],
            ['PMB-KEAMANAN', 'PMB Sekolah · Petugas Keamanan', 'KEGIATAN', 100000, 'Per orang, maksimal 2 orang.'],
            ['PMB-PU', 'PMB Sekolah · Pembantu Umum', 'KEGIATAN', 100000, 'Per orang, maksimal 2 orang.'],
        ],
        267 => [
            ['PHB-SEKOLAH-KETUA', 'PHBI/PHBN Tingkat Sekolah · Ketua', 'KEGIATAN', 200000],
            ['PHB-SEKOLAH-SEKRETARIS', 'PHBI/PHBN Tingkat Sekolah · Sekretaris', 'KEGIATAN', 100000],
            ['PHB-SEKOLAH-BENDAHARA', 'PHBI/PHBN Tingkat Sekolah · Bendahara', 'KEGIATAN', 100000],
            ['PHB-SEKOLAH-SEKSI', 'PHBI/PHBN Tingkat Sekolah · Seksi', 'KEGIATAN', 100000, 'Per orang Ka. Seksi.'],
            ['PHB-SEKOLAH-ANGGOTA', 'PHBI/PHBN Tingkat Sekolah · Anggota', 'KEGIATAN', 75000, 'Per orang.'],
            ['PHB-SEKOLAH-PU', 'PHBI/PHBN Tingkat Sekolah · Pembantu Umum', 'KEGIATAN', 50000, 'Per orang.'],
            ['PHB-YAYASAN-KETUA', 'PHBI/PHBN Tingkat Yayasan · Ketua', 'KEGIATAN', 350000],
            ['PHB-YAYASAN-SEKRETARIS', 'PHBI/PHBN Tingkat Yayasan · Sekretaris', 'KEGIATAN', 150000],
            ['PHB-YAYASAN-BENDAHARA', 'PHBI/PHBN Tingkat Yayasan · Bendahara', 'KEGIATAN', 150000],
            ['PHB-YAYASAN-SEKSI', 'PHBI/PHBN Tingkat Yayasan · Seksi', 'KEGIATAN', 125000, 'Per orang Ka. Seksi.'],
            ['PHB-YAYASAN-ANGGOTA', 'PHBI/PHBN Tingkat Yayasan · Anggota', 'KEGIATAN', 100000, 'Per orang.'],
            ['PHB-YAYASAN-PU', 'PHBI/PHBN Tingkat Yayasan · Pembantu Umum', 'KEGIATAN', 75000, 'Per orang, maksimal 5 orang.'],
        ],
    ];

    public function run(): void
    {
        $sourceDir = rtrim((string) env('SK_YAPI_DIR', storage_path('app/sk-yapi')), '/');

        foreach (self::ACTIVITY_TYPES as $type) {
            ActivityType::updateOrCreate(['code' => $type['code']], [
                'name' => $type['name'],
                'description' => 'Dasar: SK YPI Al Azhar No. '.implode(' dan ', array_map(self::decreeNumber(...), $type['decrees'])).'.',
                'status' => 'active',
            ]);
        }

        $rateCount = 0;
        $attached = 0;

        foreach (self::RATES as $decree => $rows) {
            $decreeNumber = self::decreeNumber($decree);
            $fileName = "{$decree}-I-KEP-(YPIA-P)-1437.2016.pdf";
            $source = "{$sourceDir}/{$fileName}";

            foreach ($rows as $row) {
                [$code, $name, $unit, $rate] = $row;

                $honorType = HonorType::updateOrCreate(['code' => "SK{$decree}-{$code}"], [
                    'name' => $name,
                    'unit' => $unit,
                    'description' => trim(($row[4] ?? '')." SK No. {$decreeNumber}."),
                    'status' => 'active',
                ]);

                $honorRate = HonorRate::updateOrCreate(
                    ['honor_type_id' => $honorType->id, 'unit_id' => null, 'effective_from' => self::DECREE_DATE],
                    [
                        'rate' => $rate,
                        'decree_number' => $decreeNumber,
                        'decree_date' => self::DECREE_DATE,
                        'status' => 'active',
                    ],
                );
                $rateCount++;

                $hasFile = $honorRate->decree_file_path && Storage::disk('local')->exists($honorRate->decree_file_path);

                if (! $hasFile && is_file($source)) {
                    // One copy per rate: replacing a rate's scan from the UI
                    // deletes its old file, so rates must not share a path.
                    $path = "documents/honor-rates/{$decree}-".Str::uuid()->toString().'.pdf';
                    Storage::disk('local')->put($path, file_get_contents($source));
                    $honorRate->update(['decree_file_name' => $fileName, 'decree_file_path' => $path]);
                    $attached++;
                }
            }
        }

        $this->command?->info(sprintf(
            'SK YPI Al Azhar 2016: %d jenis kegiatan, %d tarif honor, %d scan SK dilampirkan (sumber: %s).',
            count(self::ACTIVITY_TYPES),
            $rateCount,
            $attached,
            $sourceDir,
        ));
    }

    private static function decreeNumber(int $number): string
    {
        return "{$number}/I/KEP/YPIA-P/1437.2016";
    }
}
