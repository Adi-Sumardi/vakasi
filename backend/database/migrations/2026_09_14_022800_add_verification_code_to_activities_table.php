<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            // Set once, on Kepala Sekolah approval (see ApprovalService::approve).
            // Unguessable (Str::random(40)) since it backs a public,
            // unauthenticated verification endpoint — see FLOW.md
            // section 8 / ARSITEKTUR.md section 11.1.
            $table->string('verification_code', 40)->nullable()->unique()->after('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('verification_code');
        });
    }
};
