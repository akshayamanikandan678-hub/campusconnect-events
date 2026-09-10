export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assigneeId?: string;
  estimatedHours: number;
  actualHours?: number;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  progress: number;  // 0 - 100
  dependencies: string[]; // IDs of tasks that must be done before this can start
  isMilestone?: boolean;
  isCriticalPath?: boolean;
  slackDays?: number;
  comments: TaskComment[];
  tags: string[];
  order: number;
  scheduledBy?: 'manual' | 'auto_cpm' | 'ai_optimized';
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  dailyCapacityHours: number;
  skills: string[];
  isOnline?: boolean;
  activeTaskId?: string;
}

export interface ProjectSettings {
  autoScheduleOnDependencyChange: boolean;
  workDaysPerWeek: number;
  hoursPerDay: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  startDate: string;
  targetDeadline: string;
  categories: string[];
  members: TeamMember[];
  tasks: Task[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  text: string;
  timestamp: string;
  taskId?: string;
}

export interface ScheduleBottleneck {
  taskId: string;
  taskTitle: string;
  reason: string;
  severity: 'warning' | 'critical';
}

export interface ResourceOverallocation {
  memberId: string;
  memberName: string;
  capacityHoursPerDay: number;
  peakDailyHours: number;
  conflictingTaskIds: string[];
}

export interface ScheduleAdjustment {
  taskId: string;
  taskTitle: string;
  oldStart: string;
  newStart: string;
  oldDue: string;
  newDue: string;
  explanation: string;
}

export interface AutomatedScheduleResult {
  projectEndDate: string;
  criticalPath: string[]; // Task IDs
  bottlenecks: ScheduleBottleneck[];
  overallocations: ResourceOverallocation[];
  adjustments: ScheduleAdjustment[];
  updatedTasks: Task[];
  summary: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  userColor: string;
  avatar: string;
  activeView?: 'board' | 'gantt' | 'workload' | 'schedule';
  viewingTaskId?: string;
  cursorX?: number;
  cursorY?: number;
  lastPing: number;
}

export type WebSocketPayload =
  | { type: 'presence:state'; users: UserPresence[] }
  | { type: 'presence:update'; user: UserPresence }
  | { type: 'presence:cursor'; userId: string; x: number; y: number }
  | { type: 'task:upsert'; task: Task; broadcastBy: string }
  | { type: 'task:delete'; taskId: string; broadcastBy: string }
  | { type: 'schedule:apply'; tasks: Task[]; broadcastBy: string }
  | { type: 'chat:message'; message: ChatMessage }
  | { type: 'project:update'; project: Project; broadcastBy: string };
