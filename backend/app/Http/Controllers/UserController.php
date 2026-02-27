<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class UserController extends Controller
{
    /**
     * Get users with optional filtering
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('ojt_role') && $request->ojt_role !== 'all') {
            $query->where('ojt_role', $request->ojt_role);
        }

        if ($request->has('search') && !empty(trim($request->search))) {
            $search = trim($request->search);
            $query->where(function($q) use ($search) {
                $q->where('full_name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('ojt_role', 'LIKE', "%{$search}%");

                if (is_numeric($search)) {
                    $q->orWhere('ojt_id', $search);
                }
            });
        }

        if ($request->has('sortDirection')) {
            $direction = $request->sortDirection === 'desc' ? 'desc' : 'asc';
            $query->orderBy('full_name', $direction);
        }

        if ($request->has('dateSort')) {
            $direction = $request->dateSort === 'oldest' ? 'asc' : 'desc';
            $query->orderBy('created_at', $direction);
        }

        // Return array of objects mimicking Supabase response
        return response()->json($query->get());
    }

    /**
     * Get a specific user profile
     */
    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    /**
     * Create a user profile only (Used by createUser in service)
     */
    public function store(Request $request)
    {
        // This is generic user creation without password/auth (maybe legacy).
        $validated = $request->validate([
            'id' => 'required|string', // Suppose UUID from some external auth if needed
            'email' => 'required|email|unique:users,email',
            'full_name' => 'required|string',
            'role' => 'required|string',
            'avatar_url' => 'nullable|url',
        ]);

        $user = User::create($validated);
        return response()->json($user, 201);
    }

    /**
     * Update any user's profile
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($user->id)],
            'full_name' => 'nullable|string',
            'role' => 'nullable|string',
            'status' => 'nullable|in:active,archived',
            'ojt_role' => 'nullable|string',
            'avatar_url' => 'nullable|url',

            // Password Fields
            'current_password' => 'required_with:password',
            'password' => 'nullable|confirmed|min:8'
            // ... add other updatable fields as needed based on frontend sent payload
        ]);

        unset($validated['current_password'], $validated['password_confirmation']);

        $user->update($validated);


        // Handle Password Update
        if ($request->filled('password')) {
            // Verify Password if it matches database
            if (!\Hash::check($request->current_password, $user->password)) {
                return response() -> json(['message'=> 'Current password does not match.'], 422);
            }

            // If password Assigned then hash
            $user->password = $request->password;
            $user->save();

        }

        // If the user was just archived, revoke all their Sanctum tokens
        // so their active sessions are immediately terminated.
        if ($user->status === 'archived') {
            $user->tokens()->delete();
        }

        return response()->json($user->refresh());
    }

    /**
     * Get role-based statistics (Interns, Admins, Supervisors)
     */
    public function stats(Request $request)
    {
        $role = $request->query('role');

        $query = User::where('role', $role);
        $total = clone $query;
        $active = clone $query;
        $archived = clone $query;

        if ($role === 'intern') {
            $rolesQuery = clone $query;
            $totalRoles = $rolesQuery->whereNotNull('ojt_role')->distinct('ojt_role')->count('ojt_role');

            return response()->json([
                'totalInterns' => $total->count(),
                'totalRoles' => $totalRoles,
                'archivedInterns' => $archived->where('status', 'archived')->count(),
            ]);
        }

        return response()->json([
            'total' . ucfirst($role) . 's' => $total->count(),
            'active' . ucfirst($role) . 's' => $active->where('status', 'active')->count(),
            'archived' . ucfirst($role) . 's' => $archived->where('status', 'archived')->count(),
        ]);
    }

    /**
     * Get unique OJT roles for filter dropdown
     */
    public function ojtRoles()
    {
        $roles = User::where('role', 'intern')
                     ->whereNotNull('ojt_role')
                     ->distinct()
                     ->pluck('ojt_role');
        
        return response()->json($roles);
    }

    /**
     * Get specific admin dashboard stats replacing Supabase RPC
     */
    public function dashboardStats()
    {
        $totalInterns = User::where('role', 'intern')->count();
        $verifiedInterns = User::where('role', 'intern')->whereNotNull('email_verified_at')->count();
        $unverifiedInterns = $totalInterns - $verifiedInterns;

        $recentRegisters = User::where('role', 'intern')
                            ->where('created_at', '>=', Carbon::now()->subMonths(3))
                            ->pluck('created_at');

        return response()->json([
            'totalInterns' => $totalInterns,
            'activeInterns' => $verifiedInterns,
            'pendingApplications' => $unverifiedInterns,
            'recentRegisters' => $recentRegisters,
        ]);
    }

    /**
     * Get recent interns for feed
     */
    public function recentInterns(Request $request)
    {
        $limit = $request->query('limit', 5);
        $interns = User::select('full_name', 'created_at', 'avatar_url')
                       ->where('role', 'intern')
                       ->orderBy('created_at', 'desc')
                       ->limit($limit)
                       ->get();

        return response()->json($interns);
    }
}
