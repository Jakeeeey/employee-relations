"use client";

import React, { useEffect, useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { TaskStatus } from "../type";
import { Loader2, Plus, GripVertical, CheckCircle2, Clock, PlayCircle, Calendar as CalendarIcon, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subMonths,
  addMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from "date-fns";
import { CreateTaskDialog } from "./CreateTaskDialog";

export function TaskBoard({ userId }: { userId: string | number }) {
  const { tasks, isLoading, error, refresh, updateTask, createTask } = useTasks(userId);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "calendar">("board");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStatusChange = async (taskId: string | number, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

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

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];

    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;

        // Find tasks for this day
        // Map tasks to their end_date (fallback to start_date or date_created)
        const dayTasks = tasks.filter(t => {
           const targetDate = t.end_date ? parseISO(t.end_date) : 
                              t.start_date ? parseISO(t.start_date) : 
                              (t.date_created ? parseISO(t.date_created) : null);
           if (!targetDate) return false;
           return isSameDay(targetDate, cloneDay);
        });

        days.push(
          <div
            className={`min-h-[120px] p-2 border-r border-b relative ${
              !isSameMonth(day, monthStart)
                ? "bg-gray-50 text-gray-400"
                : isToday(day)
                ? "bg-blue-50/10"
                : "bg-white"
            }`}
            key={day.toString()}
          >
            <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-white bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700 ml-1'}`}>
              {formattedDate}
            </div>
            <div className="space-y-1 mt-1 overflow-y-auto max-h-[85px] no-scrollbar">
              {dayTasks.map(task => (
                <div 
                  key={task.id}
                  className={`text-xs p-1 px-1.5 rounded border truncate shadow-sm cursor-pointer ${
                    task.status === "Complete" ? "bg-green-100 border-green-200 text-green-800"
                    : task.status === "In Progress" ? "bg-blue-100 border-blue-200 text-blue-800"
                    : "bg-gray-100 border-gray-200 text-gray-800"
                  }`}
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="mt-6 border-t border-l border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
        {/* Calendar Header Nav */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{format(currentMonth, "MMMM yyyy")}</h3>
          <div className="flex items-center gap-2">
            <button onClick={goToToday} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium">Today</button>
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-50 text-gray-600 border-r border-gray-300">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-50 text-gray-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map(wd => (
             <div key={wd} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
               {wd}
             </div>
          ))}
        </div>
        
        {/* Grid cells */}
        <div className="border-r-0 border-b-0">
          {rows}
        </div>
      </div>
    );
  };

  const renderBoard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {columns.map((col) => (
        <div key={col.status} className={`rounded-xl p-4 ${col.color} border border-gray-200 min-h-[500px]`}>
          <div className="flex items-center gap-2 mb-4">
            {col.icon}
            <h3 className="font-semibold text-gray-700">{col.title}</h3>
            <span className="ml-auto bg-white text-gray-600 text-xs px-2 py-1 rounded-full shadow-sm border border-gray-100">
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
                    
                    {task.assignees && task.assignees.length > 0 && (
                      <span className="text-xs text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                        👥 {task.assignees.length}
                      </span>
                    )}

                    {/* Simple action buttons to move state */}
                    <div className="flex gap-1 ml-auto">
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
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">My Tasks</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "board" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "calendar" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <CalendarIcon className="w-4 h-4" /> Calendar
            </button>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {viewMode === "board" ? renderBoard() : renderCalendar()}
      
      <CreateTaskDialog 
        open={isCreating} 
        onOpenChange={setIsCreating} 
        userId={userId} 
        onSubmit={createTask} 
      />
    </div>
  );
}
