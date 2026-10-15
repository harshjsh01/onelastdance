# Navrang 2026 - Dandiya & Garba Registration Reconciliation

This folder contains the payment reconciliation data for **Navrang 2026 (Dandiya and Garba Evening)**.

## Files Overview

1. **`verified_students.csv`**
   - Contains all student registrations that have been **successfully matched** with confirmed credit entries across the provided bank statements.
   - Includes columns: `timestamp`, `name`, `scholar_no`, `branch`, `year_sem`, `contact_no`, `email`, `submitted_transaction_id`, `verification_status`, `bank_source`, `bank_sender_name`, `matched_bank_txn`, `matched_bank_utr`, `verified_amount`.

2. **`unverified_students.csv`**
   - Contains registrations that are **unverified, invalid, or fake**.
   - Includes entries with invalid/fake transaction IDs (e.g. truncated `3167`, UUIDs, hash tokens), duplicate submissions, or payments not found.

3. **`all_students_reconciliation.csv`**
   - Master list combining all 349 student registrations with complete audit trail and verification status.

## Reconciliation Summary
- **Total Student Registrations**: 349
- **Successfully Verified**: 329
- **Unverified / Fake / Duplicate**: 20

## Bank Statements Processed
- **PhonePe - Pulkit (9351061046)**: 15 Sept 2026 - 15 Oct 2026
- **State Bank of India - Harsh Joshi (42225178872)**: 01 Oct 2026 - 15 Oct 2026
- **PhonePe (9462480988)**: 15 Sept 2026 - 15 Oct 2026
- **PhonePe (7877559575)**: 15 Sept 2026 - 15 Oct 2026
- **State Bank of India (9461637281)**: 14 Oct 2026
- **PhonePe (8279293128)**: 15 Sept 2026 - 15 Oct 2026
- **Navi UPI - Destiny Sharma (8112299241)**: 15 Sept 2026 - 15 Oct 2026
