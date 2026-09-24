<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * HonorCalculationService upserts honor lines with
     * updateOrCreate(['activity_member_id', 'honor_type_id']), which
     * silently assumes that pair is unique. Nothing enforced it, so two
     * concurrent calculations could each insert a line for the same
     * member and honor type and double the activity's committed amount.
     */
    public function up(): void
    {
        Schema::table('honor_details', function (Blueprint $table) {
            $table->unique(['activity_member_id', 'honor_type_id'], 'honor_details_member_type_unique');
        });
    }

    public function down(): void
    {
        Schema::table('honor_details', function (Blueprint $table) {
            $table->dropUnique('honor_details_member_type_unique');
        });
    }
};
