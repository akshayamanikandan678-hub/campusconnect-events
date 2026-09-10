import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { Task, TaskPriority, TaskStatus } from '../types.ts';
import { X, Plus, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, defaultStatus = 'todo' }) => {
  const { project, currentUser, addTask } = useProject();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(project.categories[0] || 'General');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [estimatedHours, setEstimatedHours] = useState(16);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status,
      assigneeId,
      estimatedHours,
      startDate,
      dueDate,
      dependencies: selectedDependencies,
      tags: [category.split(' ')[0]]
    });

    onClose();
  };

  const toggleDependency = (id: string) => {
    setSelectedDependencies(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <span>Create New Task</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Live Audience Interactive Voting Widget"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Describe deliverables, stage requirements, or tech dependencies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium"
              >
                {project.categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-semibold"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-semibold"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white font-medium"
              >
                {project.members.map(m => (
                  <option key={m.id} value={m.id}>{m.name.split(' ')[0]} ({m.role.split(' ')[0]})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Effort (Hours)</label>
              <input
                type="number"
                min="1"
                max="160"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 8)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Dependencies select */}
          {project.tasks.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dependencies (Must complete before this starts)
              </label>
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 max-h-32 overflow-y-auto space-y-1">
                {project.tasks.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleDependency(t.id)}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer transition ${
                      selectedDependencies.includes(t.id) 
                        ? 'bg-blue-100 text-blue-900 font-semibold' 
                        : 'bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{t.title}</span>
                    {selectedDependencies.includes(t.id) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-xs cursor-pointer"
            >
              Create Task
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
