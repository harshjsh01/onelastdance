# Navrang 2026 - Dandiya & Garba Registration Reconciliation

This folder contains the payment reconciliation data for **Navrang 2026 (Dandiya and Garba Evening)**.

## Files Overview

1. **`verified_students.csv`**
   - Contains all student registrations that have been **successfully matched** with confirmed credit entries across the provided bank statements.
   - Includes columns: `timestamp`, `name`, `scholar_no`, `branch`, `year_sem`, `contact_no`, `email`, `submitted_transaction_id`, `verification_status`, `bank_source`, `bank_sender_name`, `matched_bank_txn`, `matched_bank_utr`, `verified_amount`.

2. **`unverified_students.csv`**
   - Contains registrations that are **pending verification**.
   - These include students whose transactions belong to the remaining pending bank statement (as noted, a continuous block of ~50 registrations awaiting the next statement upload) or entries with unconfirmed transaction IDs.

3. **`all_students_reconciliation.csv`**
   - Master list combining both verified and unverified students with full details and audit trail.

## Bank Statements Processed
- **PhonePe (9462480988)**: 15 Sept 2026 - 15 Oct 2026
- **PhonePe (7877559575)**: 15 Sept 2026 - 15 Oct 2026
- **State Bank of India (9461637281)**: 14 Oct 2026
- **PhonePe (8279293128)**: 15 Sept 2026 - 15 Oct 2026
- **Navi UPI - Destiny Sharma (8112299241)**: 15 Sept 2026 - 15 Oct 2026

*Note: Once the final remaining bank statement is provided, `unverified_students.csv` will be re-processed to generate the final approved registration list for ticket issuing and QR code generation.*
