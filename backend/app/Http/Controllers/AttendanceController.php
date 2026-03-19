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

        // Auto-invalidate any past sessions that were never clocked out
        Attendance::whereNull('time_out')
            ->where('date', '<', Carbon::now()->toDateString())
            ->update([
                'status' => 'absent',
                'total_hours' => 0
            ]);

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
            'time_in'  => ['required', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
            'time_out' => ['nullable', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', 'after:time_in'],
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
            'time_in'  => ['required', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
            'time_out' => ['required', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', 'after:time_in'],
        ]);

        $totalHours = $this->computeHours($validated['time_in'], $validated['time_out']);

        $status = 'present';

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
        $user  = Auth::user();
        $today = Carbon::now()->toDateString();
        $timeIn = Carbon::now()->format('H:i:s');

        // ── OJT ID verification ─────────────────────────────────────────────
        $request->validate([
            'ojt_id' => 'required',
        ]);

        $storedOjtId = $user->ojt_id; // integer or null

        // If this user has no OJT ID assigned yet, skip verification
        if ($storedOjtId !== null) {
            // Compare as integers so "1102" === 1102
            $submittedOjtId = intval(trim((string) $request->input('ojt_id')));
            if ($submittedOjtId <= 0 || $submittedOjtId !== (int) $storedOjtId) {
                return response()->json([
                    'message' => "Invalid OJT ID. Your OJT ID is a number shown on your Settings page.",
                ], 422);
            }
        }

        // ── Already clocked in today? ────────────────────────────────────────
        $existing = Attendance::where('user_id', $user->id)->where('date', $today)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Already clocked in today.',
                'data'    => $existing,
            ], 200);
        }

        $status = 'present';

        $attendance = Attendance::create([
            'user_id'     => $user->id,
            'date'        => $today,
            'time_in'     => $timeIn,
            'time_out'    => null,
            'total_hours' => 0,
            'status'      => $status,
        ]);

        return response()->json(['data' => $attendance], 201);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/attendance/clock-out
    // Intern clocks out — updates today's record with current time + hours.
    // ──────────────────────────────────────────────────────────────────────────
    public function clockOut(Request $request)
    {
        $user = Auth::user();
        $now  = Carbon::now();

        // Find the most-recent open session for this user (no time_out yet)
        $attendance = Attendance::where('user_id', $user->id)
            ->whereNull('time_out')
            ->orderBy('date', 'desc')
            ->first();

        if (!$attendance) {
            // Maybe already clocked out — return today's record if it exists
            $today   = $now->toDateString();
            $todayRec = Attendance::where('user_id', $user->id)->where('date', $today)->first();
            return response()->json([
                'message' => 'Already clocked out or no active session found.',
                'data'    => $todayRec,
            ], 200);
        }

        // ── Cross-midnight: session started on a prior day ──────────────────
        $sessionDate   = Carbon::parse($attendance->date);
        $isCrossMidnight = !$sessionDate->isSameDay($now);

        $timeIn = Carbon::parse($sessionDate->format('Y-m-d') . ' ' . $attendance->time_in);

        if (!$isCrossMidnight && $timeIn->diffInMinutes($now) < 480) {
            return response()->json([
                'message' => 'You must complete 8 hours before clocking out.',
            ], 422);
        }

        if ($isCrossMidnight) {
            // Invalidate the session instead of capping it
            $attendance->time_out = null;
            $attendance->total_hours = 0;
            $attendance->status = 'absent';
            $attendance->save();

            return response()->json([
                'message'        => 'Session invalidated because you did not clock out yesterday.',
                'data'           => $attendance,
                'capped'         => false,
                'cross_midnight' => true,
            ]);
        } else {
            $timeOut       = $now->format('H:i:s');
            $rawHours      = $this->computeHours($attendance->time_in, $timeOut);
            $totalHours    = min((float)$rawHours, 8.0); // cap at 8 h
        }

        $attendance->time_out    = $timeOut;
        $attendance->total_hours = $totalHours;
        $attendance->save();

        return response()->json([
            'data'        => $attendance,
            'capped'      => $totalHours >= 8.0,
            'cross_midnight' => $isCrossMidnight,
        ]);
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
        $parts = array_map('intval', explode(':', $hhmm));
        $h = $parts[0] ?? 0;
        $m = $parts[1] ?? 0;
        return $h * 60 + $m;
    }

    private function computeHours(string $timeIn, string $timeOut): float
    {
        // Add artificial dummy date just to calculate pure time diff cleanly if needed
        // but Carbon::parse handles raw times as today's date perfectly
        $in = Carbon::parse($timeIn);
        $out = Carbon::parse($timeOut);
        
        $diff = $in->diffInMinutes($out); // positive value
        return max(0, round($diff / 60, 2));
    }
}
