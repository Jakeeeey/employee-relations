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

## Testing

Add salesman API regression tests proving:

- A stored `With Concern` expense with `return_to: null` becomes `Submitted`, preserves `return_to: null`, clears feedback, increments its version, and logs `Submitted`.
- A stored `With Concern` expense with a non-null `return_to` becomes `Approved`, preserves the original `return_to`, clears feedback, increments its version, and logs `Approved`.
- A client-supplied `return_to` cannot override the stored routing value.

Run the focused salesman API tests, all expense-report tests, TypeScript typechecking, and scoped linting.
