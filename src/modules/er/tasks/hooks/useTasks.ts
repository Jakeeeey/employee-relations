import { useState, useCallback } from "react";
import { Task, CreateTask, UpdateTask } from "../type";

export function useTasks(userId: string | number) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/er/tasks?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createTask = async (data: CreateTask) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/er/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      await fetchTasks();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred while creating task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (id: string | number, data: UpdateTask) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/er/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      await fetchTasks();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred while updating task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (id: string | number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/er/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      await fetchTasks();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An error occurred while deleting task");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tasks,
    isLoading,
    error,
    refresh: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
