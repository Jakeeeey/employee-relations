import type { ExpenseDraft, ExpenseDraftHeader } from "./types/salesman-wer.schema";

export type NotificationSeenId = number | string;

export interface MissingWerNotification {
  id: string;
  header_id: number;
  status: "Missing File";
  transaction_date: string;
  payee: string;
  feedback: string;
  amount: number;
  isVirtual: true;
}

export type SalesmanWerNotification = ExpenseDraft | MissingWerNotification;

const NOTIFICATION_STATUS_PRIORITY: Record<string, number> = {
  "With Concern": 0,
  Rejected: 1,
  "Missing File": 2,
};

const PERSISTENT_ACTION_STATUSES = new Set(["With Concern", "Rejected"]);

const ACTIONABLE_MISSING_WER_HEADER_STATUSES = ["", "drafts", "not submitted", "waiting for approval"];
const ACTIONABLE_MISSING_WER_VOUCHER_STATUSES = ["", "drafts"];

export function buildMissingWerNotifications(headersList: ExpenseDraftHeader[]): MissingWerNotification[] {
  return headersList.flatMap((header) => {
    const headerStatus = (header.status || "").toLowerCase();
    const voucherStatus = (header.voucher_status || "").toLowerCase();
    const isActionable =
      ACTIONABLE_MISSING_WER_HEADER_STATUSES.includes(headerStatus) &&
      ACTIONABLE_MISSING_WER_VOUCHER_STATUSES.includes(voucherStatus);

    if (!isActionable || header.has_wer_file !== false) {
      return [];
    }

    const payeeName =
      typeof header.payee_id === "object" && header.payee_id !== null
        ? header.payee_id.supplier_name || "WER Summary File"
        : "WER Summary File";

    return [
      {
        id: `wer-missing-${header.id}`,
        header_id: header.id,
        status: "Missing File" as const,
        transaction_date: header.period_from,
        payee: payeeName,
        feedback: `No Weekly Expense Report summary file (WER Summary) has been uploaded for the period ${header.period_from} to ${header.period_to}. Please upload it before this report moves to approval.`,
        amount: 0,
        isVirtual: true as const,
      },
    ];
  });
}

export function getVisibleNotifications(
  virtualNotifications: MissingWerNotification[],
  returnedExpenses: ExpenseDraft[]
): SalesmanWerNotification[] {
  return [...virtualNotifications, ...returnedExpenses];
}

export function getUnreadNotifications(
  notifications: SalesmanWerNotification[],
  seenIds: NotificationSeenId[]
): SalesmanWerNotification[] {
  return notifications.filter((item) => !seenIds.includes(item.id));
}

export function isPersistentActionNotification(notification: { status: string }): boolean {
  return PERSISTENT_ACTION_STATUSES.has(notification.status);
}

export function isNotificationHighlighted<T extends { id: NotificationSeenId; status: string }>(
  notification: T,
  seenIds: NotificationSeenId[]
): boolean {
  return isPersistentActionNotification(notification) || !seenIds.includes(notification.id);
}

export function getActionRequiredNotifications<
  T extends { id: NotificationSeenId; status: string },
>(notifications: readonly T[], seenIds: NotificationSeenId[]): T[] {
  return notifications.filter((notification) =>
    isNotificationHighlighted(notification, seenIds)
  );
}

export function getMarkableNotificationIds<
  T extends { id: NotificationSeenId; status: string },
>(notifications: readonly T[], seenIds: NotificationSeenId[]): NotificationSeenId[] {
  return notifications
    .filter(
      (notification) =>
        !isPersistentActionNotification(notification) && !seenIds.includes(notification.id)
    )
    .map((notification) => notification.id);
}

export function sortWerNotificationsByPriority<T extends { status: string }>(
  notifications: readonly T[]
): T[] {
  return notifications
    .map((notification, index) => ({ notification, index }))
    .sort((a, b) => {
      const priorityDifference =
        (NOTIFICATION_STATUS_PRIORITY[a.notification.status] ?? 3) -
        (NOTIFICATION_STATUS_PRIORITY[b.notification.status] ?? 3);

      return priorityDifference || a.index - b.index;
    })
    .map(({ notification }) => notification);
}

export function isMissingWerNotification(
  notification: SalesmanWerNotification
): notification is MissingWerNotification {
  return "isVirtual" in notification && notification.isVirtual === true;
}
