import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { Task } from '../types.ts';
import { 
  format, 
  parseISO, 
  eachDayOfInterval, 
  differenceInCalendarDays, 
  addDays, 
  isSameDay, 
  isWeekend 
} from 'date-fns';
import { 
  Calendar, 
  Flame, 
  Clock, 
  ChevronRight, 
  Flag, 
  Filter, 
  ZoomIn, 
  GitCommit,
  CheckCircle2
} from 'lucide-react';

export const GanttTimeline: React.FC = () => {
  const { project, setSelectedTaskId, searchQuery, selectedCategory, selectedPriority } = useProject();
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [dayWidth, setDayWidth] = useState(38); // pixels per day

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return project.tasks.filter(task => {
      if (showCriticalOnly && !task.isCriticalPath) return false;
      if (selectedCategory !== 'All' && task.category !== selectedCategory) return false;
      if (selectedPriority !== 'All' && task.priority !== selectedPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return task.title.toLowerCase().includes(q) || task.category.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [project.tasks, showCriticalOnly, selectedCategory, selectedPriority, searchQuery]);

  // Compute timeline boundaries
  const { timelineStart, timelineEnd, allDays } = useMemo(() => {
    let minDate = parseISO(project.startDate || '2026-09-10');
    let maxDate = parseISO(project.targetDeadline || '2026-10-15');

    project.tasks.forEach(t => {
      try {
        const s = parseISO(t.startDate);
        const d = parseISO(t.dueDate);
        if (s < minDate) minDate = s;
        if (d > maxDate) maxDate = d;
      } catch {}
    });

    // Add 3 days buffer on each side
    const start = addDays(minDate, -2);
    const end = addDays(maxDate, 5);
    const days = eachDayOfInterval({ start, end });

    return { timelineStart: start, timelineEnd: end, allDays: days };
  }, [project.startDate, project.targetDeadline, project.tasks]);

  const totalWidth = allDays.length * dayWidth;
  const today = new Date();

  const getTaskLeftAndWidth = (task: Task) => {
    try {
      const taskStart = parseISO(task.startDate);
      const taskEnd = parseISO(task.dueDate);
      const daysFromStart = Math.max(0, differenceInCalendarDays(taskStart, timelineStart));
      const durationDays = Math.max(1, differenceInCalendarDays(taskEnd, taskStart) + 1);

      return {
        left: daysFromStart * dayWidth,
        width: Math.max(28, durationDays * dayWidth - 4)
      };
    } catch {
      return { left: 0, width: dayWidth * 2 };
    }
  };

  const getAssignee = (id?: string) => project.members.find(m => m.id === id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Timeline Range:</span>
            <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {format(timelineStart, 'MMM d')} – {format(timelineEnd, 'MMM d, yyyy')}
            </span>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={showCriticalOnly}
              onChange={(e) => setShowCriticalOnly(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="flex items-center gap-1 text-amber-900 font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              Critical Path Only
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Grid Zoom:</span>
          <button
            onClick={() => setDayWidth(28)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
              dayWidth === 28 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Compact
          </button>
          <button
            onClick={() => setDayWidth(38)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
              dayWidth === 38 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setDayWidth(52)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
              dayWidth === 52 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Detailed
          </button>
        </div>
      </div>

      {/* Main Gantt Canvas Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
        
        {/* Left Column: Task Titles & Assignees (Sticky) */}
        <div className="w-72 sm:w-80 shrink-0 border-r border-slate-200 bg-slate-50/50 z-10 flex flex-col">
          {/* Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 font-bold text-xs text-slate-700 bg-slate-100/80">
            <span>Task & Dependencies</span>
            <span>Assignee</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {filteredTasks.map(task => {
              const assignee = getAssignee(task.assigneeId);
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="h-14 px-3 flex items-center justify-between gap-2 hover:bg-blue-50/50 cursor-pointer transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {task.isCriticalPath && (
                        <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                      <h4 className="text-xs font-semibold text-slate-800 truncate">
                        {task.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="truncate max-w-[110px]">{task.category}</span>
                      <span>•</span>
                      <span className="font-mono">{task.estimatedHours}h</span>
                      {task.dependencies.length > 0 && (
                        <span className="text-indigo-600 font-medium">
                          ({task.dependencies.length} deps)
                        </span>
                      )}
                    </div>
                  </div>

                  {assignee && (
                    <img
                      src={assignee.avatar}
                      alt={assignee.name}
                      title={assignee.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover shrink-0 border border-white shadow-2xs"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Horizontal Timeline Canvas */}
        <div className="flex-1 overflow-x-auto relative">
          <div style={{ width: `${totalWidth}px` }} className="relative min-w-full">
            
            {/* Timeline Header (Dates) */}
            <div className="h-16 border-b border-slate-200 bg-slate-100/60 flex sticky top-0 z-10">
              {allDays.map((day, idx) => {
                const isWk = isWeekend(day);
                const isTargetDeadline = format(day, 'yyyy-MM-dd') === project.targetDeadline;

                return (
                  <div
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`shrink-0 border-r border-slate-200/60 flex flex-col items-center justify-center text-[10px] ${
                      isWk ? 'bg-slate-200/40 text-slate-400' : 'text-slate-600'
                    } ${isTargetDeadline ? 'bg-rose-50' : ''}`}
                  >
                    <span className="font-semibold text-slate-800">{format(day, 'd')}</span>
                    <span className="text-[9px] uppercase tracking-wider">{format(day, 'EEE')}</span>
                    {day.getDate() === 1 && (
                      <span className="text-[9px] font-bold text-blue-600 font-mono">
                        {format(day, 'MMM')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Target Deadline Vertical Line */}
            {(() => {
              try {
                const targetDate = parseISO(project.targetDeadline);
                const offset = differenceInCalendarDays(targetDate, timelineStart);
                if (offset >= 0 && offset < allDays.length) {
                  return (
                    <div
                      style={{ left: `${offset * dayWidth + dayWidth / 2}px` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
                    >
                      <div className="sticky top-2 -translate-x-1/2 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                        Deadline {project.targetDeadline}
                      </div>
                    </div>
                  );
                }
              } catch {}
              return null;
            })()}

            {/* Background Grid Columns */}
            <div className="absolute inset-0 top-16 flex pointer-events-none">
              {allDays.map((day, idx) => {
                const isWk = isWeekend(day);
                return (
                  <div
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`shrink-0 border-r border-slate-100 h-full ${
                      isWk ? 'bg-slate-50/60' : ''
                    }`}
                  />
                );
              })}
            </div>

            {/* Task Bars Rows */}
            <div className="divide-y divide-slate-100 relative z-10">
              {filteredTasks.map(task => {
                const { left, width } = getTaskLeftAndWidth(task);
                const isDone = task.status === 'done';

                return (
                  <div key={task.id} className="h-14 relative flex items-center">
                    {/* Task Bar */}
                    <div
                      onClick={() => setSelectedTaskId(task.id)}
                      style={{ left: `${left}px`, width: `${width}px` }}
                      className={`absolute h-8 rounded-lg px-2.5 flex items-center justify-between text-xs font-semibold cursor-pointer transition shadow-xs hover:ring-2 hover:ring-blue-400 group overflow-hidden ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : task.isCriticalPath
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border border-amber-400 ring-1 ring-amber-300'
                          : task.status === 'in_progress'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                      title={`${task.title} (${task.startDate} to ${task.dueDate}) - ${task.progress}%`}
                    >
                      {/* Internal Progress fill indicator */}
                      <div
                        className="absolute inset-0 bg-white/20 pointer-events-none"
                        style={{ width: `${task.progress}%` }}
                      />

                      {/* Content */}
                      <div className="relative z-10 flex items-center gap-1.5 truncate">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : task.isCriticalPath ? (
                          <Flame className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                        ) : null}
                        <span className="truncate text-[11px]">{task.title}</span>
                      </div>

                      <span className="relative z-10 text-[10px] font-mono opacity-85 shrink-0 ml-1">
                        {task.progress}%
                      </span>
                    </div>

                    {/* Predecessor Connector indicator */}
                    {task.dependencies.length > 0 && (
                      <div
                        style={{ left: `${Math.max(0, left - 18)}px` }}
                        className="absolute text-[10px] text-slate-400 pointer-events-none"
                      >
                        ←
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* Gantt Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3 px-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-rose-500 border border-amber-400"></span>
            <span>Critical Path (Zero Slack)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600"></span>
            <span>In Progress</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600"></span>
            <span>Completed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500"></span>
            <span>Target Milestone Deadline</span>
          </span>
        </div>
        <p className="text-[11px]">Click any bar to adjust duration, dependencies, or assignee</p>
      </div>
    </div>
  );
};
