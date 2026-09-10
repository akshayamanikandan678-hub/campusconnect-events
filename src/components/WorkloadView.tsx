import React from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Flame
} from 'lucide-react';

export const WorkloadView: React.FC = () => {
  const { project, setSelectedTaskId, runAutoSchedule, applyScheduleResult } = useProject();

  const handleLevelWorkload = async () => {
    const result = await runAutoSchedule(true, true);
    applyScheduleResult(result);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Team Workload & Capacity Utilization</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Monitors individual bandwidth across CampusConnect workstreams. Automated resource leveling automatically shifts non-critical tasks to prevent burnout and resolve scheduling bottlenecks.
          </p>
        </div>

        <button
          onClick={handleLevelWorkload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>Auto-Level Workload</span>
        </button>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {project.members.map(member => {
          const assignedTasks = project.tasks.filter(t => t.assigneeId === member.id);
          const activeTasks = assignedTasks.filter(t => t.status !== 'done');
          const totalEstimatedHours = assignedTasks.reduce((acc, t) => acc + t.estimatedHours, 0);
          const activeHours = activeTasks.reduce((acc, t) => acc + t.estimatedHours, 0);

          // Standard 4-week window benchmark (e.g. member.dailyCapacityHours * 20 days)
          const totalCapacityHours = member.dailyCapacityHours * 20;
          const utilizationPercent = Math.min(150, Math.round((activeHours / totalCapacityHours) * 100));
          const isOverallocated = utilizationPercent > 100;

          return (
            <div
              key={member.id}
              className={`bg-white rounded-2xl border p-5 transition shadow-2xs flex flex-col justify-between ${
                isOverallocated ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Member Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>

                  {isOverallocated ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      <ShieldAlert className="w-3 h-3" />
                      Overallocated
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" />
                      Optimal
                    </span>
                  )}
                </div>

                {/* Capacity Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">Allocated Hours</span>
                    <span className="font-mono font-bold text-slate-900">
                      {activeHours}h <span className="text-slate-400 font-normal">/ {totalCapacityHours}h max</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverallocated
                          ? 'bg-rose-500'
                          : utilizationPercent > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>{member.dailyCapacityHours}h/day standard</span>
                    <span className={`font-semibold ${isOverallocated ? 'text-rose-600' : 'text-slate-700'}`}>
                      {utilizationPercent}% capacity
                    </span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Skills & Domain</p>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map(skill => (
                      <span key={skill} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Active Tasks list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Assigned Tasks ({activeTasks.length})
                    </p>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {activeTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No active tasks assigned</p>
                    ) : (
                      activeTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-100 flex items-center justify-between gap-2 text-xs cursor-pointer transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {task.isCriticalPath && (
                                <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                              )}
                              <span className="font-semibold text-slate-800 truncate block">
                                {task.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">{task.startDate} to {task.dueDate}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            {task.estimatedHours}h
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{assignedTasks.filter(t => t.status === 'done').length} completed</span>
                <span className="font-medium text-slate-700">{totalEstimatedHours}h total effort</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
