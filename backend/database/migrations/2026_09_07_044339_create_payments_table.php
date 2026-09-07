<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->foreignId('activity_id')->constrained()->restrictOnDelete();
            $table->date('payment_date');
            $table->string('payment_method');
            $table->string('source_account')->nullable();
            $table->unsignedBigInteger('total_amount');
            $table->string('reference_number')->nullable();
            $table->string('status')->default('processing');
            $table->foreignId('processed_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index('payment_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
