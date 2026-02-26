<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
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

    if ($user->hasVerifiedEmail()) {
        return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/?verified=1');
    }

    $user->markEmailAsVerified();
    event(new Verified($user));

    return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/?verified=1');
})->middleware('signed')->name('verification.verify');

// ── Protected Routes (Sanctum token auth) ─────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user',    [AuthController::class, 'user']);

    // User Data Endpoints
    Route::get('/users/stats',            [UserController::class, 'stats']);
    Route::get('/users/ojt-roles',        [UserController::class, 'ojtRoles']);
    Route::get('/users/dashboard-stats',  [UserController::class, 'dashboardStats']);
    Route::get('/users/interns/recent',   [UserController::class, 'recentInterns']);
    
    Route::get('/users',                  [UserController::class, 'index']);
    Route::post('/users',                 [UserController::class, 'store']);
    Route::get('/users/{id}',             [UserController::class, 'show']);
    Route::put('/users/{id}',             [UserController::class, 'update']);

    // Intern Task Endpoints
    Route::get('/tasks',                  [TaskController::class, 'index']);
    Route::get('/tasks/{id}',             [TaskController::class, 'show']);
    Route::patch('/tasks/{id}/status',    [TaskController::class, 'updateStatus']);
});
