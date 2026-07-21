# Salesman Concern Resubmission Routing Design

## Goal

Route corrected salesman WER expense lines back to the correct approval module based on the original `return_to` value.

## Scope

This behavior applies only to the salesman WER expense PATCH endpoint. Supervisor WER behavior is unchanged.

## Routing Rules

When the stored `expense_draft.status` is `With Concern`:

- If the stored `return_to` value is `null`, update the expense status to `Submitted`. This returns the corrected expense to the supervisor approval module (`salesman-expense-approval` on FM).
- If the stored `return_to` value is not `null`, update the expense status to `Approved`. This returns the corrected expense to the Bulk Approval module (`bulk-approval` on FM).

The server derives the destination exclusively from the stored record. A client-supplied `return_to` value must not influence routing.

## Preserved and Cleared Fields

- Preserve the original `return_to` value after resubmission.
- Clear `feedback` after successful correction, matching the existing resolved-concern behavior.
- Set `approved_at` to the resubmission timestamp for either routing destination, matching the existing behavior.
- Increment the expense version.
- Record the selected destination status in `expense_draft_logs`.

## Type Contract

Add `Submitted` to the salesman `ExpenseDraft.status` schema because corrected concern items can now legitimately receive that status. Do not change the supervisor schema.

## Database Contract

The physical `expense_draft.status` column must accept `Submitted`. Apply this schema migration before relying on the null-`return_to` branch:

```sql
ALTER TABLE expense_draft
MODIFY COLUMN status
ENUM('Drafts','Submitted','Approved','Rejected','With Concern')
DEFAULT 'Drafts';
```

Without this migration, Directus 11.14.1 reports a misleading `CONTAINS_NULL_VALUES` error against another required column while processing `status: "Submitted"`.

## Update Payload Contract

The salesman PATCH endpoint must build an explicit allowlist of editable expense fields instead of spreading the client request into the Directus payload. The editable fields are `transaction_date`, `particulars`, `amount`, `payee`, `payee_id`, `remarks`, and `attachment_url`. The server may additionally set routing fields, timestamps, and `version`.

Client-provided `id`, `header_id`, `encoded_by`, `division_id`, `status`, `return_to`, `feedback`, `approved_at`, `rejected_at`, `drafted_at`, `encoded_date`, and `is_supervisor` must not pass through directly. Parent ownership and division are validated from the stored expense and header, and the acting salesman remains recorded in the audit log.

## Testing

Add salesman API regression tests proving:

- A stored `With Concern` expense with `return_to: null` becomes `Submitted`, preserves `return_to: null`, clears feedback, increments its version, and logs `Submitted`.
- A stored `With Concern` expense with a non-null `return_to` becomes `Approved`, preserves the original `return_to`, clears feedback, increments its version, and logs `Approved`.
- A client-supplied `return_to` cannot override the stored routing value.
- The Directus PATCH payload contains only editable fields plus server-derived workflow fields.
- Immutable and server-controlled fields are excluded even when supplied by the client.

Run the focused salesman API tests, all expense-report tests, TypeScript typechecking, and scoped linting.
