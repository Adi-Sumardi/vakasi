<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeStatusRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $employees = Employee::query()
            ->with(['unit', 'position'])
            ->when($request->string('status')->toString(), fn ($q, $status) => $q->where('status', $status))
            ->when($request->integer('unit_id'), fn ($q, $unitId) => $q->where('unit_id', $unitId))
            ->when($request->string('employee_type')->toString(), fn ($q, $type) => $q->where('employee_type', $type))
            ->when($request->string('search')->toString(), fn ($q, $search) => $q->where(function ($q2) use ($search) {
                $q2->where('name', 'like', "%{$search}%")->orWhere('employee_code', 'like', "%{$search}%");
            }))
            ->orderBy('name')
            ->paginate(20);

        return $this->success(EmployeeResource::collection($employees));
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $employee = Employee::create($request->validated());

        return $this->success(new EmployeeResource($employee->load(['unit', 'position'])), 'Pegawai berhasil dibuat.', 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        return $this->success(new EmployeeResource($employee->load(['unit', 'position'])));
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $employee->update($request->validated());

        return $this->success(new EmployeeResource($employee->load(['unit', 'position'])), 'Pegawai berhasil diperbarui.');
    }

    public function updateStatus(UpdateEmployeeStatusRequest $request, Employee $employee): JsonResponse
    {
        $employee->update($request->validated());

        return $this->success(new EmployeeResource($employee), 'Status pegawai berhasil diperbarui.');
    }
}
