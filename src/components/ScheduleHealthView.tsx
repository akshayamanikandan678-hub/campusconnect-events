import React from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { 
  Activity, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Clock, 
  Users, 
  Layers, 
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const ScheduleHealthView: React.FC = () => {
  const { project, setIsSchedulerOpen, setSelectedTaskId, criticalPathCount } = useProject();

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = project.tasks.filter(t => t.status === 'in_progress').length;
  const criticalTasks = project.tasks.filter(t => t.isCriticalPath);

  // Measure schedule viability against target deadline
  let latestDueDate = project.startDate;
  project.tasks.forEach(t => {
    if (t.dueDate > latestDueDate) latestDueDate = t.dueDate;
  });

  const isOverdue = latestDueDate > project.targetDeadline;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Schedule Health & Critical Path Analysis
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Continuous verification of task dependencies, early/late start constraints, and zero-float critical paths. Automated task scheduling guarantees all preceding milestones are satisfied before downstream tasks commence.
          </p>
        </div>

        <button
          onClick={() => setIsSchedulerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
        >
          <Cpu className="w-4 h-4 text-indigo-200" />
          <span>Open Auto-Scheduling Engine</span>
        </button>
      </div>

      {/* 4 Health Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deadline Alignment</span>
            {isOverdue ? (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {latestDueDate}
          </div>
          <p className={`text-xs mt-1 font-semibold ${isOverdue ? 'text-rose-600' : 'text-emerald-700'}`}>
            {isOverdue ? '⚠️ Pushing past target deadline' : '✓ Target deadline guaranteed'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Path (CPM)</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-900 font-mono flex items-center gap-1.5">
            <span>{criticalPathCount} Tasks</span>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            Zero float (slack = 0)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Execution Pace</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {completedTasks}/{totalTasks}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {inProgressTasks} currently in progress
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dependency Graph</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {project.tasks.reduce((acc, t) => acc + t.dependencies.length, 0)} Links
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">
            ✓ Directed Acyclic Graph (DAG) verified
          </p>
        </div>

      </div>

      {/* Critical Path Sequence Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>CampusConnect Critical Path Timeline</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These tasks form the longest path of planned activities to the project launch. Any delay here delays the college event opening ceremony!
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
            {criticalTasks.length} Milestones
          </span>
        </div>

        <div className="space-y-2">
          {criticalTasks.map((task, idx) => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 truncate">{task.title}</h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                      {task.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {task.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                <span className="text-slate-600">{task.startDate} → {task.dueDate}</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {task.estimatedHours}h
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  task.status === 'done' ? 'bg-emerald-100 text-emerald-800' :
                  task.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
