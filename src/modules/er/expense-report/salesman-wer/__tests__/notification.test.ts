import { describe, expect, it } from "vitest";
import {
  buildMissingWerNotifications,
  getUnreadNotifications,
  getVisibleNotifications,
  getActionRequiredNotifications,
  getMarkableNotificationIds,
  isNotificationHighlighted,
  sortWerNotificationsByPriority,
  type NotificationSeenId,
} from "../notifications";
import type { ExpenseDraft, ExpenseDraftHeader } from "../types/salesman-wer.schema";

describe("Salesman WER notifications", () => {
  const missingWerHeader: ExpenseDraftHeader = {
    id: 100,
    division_id: 1,
    payee_id: { id: 5, supplier_name: "2NABAT Supplier" },
    period_from: "2026-07-15",
    period_to: "2026-07-21",
    created_by: 123,
    status: "Waiting for Approval",
    has_wer_file: false,
  };

  const returnedExpense: ExpenseDraft = {
    id: 200,
    header_id: 100,
    encoded_by: 123,
    particulars: 4000,
    division_id: 1,
    payee_id: 5,
    transaction_date: "2026-07-16",
    amount: 500,
    payee: "Merchant A",
    status: "With Concern",
    version: 1,
    feedback: "Please correct the amount.",
  };

  it("resets missing WER virtual notifications to unread after refresh while preserving returned item read state", () => {
    const virtualNotifications = buildMissingWerNotifications([missingWerHeader]);
    const visibleNotifications = getVisibleNotifications(virtualNotifications, [returnedExpense]);

    const seenBeforeRefresh: NotificationSeenId[] = [
      virtualNotifications[0].id,
      returnedExpense.id,
    ];
    expect(getUnreadNotifications(visibleNotifications, seenBeforeRefresh)).toHaveLength(0);

    const seenAfterRefresh: NotificationSeenId[] = [returnedExpense.id];
    expect(getUnreadNotifications(visibleNotifications, seenAfterRefresh).map((item) => item.id)).toEqual([
      virtualNotifications[0].id,
    ]);
  });

  it("only creates missing WER notifications for not submitted or waiting for approval headers", () => {
    const headers: ExpenseDraftHeader[] = [
      { ...missingWerHeader, id: 101, status: "Drafts" },
      { ...missingWerHeader, id: 102, status: "Not Submitted" },
      { ...missingWerHeader, id: 103, status: "Waiting for Approval" },
      { ...missingWerHeader, id: 104, status: "Approved" },
      { ...missingWerHeader, id: 105, status: "Drafts", voucher_status: "Approved" },
      { ...missingWerHeader, id: 106, status: "Submitted" },
    ];

    expect(buildMissingWerNotifications(headers).map((item) => item.header_id)).toEqual([
      101,
      102,
      103,
    ]);
  });

  it("prioritizes With Concern notifications without changing equal-priority order", () => {
    const notifications = [
      { id: "missing", status: "Missing File" },
      { id: "rejected", status: "Rejected" },
      { id: "concern-first", status: "With Concern" },
      { id: "concern-second", status: "With Concern" },
    ];

    expect(sortWerNotificationsByPriority(notifications).map((item) => item.id)).toEqual([
      "concern-first",
      "concern-second",
      "rejected",
      "missing",
    ]);
  });

  it("does not mutate the notification source array", () => {
    const notifications = [
      { id: "rejected", status: "Rejected" },
      { id: "concern", status: "With Concern" },
    ];
    const originalIds = notifications.map((item) => item.id);

    sortWerNotificationsByPriority(notifications);

    expect(notifications.map((item) => item.id)).toEqual(originalIds);
  });

  it("keeps seen With Concern and Rejected items action-required and highlighted", () => {
    const rejectedExpense: ExpenseDraft = {
      ...returnedExpense,
      id: 201,
      status: "Rejected",
    };
    const notifications = [returnedExpense, rejectedExpense];
    const seenIds = notifications.map((item) => item.id);

    expect(getActionRequiredNotifications(notifications, seenIds).map((item) => item.id)).toEqual([
      returnedExpense.id,
      rejectedExpense.id,
    ]);
    expect(isNotificationHighlighted(returnedExpense, seenIds)).toBe(true);
    expect(isNotificationHighlighted(rejectedExpense, seenIds)).toBe(true);
  });

  it("keeps non-persistent notifications subject to seen state", () => {
    const [missingNotification] = buildMissingWerNotifications([missingWerHeader]);

    expect(getActionRequiredNotifications([missingNotification], [missingNotification.id])).toEqual([]);
    expect(isNotificationHighlighted(missingNotification, [missingNotification.id])).toBe(false);
  });

  it("excludes persistent action-required items from mark-all IDs", () => {
    const rejectedExpense: ExpenseDraft = {
      ...returnedExpense,
      id: 201,
      status: "Rejected",
    };
    const [missingNotification] = buildMissingWerNotifications([missingWerHeader]);

    expect(
      getMarkableNotificationIds([returnedExpense, rejectedExpense, missingNotification], [])
    ).toEqual([missingNotification.id]);
  });
});
