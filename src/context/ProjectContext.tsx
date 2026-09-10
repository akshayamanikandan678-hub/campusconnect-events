import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Project, Task, TeamMember, ChatMessage, UserPresence, AutomatedScheduleResult, WebSocketPayload } from '../types.ts';
import { INITIAL_PROJECT, INITIAL_TEAM_MEMBERS } from '../defaultData.ts';
import { computeAutomatedSchedule } from '../utils/scheduler.ts';

export interface ActivityLog {
  id: string;
  user: string;
  avatar?: string;
  color?: string;
  action: string;
  timestamp: string;
}

interface ProjectContextType {
  project: Project;
  currentUser: TeamMember;
  setCurrentUser: (member: TeamMember) => void;
  activeUsers: UserPresence[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  chatMessages: ChatMessage[];
  activityLogs: ActivityLog[];
  sendChatMessage: (text: string, taskId?: string) => void;
  addTask: (taskData: Partial<Task>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  runAutoSchedule: (levelResources?: boolean, apply?: boolean) => Promise<AutomatedScheduleResult>;
  applyScheduleResult: (result: AutomatedScheduleResult) => void;
  resetToDefault: () => Promise<void>;
  isSchedulerOpen: boolean;
  setIsSchedulerOpen: (open: boolean) => void;
  isAIPlannerOpen: boolean;
  setIsAIPlannerOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  activeTab: 'board' | 'gantt' | 'workload' | 'schedule';
  setActiveTab: (tab: 'board' | 'gantt' | 'workload' | 'schedule') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedPriority: string;
  setSelectedPriority: (p: string) => void;
  criticalPathCount: number;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [currentUser, setCurrentUser] = useState<TeamMember>(INITIAL_TEAM_MEMBERS[0]);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    {
      id: 'log-1',
      user: 'Devon Vance',
      action: 'Completed Digital RSVP & Role-based Access Schema',
      timestamp: new Date(Date.now() - 3600000 * 3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'log-2',
      user: 'Akshaya M. (Lead)',
      action: 'Updated Stage Run-of-Show progress to 65%',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isAIPlannerOpen, setIsAIPlannerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'gantt' | 'workload' | 'schedule'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Fetch initial project data from server
  useEffect(() => {
    fetch('/api/projects/' + INITIAL_PROJECT.id)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          // Pre-calculate critical path flags
          const calculated = computeAutomatedSchedule(
            data.tasks,
            data.members,
            data.startDate,
            data.targetDeadline,
            data.settings?.hoursPerDay || 8
          );
          setProject({
            ...data,
            tasks: calculated.updatedTasks
          });
        }
      })
      .catch(err => {
        console.warn('Could not fetch server project state, using local initial data:', err);
      });
  }, []);

  // Real-time WebSocket connection setup
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      setConnectionStatus('connecting');
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        // Announce presence
        const presence: UserPresence = {
          userId: currentUser.id,
          userName: currentUser.name,
          userColor: currentUser.color,
          avatar: currentUser.avatar,
          activeView: activeTab,
          viewingTaskId: selectedTaskId || undefined,
          lastPing: Date.now()
        };
        ws.send(JSON.stringify({
          type: 'join',
          projectId: project.id,
          user: presence
        }));
      };

      ws.onmessage = (event) => {
        try {
          const payload: WebSocketPayload = JSON.parse(event.data);
          
          if (payload.type === 'presence:state') {
            setActiveUsers(payload.users);
          } else if (payload.type === 'presence:update') {
            setActiveUsers(prev => {
              const existingIdx = prev.findIndex(u => u.userId === payload.user.userId);
              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = payload.user;
                return next;
              }
              return [...prev, payload.user];
            });
          } else if (payload.type === 'task:upsert') {
            setProject(prev => {
              const idx = prev.tasks.findIndex(t => t.id === payload.task.id);
              let nextTasks: Task[];
              if (idx >= 0) {
                nextTasks = [...prev.tasks];
                nextTasks[idx] = payload.task;
              } else {
                nextTasks = [...prev.tasks, payload.task];
              }
              return { ...prev, tasks: nextTasks };
            });

            setActivityLogs(prev => [
              {
                id: 'log-' + Date.now(),
                user: payload.broadcastBy || 'Collaborator',
                action: `Updated task "${payload.task.title}"`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              },
              ...prev.slice(0, 40)
            ]);
          } else if (payload.type === 'task:delete') {
            setProject(prev => ({
              ...prev,
              tasks: prev.tasks.filter(t => t.id !== payload.taskId)
            }));
            setActivityLogs(prev => [
              {
                id: 'log-' + Date.now(),
                user: payload.broadcastBy || 'Collaborator',
                action: `Deleted a task`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              },
              ...prev.slice(0, 40)
            ]);
          } else if (payload.type === 'schedule:apply') {
            setProject(prev => ({
              ...prev,
              tasks: payload.tasks
            }));
            setActivityLogs(prev => [
              {
                id: 'log-' + Date.now(),
                user: payload.broadcastBy || 'System',
                action: `Applied automated schedule recalculation across all tasks`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              },
              ...prev.slice(0, 40)
            ]);
          } else if (payload.type === 'chat:message') {
            setChatMessages(prev => {
              if (prev.some(m => m.id === payload.message.id)) return prev;
              return [...prev, payload.message];
            });
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = () => {
        setConnectionStatus('disconnected');
      };
    } catch (err) {
      console.warn('WebSocket connection failed:', err);
      setConnectionStatus('disconnected');
    }
  }, [currentUser, project.id, activeTab, selectedTaskId]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Update presence when user or view changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'presence:update',
        user: {
          userId: currentUser.id,
          userName: currentUser.name,
          userColor: currentUser.color,
          avatar: currentUser.avatar,
          activeView: activeTab,
          viewingTaskId: selectedTaskId || undefined,
          lastPing: Date.now()
        }
      }));
    }
  }, [currentUser, activeTab, selectedTaskId]);

  const sendChatMessage = (text: string, taskId?: string) => {
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderColor: currentUser.color,
      text,
      timestamp: new Date().toISOString(),
      taskId
    };

    setChatMessages(prev => [...prev, newMsg]);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat:message',
        message: newMsg
      }));
    }
  };

  const addTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: 'task-' + Date.now(),
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      category: taskData.category || project.categories[0] || 'General',
      assigneeId: taskData.assigneeId || currentUser.id,
      estimatedHours: taskData.estimatedHours || 8,
      startDate: taskData.startDate || new Date().toISOString().split('T')[0],
      dueDate: taskData.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      progress: taskData.progress || 0,
      dependencies: taskData.dependencies || [],
      isMilestone: !!taskData.isMilestone,
      comments: [],
      tags: taskData.tags || [],
      order: project.tasks.length + 1,
      scheduledBy: 'manual'
    };

    const nextTasks = [...project.tasks, newTask];
    // Recompute schedule to update critical path flags
    const calculated = computeAutomatedSchedule(
      nextTasks,
      project.members,
      project.startDate,
      project.targetDeadline,
      project.settings.hoursPerDay
    );

    const updatedProject = { ...project, tasks: calculated.updatedTasks };
    setProject(updatedProject);

    // Save to server
    fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: updatedProject.tasks })
    }).catch(console.error);

    // Broadcast via WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'task:upsert',
        task: newTask
      }));
    }

    setActivityLogs(prev => [
      {
        id: 'log-' + Date.now(),
        user: currentUser.name,
        action: `Created task "${newTask.title}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);
  };

  const updateTask = (updatedTask: Task) => {
    const idx = project.tasks.findIndex(t => t.id === updatedTask.id);
    if (idx === -1) return;

    let nextTasks = [...project.tasks];
    nextTasks[idx] = updatedTask;

    // Check if auto-scheduling on dependency change is enabled
    if (project.settings.autoScheduleOnDependencyChange) {
      const scheduled = computeAutomatedSchedule(
        nextTasks,
        project.members,
        project.startDate,
        project.targetDeadline,
        project.settings.hoursPerDay
      );
      nextTasks = scheduled.updatedTasks;
    }

    const updatedProject = { ...project, tasks: nextTasks };
    setProject(updatedProject);

    // Persist to server
    fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: nextTasks })
    }).catch(console.error);

    // Broadcast
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'task:upsert',
        task: updatedTask
      }));
    }

    setActivityLogs(prev => [
      {
        id: 'log-' + Date.now(),
        user: currentUser.name,
        action: `Updated task "${updatedTask.title}" (${updatedTask.status})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);
  };

  const deleteTask = (taskId: string) => {
    const taskToDelete = project.tasks.find(t => t.id === taskId);
    const nextTasks = project.tasks
      .filter(t => t.id !== taskId)
      .map(t => ({
        ...t,
        dependencies: t.dependencies.filter(depId => depId !== taskId)
      }));

    const calculated = computeAutomatedSchedule(
      nextTasks,
      project.members,
      project.startDate,
      project.targetDeadline,
      project.settings.hoursPerDay
    );

    const updatedProject = { ...project, tasks: calculated.updatedTasks };
    setProject(updatedProject);

    fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: calculated.updatedTasks })
    }).catch(console.error);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'task:delete',
        taskId
      }));
    }

    if (taskToDelete) {
      setActivityLogs(prev => [
        {
          id: 'log-' + Date.now(),
          user: currentUser.name,
          action: `Deleted task "${taskToDelete.title}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);
    }
  };

  const runAutoSchedule = async (levelResources = false, apply = false): Promise<AutomatedScheduleResult> => {
    try {
      const res = await fetch(`/api/projects/${project.id}/auto-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelResources, applyChanges: apply })
      });
      const data: AutomatedScheduleResult = await res.json();
      if (apply && data.updatedTasks) {
        setProject(prev => ({ ...prev, tasks: data.updatedTasks }));
      }
      return data;
    } catch (e) {
      // Local fallback calculation
      const fallbackResult = computeAutomatedSchedule(
        project.tasks,
        project.members,
        project.startDate,
        project.targetDeadline,
        project.settings.hoursPerDay,
        levelResources
      );
      if (apply) {
        setProject(prev => ({ ...prev, tasks: fallbackResult.updatedTasks }));
      }
      return fallbackResult;
    }
  };

  const applyScheduleResult = (result: AutomatedScheduleResult) => {
    setProject(prev => ({
      ...prev,
      tasks: result.updatedTasks
    }));

    fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: result.updatedTasks })
    }).catch(console.error);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'schedule:apply',
        tasks: result.updatedTasks
      }));
    }

    setActivityLogs(prev => [
      {
        id: 'log-' + Date.now(),
        user: currentUser.name,
        action: `Applied automated schedule alignment (${result.adjustments.length} tasks optimized)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);
  };

  const resetToDefault = async () => {
    try {
      const res = await fetch(`/api/projects/${INITIAL_PROJECT.id}/reset`, { method: 'POST' });
      const data = await res.json();
      if (data && data.tasks) {
        setProject(data);
      }
    } catch {
      setProject(JSON.parse(JSON.stringify(INITIAL_PROJECT)));
    }
  };

  const criticalPathCount = project.tasks.filter(t => t.isCriticalPath).length;

  return (
    <ProjectContext.Provider
      value={{
        project,
        currentUser,
        setCurrentUser,
        activeUsers,
        connectionStatus,
        chatMessages,
        activityLogs,
        sendChatMessage,
        addTask,
        updateTask,
        deleteTask,
        runAutoSchedule,
        applyScheduleResult,
        resetToDefault,
        isSchedulerOpen,
        setIsSchedulerOpen,
        isAIPlannerOpen,
        setIsAIPlannerOpen,
        isChatOpen,
        setIsChatOpen,
        selectedTaskId,
        setSelectedTaskId,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedPriority,
        setSelectedPriority,
        criticalPathCount
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
