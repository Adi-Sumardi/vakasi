<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\EmployeeResource;
use App\Models\Activity;
use App\Models\Document;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Global header search (API.md doesn't document this endpoint yet —
 * added to back the previously-decorative header search box). Each
 * section is only searched if the user holds the matching view
 * permission, and results are scoped identically to the section's own
 * list endpoint (ActivityController::index / DocumentController::all)
 * so this never leaks data a user couldn't otherwise see.
 */
class SearchController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = trim((string) $request->string('q'));
        $user = $request->user();

        if (mb_strlen($query) < 2) {
            return $this->success(['activities' => [], 'employees' => [], 'documents' => []]);
        }

        return $this->success([
            'activities' => $user->hasPermission('activities.view') ? $this->searchActivities($query, $user) : [],
            'employees' => $user->hasPermission('employees.view') ? $this->searchEmployees($query) : [],
            'documents' => $user->hasPermission('documents.view') ? $this->searchDocuments($query, $user) : [],
        ]);
    }

    private function searchActivities(string $query, User $user): mixed
    {
        $activities = Activity::query()
            ->with(['activityType', 'unit'])
            ->when(
                $user->hasRole('tu') && ! $user->hasRole('super_admin', 'admin'),
                fn (Builder $q) => $q->where('created_by', $user->id),
            )
            ->when(
                $user->hasRole('guru_tendik') && $user->employee_id,
                fn (Builder $q) => $q->whereHas('members', fn (Builder $m) => $m->where('employee_id', $user->employee_id)),
            )
            ->where(fn (Builder $q) => $q->where('name', 'like', "%{$query}%")->orWhere('activity_code', 'like', "%{$query}%"))
            ->limit(5)
            ->get();

        return ActivityResource::collection($activities);
    }

    private function searchEmployees(string $query): mixed
    {
        $employees = Employee::query()
            ->where(fn (Builder $q) => $q->where('name', 'like', "%{$query}%")
                ->orWhere('employee_code', 'like', "%{$query}%")
                ->orWhere('nip', 'like', "%{$query}%"))
            ->limit(5)
            ->get();

        return EmployeeResource::collection($employees);
    }

    private function searchDocuments(string $query, User $user): mixed
    {
        $documents = Document::query()
            ->with(['activity', 'payment'])
            ->when(
                $user->hasRole('guru_tendik') && $user->employee_id,
                fn (Builder $q) => $q->where(function (Builder $q2) use ($user) {
                    $q2->whereHas('activity.members', fn (Builder $m) => $m->where('employee_id', $user->employee_id))
                        ->orWhereHas('payment.activity.members', fn (Builder $m) => $m->where('employee_id', $user->employee_id));
                }),
            )
            ->where(fn (Builder $q) => $q->where('file_name', 'like', "%{$query}%")->orWhere('document_type', 'like', "%{$query}%"))
            ->limit(5)
            ->get();

        return DocumentResource::collection($documents);
    }
}
