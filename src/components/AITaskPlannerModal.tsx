import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { Task } from '../types.ts';
import { 
  Sparkles, 
  X, 
  Loader2, 
  Plus, 
  CheckCircle2, 
  Layers, 
  Clock, 
  ArrowRight,
  Lightbulb
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    title: 'Stage Teleprompter & Speech Cue Integration',
    desc: 'Voice recognition, script auto-scroll, and hands-free foot pedal or voice cue trigger for the MC.',
  },
  {
    title: 'Auditorium QR Scanner Stations & Volunteer Roles',
    desc: 'Door scanner stations, offline badge verification, and volunteer coordinator shifts.',
  },
  {
    title: 'Audience Live Sentiment & Emoji Reaction HUD',
    desc: 'Seat-level QR code entry, WebSocket real-time reaction aggregation, and MC feedback monitor.',
  },
  {
    title: 'Campus Fest Opening Ceremony Rehearsal & Dry Run',
    desc: 'Audio/lighting check, chief guest introduction scripts, and crisis contingency runs.',
  }
];

export const AITaskPlannerModal: React.FC = () => {
  const { project, isAIPlannerOpen, setIsAIPlannerOpen, addTask } = useProject();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  if (!isAIPlannerOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) return;

    setIsLoading(true);
    setGeneratedTasks([]);
    setSelectedTasks(new Set());

    try {
      const res = await fetch(`/api/projects/${project.id}/ai-breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse })
      });
      const data = await res.json();
      if (data && data.tasks) {
        setGeneratedTasks(data.tasks);
        // Pre-select all
        setSelectedTasks(new Set(data.tasks.map((_: any, i: number) => i)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    const tasksToImport = generatedTasks.filter((_, i) => selectedTasks.has(i));
    
    // Map tasks and generate new IDs
    const createdTaskIds: string[] = [];
    tasksToImport.forEach((t) => {
      // Find assignee by name match or first member
      const member = project.members.find(m => 
        t.assigneeName && m.name.toLowerCase().includes(t.assigneeName.toLowerCase())
      ) || project.members[0];

      // Add task
      addTask({
        title: t.title,
        description: t.description || '',
        category: t.category || project.categories[0],
        assigneeId: member.id,
        estimatedHours: t.estimatedHours || 12,
        priority: t.priority || 'medium',
        isMilestone: !!t.isMilestone,
        tags: t.tags || ['AI-Plan'],
        dependencies: [] // Auto-scheduler will link or can be manually set
      });
    });

    setIsAIPlannerOpen(false);
  };

  const toggleTaskSelection = (index: number) => {
    const next = new Set(selectedTasks);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedTasks(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AI Task & Schedule Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Powered by Gemini 3.8 Flash • Generates structured workstreams with effort estimations
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAIPlannerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Input Form */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Describe a feature, milestone, or event workstream:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g., Implement live audience Q&A with profanity filter and MC ear monitor"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-blue-200" />
                )}
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Quick Suggested Prompts for CampusConnect */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>CampusConnect Quick Templates:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(item.title);
                    handleGenerate(item.title + ': ' + item.desc);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-200 text-left transition text-xs cursor-pointer"
                >
                  <p className="font-bold text-slate-800 leading-snug">{item.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generated Tasks List */}
          {generatedTasks.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Generated Work Breakdown ({generatedTasks.length} tasks)
                </h3>
                <span className="text-[11px] text-slate-500">
                  {selectedTasks.size} selected for import
                </span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {generatedTasks.map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleTaskSelection(idx)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-xs flex items-start gap-3 ${
                      selectedTasks.has(idx) 
                        ? 'border-blue-300 bg-blue-50/40 ring-1 ring-blue-200' 
                        : 'border-slate-200 bg-white opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(idx)}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-slate-900">{t.title}</h4>
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                          {t.estimatedHours}h
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {t.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-slate-500">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 font-medium">
                          {t.category}
                        </span>
                        {t.assigneeName && (
                          <span className="text-blue-600 font-medium">
                            Suggested: {t.assigneeName}
                          </span>
                        )}
                        <span className="uppercase font-semibold text-amber-700">
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => setIsAIPlannerOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleImport}
            disabled={selectedTasks.size === 0}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Import & Schedule ({selectedTasks.size})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
