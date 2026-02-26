# InternTrack — Laravel Migration Guide (Authentication)

This document covers everything done to migrate the **Sign Up / Sign In / Email Verification / Password Reset** flow from Supabase to Laravel + MySQL. Use this as the reference point when migrating other features.

---

## Prerequisites

Before running the project locally, make sure you have the following installed:

| Tool | Version | Notes |
|------|---------|-------|
| PHP | 8.2+ | Enable `pdo_mysql` and `mysqli` extensions in `php.ini` |
| Composer | latest | PHP package manager |
| MySQL | 8.0+ | Use MySQL Installer (Community) |
| Node.js | 18+ | For the React frontend |
| TablePlus | latest | Recommended GUI for MySQL |

### Enabling PHP MySQL Extensions

After installing PHP, open your `php.ini` file (run `php --ini` to find its location) and uncomment these two lines:

```ini
extension=pdo_mysql
extension=mysqli
```

Restart any running PHP processes after saving.

---

## Project Structure

```
InternTrack/
├── backend/              ← Laravel 11 project
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/AuthController.php
│   │   │   └── Middleware/RoleMiddleware.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   └── UserSetting.php
│   │   ├── Notifications/
│   │   │   ├── VerifyEmailNotification.php
│   │   │   └── ResetPasswordNotification.php
│   │   ├── Observers/
│   │   │   └── UserObserver.php
│   │   └── Providers/
│   │       └── AppServiceProvider.php
│   ├── bootstrap/app.php
│   ├── config/
│   │   ├── cors.php
│   │   └── sanctum.php
│   ├── database/migrations/
│   ├── resources/views/emails/
│   │   ├── verify-email.blade.php
│   │   └── reset-password.blade.php
│   └── routes/api.php
├── src/                  ← React frontend
│   ├── services/authService.ts
│   └── context/AuthContext.tsx
└── .env                  ← Frontend env (VITE_API_BASE_URL)
```

---

## Step 1 — Set Up the Laravel Project

The `backend/` directory was created with:

```bash
composer create-project laravel/laravel backend
```

Then install Laravel Sanctum (for API token auth):

```bash
cd backend
composer require laravel/sanctum
php artisan vendor:publish --tag=sanctum-migrations
```

---

## Step 2 — Configure the Database

### Create the MySQL database

Open TablePlus (or any MySQL client) and run:

```sql
CREATE DATABASE interntrack;
```

### Configure `backend/.env`

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=interntrack
DB_USERNAME=root
DB_PASSWORD=your_mysql_root_password

APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

SESSION_DRIVER=cookie
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
```

> **Important:** `APP_URL` must be set correctly — Laravel uses it to generate signed email verification URLs.

### Run migrations

```bash
php artisan migrate
```

This creates: `users`, `user_settings`, `personal_access_tokens`, `password_reset_tokens`, and other Laravel default tables.

---

## Step 3 — Database Schema

### `users` table (`0001_01_01_000000_create_users_table.php`)

Replaces Supabase's `auth.users` + `public.users` tables.

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('email')->unique();
    $table->string('password');
    $table->string('full_name')->nullable();
    $table->string('avatar_url', 500)->nullable();
    $table->enum('role', ['admin', 'supervisor', 'intern'])->default('intern');
    $table->string('ojt_role')->nullable();
    $table->unsignedInteger('ojt_id')->unique()->nullable();
    $table->date('start_date')->nullable();
    $table->unsignedInteger('required_hours')->nullable();
    $table->enum('ojt_type', ['required', 'voluntary'])->default('required');
    $table->enum('status', ['active', 'archived'])->default('active');
    $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('department')->nullable();
    $table->timestamp('email_verified_at')->nullable();
    $table->rememberToken();
    $table->timestamps();

    $table->index('supervisor_id');
    $table->index('role');
    $table->index('status');
});
```

### `user_settings` table (`0001_01_01_000003_create_user_settings_table.php`)

Replaces the Supabase `user_settings` table and the `on_auth_user_created` trigger.

```php
Schema::create('user_settings', function (Blueprint $table) {
    $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
    $table->enum('theme', ['light', 'dark', 'system'])->default('light');
    $table->boolean('notifications_enabled')->default(true);
    $table->boolean('email_updates')->default(true);
    $table->string('dashboard_layout', 50)->default('default');
    $table->timestamps();
});
```

---

## Step 4 — Models

### `app/Models/User.php`

Key points:
- Uses `HasApiTokens` (Sanctum) for bearer token auth
- Implements `MustVerifyEmail` to enforce email verification
- Custom notification methods to use our branded email templates

```php
class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email', 'password', 'full_name', 'avatar_url', 'role',
        'ojt_role', 'ojt_id', 'start_date', 'required_hours',
        'ojt_type', 'status', 'supervisor_id', 'department', 'email_verified_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'start_date'        => 'date',
        ];
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    public function supervisor() { return $this->belongsTo(User::class, 'supervisor_id'); }
    public function interns()    { return $this->hasMany(User::class, 'supervisor_id'); }
    public function settings()   { return $this->hasOne(UserSetting::class); }
}
```

### `app/Models/UserSetting.php`

```php
class UserSetting extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing  = false;

    protected $fillable = [
        'user_id', 'theme', 'notifications_enabled',
        'email_updates', 'dashboard_layout',
    ];

    protected function casts(): array
    {
        return [
            'notifications_enabled' => 'boolean',
            'email_updates'         => 'boolean',
        ];
    }

    public function user() { return $this->belongsTo(User::class); }
}
```

---

## Step 5 — UserObserver (replaces Supabase trigger)

Supabase had a database trigger `on_auth_user_created` that automatically created a row in `user_settings` whenever a user was created. In Laravel this is done with an **Observer**.

### `app/Observers/UserObserver.php`

```php
class UserObserver
{
    public function created(User $user): void
    {
        UserSetting::create(['user_id' => $user->id]);
    }
}
```

### Register it in `app/Providers/AppServiceProvider.php`

```php
public function boot(): void
{
    User::observe(UserObserver::class);
}
```

---

## Step 6 — Authentication Controller

`app/Http/Controllers/AuthController.php` handles all auth endpoints.

### Supabase → Laravel mapping

| Supabase | Laravel Endpoint |
|----------|-----------------|
| `supabase.auth.signUp()` | `POST /api/auth/register` |
| `supabase.auth.signInWithPassword()` | `POST /api/auth/login` |
| `supabase.auth.signOut()` | `POST /api/auth/logout` |
| `supabase.auth.getSession()` | `GET /api/auth/user` |
| `supabase.auth.resetPasswordForEmail()` | `POST /api/auth/forgot-password` |
| `supabase.auth.updateUser({ password })` | `POST /api/auth/reset-password` |
| `supabase.rpc('check_email_exists')` | `POST /api/auth/check-email` |
| `supabase.auth.resend()` | `POST /api/auth/resend-verification` |

### Registration flow

```php
public function register(Request $request): JsonResponse
{
    // 1. Validate input
    // 2. Auto-generate avatar_url (ui-avatars.com) if not provided
    // 3. Auto-generate sequential ojt_id (max + 1, starting at 1101)
    // 4. Create user — UserObserver auto-creates user_settings row
    // 5. Send verification email
    //    → If email fails: delete user + settings (manual rollback)
    // 6. Return { requires_verification: true } — no token issued yet
}
```

> **No token is returned on registration.** The user must verify their email first before they can log in.

### Login guards

```php
// Block archived accounts
if ($user->status === 'archived') { ... }

// Block unverified accounts
if (! $user->hasVerifiedEmail()) { ... }
```

---

## Step 7 — Email Verification

### How it works

1. On registration, `sendEmailVerificationNotification()` sends a **signed URL** to the user's email.
2. The signed URL points to `GET /api/auth/verify-email/{id}/{hash}`.
3. That route verifies the hash, marks the email as verified, and **redirects to the frontend** (`http://localhost:5173/?verified=1`).
4. The frontend detects `?verified=1` in the URL and shows a success message.

### Custom email template

`app/Notifications/VerifyEmailNotification.php` uses the Blade template at `resources/views/emails/verify-email.blade.php` instead of Laravel's default plain text email.

### Signed verification route in `routes/api.php`

```php
Route::get('/auth/verify-email/{id}/{hash}', function (Request $request) {
    $user = User::findOrFail($request->route('id'));

    if (! hash_equals(sha1($user->getEmailForVerification()), (string) $request->route('hash'))) {
        return response()->json(['error' => 'Invalid verification link.'], 403);
    }

    if ($user->hasVerifiedEmail()) {
        return redirect(env('FRONTEND_URL') . '/?verified=1');
    }

    $user->markEmailAsVerified();
    event(new Verified($user));

    return redirect(env('FRONTEND_URL') . '/?verified=1');
})->middleware('signed')->name('verification.verify');
```

> **`APP_URL` must be correct in `.env`** or the signed URLs will be invalid and verification will fail.

---

## Step 8 — Password Reset

### How it works

1. User submits email to `POST /api/auth/forgot-password`.
2. Laravel's `Password::sendResetLink()` generates a token, stores a hash in `password_reset_tokens`, and sends the reset email.
3. `app/Notifications/ResetPasswordNotification.php` overrides the reset URL to point to the **frontend**: `http://localhost:5173/reset-password?token=...&email=...`
4. Frontend's `/reset-password` page reads `token` and `email` from query params, then submits to `POST /api/auth/reset-password`.

---

## Step 9 — CORS & Sanctum Configuration

### `config/cors.php`

```php
return [
    'paths'               => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'     => ['*'],
    'allowed_origins'     => ['http://localhost:5173', 'http://127.0.0.1:5173'],
    'allowed_headers'     => ['*'],
    'supports_credentials' => true,
];
```

### `config/sanctum.php` — stateful domains

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost:5173,127.0.0.1:5173')),
```

### `bootstrap/app.php` — no `statefulApi()`

Do **not** call `$middleware->statefulApi()`. This was removed because it enforces CSRF protection, which breaks stateless Bearer token authentication (which is what we use).

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'role' => RoleMiddleware::class,
    ]);
})
```

---

## Step 10 — Role Middleware

`app/Http/Middleware/RoleMiddleware.php` — used to protect routes by user role.

Usage in routes:

```php
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // admin-only routes
});
```

---

## Step 11 — Email (SMTP) Configuration

We use Gmail SMTP with an **App Password** (not your regular Gmail password).

### How to get a Gmail App Password

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Search for **App passwords** and generate one for "Mail"
4. Copy the 16-character password — **remove all spaces**

### `backend/.env` mail settings

```env
MAIL_MAILER=smtp
MAIL_SCHEME=
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your16charapppassword
MAIL_FROM_ADDRESS="your_gmail@gmail.com"
MAIL_FROM_NAME="InternTrack"
```

> **`MAIL_SCHEME` must be empty (not `tls`).** Setting it to `tls` causes an error in Laravel 11's Symfony Mailer on port 587.

---

## Step 12 — Frontend Configuration

### `.env` (project root)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### `src/services/authService.ts`

All Supabase SDK calls were replaced with `fetch` calls to the Laravel API. Key behaviors:

- **Sign up** returns `{ requires_verification: true }` — no token is stored. The frontend shows a "check your email" message.
- **Sign in** stores the Bearer token in `localStorage` on success.
- **Forgot password** first calls `POST /api/auth/check-email` to validate the email exists before hitting the reset endpoint.
- **Reset password** uses `token` and `email` from URL query params.

### `src/context/AuthContext.tsx`

- On app load, calls `authService.getSession()` which hits `GET /api/auth/user` with the stored token.
- Polls periodically to check if the user's `status` has changed to `archived` (replaces Supabase Realtime).

---

## Running the Project

Open two terminals:

**Terminal 1 — Laravel backend**
```bash
cd backend
php artisan serve
# Runs on http://localhost:8000
```

**Terminal 2 — React frontend**
```bash
npm run dev
# Runs on http://localhost:5173
```

---

## Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `could not find driver` | `pdo_mysql` not enabled in `php.ini` | Uncomment `extension=pdo_mysql` and `extension=mysqli` in `php.ini` |
| `Table 'personal_access_tokens' doesn't exist` | Sanctum migration not run | `php artisan vendor:publish --tag=sanctum-migrations` then `php artisan migrate` |
| 419 CSRF token mismatch | `statefulApi()` enabled in `bootstrap/app.php` | Remove `$middleware->statefulApi()` |
| `The "tls" scheme is not supported` | `MAIL_SCHEME=tls` in `.env` | Change to `MAIL_SCHEME=` (empty) |
| Verification link invalid / expired | Wrong `APP_URL` in `.env` | Set `APP_URL=http://localhost:8000` exactly |
| "This email is not registered" on forgot password | Email not in DB or typo | Make sure the email was registered AND verified first |
| User created in DB even if email fails | No rollback on email error | The `register()` method catches the exception and deletes the user + settings manually |

---

## Key Design Decisions

- **Token-based auth (Sanctum)** — not session/cookie based. Every protected request sends `Authorization: Bearer <token>` in the header.
- **No token on registration** — the user cannot log in until their email is verified. This prevents unverified accounts from accessing the app.
- **UserObserver instead of DB trigger** — Laravel Observers are the idiomatic replacement for Supabase database triggers.
- **Manual rollback on email failure** — since we don't use DB transactions for email sending, `register()` explicitly deletes the user if the verification email fails.
- **Frontend URL in reset email** — the password reset link points to the React frontend (`/reset-password?token=...`), not a Laravel page.
