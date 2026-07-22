<?php

namespace App\Http\Controllers\ContainerYard\Api;

use App\Http\Controllers\Controller;
use App\Models\Block;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class BlockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Block::query();

            if ($request->has('facility')) {
                $query->byFacility($request->input('facility'));
            }

            if ($request->boolean('active_only', false)) {
                $query->active();
            }

            if ($request->has('search')) {
                $query->search($request->input('search'));
            }

            $sortBy = $request->input('sort_by', 'name');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = (int) $request->input('per_page', 50);
            $blocks = $query->paginate($perPage);

            $blocks->getCollection()->each(function (Block $block) {
                $block->append(['total_bays', 'total_rows', 'total_capacity']);
            });

            return response()->json([
                'success' => true,
                'data' => $blocks->items(),
                'pagination' => [
                    'current_page' => $blocks->currentPage(),
                    'total' => $blocks->total(),
                    'per_page' => $blocks->perPage(),
                    'last_page' => $blocks->lastPage(),
                ],
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve blocks',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate($this->rules());

            $block = Block::create($validated);
            $block->append(['total_bays', 'total_rows', 'total_capacity']);

            return response()->json([
                'success' => true,
                'message' => 'Block created successfully',
                'data' => $block,
            ], Response::HTTP_CREATED);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to create block',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(Block $block): JsonResponse
    {
        $block->append(['total_bays', 'total_rows', 'total_capacity']);

        return response()->json([
            'success' => true,
            'data' => $block,
        ], Response::HTTP_OK);
    }

    public function update(Request $request, Block $block): JsonResponse
    {
        try {
            $validated = $request->validate($this->rules($block->id, sometimes: true));

            $block->update($validated);
            $block->append(['total_bays', 'total_rows', 'total_capacity']);

            return response()->json([
                'success' => true,
                'message' => 'Block updated successfully',
                'data' => $block,
            ], Response::HTTP_OK);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to update block',
                'message' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Block $block): JsonResponse
    {
        $block->delete();

        return response()->json([
            'success' => true,
            'message' => 'Block deleted successfully',
        ], Response::HTTP_OK);
    }

    /** @return array<string, string> */
    private function rules(?int $ignoreId = null, bool $sometimes = false): array
    {
        $required = $sometimes ? 'sometimes' : 'required';
        $nameUnique = 'unique:blocks,name'.($ignoreId ? ",{$ignoreId}" : '');

        return [
            'name' => "{$required}|string|{$nameUnique}",
            'bay_start' => "{$required}|integer|min:1",
            'bay_end' => "{$required}|integer|min:1|gte:bay_start",
            'row_start' => "{$required}|string|regex:/^[A-Z]$/",
            'row_end' => "{$required}|string|regex:/^[A-Z]$/",
            'max_tier' => "{$required}|integer|min:1|max:10",
            'facility' => "{$required}|in:".implode(',', Block::FACILITIES),
            'road_side' => 'sometimes|in:row_start,row_end,both',
            'is_active' => 'sometimes|boolean',
            'excluded_rows' => 'sometimes|nullable|string',
        ];
    }
}
