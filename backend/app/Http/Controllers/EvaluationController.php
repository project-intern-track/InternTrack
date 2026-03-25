<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\TaskFeedback;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    /**
     * Get all evaluations
     */
    public function index()
    {
        try {
            $evaluations = Evaluation::with('intern:id,full_name')->get();
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
            $evaluation = Evaluation::with('intern:id,full_name')->findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $evaluation,
                'message' => 'Evaluation retrieved successfully'
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
                'intern_id' => 'required|numeric',
                'supervisor_id' => 'required|numeric',
                'task_completion' => 'nullable|numeric',
                'competency_score' => 'nullable|string',
                'score' => 'nullable|numeric|min:0|max:100',
                'feedback' => 'nullable|string',
                'evaluation_date' => 'required|date',
                'intern_name' => 'nullable|string',
            ]);

            $feedbackEntries = TaskFeedback::where('intern_id', $validated['intern_id'])->get();

            if ($feedbackEntries->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot create evaluation because this intern has no submitted feedback yet.',
                    'errors' => [
                        'intern_id' => ['This intern has no submitted feedback yet.'],
                    ],
                ], 422);
            }

            $allRatings = [];
            foreach ($feedbackEntries as $entry) {
                foreach ($entry->competency_ratings as $rating) {
                    $allRatings[] = (int) ($rating['rating'] ?? 0);
                }
            }

            $avgCompetency = !empty($allRatings)
                ? array_sum($allRatings) / count($allRatings)
                : 0;

            $validated['task_completion'] = round($avgCompetency);
            $validated['competency_score'] = number_format($avgCompetency, 1) . '/5';
            $validated['score'] = round(($avgCompetency / 5) * 100);

            $evaluation = Evaluation::create($validated);

            return response()->json([
                'success' => true,
                'data' => $evaluation->fresh(),  // ← Add this to refresh timestamps
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
                'task_completion' => 'nullable|numeric',
                'competency_score' => 'nullable|string',
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
