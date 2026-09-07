<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('honor_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('honor_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('rate');
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['honor_type_id', 'effective_from']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('honor_rates');
    }
};
