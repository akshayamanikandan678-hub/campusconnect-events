import React from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { 
  LayoutGrid, 
  GanttChartSquare, 
  Users2, 
  Activity, 
  Search, 
  Plus, 
  Filter, 
  Flame,
  Clock,
  Sparkles
} from 'lucide-react';

interface NavigationTabsProps {
  onOpenNewTask: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ onOpenNewTask }) => {
  const { 
    project, 
    activeTab, 
    setActiveTab, 
    searchQuery, 
    setSearchQuery,
    selectedCategory, 
    setSelectedCategory,
    selectedPriority, 
    setSelectedPriority,
    criticalPathCount
  } = useProject();

  const urgentCount = project.tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        
        {/* Row 1: Primary View Tabs & New Task Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* View Mode Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'board'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>Kanban Board</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700 font-mono">
                {project.tasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gantt')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'gantt'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
              }`}
            >
              <GanttChartSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gantt Timeline</span>
              {criticalPathCount > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-medium">
                  <Flame className="w-2.5 h-2.5 text-amber-600" />
                  {criticalPathCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('workload')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'workload'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
              }`}
            >
              <Users2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Workload Matrix</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700 font-mono">
                {project.members.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'schedule'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-rose-600" />
              <span>Schedule Health</span>
            </button>
          </nav>

          {/* Quick Add Task Button */}
          <button
            onClick={onOpenNewTask}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Row 2: Search, Filters, and Quick Metric Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
          
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative min-w-[180px] max-w-xs flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks, tags, or IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/60 focus:bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 pl-2 pr-6 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {project.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="py-1.5 pl-2 pr-6 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Quick Status Tags */}
          <div className="flex items-center gap-2 text-xs">
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Clock className="w-3 h-3 text-rose-500" />
                {urgentCount} Urgent
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
              Auto-Scheduling: <span className="text-emerald-700 font-semibold">Active (CPM)</span>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
