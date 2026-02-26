# InternTrack Laravel Backend Setup Guide

Welcome to the InternTrack project! We have migrated our authentication and
backend systems from Supabase to a custom **Laravel 11** backend. This guide
will help you install and configure everything you need to run the project
locally.

## 🛠️ Prerequisites

Before you start, make sure you have the following installed on your machine:

1. **[PHP >= 8.2](https://windows.php.net/download/)**: Required by Laravel 11.
2. **[Composer](https://getcomposer.org/)**: The dependency manager for PHP.
3. **[Node.js & npm](https://nodejs.org/)**: Required for the React frontend.
4. **[XAMPP](https://www.apachefriends.org/index.html)** (or any MySQL server):
   For the local database.

---

## 🚀 Step 1: Database Setup

1. Open **XAMPP Control Panel** and start both **Apache** and **MySQL**.
2. Open your browser and go to `http://localhost/phpmyadmin`.
3. Click on the **Databases** tab.
4. Create a new database named exactly: `interntrack` _(Note: Make sure the
   collation is set to `utf8mb4_unicode_ci` or just leave it as the default)._

---

## ⚙️ Step 2: Backend Configuration (Laravel)

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd e:\ecode\InternTrack\backend
   ```

2. Install the PHP dependencies using Composer:
   ```bash
   composer install
   ```

3. Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
   _(If you are on Windows Command Prompt, use `copy .env.example .env`
   instead)._

4. Generate the application key:
   ```bash
   php artisan key:generate
   ```

5. Open the newly created `backend/.env` file in your code editor and verify
   your database settings match your local XAMPP setup:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=interntrack
   DB_USERNAME=root
   DB_PASSWORD=
   ```
   _(Note: XAMPP's default MySQL username is `root` with an empty password)._

6. Run the database migrations and seeders to create your tables and test
   accounts:
   ```bash
   php artisan migrate:fresh --seed
   ```

---

## 🎨 Step 3: Frontend Configuration (React)

1. Open a **new** terminal window and navigate to the project root:
   ```bash
   cd e:\ecode\InternTrack
   ```

2. Install the Node dependencies:
   ```bash
   npm install
   ```

3. Open the `.env` file in the **root directory** (`e:\ecode\InternTrack\.env`)
   and ensure you have the Laravel API URL configured:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
   _(Leave the Supabase keys there for now as we are actively migrating
   remaining features)._

---

## ▶️ Step 4: Running the Application

You will need to run two terminal windows simultaneously to start both servers.

**Terminal 1 (The Backend):**

```bash
cd e:\ecode\InternTrack\backend
php artisan serve
```

_(This will start the PHP server at `http://localhost:8000`)_

**Terminal 2 (The Frontend):**

```bash
cd e:\ecode\InternTrack
npm run dev
```

_(This will start the Vite React server at `http://localhost:5173`)_

---

## 🧪 Step 5: Test Accounts

When you visit `http://localhost:5173`, use these pre-seeded accounts to test
out the different dashboards:

| Role           | Email                        | Password      |
| :------------- | :--------------------------- | :------------ |
| **Admin**      | `admin@interntrack.com`      | `password123` |
| **Supervisor** | `supervisor@interntrack.com` | `password123` |
| **Intern**     | `intern@interntrack.com`     | `password123` |

Happy coding! If you run into issues, try re-running `composer install` or
`php artisan migrate:fresh --seed`.
