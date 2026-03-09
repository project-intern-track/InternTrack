<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    /**
     * Get all evaluations
     */
    public function index()
    {
        try {
            $evaluations = Evaluation::all();
            return response()->json([
                'success' => true,
                'data' => $evaluations,
                'message' => 'Evaluations retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve evaluations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single evaluation by ID
     */
    public function show($id)
    {
        try {
            $evaluation = Evaluation::findOrFail($id);
            return response()->json([
                'user_id' => 'required|exists:users,id', 
                'supervisor_id' => 'required|exists:users,id',
                'score' => 'required|numeric|min:0|max:100',
                'feedback' => 'nullable|string',
                'evaluation_date' => 'required|date',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Evaluation not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create new evaluation
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'supervisor_id' => 'required|exists:users,id',
                'score' => 'required|numeric|min:0|max:100',
                'feedback' => 'nullable|string',
                'evaluation_date' => 'required|date',
            ]);

            $evaluation = Evaluation::create($validated);

            return response()->json([
                'success' => true,
                'data' => $evaluation,
                'message' => 'Evaluation created successfully'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update evaluation
     */
    public function update(Request $request, $id)
    {
        try {
            $evaluation = Evaluation::findOrFail($id);

            $validated = $request->validate([
                'score' => 'nullable|numeric|min:0|max:100',
                'feedback' => 'nullable|string',
                'evaluation_date' => 'nullable|date',
            ]);

            $evaluation->update($validated);

            return response()->json([
                'success' => true,
                'data' => $evaluation,
                'message' => 'Evaluation updated successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete evaluation
     */
    public function destroy($id)
    {
        try {
            $evaluation = Evaluation::findOrFail($id);
            $evaluation->delete();

            return response()->json([
                'success' => true,
                'message' => 'Evaluation deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete evaluation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}