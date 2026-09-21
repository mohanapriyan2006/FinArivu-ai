# Financial Data Ingestion (Phase 5)

> **Goal:** turn external financial documents into trustworthy,
> explainable, **user-confirmed** financial state — never silent mutation.

## Pipeline

```
upload / copilot text
  → extract_document        (bytes → text, in-memory; raw file never stored)
  → detect_document_type    (keyword scoring + CSV headers; ambiguous → user picks)
  → extractor               (payslip / bank / loan / investment → NormalizedImport)
  → build_candidates        (normalized → ImportCandidate rows vs current state)
  → REVIEW_REQUIRED         (preview: detected fields, changes, dupes, warnings)
  → confirm(confirmToken)   (token must match last reviewed version)
  → ImportCommitter         (single mutation boundary → domain tables)
  → Money Radar scan        (fresh detector run)
  → Action Plan reconcile   (via FinancialActionPlanService)
  → ImportResult            (counts, changed domains, recompute flags)
```

## Supported document types & formats

| Type | Key extractions |
|------|-----------------|
| `PAYSLIP` | employer, pay period, gross, basic, net pay, EPF, tax, allowances/deductions |
| `BANK_STATEMENT` | transactions (date, description, amount, direction, balance, reference) |
| `LOAN_STATEMENT` | lender, outstanding principal, EMI, rate, tenure, dates, loan type |
| `INVESTMENT_STATEMENT` | provider, statement date, holdings (name, type, qty, invested, value) |

Formats: **PDF** (pypdf), **DOCX** (python-docx), **TXT/CSV** (stdlib).
XLSX/images/scanned PDFs → `UNSUPPORTED_FORMAT` / `UNREADABLE_DOCUMENT`.
No OCR, no live bank connectivity, no Account Aggregator (intentionally
deferred).

## Lifecycle

`UPLOADED → PROCESSING → REVIEW_REQUIRED → CONFIRMED → APPLIED |
PARTIALLY_APPLIED`; `FAILED` / `CANCELLED` from any non-terminal state.
Only `REVIEW_REQUIRED`/`CONFIRMED` can be confirmed; terminal states are
reject confirm/cancel with controlled 409 errors.

## Candidates

Each `ImportCandidate` carries: `kind` (FIELD|ENTITY|RECORD),
`targetDomain`, `operation` (UPDATE|CREATE|SKIP), current vs proposed
(+ optional `editedValue`), `validationState` (VALID|WARNING|INVALID|
DUPLICATE|POSSIBLE_DUPLICATE|NEEDS_REVIEW), `decision`
(ACCEPTED|EDITED|SKIPPED), `confidence`, `provenance` (label, page, row,
column), `fingerprint`, `warnings`.

Domain mapping (`mapping.py`):

- **Payslip** → primary `Income.amount`, `TaxProfile.annual_income`
  (gross×12, flagged), `TaxProfile.deduction_80c` (EPF×12, flagged LOW).
- **Bank statement** → `Expense` (DEBIT→EXPENSE), `Income` (CREDIT→INCOME);
  TRANSFER and UNKNOWN are skipped / needs-review. Expenses file under
  the system "Other" category — never a guessed category.
- **Loan statement** → `Liability` UPDATE (matched by lender/type) or
  ENTITY CREATE.
- **Investment statement** → `Asset` UPDATE by name match or ENTITY
  CREATE with canonical `AssetType` mapping (`Other` fallback).
  Holdings are read-only — never buy/sell/rebalance signals.

## Dedup & idempotency

- `content_hash` (sha256 of bytes / normalized text) → `DUPLICATE_IMPORT`
  409 with `existingBatchId` (unique per user, CANCELLED/FAILED exempt).
- `transaction_fingerprint` (user + date + direction + amount +
  reference|normalized description) persisted on the created
  `Expense`/`Income` rows → re-imports mark rows `DUPLICATE` and skip.
- Heuristic `POSSIBLE_DUPLICATE` (same date+amount+similar description
  vs existing rows) — user decides.
- `confirmToken` rotates on every candidate edit — confirmations always
  apply to the exact version reviewed. A second confirm →
  `ALREADY_APPLIED`.
- Stale-source guard: UPDATE candidates re-verify the live value at
  confirm; drift → `STALE_PREVIEW` 409 listing changed labels.

## Commit & recompute

`ImportCommitter` is the only writer. Per candidate: SKIPPED/INVALID/
SKIP ops never write; failures are counted → `PARTIALLY_APPLIED`.
Imported rows carry `source='imported'` (expenses/assets/liabilities)
plus `import_batch_id` + `import_fingerprint` lineage (expenses/income).
Primary-income updates also sync `Profile.monthly_income`. An `AuditLog`
row records counts + domains — never raw document content.

After commit: `FinancialActionPlanService.get_or_generate_current(
force_rescan=True)` runs a fresh Money Radar scan and reconciles the
plan. `changed_domains` is intersected with the authoritative
document-type impact map (`impact.py`) — a payslip can never claim to
have touched liabilities.

## Copilot

Explicit import phrasing (`is_import_request`) in `AIController` —
sync and streaming — runs `ingest_text` on the full attachment content
and returns a `data_import_card` artifact + `importPreview` payload +
NAVIGATE action to `import_center` (deep-links `batchId` → review).
Nothing auto-commits; the attachment never reaches executable action
paths (existing `<document>` stripping unchanged).

## Data model

- `import_batches`: user, type, filename/mime, `content_hash`, status,
  period, `confirm_token`, summary/result JSON, timestamps. Unique
  `(user_id, content_hash)`.
- `import_candidates`: batch+user, kind/domain/operation, values,
  validation/confidence/decision, fingerprint, provenance, seq.
- `expenses` + `income`: `import_batch_id`, `import_fingerprint`
  (+ `source` on expenses). Idempotent `_ensure_columns` migration.
