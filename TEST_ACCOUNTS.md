# Test Account Credentials

## Overview
This document contains login credentials for testing different user roles in the InternTrack application.

---

## Admin Account

**Email:** `admin@interntrack.com`  
**Password:** `Admin123!`  
**Role:** Administrator  
**Permissions:** Full system access, user management, system configuration

---

## Supervisor Accounts

### Supervisor 1
**Email:** `supervisor1@company.com`  
**Password:** `Super123!`  
**Role:** Supervisor  
**Permissions:** Manage assigned students, approve tasks, view reports

### Supervisor 2
**Email:** `supervisor2@company.com`  
**Password:** `Super123!`  
**Role:** Supervisor  
**Permissions:** Manage assigned students, approve tasks, view reports

---

## Student Accounts

### Student 1 (Required OJT)
**Email:** `student1@university.edu`  
**Password:** `Student123!`  
**Role:** Student  
**OJT Type:** Required  
**Required Hours:** 500  
**Status:** Active

### Student 2 (Voluntary OJT)
**Email:** `student2@university.edu`  
**Password:** `Student123!`  
**Role:** Student  
**OJT Type:** Voluntary  
**Required Hours:** 300  
**Status:** Active

### Student 3 (Completed OJT)
**Email:** `student3@university.edu`  
**Password:** `Student123!`  
**Role:** Student  
**OJT Type:** Required  
**Required Hours:** 500  
**Status:** Completed

---

## Notes

- **Security:** These are test accounts for development/staging environments only. **Never use these credentials in production.**
- **Password Policy:** All test passwords follow the format: `[Role]123!`
- **Email Verification:** Test accounts may need email verification disabled or use a test email service
- **Data Reset:** Test data should be reset periodically to maintain clean test environments

---

## Quick Reference Table

| Role | Email | Password | Use Case |
|------|-------|----------|----------|
| Admin | admin@interntrack.com | Admin123! | System administration |
| Supervisor | supervisor1@company.com | Super123! | Managing students |
| Supervisor | supervisor2@company.com | Super123! | Alternative supervisor |
| Student | student1@university.edu | Student123! | Required OJT testing |
| Student | student2@university.edu | Student123! | Voluntary OJT testing |
| Student | student3@university.edu | Student123! | Completed OJT testing |

---

## Creating Additional Test Accounts

To create additional test accounts, use the signup form with these patterns:

- **Email Pattern:** `[role][number]@[domain]`
- **Password Pattern:** `[Role]123!`
- **Naming Convention:** Use descriptive names that indicate the test scenario

---

**Last Updated:** March 6, 2026  
**Environment:** Development/Testing Only
