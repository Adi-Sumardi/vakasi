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
            // Official reference number for the approval document,
            // distinct from `verification_code` (an opaque public
            // lookup key) and `activity_code` (assigned on creation,
            // before any approval exists) — set once, alongside
            // verification_code, in ApprovalService::approve().
            $table->string('approval_document_number')->nullable()->unique()->after('verification_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn('approval_document_number');
        });
    }
};
