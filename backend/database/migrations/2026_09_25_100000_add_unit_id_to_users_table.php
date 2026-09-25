<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ties an account to one unit (sekolah). A TU, Kepala Sekolah or unit
 * admin with a unit only sees and acts on that unit's activities; an
 * account without one keeps yayasan-wide scope. Super Admin is never
 * scoped (User::scopedUnitId).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('unit_id')->nullable()->after('employee_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('unit_id');
        });
    }
};
