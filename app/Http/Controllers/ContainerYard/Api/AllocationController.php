<?php

namespace App\Http\Controllers\ContainerYard\Api;

use App\Http\Controllers\Controller;
use App\Models\Allocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AllocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Allocation::query();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('service', 'like', "%{$search}%")
                    ->orWhere('discharge_port', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('iso_basic_length', 'like', "%{$search}%")
                    ->orWhere('reefer_type', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 50);
        $allocations = $query->orderBy('service')->orderBy('discharge_port')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $allocations->items(),
            'pagination' => [
                'total' => $allocations->total(),
                'per_page' => $allocations->perPage(),
                'current_page' => $allocations->currentPage(),
                'last_page' => $allocations->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service' => 'nullable|string|max:255',
            'discharge_port' => 'nullable|string|max:255',
            'iso_basic_length' => 'nullable|string|max:255',
            'reefer_type' => 'nullable|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        $allocation = Allocation::create($validated);

        return response()->json([
            'success' => true,
            'data' => $allocation,
            'message' => 'Allocation created successfully.',
        ], 201);
    }

    public function show(Allocation $allocation): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $allocation,
        ]);
    }

    public function update(Request $request, Allocation $allocation): JsonResponse
    {
        $validated = $request->validate([
            'service' => 'nullable|string|max:255',
            'discharge_port' => 'nullable|string|max:255',
            'iso_basic_length' => 'nullable|string|max:255',
            'reefer_type' => 'nullable|string|max:255',
            'location' => 'sometimes|required|string|max:255',
        ]);

        $allocation->update($validated);

        return response()->json([
            'success' => true,
            'data' => $allocation,
            'message' => 'Allocation updated successfully.',
        ]);
    }

    public function destroy(Allocation $allocation): JsonResponse
    {
        $allocation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Allocation deleted successfully.',
        ]);
    }
}
