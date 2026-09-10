import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext.tsx';
import { INITIAL_TEAM_MEMBERS } from '../defaultData.ts';
import { 
  Calendar, 
  Sparkles, 
  Cpu, 
  MessageSquare, 
  CheckCircle2, 
  Users, 
  Wifi, 
  WifiOff, 
  RotateCcw,
  Clock,
  ChevronDown
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    project, 
    currentUser, 
    setCurrentUser, 
    activeUsers, 
    connectionStatus, 
    chatMessages,
    setIsSchedulerOpen, 
    setIsAIPlannerOpen, 
    setIsChatOpen,
    resetToDefault,
    criticalPathCount
  } = useProject();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const completedCount = project.tasks.filter(t => t.status === 'done').length;
  const progressPercent = project.tasks.length > 0 
    ? Math.round((completedCount / project.tasks.length) * 100) 
    : 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top tier: Project branding, live status, persona switch, action buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Project title & deadline badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            SP
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 truncate tracking-tight">
                {project.title}
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                v2.4 Active
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Target: <strong className="text-slate-700 font-medium">{project.targetDeadline}</strong>
              </span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{completedCount}/{project.tasks.length} tasks completed ({progressPercent}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live collaboration, Persona Switcher, Auto-Schedule, AI Planner, Chat */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">

          {/* Real-time connection badge */}
          <div 
            title={connectionStatus === 'connected' ? 'WebSocket Live Synchronized' : 'Reconnecting...'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors bg-slate-50 border-slate-200 text-slate-600"
          >
            {connectionStatus === 'connected' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Live Sync</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-500" />
                <span className="text-[11px] text-amber-600">Connecting</span>
              </>
            )}
          </div>

          {/* Active Presence Avatars */}
          <div className="hidden lg:flex items-center -space-x-1.5 overflow-hidden pl-1" title="Collaborators active in this session">
            {activeUsers.slice(0, 4).map((user) => (
              <div 
                key={user.userId} 
                className="relative group cursor-pointer"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={user.userName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-xs"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
                {/* Tooltip */}
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 whitespace-nowrap bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-lg">
                  {user.userName} ({user.activeView || 'viewing'})
                </div>
              </div>
            ))}
            {activeUsers.length === 0 && (
              <div className="relative group">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border-2 border-white object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
              </div>
            )}
          </div>

          {/* Persona Switcher (Allows testing multi-user collaboration easily) */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs text-slate-700 transition shadow-2xs font-medium cursor-pointer"
              title="Switch user identity to test collaboration"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="hidden sm:inline max-w-[110px] truncate">{currentUser.name.split(' ')[0]}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">Switch</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Persona</p>
                  <p className="text-xs text-slate-500">Test real-time collaboration from different roles</p>
                </div>
                {INITIAL_TEAM_MEMBERS.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setCurrentUser(member);
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-xs hover:bg-slate-50 transition ${
                      currentUser.id === member.id ? 'bg-blue-50/70 text-blue-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{member.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{member.role}</div>
                    </div>
                    {currentUser.id === member.id && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Automated Scheduling Button */}
          <button
            onClick={() => setIsSchedulerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition shadow-2xs cursor-pointer"
            title="Open Automated Task Scheduling Engine (CPM & Resource Leveling)"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>Auto-Schedule</span>
            {criticalPathCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                {criticalPathCount} CPM
              </span>
            )}
          </button>

          {/* AI Task Planner Button */}
          <button
            onClick={() => setIsAIPlannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
            title="Generate task breakdowns using Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span className="hidden sm:inline">AI Planner</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Real-time Team Chat Drawer Toggle */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="relative flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs cursor-pointer"
            title="Open Project Live Chat & Activity Stream"
          >
            <MessageSquare className="w-4 h-4 text-slate-600" />
            {chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {chatMessages.length > 9 ? '9+' : chatMessages.length}
              </span>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="p-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Reset to initial CampusConnect sample project"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">Reset Project Data?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              This will restore all default tasks and schedules for <strong>CampusConnect</strong> (Event Operations, QR Check-ins, MC Script Assistant, Live Sentiment, and Stage Integration).
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDefault();
                  setIsResetConfirmOpen(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
