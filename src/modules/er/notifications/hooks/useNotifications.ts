import { useState, useCallback } from "react";
import { AppNotification } from "../type";

export function useNotifications(userId: string | number) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/er/notifications?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markAsRead = async (id: string | number) => {
    try {
      const response = await fetch(`/api/er/notifications/${id}`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to update notification");
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred marking notification as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
  };
}
