<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Read-only mirror of the disbursement as it progresses through
     * Sianggar (FLOW.md section 8).
     *
     * Sianggar stays the single source of truth: nothing in VAKASI ever
     * writes these rows except the signed callback, and no VAKASI screen
     * can advance a stage. This is deliberately not the dormant payment
     * module — mirroring someone else's status is a different thing from
     * owning it, and a mirror cannot invent a payment that never
     * happened.
     */
    public function up(): void
    {
        Schema::create('activity_disbursements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->unique()->constrained()->cascadeOnDelete();

            // Sianggar's own identifiers — kept as plain columns, never as
            // foreign keys into another system's database
            // (AI_CODING_RULES.md section 17).
            $table->string('pengajuan_ulid')->nullable();
            $table->string('nomor_pengajuan')->nullable();
            $table->string('no_surat')->nullable();
            $table->string('perihal')->nullable();

            $table->string('status_proses')->nullable();
            $table->string('current_stage')->nullable();
            $table->unsignedBigInteger('approved_amount')->nullable();
            $table->string('no_voucher')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('last_event_at')->nullable();

            $table->timestamps();

            $table->index('status_proses');
        });

        Schema::create('activity_disbursement_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_disbursement_id')->constrained()->cascadeOnDelete();

            // Sianggar's event id: the callback is retried on failure, so
            // the same event can legitimately arrive more than once.
            $table->string('external_event_id')->unique();

            $table->string('event_type');
            $table->string('stage')->nullable();
            $table->string('status')->nullable();
            $table->string('actor_name')->nullable();
            $table->text('note')->nullable();
            $table->timestamp('occurred_at');
            $table->json('payload')->nullable();
            $table->timestamps();

            // Named explicitly: the generated name would exceed MySQL's
            // 64-character identifier limit.
            $table->index(['activity_disbursement_id', 'occurred_at'], 'disbursement_events_timeline_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_disbursement_events');
        Schema::dropIfExists('activity_disbursements');
    }
};
