import React from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { Task, TaskStatus } from '../types.ts';
import { 
  Clock, 
  GitFork, 
  Flame, 
  MessageSquare, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  AlertCircle,
  Plus
} from 'lucide-react';

interface KanbanBoardProps {
  onOpenNewTask: (defaultStatus?: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; badgeBg: string; borderTop: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'text-slate-600', badgeBg: 'bg-slate-100', borderTop: 'border-t-slate-400' },
  { id: 'todo', title: 'To Do', color: 'text-blue-600', badgeBg: 'bg-blue-50 text-blue-700', borderTop: 'border-t-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700', borderTop: 'border-t-amber-500' },
  { id: 'review', title: 'Review / Stage QA', color: 'text-purple-600', badgeBg: 'bg-purple-50 text-purple-700', borderTop: 'border-t-purple-500' },
  { id: 'done', title: 'Done', color: 'text-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-700', borderTop: 'border-t-emerald-500' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOpenNewTask }) => {
  const { 
    project, 
    updateTask, 
    setSelectedTaskId, 
    activeUsers, 
    searchQuery, 
    selectedCategory, 
    selectedPriority 
  } = useProject();

  // Filter tasks
  const filteredTasks = project.tasks.filter(task => {
    if (selectedCategory !== 'All' && task.category !== selectedCategory) return false;
    if (selectedPriority !== 'All' && task.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      const matchTags = task.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const getAssignee = (id?: string) => project.members.find(m => m.id === id);

  const moveTaskStatus = (task: Task, direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    const statusOrder: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    const currentIdx = statusOrder.indexOf(task.status);
    const targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (targetIdx >= 0 && targetIdx < statusOrder.length) {
      const nextStatus = statusOrder[targetIdx];
      const nextProgress = nextStatus === 'done' ? 100 : (task.progress === 100 ? 50 : task.progress);
      updateTask({
        ...task,
        status: nextStatus,
        progress: nextProgress
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4.5 items-start">
        {COLUMNS.map((column) => {
          const colTasks = filteredTasks.filter(t => t.status === column.id);

          return (
            <div 
              key={column.id} 
              className={`bg-slate-100/70 border border-slate-200/80 rounded-2xl flex flex-col max-h-[calc(100vh-210px)] border-t-4 ${column.borderTop} shadow-2xs`}
            >
              {/* Column Header */}
              <div className="p-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                    {column.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${column.badgeBg}`}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onOpenNewTask(column.id)}
                  className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  title={`Add task to ${column.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="p-2.5 pt-1 space-y-2.5 overflow-y-auto flex-1">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No tasks in {column.title.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignee = getAssignee(task.assigneeId);
                    // Check if another user is actively looking at this task
                    const viewingUsers = activeUsers.filter(u => u.viewingTaskId === task.id);

                    // Check if dependencies are unfulfilled
                    const unmetDependencies = task.dependencies.filter(depId => {
                      const depTask = project.tasks.find(t => t.id === depId);
                      return depTask && depTask.status !== 'done';
                    });

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`group bg-white rounded-xl p-3.5 border transition cursor-pointer shadow-2xs hover:shadow-md hover:border-blue-300 relative ${
                          task.isCriticalPath 
                            ? 'border-amber-300 ring-1 ring-amber-200/60' 
                            : 'border-slate-200/80'
                        }`}
                      >
                        {/* Live Collaborator Presence Indicator */}
                        {viewingUsers.length > 0 && (
                          <div className="absolute -top-2 -right-2 flex -space-x-1 z-10">
                            {viewingUsers.map(vu => (
                              <img
                                key={vu.userId}
                                src={vu.avatar}
                                alt={vu.userName}
                                title={`${vu.userName} is viewing this task`}
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full border-2 border-white ring-2 ring-emerald-400"
                              />
                            ))}
                          </div>
                        )}

                        {/* Badges row: Priority, Category, CPM Critical Path */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            task.priority === 'urgent' 
                              ? 'bg-rose-100 text-rose-700 font-extrabold' 
                              : task.priority === 'high' 
                              ? 'bg-orange-100 text-orange-800' 
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {task.priority}
                          </span>

                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[120px]">
                            {task.category}
                          </span>

                          {task.isCriticalPath && (
                            <span 
                              title="Critical Path: Any delay in this task pushes back the entire project deadline!"
                              className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300"
                            >
                              <Flame className="w-2.5 h-2.5 text-amber-600" />
                              CPM
                            </span>
                          )}

                          {task.isMilestone && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800">
                              Milestone
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition mb-1.5">
                          {task.title}
                        </h4>

                        {/* Description snippet */}
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                          {task.description}
                        </p>

                        {/* Unmet dependencies warning */}
                        {unmetDependencies.length > 0 && task.status !== 'done' && (
                          <div className="mb-2.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200/80 text-[10px] text-amber-800 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">Waiting on {unmetDependencies.length} predecessor task(s)</span>
                          </div>
                        )}

                        {/* Progress Bar if in progress */}
                        {task.status === 'in_progress' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div 
                                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer info: Assignee, Effort, Dates & Quick Status buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {assignee ? (
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                title={`${assignee.name} (${assignee.role})`}
                                referrerPolicy="no-referrer"
                                className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-bold">
                                ?
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{task.estimatedHours}h</span>
                            </div>

                            {task.dependencies.length > 0 && (
                              <div 
                                title={`Depends on ${task.dependencies.length} tasks`}
                                className="flex items-center gap-0.5 text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-mono"
                              >
                                <GitFork className="w-2.5 h-2.5" />
                                <span>{task.dependencies.length}</span>
                              </div>
                            )}

                            {task.comments && task.comments.length > 0 && (
                              <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>{task.comments.length}</span>
                              </div>
                            )}
                          </div>

                          {/* Move arrows */}
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                            {column.id !== 'backlog' && (
                              <button
                                onClick={(e) => moveTaskStatus(task, 'prev', e)}
                                title="Move to previous column"
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {column.id !== 'done' && (
                              <button
                                onClick={(e) => moveTaskStatus(task, 'next', e)}
                                title="Advance to next column"
                                className="p-1 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-800 cursor-pointer font-bold"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
