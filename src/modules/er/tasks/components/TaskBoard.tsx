"use client";

import React, { useEffect, useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { TaskStatus } from "../type";
import { Loader2, Plus, GripVertical, CheckCircle2, Clock, PlayCircle, Calendar as CalendarIcon, LayoutGrid, ChevronLeft, ChevronRight, List as ListIcon, User } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  subMonths,
  addMonths,
  subWeeks,
  addWeeks,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  endOfDay,
  differenceInCalendarDays,
  differenceInMinutes,
  getHours,
  getMinutes
} from "date-fns";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { Task } from "../type";

export function TaskBoard({ userId }: { userId: string | number }) {
  const { tasks, holidays, isLoading, error, refresh, updateTask, createTask, deleteTask } = useTasks(userId);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "calendar" | "list">("board");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | number | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStatusChange = async (taskId: string | number, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const prevDate = () => {
    if (calendarView === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (calendarView === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };
  const nextDate = () => {
    if (calendarView === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (calendarView === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };
  const goToToday = () => setCurrentDate(new Date());

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

    const renderCalendarHeader = (startDate: Date, endDate: Date) => (
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {calendarView === "month" ? format(currentDate, "MMMM yyyy") : 
             calendarView === "week" ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}` :
             format(currentDate, "MMMM d, yyyy")}
          </h3>
          
          <div className="flex bg-gray-100 p-1 rounded-md">
            <button onClick={() => setCalendarView("month")} className={`px-2 py-1 text-xs font-medium rounded ${calendarView === "month" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}>Month</button>
            <button onClick={() => setCalendarView("week")} className={`px-2 py-1 text-xs font-medium rounded ${calendarView === "week" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}>Week</button>
            <button onClick={() => setCalendarView("day")} className={`px-2 py-1 text-xs font-medium rounded ${calendarView === "day" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}>Day</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-medium">Today</button>
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button onClick={prevDate} className="p-1 hover:bg-gray-50 text-gray-600 border-r border-gray-300">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextDate} className="p-1 hover:bg-gray-50 text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );

    const renderCalendar = () => {
      let startDate: Date, endDate: Date;
      if (calendarView === "month") {
        startDate = startOfWeek(startOfMonth(currentDate));
        endDate = endOfWeek(endOfMonth(currentDate));
      } else {
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
      }
      const displayDays = 7;
  
      const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
      let day = startDate;
      const rows = [];
  
      while (day <= endDate) {
        const weekStart = day;
        const weekEnd = addDays(day, displayDays - 1);
  
        // 1. Render background cells for the segment
        const days = [];
        for (let i = 0; i < displayDays; i++) {
          const currentDay = addDays(weekStart, i);
          
          const dayHolidays = holidays?.filter(h => isSameDay(parseISO(h.holiday_date), currentDay)) || [];
          
          days.push(
            <div
              key={currentDay.toString()}
              className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                calendarView === "month" && !isSameMonth(currentDay, currentDate)
                  ? "bg-gray-50/50 text-gray-400"
                  : dayHolidays.length > 0 
                  ? "bg-rose-50/30" // Subtle red tint for holidays
                  : isToday(currentDay)
                  ? "bg-blue-50/30"
                  : "bg-white"
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday(currentDay) ? 'text-white bg-blue-600 w-7 h-7 rounded-full flex items-center justify-center shadow-sm' : dayHolidays.length > 0 ? 'text-rose-600 ml-1' : 'text-gray-700 ml-1'}`}>
                {format(currentDay, "d")}
              </div>
              {dayHolidays.map(h => (
                <div key={h.id} className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1 px-1 truncate" title={h.description}>
                  {h.description}
                </div>
              ))}
            </div>
          );
        }
  
        // 2. Find tasks overlapping this week
        const weekTasks = tasks.filter(t => {
          const tStart = t.start_date ? startOfDay(parseISO(t.start_date)) : 
                         t.end_date ? startOfDay(parseISO(t.end_date)) :
                         (t.date_created ? startOfDay(parseISO(t.date_created)) : null);
          const tEnd = t.end_date ? endOfDay(parseISO(t.end_date)) : 
                       t.start_date ? endOfDay(parseISO(t.start_date)) : 
                       (t.date_created ? endOfDay(parseISO(t.date_created)) : null);
          
          if (!tStart || !tEnd) return false;
          // Overlaps if task start is before week end AND task end is after week start
          return tStart <= endOfDay(weekEnd) && tEnd >= startOfDay(weekStart);
        });
  
        // Sort tasks by start date, then duration (longer first)
        weekTasks.sort((a, b) => {
          const aStart = a.start_date ? parseISO(a.start_date).getTime() : 0;
          const bStart = b.start_date ? parseISO(b.start_date).getTime() : 0;
          if (aStart === bStart) {
             const aEnd = a.end_date ? parseISO(a.end_date).getTime() : aStart;
             const bEnd = b.end_date ? parseISO(b.end_date).getTime() : bStart;
             return (bEnd - bStart) - (aEnd - aStart);
          }
          return aStart - bStart;
        });
  
        // 3. Assign vertical slots to prevent overlaps within the week row
        const slots: Array<Array<{start: number, end: number}>> = [];
        const taskRenderData = weekTasks.map(t => {
          const tStart = t.start_date ? startOfDay(parseISO(t.start_date)) : 
                         t.end_date ? startOfDay(parseISO(t.end_date)) :
                         (t.date_created ? startOfDay(parseISO(t.date_created)) : new Date());
          const tEnd = t.end_date ? endOfDay(parseISO(t.end_date)) : 
                       t.start_date ? endOfDay(parseISO(t.start_date)) : 
                       (t.date_created ? endOfDay(parseISO(t.date_created)) : new Date());
                       
          // Clamp to week bounds
          const visibleStart = tStart < weekStart ? weekStart : tStart;
          const visibleEnd = tEnd > weekEnd ? weekEnd : tEnd;
  
          // Calculate indices (0-6)
          const startIndex = differenceInCalendarDays(visibleStart, weekStart);
          const endIndex = differenceInCalendarDays(visibleEnd, weekStart);
          const span = endIndex - startIndex + 1;
  
          // Find the first available vertical slot
          let slotIndex = 0;
          while (true) {
            if (!slots[slotIndex]) slots[slotIndex] = [];
            let collision = false;
            for (const occ of slots[slotIndex]) {
              if (!(startIndex > occ.end || endIndex < occ.start)) {
                collision = true;
                break;
              }
            }
            if (!collision) {
              slots[slotIndex].push({ start: startIndex, end: endIndex });
              break;
            }
            slotIndex++;
          }
  
          return { task: t, startIndex, span, slotIndex, tStart, tEnd };
        });
  
        // 4. Render the week row with absolute positioned event bars
        rows.push(
          <div className={`grid ${displayDays === 1 ? 'grid-cols-1' : 'grid-cols-7'} relative`} key={weekStart.toString()}>
            {days}
            
            {taskRenderData.map(({ task, startIndex, span, slotIndex, tStart, tEnd }) => {
              const topOffset = 42 + (slotIndex * 26); // 42px below the day number, 26px height per task
              
              // Check if actual dates extend beyond this week to control border radius
              const isStartRounded = tStart >= weekStart;
              const isEndRounded = tEnd <= weekEnd;
  
              let roundedClass = "rounded-md";
              if (!isStartRounded && !isEndRounded) roundedClass = "rounded-none";
              else if (!isStartRounded) roundedClass = "rounded-r-md rounded-l-none border-l-0";
              else if (!isEndRounded) roundedClass = "rounded-l-md rounded-r-none border-r-0";
  
              // Modern solid color bars
              let colorClass = "bg-slate-700 text-white border-slate-800";
              if (task.status === "Complete") colorClass = "bg-emerald-500 text-white border-emerald-600";
              else if (task.status === "In Progress") colorClass = "bg-blue-500 text-white border-blue-600";
              
              // Apply urgent/high priority styling if pending
              if (task.status === "Pending") {
                 if (task.priority === "Urgent") colorClass = "bg-rose-500 text-white border-rose-600";
                 else if (task.priority === "High") colorClass = "bg-orange-500 text-white border-orange-600";
              }
  
              return (
                <div 
                  key={task.id}
                  className={`absolute h-[22px] px-2 text-xs font-semibold flex items-center shadow-sm truncate border ${colorClass} ${roundedClass} hover:opacity-90 cursor-pointer transition-opacity z-10`}
                  style={{
                    left: `calc(${startIndex} * (100% / ${displayDays}) + 6px)`,
                    width: `calc(${span} * (100% / ${displayDays}) - 12px)`,
                    top: `${topOffset}px`
                  }}
                  title={task.title}
                  onClick={() => setEditingTask(task)}
                >
                  {task.title}
                </div>
              );
            })}
          </div>
        );
  
        day = addDays(day, displayDays); // Jump by number of days displayed
      }
  
    return (
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
        {renderCalendarHeader(startDate, endDate)}
  
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

  const renderDayView = () => {
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);

    const allDayTasks: any[] = [];
    const timedTasks: any[] = [];

    tasks.forEach(t => {
      const tStart = t.start_date ? parseISO(t.start_date) : 
                     t.end_date ? startOfDay(parseISO(t.end_date)) :
                     (t.date_created ? parseISO(t.date_created) : null);
      const tEnd = t.end_date ? parseISO(t.end_date) : 
                   t.start_date ? endOfDay(parseISO(t.start_date)) : 
                   (t.date_created ? endOfDay(parseISO(t.date_created)) : null);
                   
      if (!tStart || !tEnd) return;
      
      if (tStart <= dayEnd && tEnd >= dayStart) {
        const isMultiDay = !isSameDay(tStart, tEnd);
        const startsAtMidnight = getHours(tStart) === 0 && getMinutes(tStart) === 0;
        const endsAtMidnight = getHours(tEnd) === 23 && getMinutes(tEnd) === 59;
        
        if (isMultiDay || (startsAtMidnight && endsAtMidnight)) {
          allDayTasks.push({ task: t, tStart, tEnd });
        } else {
          timedTasks.push({ task: t, tStart, tEnd });
        }
      }
    });

    timedTasks.sort((a, b) => {
      if (a.tStart.getTime() === b.tStart.getTime()) return b.tEnd.getTime() - a.tEnd.getTime();
      return a.tStart.getTime() - b.tStart.getTime();
    });

    const columns: any[][] = [];
    timedTasks.forEach(item => {
      let placed = false;
      for (const col of columns) {
        const overlaps = col.some(existing => {
          return item.tStart < existing.tEnd && item.tEnd > existing.tStart;
        });
        if (!overlaps) {
          col.push(item);
          item.colIndex = columns.indexOf(col);
          placed = true;
          break;
        }
      }
      if (!placed) {
        item.colIndex = columns.length;
        columns.push([item]);
      }
    });
    const numColumns = Math.max(columns.length, 1);

    return (
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white flex flex-col">
        {renderCalendarHeader(dayStart, dayEnd)}

        {/* All-Day Section */}
        {allDayTasks.length > 0 && (
          <div className="flex bg-gray-50 border-b border-gray-200 p-2 max-h-32 overflow-y-auto">
            <div className="w-16 flex-shrink-0 text-[10px] text-gray-500 font-semibold text-right pr-4 pt-1.5 uppercase tracking-wider">All Day</div>
            <div className="flex-1 flex flex-col gap-1">
              {allDayTasks.map(({ task }) => {
                let colorClass = "bg-slate-700 border-slate-800";
                if (task.status === "Complete") colorClass = "bg-emerald-500 border-emerald-600";
                else if (task.status === "In Progress") colorClass = "bg-blue-500 border-blue-600";
                
                if (task.status === "Pending") {
                   if (task.priority === "Urgent") colorClass = "bg-rose-500 border-rose-600";
                   else if (task.priority === "High") colorClass = "bg-orange-500 border-orange-600";
                }

                return (
                  <div 
                    key={task.id} 
                    onClick={() => setEditingTask(task)}
                    className={`text-white text-xs font-semibold px-2 py-1 rounded cursor-pointer hover:opacity-90 truncate shadow-sm border ${colorClass}`}
                  >
                    {task.title}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hourly Grid */}
        <div className="flex-1 overflow-y-auto max-h-[600px] relative">
          <div className="flex relative">
            {/* Time axis */}
            <div className="w-16 flex-shrink-0 bg-white border-r border-gray-100 z-20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border-b border-gray-100 flex items-start justify-end pr-4 text-[10px] text-gray-400 font-medium pt-1" style={{ height: '60px' }}>
                  {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                </div>
              ))}
            </div>
            
            {/* Grid Area */}
            <div className="flex-1 relative bg-white">
              {/* Horizontal Lines */}
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border-b border-gray-100 w-full" style={{ height: '60px' }} />
              ))}
              
              {/* Timed Tasks */}
              {timedTasks.map(({ task, tStart, tEnd, colIndex }) => {
                const clampedStart = tStart < dayStart ? dayStart : tStart;
                const clampedEnd = tEnd > dayEnd ? dayEnd : tEnd;
                
                const startMinutes = getHours(clampedStart) * 60 + getMinutes(clampedStart);
                const durationMinutes = differenceInMinutes(clampedEnd, clampedStart);
                
                const top = startMinutes;
                const height = Math.max(durationMinutes, 20);

                let colorClass = "bg-slate-700 border-slate-800";
                if (task.status === "Complete") colorClass = "bg-emerald-500 border-emerald-600";
                else if (task.status === "In Progress") colorClass = "bg-blue-500 border-blue-600";
                
                if (task.status === "Pending") {
                   if (task.priority === "Urgent") colorClass = "bg-rose-500 border-rose-600";
                   else if (task.priority === "High") colorClass = "bg-orange-500 border-orange-600";
                }

                return (
                  <div 
                    key={task.id}
                    onClick={() => setEditingTask(task)}
                    className={`absolute rounded border text-white shadow-sm overflow-hidden p-1.5 cursor-pointer hover:opacity-90 z-10 ${colorClass}`}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `calc(${colIndex} * (100% / ${numColumns}) + 4px)`,
                      width: `calc(100% / ${numColumns} - 8px)`
                    }}
                  >
                    <div className="text-xs font-semibold leading-tight mb-0.5 truncate">{task.title}</div>
                    <div className="text-[10px] opacity-80 leading-tight truncate">
                      {format(clampedStart, "h:mm a")} - {format(clampedEnd, "h:mm a")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBoard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {columns.map((col) => (
        <div 
          key={col.status} 
          className={`rounded-xl p-4 ${col.color} border border-gray-200 min-h-[500px] transition-colors`}
          onDragOver={(e) => {
            e.preventDefault(); // allow drop
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedTaskId) {
              handleStatusChange(draggedTaskId, col.status);
              setDraggedTaskId(null);
            }
          }}
        >
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
                  draggable
                  onDragStart={(e) => {
                    setDraggedTaskId(task.id);
                    e.dataTransfer.setData("text/plain", task.id.toString());
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDraggedTaskId(null);
                  }}
                  onClick={() => setEditingTask(task)}
                  className={`bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${draggedTaskId === task.id ? "opacity-50" : ""} ${task.end_date && isToday(parseISO(task.end_date)) && task.status !== "Complete" ? "border-blue-400 ring-1 ring-blue-400/20 bg-blue-50/10" : "border-gray-100"}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      
                      {/* Dates */}
                      {(task.start_date || task.end_date) && (
                        <div className={`flex flex-wrap items-center text-[10px] mt-3 gap-1.5 font-medium ${task.end_date && isToday(parseISO(task.end_date)) && task.status !== "Complete" ? "text-blue-700" : "text-gray-500"}`}>
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>{task.start_date ? format(parseISO(task.start_date), "MMM d, h:mm a") : "No start"}</span>
                          <span className="text-gray-300">→</span>
                          <span className={task.end_date && isToday(parseISO(task.end_date)) && task.status !== "Complete" ? "bg-blue-600 text-white px-2 py-0.5 rounded-full text-white" : ""}>
                            {task.end_date ? format(parseISO(task.end_date), "MMM d, h:mm a") : "No deadline"}
                          </span>
                        </div>
                      )}
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
                    <div className="flex gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
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

  const renderList = () => (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium">Task</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Priority</th>
              <th className="px-6 py-4 font-medium">Schedule</th>
              <th className="px-6 py-4 font-medium">Assignees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr 
                  key={task.id} 
                  onClick={() => setEditingTask(task)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.description && <p className="text-gray-500 mt-1 line-clamp-1">{task.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === "Complete" ? "bg-green-100 text-green-700" :
                      task.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {task.status === "Complete" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {task.status === "In Progress" && <PlayCircle className="w-3 h-3 mr-1" />}
                      {task.status === "Pending" && <Clock className="w-3 h-3 mr-1" />}
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === "Urgent" ? "bg-red-100 text-red-700"
                      : task.priority === "High" ? "bg-orange-100 text-orange-700"
                      : task.priority === "Medium" ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {task.start_date || task.end_date ? (
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                        <span>{task.start_date ? format(parseISO(task.start_date), "MMM d, h:mm a") : "No start"}</span>
                        <span className="text-gray-300">→</span>
                        <span className={task.end_date && isToday(parseISO(task.end_date)) && task.status !== "Complete" ? "bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium" : ""}>
                          {task.end_date ? format(parseISO(task.end_date), "MMM d, h:mm a") : "No deadline"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex -space-x-2 overflow-hidden">
                        {task.assignees.slice(0, 3).map((id, idx) => (
                          <div key={idx} className="inline-flex h-8 w-8 rounded-full bg-gray-200 border-2 border-white items-center justify-center text-gray-500 shadow-sm">
                            <User className="w-4 h-4" />
                          </div>
                        ))}
                        {task.assignees.length > 3 && (
                          <div className="inline-flex h-8 w-8 rounded-full bg-gray-100 border-2 border-white items-center justify-center text-[10px] font-medium text-gray-600 shadow-sm z-10 relative">
                            +{task.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <ListIcon className="w-4 h-4" /> List
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

      {viewMode === "board" && renderBoard()}
      {viewMode === "calendar" && calendarView !== "day" && renderCalendar()}
      {viewMode === "calendar" && calendarView === "day" && renderDayView()}
      {viewMode === "list" && renderList()}
      
      <CreateTaskDialog 
        open={isCreating} 
        onOpenChange={setIsCreating} 
        userId={userId} 
        onSubmit={createTask} 
      />

      <EditTaskDialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </div>
  );
}
