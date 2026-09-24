<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * VAKASI pushes an approved activity to Sianggar, where SDM picks it
     * up under the "Vakasi" menu (FLOW.md section 8). An outbound call
     * can fail without anyone noticing, so the delivery outcome is
     * recorded on the activity itself rather than only in the log.
     */
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('sianggar_status')->nullable()->after('approval_document_number');
            $table->timestamp('sianggar_synced_at')->nullable()->after('sianggar_status');
            $table->unsignedInteger('sianggar_attempts')->default(0)->after('sianggar_synced_at');
            $table->text('sianggar_last_error')->nullable()->after('sianggar_attempts');

            $table->index('sianggar_status');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropIndex(['sianggar_status']);
            $table->dropColumn(['sianggar_status', 'sianggar_synced_at', 'sianggar_attempts', 'sianggar_last_error']);
        });
    }
};
