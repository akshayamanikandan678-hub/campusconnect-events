import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { AutomatedScheduleResult } from '../types.ts';
import { 
  Cpu, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  X, 
  Loader2,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

export const AutoSchedulerModal: React.FC = () => {
  const { 
    project, 
    isSchedulerOpen, 
    setIsSchedulerOpen, 
    runAutoSchedule, 
    applyScheduleResult 
  } = useProject();

  const [levelResources, setLevelResources] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<AutomatedScheduleResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  
  // AI optimizer state
  const [aiReport, setAiReport] = useState<{
    executiveSummary?: string;
    criticalPathRisks?: string[];
    workloadBalancingTips?: string[];
    recommendedBufferDays?: number;
    aiPowered?: boolean;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Compute schedule preview when modal opens or toggle changes
  useEffect(() => {
    if (isSchedulerOpen) {
      setIsLoading(true);
      runAutoSchedule(levelResources, false)
        .then(res => {
          setScheduleResult(res);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isSchedulerOpen, levelResources]);

  if (!isSchedulerOpen) return null;

  const handleApply = async () => {
    if (!scheduleResult) return;
    setIsApplying(true);
    applyScheduleResult(scheduleResult);
    setTimeout(() => {
      setIsApplying(false);
      setIsSchedulerOpen(false);
    }, 400);
  };

  const handleAiOptimize = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/ai-optimize`, {
        method: 'POST'
      });
      const data = await res.json();
      setAiReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const isDeadlineMet = scheduleResult 
    ? scheduleResult.projectEndDate <= project.targetDeadline 
    : true;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Automated Task Scheduling Engine
              </h2>
              <p className="text-xs text-slate-500">
                Constraint-based Critical Path Method (CPM) & Resource Leveling
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSchedulerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Computing topological order, float, and critical paths...</p>
            </div>
          ) : scheduleResult ? (
            <>
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border ${
                  isDeadlineMet ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                }`}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Projected Completion
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                    {scheduleResult.projectEndDate}
                  </div>
                  <div className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                    isDeadlineMet ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {isDeadlineMet ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Within target ({project.targetDeadline})</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Past target deadline ({project.targetDeadline})</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Critical Path (CPM)
                  </div>
                  <div className="text-lg font-bold text-amber-900 mt-1 flex items-center gap-1.5 font-mono">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>{scheduleResult.criticalPath.length} Tasks</span>
                  </div>
                  <div className="text-xs text-amber-700 mt-1">
                    Zero slack tasks determining end date
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Proposed Adjustments
                  </div>
                  <div className="text-lg font-bold text-blue-900 mt-1 font-mono">
                    {scheduleResult.adjustments.length}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Tasks aligned to dependencies
                  </div>
                </div>
              </div>

              {/* Resource Leveling Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="resourceLevel"
                    checked={levelResources}
                    onChange={(e) => setLevelResources(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="resourceLevel" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Enable Workload Balancing & Resource Leveling
                  </label>
                </div>
                <span className="text-[11px] text-slate-500">
                  Shifts tasks to avoid exceeding daily capacity limits
                </span>
              </div>

              {/* Critical Path Tasks List */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Critical Path Sequence (Zero Float)</span>
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {scheduleResult.criticalPath.map((id, index) => {
                    const task = project.tasks.find(t => t.id === id);
                    if (!task) return null;
                    return (
                      <div key={id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-semibold text-slate-800">{task.title}</span>
                            <span className="text-slate-400 text-[11px] ml-2">({task.category})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 font-mono text-slate-600 text-[11px]">
                          <span>{task.startDate} → {task.dueDate}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{task.estimatedHours}h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Proposed Adjustments Table */}
              {scheduleResult.adjustments.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                    Proposed Date Shifts ({scheduleResult.adjustments.length})
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-52 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="p-2.5">Task</th>
                          <th className="p-2.5">Original Dates</th>
                          <th className="p-2.5">Optimized Dates</th>
                          <th className="p-2.5">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {scheduleResult.adjustments.map(adj => (
                          <tr key={adj.taskId} className="hover:bg-slate-50">
                            <td className="p-2.5 font-sans font-semibold text-slate-800 max-w-[180px] truncate">
                              {adj.taskTitle}
                            </td>
                            <td className="p-2.5 text-slate-500 line-through">
                              {adj.oldStart} → {adj.oldDue}
                            </td>
                            <td className="p-2.5 font-bold text-blue-700">
                              {adj.newStart} → {adj.newDue}
                            </td>
                            <td className="p-2.5 font-sans text-slate-500 text-[10px]">
                              {adj.explanation}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* AI Schedule Optimizer Section */}
              <div className="border border-blue-100 rounded-2xl p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">
                      AI Schedule Optimizer & Risk Assessment
                    </h3>
                  </div>
                  <button
                    onClick={handleAiOptimize}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-blue-200" />
                        <span>Analyze Schedule with Gemini</span>
                      </>
                    )}
                  </button>
                </div>

                {aiReport ? (
                  <div className="mt-3 space-y-2.5 text-xs">
                    <p className="text-slate-700 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-blue-100">
                      {aiReport.executiveSummary}
                    </p>
                    {aiReport.criticalPathRisks && aiReport.criticalPathRisks.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-600 uppercase">Critical Risks:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1 text-[11px]">
                          {aiReport.criticalPathRisks.map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Click to analyze CampusConnect project dependencies, potential MC stage bottlenecks, and resource risks with Gemini.
                  </p>
                )}
              </div>
            </>
          ) : null}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => setIsSchedulerOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={isApplying || isLoading}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying & Broadcasting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Apply Automated Schedule ({scheduleResult?.adjustments.length || 0} Adjustments)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
