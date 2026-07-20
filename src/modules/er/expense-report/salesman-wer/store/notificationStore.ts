import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationStore {
  seenIds: Array<number | string>;
  markAsSeen: (id: number | string) => void;
  markAllAsSeen: (ids: Array<number | string>) => void;
  resetSeen: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      seenIds: [],
      markAsSeen: (id) =>
        set((state) => ({
          seenIds: state.seenIds.includes(id) ? state.seenIds : [...state.seenIds, id],
        })),
      markAllAsSeen: (ids) =>
        set((state) => ({
          seenIds: Array.from(new Set([...state.seenIds, ...ids])),
        })),
      resetSeen: () => set({ seenIds: [] }),
    }),
    {
      name: "wer-notification-seen-store",
      partialize: (state) => ({
        seenIds: state.seenIds.filter((id): id is number => typeof id === "number"),
      }),
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Partial<NotificationStore> | undefined;
        return {
          seenIds: Array.isArray(state?.seenIds)
            ? state.seenIds.filter((id): id is number => typeof id === "number")
            : [],
        };
      },
    }
  )
);
