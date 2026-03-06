# Test Account Credentials

## Overview
This document contains login credentials for testing different user roles in the InternTrack application.

---

## Admin Account

**Email:** `admin@interntrack.com`  
**Password:** `password123`  
**Role:** Administrator  
**Full Name:** System Administrator  
**Permissions:** Full system access, user management, system configuration

---

## Supervisor Account

**Email:** `supervisor@interntrack.com`  
**Password:** `password123`  
**Role:** Supervisor  
**Full Name:** IT Department Supervisor  
**Department:** IT Department  
**Permissions:** Manage assigned students, approve tasks, view reports

---

## Intern Account

**Email:** `intern@interntrack.com`  
**Password:** `password123`  
**Role:** Intern  
**Full Name:** Test Intern User  
**OJT Role:** Frontend Developer  
**OJT Type:** Required  
**Required Hours:** 500  
**Status:** Active  
**Supervisor:** IT Department Supervisor

---

## Notes

- **Status:** These are real accounts automatically seeded into the database by the backend team
- **Verification:** All test accounts have email verification pre-enabled (`email_verified_at` is set)
- **Security:** Never use these credentials in production environments
- **Password Policy:** All test accounts use the same password: `password123`
- **Data Reset:** Test data is seeded from `DatabaseSeeder.php` and can be reset by re-running migrations and seeders

---

## Quick Reference Table

| Role | Email | Password | Full Name |
|------|-------|----------|-----------|
| Admin | admin@interntrack.com | password123 | System Administrator |
| Supervisor | supervisor@interntrack.com | password123 | IT Department Supervisor |
| Intern | intern@interntrack.com | password123 | Test Intern User |

---

## Creating Additional Test Accounts

To create additional test accounts, use the signup form with:

- **Email Pattern:** `[username]@[domain]` (e.g., `john.doe@company.com`)
- **Password:** Use a secure password meeting the requirements: 8+ characters, uppercase, number, special symbol
- **Role:** Select from available OJT roles in the dropdown

---

**Last Updated:** March 6, 2026  
**Environment:** Development/Testing Only
