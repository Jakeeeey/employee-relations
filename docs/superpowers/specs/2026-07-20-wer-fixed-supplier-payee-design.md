# WER Fixed Supplier Payee Design

## Goal

Remove supplier selection from new Weekly Expense Report forms because each salesman or supervisor is expected to have one registered supplier payee.

## Form Behavior

Both salesman and supervisor creation forms display a read-only `Registered Supplier Payee` field. The form automatically uses the first supplier returned by the existing suppliers API and submits that supplier's ID as `payee_id`.

The suppliers API currently sorts assignments alphabetically by supplier name, so selecting the first result is deterministic.

## Assignment States

### One supplier

Display the supplier name as the registered payee. Do not show a dropdown.

### Multiple suppliers

Display the first supplier name as the registered payee and show this notice:

> Multiple supplier assignments were found. **[Supplier Name]** will be registered as the payee for this report. If this is the wrong payee, please contact your administrator.

Report creation remains enabled.

### No supplier

Display a supplier-assignment configuration warning and disable report creation. The user must contact an administrator before creating a report.

## Data Flow

The header component derives the registered supplier from `suppliers[0]`; it does not keep independently selectable payee state. `handleCreate` submits `suppliers[0].id`, plus the entered reporting period and remarks. Existing server-side supplier validation remains in place.

## Testing

Add focused unit coverage for the supplier-resolution behavior:

- A single assignment resolves to that supplier without a multiple-assignment notice.
- Multiple assignments resolve to the first supplier and require the administrator notice.
- No assignments resolve to no supplier and keep report creation disabled.

Run focused tests, all expense-report tests, TypeScript typechecking, and linting for the touched files.
