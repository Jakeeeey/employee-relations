"use client";

import React, { useEffect, useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { TaskStatus } from "../type";
import { Loader2, Plus, GripVertical, CheckCircle2, Clock, PlayCircle } from "lucide-react";

export function TaskBoard({ userId }: { userId: string | number }) {
  const { tasks, isLoading, error, refresh, updateTask } = useTasks(userId);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStatusChange = async (taskId: string | number, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-md">Error: {error}</div>;
  }

  const columns: { title: string; status: TaskStatus; icon: React.ReactNode; color: string }[] = [
    { title: "Pending", status: "Pending", icon: <Clock className="w-5 h-5 text-gray-500" />, color: "bg-gray-100" },
    { title: "In Progress", status: "In Progress", icon: <PlayCircle className="w-5 h-5 text-blue-500" />, color: "bg-blue-50" },
    { title: "Complete", status: "Complete", icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, color: "bg-green-50" },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">My Tasks</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col.status} className={`rounded-xl p-4 ${col.color} border border-gray-200 min-h-[500px]`}>
            <div className="flex items-center gap-2 mb-4">
              {col.icon}
              <h3 className="font-semibold text-gray-700">{col.title}</h3>
              <span className="ml-auto bg-white text-gray-600 text-xs px-2 py-1 rounded-full shadow-sm">
                {tasks.filter((t) => t.status === col.status).length}
              </span>
            </div>
            <div className="space-y-3">
              {tasks
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <div
                    key={task.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 cursor-pointer relative group">
                         <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === "Urgent" ? "bg-red-100 text-red-700"
                          : task.priority === "High" ? "bg-orange-100 text-orange-700"
                          : task.priority === "Medium" ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                      
                      {/* Simple action buttons to move state - in a real app, this would use DnD or a dropdown */}
                      <div className="flex gap-1">
                         {task.status !== "Pending" && (
                           <button onClick={() => handleStatusChange(task.id, "Pending")} className="text-xs text-gray-500 hover:text-black">{'<'} Pending</button>
                         )}
                         {task.status === "Pending" && (
                           <button onClick={() => handleStatusChange(task.id, "In Progress")} className="text-xs text-blue-500 hover:text-blue-700">Start {'>'}</button>
                         )}
                         {task.status === "In Progress" && (
                           <button onClick={() => handleStatusChange(task.id, "Complete")} className="text-xs text-green-500 hover:text-green-700">Finish {'>'}</button>
                         )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Note: In a complete implementation, use shadcn/ui Dialog here instead of window.prompt */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px]">
            <h3 className="text-lg font-bold mb-4">New Task</h3>
            <p className="text-sm text-gray-500 mb-4">Please create a task logic component.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
