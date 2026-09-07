<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('honor_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->restrictOnDelete();
            $table->foreignId('activity_member_id')->constrained()->restrictOnDelete();
            $table->foreignId('employee_id')->constrained()->restrictOnDelete();
            $table->foreignId('honor_type_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('rate_snapshot');
            $table->unsignedInteger('volume');
            $table->string('unit_snapshot');
            $table->unsignedBigInteger('gross_amount');
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('deduction_amount')->default(0);
            $table->unsignedBigInteger('net_amount');
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index('activity_id');
            $table->index('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('honor_details');
    }
};
