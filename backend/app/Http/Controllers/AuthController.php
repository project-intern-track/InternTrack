<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     * Replaces: supabase.auth.signUp()
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'          => 'required|email|unique:users,email',
            'password'       => ['required', 'string', PasswordRule::min(6)],
            'full_name'      => 'required|string|min:1',
            'role'           => 'nullable|in:admin,supervisor,intern',
            'avatar_url'     => 'nullable|url',
            'ojt_role'       => 'nullable|string',
            'start_date'     => 'nullable|date',
            'required_hours' => 'nullable|integer|min:1',
            'ojt_type'       => 'nullable|in:required,voluntary',
        ]);

        $role = $validated['role'] ?? 'intern';

        // Auto-generate avatar URL if not provided
        $avatarUrl = $validated['avatar_url']
            ?? 'https://ui-avatars.com/api/?name=' . urlencode($validated['full_name']) . '&background=random';

        // Auto-generate sequential ojt_id starting at 1101
        $lastOjtId = User::max('ojt_id') ?? 1100;

        $user = User::create([
            'email'          => $validated['email'],
            'password'       => Hash::make($validated['password']),
            'full_name'      => $validated['full_name'],
            'role'           => $role,
            'avatar_url'     => $avatarUrl,
            'ojt_role'       => $validated['ojt_role'] ?? null,
            'start_date'     => $validated['start_date'] ?? null,
            'required_hours' => $validated['required_hours'] ?? null,
            'ojt_type'       => $validated['ojt_type'] ?? 'required',
            'ojt_id'         => $lastOjtId + 1,
            'status'         => 'active',
        ]);

        // UserObserver auto-creates user_settings row

        // Send verification email — roll back user creation if it fails
        try {
            $user->sendEmailVerificationNotification();
        } catch (\Exception $e) {
            $user->settings()->delete();
            $user->delete();
            return response()->json([
                'error' => 'Account could not be created because the verification email failed to send. Please try again.',
            ], 500);
        }

        return response()->json([
            'message'               => 'Registration successful. Please check your email to verify your account.',
            'requires_verification' => true,
            'email'                 => $user->email,
        ], 201);
    }

    /**
     * POST /api/auth/login
     * Replaces: supabase.auth.signInWithPassword()
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'error' => 'Invalid credentials.',
            ], 401);
        }

        // Block archived users
        if ($user->status === 'archived') {
            return response()->json([
                'error' => 'Your account has been deactivated. Please contact an administrator.',
            ], 403);
        }

        // Block unverified users
        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'error'                => 'Please verify your email address before logging in.',
                'requires_verification' => true,
                'email'                => $user->email,
            ], 403);
        }

        // Revoke old tokens (single active session)
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * POST /api/auth/logout
     * Replaces: supabase.auth.signOut()
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/auth/user
     * Replaces: supabase.auth.getSession()
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    /**
     * POST /api/auth/forgot-password
     * Replaces: supabase.auth.resetPasswordForEmail()
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Password reset link sent.']);
        }

        return response()->json(['error' => 'Unable to send reset link. Please check the email address.'], 422);
    }

    /**
     * POST /api/auth/reset-password
     * Replaces: supabase.auth.updateUser({ password })
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::min(6)],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])
                     ->setRememberToken(Str::random(60));
                $user->save();
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password reset successfully.']);
        }

        return response()->json(['error' => 'Invalid or expired reset token.'], 422);
    }

    /**
     * POST /api/auth/check-email
     * Replaces: supabase.rpc('check_email_exists')
     */
    public function checkEmailExists(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $exists = User::where('email', $request->email)->exists();

        return response()->json(['exists' => $exists]);
    }

    /**
     * POST /api/auth/resend-verification
     * Replaces: supabase.auth.resend()
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['error' => 'Email not found.'], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification email resent.']);
    }

    // ── Private Helpers ──

    private function formatUser(User $user): array
    {
        return [
            'id'             => $user->id,
            'email'          => $user->email,
            'full_name'      => $user->full_name,
            'role'           => $user->role,
            'avatar_url'     => $user->avatar_url,
            'ojt_role'       => $user->ojt_role,
            'ojt_id'         => $user->ojt_id,
            'start_date'     => $user->start_date?->toDateString(),
            'required_hours' => $user->required_hours,
            'ojt_type'       => $user->ojt_type,
            'status'         => $user->status,
            'supervisor_id'  => $user->supervisor_id,
            'department'     => $user->department,
            'created_at'     => $user->created_at?->toISOString(),
        ];
    }
}
