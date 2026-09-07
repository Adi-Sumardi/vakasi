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
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\UnitController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

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
        Route::middleware('permission:activities.create')->post('/activities', [ActivityController::class, 'store']);
        Route::middleware('permission:activities.update')->group(function () {
            Route::put('/activities/{activity}', [ActivityController::class, 'update']);
            Route::delete('/activities/{activity}', [ActivityController::class, 'destroy']);
            Route::post('/activities/{activity}/cancel', [ActivityController::class, 'cancel']);
            Route::post('/activities/{activity}/members', [ActivityMemberController::class, 'store']);
            Route::put('/activities/{activity}/members/{member}', [ActivityMemberController::class, 'update']);
            Route::delete('/activities/{activity}/members/{member}', [ActivityMemberController::class, 'destroy']);
            Route::post('/activities/{activity}/documents', [DocumentController::class, 'store']);
        });
        Route::middleware('permission:honors.calculate')
            ->post('/activities/{activity}/calculate-honor', [HonorController::class, 'calculate']);
        Route::middleware('permission:activities.submit')
            ->post('/activities/{activity}/submit', [ActivityController::class, 'submit']);

        Route::get('/documents/{document}/download', [DocumentController::class, 'download']);

        // Approval
        Route::middleware('permission:activities.approve')->group(function () {
            Route::get('/approvals', [ApprovalController::class, 'index']);
            Route::post('/activities/{activity}/approve', [ApprovalController::class, 'approve']);
            Route::post('/activities/{activity}/reject', [ApprovalController::class, 'reject']);
        });

        // Payments
        Route::middleware('permission:payments.view')->group(function () {
            Route::get('/payments', [PaymentController::class, 'index']);
            Route::get('/payments/{payment}', [PaymentController::class, 'show']);
        });
        Route::middleware('permission:payments.process')->group(function () {
            Route::post('/payments', [PaymentController::class, 'store']);
            Route::post('/payments/{payment}/process', [PaymentController::class, 'process']);
            Route::post('/payments/{payment}/evidence', [PaymentController::class, 'evidence']);
            Route::post('/payments/{payment}/complete', [PaymentController::class, 'complete']);
        });

        // Reports
        Route::middleware('permission:reports.view')->group(function () {
            Route::get('/reports/activities', [ReportController::class, 'activities']);
            Route::get('/reports/honors', [ReportController::class, 'honors']);
            Route::get('/reports/employees/{employee}/honors', [ReportController::class, 'employeeHonors']);
            Route::get('/reports/budget', [ReportController::class, 'budget']);
            Route::get('/reports/payments', [ReportController::class, 'payments']);
        });

        // Audit
        Route::middleware('permission:audit.view')->get('/audit-logs', [AuditLogController::class, 'index']);
    });
});
