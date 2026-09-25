<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A tariff is only as good as the decree behind it: without the SK
 * Yayasan number and its scan, nobody downstream (Kepala Sekolah,
 * Sianggar/SDM, auditor) can check that "Rp 5.000/PAKET" is the
 * official figure rather than one typed into the master.
 *
 * The decree number is also snapshotted onto honor_details, for the same
 * reason rate_snapshot is: a later SK must not rewrite which SK an
 * already-approved honor line was calculated under.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('honor_rates', function (Blueprint $table) {
            $table->string('decree_number')->nullable()->after('rate');
            $table->date('decree_date')->nullable()->after('decree_number');
            $table->string('decree_file_name')->nullable()->after('decree_date');
            $table->string('decree_file_path')->nullable()->after('decree_file_name');
        });

        Schema::table('honor_details', function (Blueprint $table) {
            $table->string('rate_decree_number_snapshot')->nullable()->after('rate_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('honor_details', function (Blueprint $table) {
            $table->dropColumn('rate_decree_number_snapshot');
        });

        Schema::table('honor_rates', function (Blueprint $table) {
            $table->dropColumn(['decree_number', 'decree_date', 'decree_file_name', 'decree_file_path']);
        });
    }
};
