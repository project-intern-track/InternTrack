<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Reject requests from archived users and revoke their token.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status === 'archived') {
            // Revoke the current token so subsequent requests also fail
            $user->currentAccessToken()->delete();

            return response()->json([
                'error' => 'ACCOUNT_DEACTIVATED',
                'message' => 'Your account has been deactivated. Please contact an administrator.',
            ], 403);
        }

        return $next($request);
    }
}
