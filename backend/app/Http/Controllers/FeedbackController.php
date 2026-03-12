<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskFeedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function supervisorTasks(Request $request): JsonResponse
    {
        $tasks = Task::where('status', 'completed')
            ->whereHas('assignedInterns')
            ->with('assignedInterns')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn($task) => $this->formatFeedbackTask($task));

        return response()->json(['data' => $tasks->values()]);
    }

    public function submitFeedback(Request $request, int $taskId, int $internId): JsonResponse
    {
        $validated = $request->validate([
            'competency_ratings'                => 'required|array|min:1',
            'competency_ratings.*.competency'   => 'required|string',
            'competency_ratings.*.rating'       => 'required|integer|min:1|max:5',
            'competency_ratings.*.comment'      => 'nullable|string',
        ]);

        $feedback = TaskFeedback::updateOrCreate(
            ['task_id' => $taskId, 'intern_id' => $internId],
            [
                'supervisor_id'      => $request->user()->id,
                'competency_ratings' => $validated['competency_ratings'],
            ]
        );

        return response()->json(['data' => $feedback]);
    }

    public function myFeedback(Request $request): JsonResponse
    {
        $intern = $request->user();

        $feedbacks = TaskFeedback::where('intern_id', $intern->id)
            ->with('supervisor:id,full_name')
            ->orderByDesc('created_at')
            ->get();

        $competencyBuckets = [];
        $latestPerCompetency = [];

        foreach ($feedbacks as $fb) {
            foreach ($fb->competency_ratings as $cr) {
                $competency = trim($cr['competency']);
                $key = strtolower(str_replace(' ', '_', $competency));

                // Aggregate all ratings for skills overview
                $competencyBuckets[$key]['label'] = $competency;
                $competencyBuckets[$key]['ratings'][] = (int) $cr['rating'];

                // Keep only the most recent entry per competency (feedbacks are ordered desc)
                if (!isset($latestPerCompetency[$key])) {
                    $latestPerCompetency[$key] = [
                        'id'           => $fb->id . '-' . $key,
                        'competency'   => $competency,
                        'rating'       => (int) $cr['rating'],
                        'comment'      => $cr['comment'] ?? '',
                        'createdAt'    => $fb->created_at->toISOString(),
                        'reviewerName' => $fb->supervisor?->full_name,
                    ];
                }
            }
        }

        $skills = array_map(function ($key, $data) {
            $avg = array_sum($data['ratings']) / count($data['ratings']);
            return [
                'key'      => $key,
                'label'    => $data['label'],
                'score'    => round($avg, 2),
                'maxScore' => 5,
            ];
        }, array_keys($competencyBuckets), array_values($competencyBuckets));

        $recentFeedback = array_values($latestPerCompetency);
        usort($recentFeedback, fn($a, $b) => strcmp($b['createdAt'], $a['createdAt']));

        return response()->json([
            'data' => [
                'skills'         => array_values($skills),
                'recentFeedback' => $recentFeedback,
            ],
        ]);
    }

    private function formatFeedbackTask(Task $task): array
    {
        $feedbacks = TaskFeedback::where('task_id', $task->id)
            ->get()
            ->keyBy('intern_id');

        $interns = $task->assignedInterns->map(function ($intern) use ($feedbacks) {
            $fb = $feedbacks->get($intern->id);
            return [
                'id'                 => $intern->id,
                'name'               => $intern->full_name,
                'role'               => $intern->ojt_role ?? 'Intern',
                'feedback_submitted' => $fb !== null,
                'competency_ratings' => $fb?->competency_ratings,
            ];
        });

        $allSubmitted = $interns->every(fn($i) => $i['feedback_submitted']);

        return [
            'id'              => $task->id,
            'taskName'        => $task->title,
            'taskDescription' => $task->description ?? '',
            'completionDate'  => $task->updated_at->toISOString(),
            'interns'         => $interns->values()->toArray(),
            'status'          => $allSubmitted ? 'Submitted' : 'Pending',
        ];
    }



    // Function for Getting the Final Score of an intern
    public function getInternFinalScore($internId): JsonResponse
    {
        $feedback = TaskFeedback::where('intern_id', $internId)->get();

        if ($feedback->isEmpty()) {
            return response()->json([
                'data' => [
                    'avgTaskCompletion' => 0,
                    'avgCompetencyScore' => '0/5',
                    'finalScore' => 0,
                ]
            ]);
        }

        // Flatten Competency Score
        $allRatings = [];
        foreach ($feedback as $fb) {  
            foreach ($fb->competency_ratings as $rating) {
                $allRatings[] = (int) $rating['rating'];
            }
        } 

        // Average Computation
        $avgCompetency = !empty($allRatings)
            ? array_sum($allRatings) / count($allRatings)
            : 0;

        // 100 point scale
        $finalScore = round(($avgCompetency / 5) * 100);

        return response()->json([
            'data' => [
                'avgTaskCompletion' => round($avgCompetency),
                'avgCompetency' => number_format($avgCompetency, 1) . '/5',
                'finalScore' => $finalScore,
            ]
        ]);
    }
}
