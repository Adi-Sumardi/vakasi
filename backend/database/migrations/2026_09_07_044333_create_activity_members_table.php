<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->restrictOnDelete();
            $table->string('role_name');
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->unique(['activity_id', 'employee_id', 'role_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_members');
    }
};
