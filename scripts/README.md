# Role Normalization Script

This script safely normalizes duplicate role names in the `roles` table and reassigns users to canonical role names.

## What it does

1. Creates backups of `roles` and `users` as JSON files in `scripts/backup`
2. Ensures canonical roles exist:
   - `clinic_owner`
   - `doctor`
   - `receptionist`
3. Reassigns users from duplicate role names to the canonical roles
4. Prints a per-clinic summary of total users, doctors, and receptionists

## Usage

Run from the `vetinel` root directory:

```powershell
node scripts\normalize_roles.js
```

## Notes

- Duplicate role rows are not deleted automatically.
- After verifying the results, you may remove duplicate rows manually.
