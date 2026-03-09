<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/attendance
    // Returns attendance records for the authenticated user (intern)
    // OR all records if the caller is a supervisor/admin.
    // Optional query params: ?user_id=, ?from=, ?to=
    // ──────────────────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Attendance::with('user:id,full_name,email,role')
            ->orderBy('date', 'desc');

        // Interns only see their own records
        if ($user->role === 'intern') {
            $query->where('user_id', $user->id);
        } elseif ($request->has('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        // Date range filters
        if ($request->has('from')) {
            $query->where('date', '>=', $request->query('from'));
        }
        if ($request->has('to')) {
            $query->where('date', '<=', $request->query('to'));
        }

        $records = $query->get();

        return response()->json($records);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/attendance
    // Manually log an attendance record (admin / supervisor).
    // Body: { user_id, date, time_in, time_out, status? }
    // ──────────────────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'  => 'required|exists:users,id',
            'date'     => 'required|date_format:Y-m-d',
            'time_in'  => 'required|date_format:H:i',
            'time_out' => 'nullable|date_format:H:i|after:time_in',
            'status'   => 'nullable|in:present,absent,late,excused',
        ]);

        $totalHours = 0;
        if (!empty($validated['time_out'])) {
            $totalHours = $this->computeHours($validated['time_in'], $validated['time_out']);
        }

        $attendance = Attendance::updateOrCreate(
            ['user_id' => $validated['user_id'], 'date' => $validated['date']],
            [
                'time_in'     => $validated['time_in'],
                'time_out'    => $validated['time_out'] ?? null,
                'total_hours' => $totalHours,
                'status'      => $validated['status'] ?? 'present',
            ]
        );

        return response()->json($attendance, 201);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/attendance/log
    // Intern self-logs an entry (date + time_in + time_out all at once).
    // Body: { date, time_in, time_out }
    // ──────────────────────────────────────────────────────────────────────────
    public function log(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'date'     => 'required|date_format:Y-m-d',
            'time_in'  => 'required|date_format:H:i',
            'time_out' => 'required|date_format:H:i|after:time_in',
        ]);

        $totalHours = $this->computeHours($validated['time_in'], $validated['time_out']);

        // Determine status: late if time_in > 08:30
        $timeInMinutes = $this->toMinutes($validated['time_in']);
        $status = ($timeInMinutes > (8 * 60 + 30)) ? 'late' : 'present';

        $attendance = Attendance::updateOrCreate(
            ['user_id' => $user->id, 'date' => $validated['date']],
            [
                'time_in'     => $validated['time_in'],
                'time_out'    => $validated['time_out'],
                'total_hours' => $totalHours,
                'status'      => $status,
            ]
        );

        return response()->json($attendance, 201);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/attendance/clock-in
    // Intern clocks in — creates today's record with current time.
    // ──────────────────────────────────────────────────────────────────────────
    public function clockIn(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::now()->toDateString();
        $timeIn = Carbon::now()->format('H:i');

        // Check if already clocked in today
        $existing = Attendance::where('user_id', $user->id)->where('date', $today)->first();
        if ($existing) {
            return response()->json(['message' => 'Already clocked in today.', 'data' => $existing], 200);
        }

        $timeInMinutes = $this->toMinutes($timeIn);
        $status = ($timeInMinutes > (8 * 60 + 30)) ? 'late' : 'present';

        $attendance = Attendance::create([
            'user_id'     => $user->id,
            'date'        => $today,
            'time_in'     => $timeIn,
            'time_out'    => null,
            'total_hours' => 0,
            'status'      => $status,
        ]);

        return response()->json($attendance, 201);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/attendance/clock-out
    // Intern clocks out — updates today's record with current time + hours.
    // ──────────────────────────────────────────────────────────────────────────
    public function clockOut(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::now()->toDateString();
        $timeOut = Carbon::now()->format('H:i');

        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'No clock-in record found for today.'], 404);
        }

        if ($attendance->time_out) {
            return response()->json(['message' => 'Already clocked out today.', 'data' => $attendance], 200);
        }

        $attendance->time_out    = $timeOut;
        $attendance->total_hours = $this->computeHours($attendance->time_in, $timeOut);
        $attendance->save();

        return response()->json($attendance);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/attendance/today
    // Returns today's record for the authenticated intern (or null).
    // ──────────────────────────────────────────────────────────────────────────
    public function today(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::now()->toDateString();
        $record = Attendance::where('user_id', $user->id)->where('date', $today)->first();
        return response()->json($record);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/attendance/stats
    // Returns aggregated stats for the authenticated intern:
    // total_hours, this_week_hours, today_hours, total_entries.
    // ──────────────────────────────────────────────────────────────────────────
    public function stats(Request $request)
    {
        $user   = Auth::user();
        $userId = ($user->role === 'intern') ? $user->id : ($request->query('user_id') ?? $user->id);

        $allRecords = Attendance::where('user_id', $userId)->get();

        $today = Carbon::now()->toDateString();
        $monday = Carbon::now()->startOfWeek()->toDateString();
        $sunday = Carbon::now()->endOfWeek()->toDateString();

        $todayHours = $allRecords
            ->where('date', $today)
            ->sum('total_hours');

        $weekHours = $allRecords
            ->whereBetween('date', [$monday, $sunday])
            ->sum('total_hours');

        $totalHours = round($allRecords->sum('total_hours'), 2);

        return response()->json([
            'total_hours'   => $totalHours,
            'today_hours'   => round($todayHours, 2),
            'week_hours'    => round($weekHours, 2),
            'total_entries' => $allRecords->count(),
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DELETE /api/attendance/{id}
    // Admin / Supervisor can delete a record.
    // ──────────────────────────────────────────────────────────────────────────
    public function destroy(int $id)
    {
        $user       = Auth::user();
        $attendance = Attendance::findOrFail($id);

        // Intern can only delete their own records
        if ($user->role === 'intern' && $attendance->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $attendance->delete();
        return response()->json(['message' => 'Attendance record deleted.']);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────
    private function toMinutes(string $hhmm): int
    {
        [$h, $m] = array_map('intval', explode(':', $hhmm));
        return $h * 60 + $m;
    }

    private function computeHours(string $timeIn, string $timeOut): float
    {
        $diff = $this->toMinutes($timeOut) - $this->toMinutes($timeIn);
        return max(0, round($diff / 60, 2));
    }
}
