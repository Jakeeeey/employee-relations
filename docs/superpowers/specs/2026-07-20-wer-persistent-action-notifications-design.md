# WER Persistent Action Notifications Design

## Goal

Keep unresolved returned-expense notifications visibly actionable after they are opened or the page is refreshed, while updating supplier terminology across both WER roles.

## Persistent Action-Required Statuses

`With Concern` and `Rejected` are persistent action-required statuses in both salesman and supervisor notification lists.

- They always contribute to the notification badge count while returned by the backend.
- They always retain highlighted styling while returned by the backend.
- Clicking them still selects their report and performs the existing navigation or edit behavior.
- Clicking them does not mark them resolved or remove their highlight.
- `Mark all read` does not clear their badge or highlighted styling.
- They disappear only when a refresh no longer returns them with an action-required status after the underlying expense is resolved.

Local `seenIds` state remains available for non-persistent informational notifications.

## Shared Notification Logic

Add shared notification helpers that identify persistent action-required statuses, calculate whether an item should be highlighted, calculate the badge list, and return only notification IDs eligible for `Mark all read`. Both role screens use these helpers so their behavior cannot drift.

## Terminology

Apply these copy changes to salesman and supervisor screens:

- Notification metadata changes from `Merchant:` to `Payee:`.
- The creation-form label changes from `Registered Supplier Payee` to `Registered Payee Account`.
- New-report descriptions and assignment messages use `payee` or `payee account` consistently where they refer to the registered account.

Internal database and TypeScript field names such as `payee_id`, `payee`, and `supplier_name` remain unchanged.

## Testing

Extend notification unit tests to prove:

- `With Concern` remains highlighted and counted even when its ID is in `seenIds`.
- `Rejected` remains highlighted and counted even when its ID is in `seenIds`.
- Non-persistent notifications still honor `seenIds`.
- `Mark all read` excludes persistent action-required IDs.

Run notification tests, all expense-report tests, TypeScript typechecking, and scoped linting.
