<?php

use App\Http\Controllers\Api\V1\ActivityController;
use App\Http\Controllers\Api\V1\ActivityMemberController;
use App\Http\Controllers\Api\V1\ActivityTypeController;
use App\Http\Controllers\Api\V1\ApprovalController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\FundSourceController;
use App\Http\Controllers\Api\V1\HonorController;
use App\Http\Controllers\Api\V1\HonorRateController;
use App\Http\Controllers\Api\V1\HonorTypeController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PositionController;
use App\Http\Controllers\Api\V1\PublicVerificationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\SianggarCallbackController;
use App\Http\Controllers\Api\V1\SianggarController;
use App\Http\Controllers\Api\V1\UnitController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    // PRD.md FR-01 reset flow. Public by necessity, so rate limited:
    // these endpoints take an email address from an unauthenticated
    // caller.
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    });

    // Public, unauthenticated — see FLOW.md section 8 / ARSITEKTUR.md
    // section 11.1. `{code}` is an opaque unguessable token, never the
    // activity id, so throttling is defense-in-depth, not the primary
    // guard against enumeration.
    Route::middleware('throttle:30,1')->group(function () {
        Route::get('/public/verify/{code}', [PublicVerificationController::class, 'show']);
        Route::get('/public/verify/{code}/qrcode', [PublicVerificationController::class, 'qrcode']);
    });

    // Sianggar melaporkan kemajuan pencairan ke sini. Di luar
    // auth:sanctum karena pemanggilnya server, bukan pengguna VAKASI —
    // autentikasinya HMAC atas raw body (X-Sianggar-Signature).
    Route::post('/integrations/sianggar/callback', SianggarCallbackController::class)
        ->middleware('throttle:120,1')
        ->name('integrations.sianggar.callback');

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::patch('/auth/password', [AuthController::class, 'changePassword']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

        Route::get('/search', [SearchController::class, 'index']);

        // Master Data. ROLE_PERMISSION.md's matrix has no dedicated line
        // for these lookup tables; each reuses the closest related
        // permission pair (documented simplification, see AI_CODING_RULES 18):
        // units/positions -> employees.*, activity-types -> activities.*,
        // honor-types/honor-rates -> honor-rates.*, fund-sources -> budget.*.
        $masterData = [
            ['uri' => 'units', 'param' => 'unit', 'controller' => UnitController::class, 'view' => 'employees.view', 'manage' => 'employees.manage'],
            ['uri' => 'positions', 'param' => 'position', 'controller' => PositionController::class, 'view' => 'employees.view', 'manage' => 'employees.manage'],
            ['uri' => 'activity-types', 'param' => 'activityType', 'controller' => ActivityTypeController::class, 'view' => 'activities.view', 'manage' => 'activities.create'],
            ['uri' => 'honor-types', 'param' => 'honorType', 'controller' => HonorTypeController::class, 'view' => 'honor-rates.view', 'manage' => 'honor-rates.manage'],
            ['uri' => 'honor-rates', 'param' => 'honorRate', 'controller' => HonorRateController::class, 'view' => 'honor-rates.view', 'manage' => 'honor-rates.manage'],
            ['uri' => 'fund-sources', 'param' => 'fundSource', 'controller' => FundSourceController::class, 'view' => 'budget.view', 'manage' => 'budget.manage'],
        ];

        foreach ($masterData as $resource) {
            Route::middleware("permission:{$resource['view']}")->group(function () use ($resource) {
                Route::get("/{$resource['uri']}", [$resource['controller'], 'index']);
                Route::get("/{$resource['uri']}/{{$resource['param']}}", [$resource['controller'], 'show']);
            });
            Route::middleware("permission:{$resource['manage']}")->group(function () use ($resource) {
                Route::post("/{$resource['uri']}", [$resource['controller'], 'store']);
                Route::put("/{$resource['uri']}/{{$resource['param']}}", [$resource['controller'], 'update']);
            });
        }

        Route::middleware('permission:employees.view')->group(function () {
            Route::get('/employees', [EmployeeController::class, 'index']);
            Route::get('/employees/{employee}', [EmployeeController::class, 'show']);
        });
        Route::middleware('permission:employees.manage')->group(function () {
            Route::post('/employees', [EmployeeController::class, 'store']);
            Route::put('/employees/{employee}', [EmployeeController::class, 'update']);
            Route::patch('/employees/{employee}/status', [EmployeeController::class, 'updateStatus']);
        });

        // Activities
        Route::middleware('permission:activities.view')->group(function () {
            Route::get('/activities', [ActivityController::class, 'index']);
            Route::get('/activities/{activity}', [ActivityController::class, 'show']);
            Route::get('/activities/{activity}/members', [ActivityMemberController::class, 'index']);
            Route::get('/activities/{activity}/honors', [HonorController::class, 'index']);
            Route::get('/activities/{activity}/documents', [DocumentController::class, 'index']);
            Route::get('/activities/{activity}/approvals', [ApprovalController::class, 'forActivity']);
        });
        Route::middleware('permission:documents.view')
            ->get('/activities/{activity}/employees/{employee}/honor-slip', [HonorController::class, 'slip']);
        Route::middleware('permission:activities.create')->post('/activities', [ActivityController::class, 'store']);
        Route::middleware('permission:activities.update')->group(function () {
            Route::put('/activities/{activity}', [ActivityController::class, 'update']);
            Route::delete('/activities/{activity}', [ActivityController::class, 'destroy']);
            Route::post('/activities/{activity}/cancel', [ActivityController::class, 'cancel']);
            Route::post('/activities/{activity}/members', [ActivityMemberController::class, 'store']);
            // scopeBindings(): resolve {member} through $activity->members(),
            // not globally by id. Without it, authorizing against {activity}
            // while acting on a {member} that belongs to a *different*
            // activity is an IDOR (AI_CODING_RULES.md section 6: never trust
            // an id from the request just because the user is logged in).
            Route::put('/activities/{activity}/members/{member}', [ActivityMemberController::class, 'update'])->scopeBindings();
            Route::delete('/activities/{activity}/members/{member}', [ActivityMemberController::class, 'destroy'])->scopeBindings();
        });
        // Documents Manage is its own row in ROLE_PERMISSION.md section 3
        // (Keuangan has it, and they cannot update activities) — gating
        // uploads on activities.update left that permission unused.
        Route::middleware('permission:documents.manage')
            ->post('/activities/{activity}/documents', [DocumentController::class, 'store']);
        Route::middleware('permission:honors.calculate')
            ->post('/activities/{activity}/calculate-honor', [HonorController::class, 'calculate']);
        Route::middleware('permission:activities.submit')
            ->post('/activities/{activity}/submit', [ActivityController::class, 'submit']);

        Route::middleware('permission:documents.view')->get('/documents', [DocumentController::class, 'all']);
        Route::get('/documents/{document}/download', [DocumentController::class, 'download']);

        // Handoff to Sianggar (FLOW.md section 8). The push is automatic on
        // approval; these endpoints only cover recovering a failed one.
        Route::middleware('permission:integration.manage')->group(function () {
            Route::get('/integrations/sianggar/pending', [SianggarController::class, 'pending']);
            Route::post('/integrations/sianggar/activities/{activity}/push', [SianggarController::class, 'push']);
        });

        // Approval
        Route::middleware('permission:activities.approve')->group(function () {
            Route::get('/approvals', [ApprovalController::class, 'index']);
            Route::post('/activities/{activity}/approve', [ApprovalController::class, 'approve']);
            Route::post('/activities/{activity}/reject', [ApprovalController::class, 'reject']);
        });

        // Payments — dormant. VAKASI stops at Kepala Sekolah approval;
        // disbursement happens in Sianggar (FLOW.md section 8). These
        // routes only exist when config('vakasi.payment_module') is on.
        if (config('vakasi.payment_module')) {
            Route::middleware('permission:payments.view')->group(function () {
                Route::get('/payments', [PaymentController::class, 'index']);
                Route::get('/payments/{payment}', [PaymentController::class, 'show']);
            });
            Route::middleware('permission:payments.process')->group(function () {
                Route::post('/payments', [PaymentController::class, 'store']);
                Route::post('/payments/{payment}/process', [PaymentController::class, 'process']);
                Route::post('/payments/{payment}/evidence', [PaymentController::class, 'evidence']);
                Route::post('/payments/{payment}/complete', [PaymentController::class, 'complete']);
                Route::post('/payments/{payment}/cancel', [PaymentController::class, 'cancel']);
            });
        }

        // Reports
        Route::middleware('permission:reports.view')->group(function () {
            Route::get('/reports/activities', [ReportController::class, 'activities']);
            Route::get('/reports/honors', [ReportController::class, 'honors']);
            Route::get('/reports/employees/{employee}/honors', [ReportController::class, 'employeeHonors']);
            Route::get('/reports/budget', [ReportController::class, 'budget']);

            if (config('vakasi.payment_module')) {
                Route::get('/reports/payments', [ReportController::class, 'payments']);
            }
        });

        // Audit
        Route::middleware('permission:audit.view')->get('/audit-logs', [AuditLogController::class, 'index']);

        // Users (Pengaturan) — per ROLE_PERMISSION.md matrix, Super Admin only.
        Route::middleware('permission:users.manage')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::get('/roles', [UserController::class, 'roles']);
        });
    });
});
