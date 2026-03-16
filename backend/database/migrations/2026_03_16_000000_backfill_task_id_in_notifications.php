<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Regex patterns to extract task title from notification content
        $patterns = [
            '/You have been assigned to: (.+)$/',
            "/Your task '(.+)' /",
            "/Task '(.+)' /",
            "/task: '(.+)'/",
        ];

        DB::table('notifications')->get()->each(function ($row) use ($patterns) {
                $data = json_decode($row->data, true);

                if (!empty($data['task_id'])) {
                    return; // already has task_id, skip
                }

                $content = $data['content'] ?? '';
                $taskTitle = null;

                foreach ($patterns as $pattern) {
                    if (preg_match($pattern, $content, $matches)) {
                        $taskTitle = trim($matches[1], " .'");
                        break;
                    }
                }

                if (!$taskTitle) {
                    return;
                }

                $task = DB::table('task_information')->where('title', $taskTitle)->first();

                if (!$task) {
                    return;
                }

                $data['task_id'] = $task->id;

                DB::table('notifications')
                    ->where('id', $row->id)
                    ->update(['data' => json_encode($data)]);
            });
    }

    public function down(): void
    {
        // Remove backfilled task_ids from notifications
        DB::table('notifications')->get()->each(function ($row) {
            $data = json_decode($row->data, true);
            unset($data['task_id']);
            DB::table('notifications')
                ->where('id', $row->id)
                ->update(['data' => json_encode($data)]);
        });
    }
};
