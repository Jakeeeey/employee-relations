# WER Notification Priority Design

## Goal

Display actionable `With Concern` notifications before every other notification in both the salesman and supervisor Weekly Expense Report notification lists.

## Ordering

Notifications are grouped by status in this priority order:

1. `With Concern`
2. `Rejected`
3. `Missing File`
4. Any unrecognized status

Items with the same priority retain their existing relative order. Unread counts and persisted seen state are not changed.

## Implementation

Add a shared, stable notification-ordering helper alongside the existing salesman WER notification utilities. The salesman module will apply it to its combined real and virtual notifications. The supervisor module will apply it to its returned-expense notifications.

Centralizing the policy prevents the two screens from developing different ordering behavior.

## Testing

Add unit coverage proving that:

- `With Concern` items precede rejected and missing-file items.
- Equal-priority items preserve their input order.
- The input array is not mutated.

Run the focused notification tests, the complete expense-report test set, and TypeScript typechecking.
