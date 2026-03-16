<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\AttendanceController;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ── Public Auth Routes ──────────────────────────────────────────────────────
Route::post('/auth/register',            [AuthController::class, 'register']);
Route::post('/auth/login',               [AuthController::class, 'login']);
Route::post('/auth/forgot-password',     [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password',      [AuthController::class, 'resetPassword']);
Route::post('/auth/check-email',         [AuthController::class, 'checkEmailExists']);
Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']);

// Email Verification 
Route::get('/auth/verify-email/{id}/{hash}', function (Request $request) {
    $user = \App\Models\User::findOrFail($request->route('id'));

    if (! hash_equals(
        sha1($user->getEmailForVerification()),
        (string) $request->route('hash')
    )) {
        return response()->json(['error' => 'Invalid verification link.'], 403);
    }

    $frontendUrl = app()->environment('local')
        ? env('FRONTEND_URL', 'http://localhost:5173')
        : rtrim(env('FRONTEND_URL', config('app.url')), '/');

    if ($user->hasVerifiedEmail()) {
        return redirect($frontendUrl . '/?verified=1');
    }

    $user->markEmailAsVerified();
    event(new Verified($user));

    return redirect($frontendUrl . '/?verified=1');
})->middleware('signed')->name('verification.verify');

// ── Protected Routes (Sanctum token auth) ───
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user',    [AuthController::class, 'user']);

    // ---ADMIN ONLY - Supervisor Registration
    Route::post('/auth/register-supervisor', [AuthController::class, 'registerSupervisor']);


    // User Data Endpoints
    Route::get('/users/stats',                        [UserController::class, 'stats']);
    Route::get('/users/ojt-roles',                    [UserController::class, 'ojtRoles']);
    Route::get('/users/dashboard-stats',              [UserController::class, 'dashboardStats']);
    Route::get('/users/supervisor/dashboard-stats',   [UserController::class, 'supervisorDashboardStats']);
    Route::get('/users/interns/recent',               [UserController::class, 'recentInterns']);
    
    Route::get('/users',                  [UserController::class, 'index']);
    Route::post('/users',                 [UserController::class, 'store']);
    Route::get('/users/{id}',             [UserController::class, 'show']);
    Route::put('/users/{id}',             [UserController::class, 'update']);

    // Task Routes
    Route::get('/tasks/my-tasks',         [TaskController::class, 'myTasks']);
    Route::get('/tasks/supervisor',       [TaskController::class, 'supervisorTasks']);
    Route::get('/tasks',                  [TaskController::class, 'index']);
    Route::post('/tasks',                 [TaskController::class, 'store']);
    Route::get('/tasks/{id}',             [TaskController::class, 'show']);
    Route::put('/tasks/{id}',             [TaskController::class, 'update']);
    Route::put('/tasks/{id}/status',      [TaskController::class, 'updateStatus']);
    Route::put('/tasks/{id}/reject',      [TaskController::class, 'reject']);
    Route::put('/tasks/{id}/approve',           [TaskController::class, 'approve']);
    Route::put('/tasks/{id}/supervisor-reject', [TaskController::class, 'supervisorReject']);
    Route::put('/tasks/{id}/request-revision',  [TaskController::class, 'requestRevision']);
    Route::delete('/tasks/{id}',                 [TaskController::class, 'destroy']);
    Route::get('/tasks/{id}/progress',           [TaskController::class, 'taskProgress']);
    Route::post('/tasks/{id}/finalize',          [TaskController::class, 'finalizeTask']);

    // Announcements
    Route::get('/announcements',  [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);

    // Admin Report Endpoints
    Route::get('/reports/interns',              [ReportController::class, 'index']);
    Route::get('/reports/interns/export',       [ReportController::class, 'export']);
    Route::get('/reports/interns/{id}',         [ReportController::class, 'show']);
    Route::get('/reports/interns/{id}/weekly',  [ReportController::class, 'weekly']);
    Route::get('/reports/interns/{id}/monthly', [ReportController::class, 'monthly']);


    // Feedback Routes (task-based, per-intern competency feedback)
    Route::get('/feedback/tasks',                                        [FeedbackController::class, 'supervisorTasks']);
    Route::post('/feedback/tasks/{taskId}/interns/{internId}',           [FeedbackController::class, 'submitFeedback']);
    Route::get('/feedback/my-feedback',                                  [FeedbackController::class, 'myFeedback']);
    Route::get('/feedback/interns/{internId}/final-score',               [FeedbackController::class, 'getInternFinalScore']);

    // Evaluation Routes
    Route::get('/evaluations',           [EvaluationController::class, 'index']);
    Route::post('/evaluations',          [EvaluationController::class, 'store']);
    Route::get('/evaluations/{id}',      [EvaluationController::class, 'show']);
    Route::put('/evaluations/{id}',      [EvaluationController::class, 'update']);
    Route::delete('/evaluations/{id}',   [EvaluationController::class, 'destroy']);

    // Attendance Routes
    Route::get('/attendance/today',      [AttendanceController::class, 'today']);
    Route::get('/attendance/stats',      [AttendanceController::class, 'stats']);
    Route::post('/attendance/clock-in',  [AttendanceController::class, 'clockIn']);
    Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);
    Route::post('/attendance/log',       [AttendanceController::class, 'log']);
    Route::get('/attendance',            [AttendanceController::class, 'index']);
    Route::post('/attendance',           [AttendanceController::class, 'store']);
    Route::delete('/attendance/{id}',    [AttendanceController::class, 'destroy']);
});
