<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->string('approval_type');
            $table->unsignedInteger('sequence')->default(1);
            $table->foreignId('approver_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('decision_at')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['activity_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
