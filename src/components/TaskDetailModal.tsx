import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { Task, TaskPriority, TaskStatus, TaskComment } from '../types.ts';
import { 
  X, 
  Trash2, 
  Clock, 
  Flame, 
  GitFork, 
  Calendar, 
  User, 
  CheckCircle2, 
  Send, 
  AlertCircle,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const TaskDetailModal: React.FC = () => {
  const { 
    project, 
    currentUser, 
    selectedTaskId, 
    setSelectedTaskId, 
    updateTask, 
    deleteTask,
    sendChatMessage
  } = useProject();

  const task = project.tasks.find(t => t.id === selectedTaskId);
  const [formData, setFormData] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData(JSON.parse(JSON.stringify(task)));
    } else {
      setFormData(null);
    }
  }, [task]);

  if (!task || !formData) return null;

  const handleChange = (field: keyof Task, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (formData) {
      updateTask(formData);
      setSelectedTaskId(null);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: TaskComment = {
      id: 'c-' + Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: newComment.trim(),
      timestamp: new Date().toISOString()
    };

    const nextComments = [...(formData.comments || []), comment];
    const updated = { ...formData, comments: nextComments };
    setFormData(updated);
    updateTask(updated);
    sendChatMessage(`💬 Added a comment to "${task.title}": ${newComment.trim()}`, task.id);
    setNewComment('');
  };

  const toggleDependency = (depId: string) => {
    if (depId === task.id) return; // Prevent self-dependency
    const currentDeps = formData.dependencies || [];
    const nextDeps = currentDeps.includes(depId)
      ? currentDeps.filter(id => id !== depId)
      : [...currentDeps, depId];
    handleChange('dependencies', nextDeps);
  };

  const otherTasks = project.tasks.filter(t => t.id !== task.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
              {task.id}
            </span>
            {task.isCriticalPath && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                <Flame className="w-3 h-3 text-amber-600" />
                Critical Path (0d Slack)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Description & Acceptance Criteria
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* 4-column Meta Grid: Status, Priority, Category, Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const s = e.target.value as TaskStatus;
                  handleChange('status', s);
                  if (s === 'done') handleChange('progress', 100);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review / QA</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
              >
                {project.categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Assignee
              </label>
              <select
                value={formData.assigneeId || ''}
                onChange={(e) => handleChange('assigneeId', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
              >
                {project.members.map(m => (
                  <option key={m.id} value={m.id}>{m.name.split(' ')[0]} ({m.role.split(' ')[0]})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Effort row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.estimatedHours}
                onChange={(e) => handleChange('estimatedHours', parseInt(e.target.value) || 8)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
              />
            </div>
          </div>

          {/* Progress Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-700">
              <span>Completion Progress</span>
              <span className="font-mono text-blue-600">{formData.progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress}
              onChange={(e) => {
                const p = parseInt(e.target.value);
                handleChange('progress', p);
                if (p === 100 && formData.status !== 'done') {
                  handleChange('status', 'done');
                }
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Dependencies Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Prerequisites / Dependencies (Finish-to-Start)</span>
              <span className="text-[10px] text-indigo-600 lowercase font-medium">
                {formData.dependencies?.length || 0} required before starting
              </span>
            </label>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-36 overflow-y-auto space-y-1.5">
              {otherTasks.map(t => {
                const isSelected = formData.dependencies?.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleDependency(t.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-100 text-blue-900 font-semibold border border-blue-200' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'
                    }`}
                  >
                    <div className="truncate flex-1 mr-2">
                      <span>{t.title}</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">({t.category})</span>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">+{t.estimatedHours}h</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Collaboration Comments */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Real-time Task Discussion ({formData.comments?.length || 0})</span>
            </h4>

            {/* Comments List */}
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
              {(!formData.comments || formData.comments.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-2">No comments yet. Start the discussion below.</p>
              ) : (
                formData.comments.map(c => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-start gap-2.5">
                    <img
                      src={c.authorAvatar}
                      alt={c.authorName}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-white"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800">{c.authorName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Comment as ${currentUser.name.split(' ')[0]}...`}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Post</span>
              </button>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => setSelectedTaskId(null)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Broadcast Changes</span>
          </button>
        </div>

      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Task?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to delete <strong>"{task.title}"</strong>? Dependent tasks will have this dependency unlinked.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTask(task.id);
                  setSelectedTaskId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
