# Complete the AVK Financial Upgrade

## Goal
Finish the requested financial tools inside the existing AVK website, preserving its login, members, records, and Tamil-first design. Keep member mobile numbers blank unless an admin supplies them.

## Work
1. **Safe financial storage** — add optional member mobile fields; split money returns into principal and interest without overwriting existing records; add a separate extra-account expense ledger; and protect financial create/edit/delete actions with admin-only database functions and validation.
2. **Three account views** — complete the admin dashboard’s nine requested totals with year filtering; finish monthly and yearly subscription history; separate saree-fund principal given/returned from interest; and show extra interest received, expenses, and remaining balance. Preserve the current monthly/yearly payment records and duplicate-obligation safeguards.
3. **Transactions and member histories** — add member/year/type filters and safe edit/delete controls for receipts, principal advances/returns, and extra expenses. Add optional blank mobile-number editing and per-member histories without changing existing sign-in or member accounts.
4. **Yearly reports** — add a reports page that exports the selected year’s three account ledgers to Excel and PDF.
5. **Verification** — add tests for account formulas and return limits, run the focused tests, and verify the signed-in admin and member experiences against the live preview. Confirm existing financial records are unchanged.

## Technical details
- Use additive database changes only. Keep existing columns and records; use admin-checked database functions for writes so concurrent returns cannot exceed the principal or interest still due.
- Count only actual money received as subscription collection, principal returned, or interest collected. Treat any interest entered with money given as expected interest, not income; deduct extra expenses only from the extra account.
- Keep the three accounts separate in calculations and exports. Use existing subscription obligations/receipts for monthly and yearly dues, and existing money records for principal advances/returns.