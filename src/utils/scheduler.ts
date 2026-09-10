import { Task, TeamMember, AutomatedScheduleResult, ScheduleBottleneck, ResourceOverallocation, ScheduleAdjustment } from '../types.ts';
import { addDays, parseISO, format, isWeekend, differenceInCalendarDays } from 'date-fns';

/**
 * Calculates work-day additions, skipping weekends if 5-day week
 */
export function addWorkDays(startDate: Date, days: number, skipWeekends = true): Date {
  let current = new Date(startDate);
  let added = 0;
  
  // If starting on a weekend, advance to Monday
  if (skipWeekends) {
    while (isWeekend(current)) {
      current = addDays(current, 1);
    }
  }

  while (added < days) {
    current = addDays(current, 1);
    if (!skipWeekends || !isWeekend(current)) {
      added++;
    }
  }
  return current;
}

/**
 * Calculates work-day count between two dates
 */
export function getWorkDaySpan(startDate: Date, endDate: Date, skipWeekends = true): number {
  let count = 0;
  let current = new Date(startDate);
  while (current <= endDate) {
    if (!skipWeekends || !isWeekend(current)) {
      count++;
    }
    current = addDays(current, 1);
  }
  return Math.max(1, count);
}

/**
 * Automated Task Scheduling Engine using CPM (Critical Path Method) and Resource Constraints
 */
export function computeAutomatedSchedule(
  tasks: Task[],
  members: TeamMember[],
  projectStartDate: string,
  targetDeadline: string,
  hoursPerDay = 8,
  levelResources = false
): AutomatedScheduleResult {
  const taskMap = new Map<string, Task>(tasks.map(t => [t.id, { ...t }]));
  const bottlenecks: ScheduleBottleneck[] = [];
  const adjustments: ScheduleAdjustment[] = [];

  // 1. Detect Cycle in dependencies (Topological sort check)
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  tasks.forEach(t => {
    inDegree.set(t.id, 0);
    adjacency.set(t.id, []);
  });

  tasks.forEach(t => {
    (t.dependencies || []).forEach(depId => {
      if (taskMap.has(depId)) {
        adjacency.get(depId)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
      } else {
        bottlenecks.push({
          taskId: t.id,
          taskTitle: t.title,
          reason: `Dependency ${depId} does not exist in project.`,
          severity: 'warning'
        });
      }
    });
  });

  // Kahn's algorithm for topological order
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sortedOrder: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    sortedOrder.push(curr);
    adjacency.get(curr)?.forEach(neighbor => {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });
  }

  const hasCycle = sortedOrder.length < tasks.length;
  if (hasCycle) {
    bottlenecks.push({
      taskId: 'all',
      taskTitle: 'Dependency Graph Error',
      reason: 'Circular dependency detected among tasks! Auto-scheduler will resolve sequentially.',
      severity: 'critical'
    });
  }

  // 2. Forward Pass (Early Start, Early Finish)
  const earlyStart = new Map<string, Date>();
  const earlyFinish = new Map<string, Date>();
  const initialDate = parseISO(projectStartDate || format(new Date(), 'yyyy-MM-dd'));

  const processingOrder = hasCycle ? tasks.map(t => t.id) : sortedOrder;

  processingOrder.forEach(id => {
    const task = taskMap.get(id)!;
    const durationDays = Math.max(1, Math.ceil(task.estimatedHours / hoursPerDay));

    let maxDepFinish = new Date(initialDate);
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach(depId => {
        const depFinish = earlyFinish.get(depId);
        if (depFinish) {
          // Task can start next working day after dependency finishes
          const nextStart = addWorkDays(depFinish, 1);
          if (nextStart > maxDepFinish) {
            maxDepFinish = nextStart;
          }
        }
      });
    }

    earlyStart.set(id, maxDepFinish);
    const calculatedFinish = addWorkDays(maxDepFinish, durationDays - 1);
    earlyFinish.set(id, calculatedFinish);
  });

  // Calculate project end date from latest early finish
  let projectEnd = new Date(initialDate);
  earlyFinish.forEach(finish => {
    if (finish > projectEnd) {
      projectEnd = finish;
    }
  });

  // 3. Backward Pass (Late Finish, Late Start)
  const lateFinish = new Map<string, Date>();
  const lateStart = new Map<string, Date>();

  // Initialize all late finish to projectEnd
  tasks.forEach(t => {
    lateFinish.set(t.id, new Date(projectEnd));
  });

  // Traverse in reverse topological order
  for (let i = processingOrder.length - 1; i >= 0; i--) {
    const id = processingOrder[i];
    const task = taskMap.get(id)!;
    const durationDays = Math.max(1, Math.ceil(task.estimatedHours / hoursPerDay));

    // Successors that depend on this task
    const successors = adjacency.get(id) || [];
    if (successors.length > 0) {
      let minSuccStart = new Date(projectEnd);
      successors.forEach(succId => {
        const succLateStart = lateStart.get(succId);
        if (succLateStart) {
          // This task must finish before successor starts
          const mustFinishBy = addWorkDays(succLateStart, -1);
          if (mustFinishBy < minSuccStart) {
            minSuccStart = mustFinishBy;
          }
        }
      });
      lateFinish.set(id, minSuccStart);
    }

    const currentLateFinish = lateFinish.get(id)!;
    const currentLateStart = addWorkDays(currentLateFinish, -(durationDays - 1));
    lateStart.set(id, currentLateStart);
  }

  // 4. Calculate Slack / Float and Critical Path
  const criticalPathIds: string[] = [];
  tasks.forEach(t => {
    const es = earlyStart.get(t.id) || initialDate;
    const ls = lateStart.get(t.id) || initialDate;
    const slack = differenceInCalendarDays(ls, es);

    const isCrit = Math.abs(slack) <= 1; // 0 or 1 day tolerance
    if (isCrit) {
      criticalPathIds.push(t.id);
    }

    const taskObj = taskMap.get(t.id)!;
    taskObj.isCriticalPath = isCrit;
    taskObj.slackDays = Math.max(0, slack);

    const calculatedStartStr = format(es, 'yyyy-MM-dd');
    const calculatedDueStr = format(earlyFinish.get(t.id) || es, 'yyyy-MM-dd');

    if (t.startDate !== calculatedStartStr || t.dueDate !== calculatedDueStr) {
      adjustments.push({
        taskId: t.id,
        taskTitle: t.title,
        oldStart: t.startDate,
        newStart: calculatedStartStr,
        oldDue: t.dueDate,
        newDue: calculatedDueStr,
        explanation: (t.dependencies.length > 0)
          ? `Aligned with prerequisite tasks (${t.dependencies.length} dependencies)`
          : `Scheduled from project kick-off with ${t.estimatedHours}h estimated effort.`
      });

      taskObj.startDate = calculatedStartStr;
      taskObj.dueDate = calculatedDueStr;
      taskObj.scheduledBy = 'auto_cpm';
    }
  });

  // 5. Workload & Resource Overallocation Analysis
  const memberDailyUsage = new Map<string, Map<string, number>>();
  members.forEach(m => memberDailyUsage.set(m.id, new Map()));

  taskMap.forEach(task => {
    if (!task.assigneeId || task.status === 'done') return;
    const assignee = members.find(m => m.id === task.assigneeId);
    if (!assignee) return;

    const start = parseISO(task.startDate);
    const due = parseISO(task.dueDate);
    const workDays = getWorkDaySpan(start, due);
    const hoursPerWorkDay = task.estimatedHours / Math.max(1, workDays);

    let curr = new Date(start);
    while (curr <= due) {
      if (!isWeekend(curr)) {
        const dayKey = format(curr, 'yyyy-MM-dd');
        const usageMap = memberDailyUsage.get(assignee.id)!;
        const prev = usageMap.get(dayKey) || 0;
        usageMap.set(dayKey, prev + hoursPerWorkDay);
      }
      curr = addDays(curr, 1);
    }
  });

  const overallocations: ResourceOverallocation[] = [];
  members.forEach(member => {
    const usageMap = memberDailyUsage.get(member.id);
    if (!usageMap) return;

    let peakHours = 0;
    const conflictingTaskIds = new Set<string>();

    usageMap.forEach((hours, day) => {
      if (hours > peakHours) peakHours = hours;
      if (hours > member.dailyCapacityHours) {
        // Find tasks active on this day
        taskMap.forEach(t => {
          if (t.assigneeId === member.id && t.startDate <= day && t.dueDate >= day) {
            conflictingTaskIds.add(t.id);
          }
        });
      }
    });

    if (peakHours > member.dailyCapacityHours) {
      overallocations.push({
        memberId: member.id,
        memberName: member.name,
        capacityHoursPerDay: member.dailyCapacityHours,
        peakDailyHours: Math.round(peakHours * 10) / 10,
        conflictingTaskIds: Array.from(conflictingTaskIds)
      });

      bottlenecks.push({
        taskId: Array.from(conflictingTaskIds)[0] || 'member',
        taskTitle: `${member.name} Overallocated`,
        reason: `Exceeds daily capacity (${Math.round(peakHours * 10) / 10}h / ${member.dailyCapacityHours}h limit).`,
        severity: 'warning'
      });
    }
  });

  // Target deadline verification
  const projEndStr = format(projectEnd, 'yyyy-MM-dd');
  if (targetDeadline && projEndStr > targetDeadline) {
    bottlenecks.push({
      taskId: criticalPathIds[criticalPathIds.length - 1] || 'deadline',
      taskTitle: 'Milestone Deadline Exceeded',
      reason: `Projected finish (${projEndStr}) is past target deadline (${targetDeadline}). Critical path needs optimization.`,
      severity: 'critical'
    });
  }

  const updatedTasks = Array.from(taskMap.values());

  const summary = `Automated schedule calculated with Critical Path (${criticalPathIds.length} tasks). Projected finish is ${projEndStr}. Found ${adjustments.length} schedule optimizations and ${overallocations.length} workload alerts.`;

  return {
    projectEndDate: projEndStr,
    criticalPath: criticalPathIds,
    bottlenecks,
    overallocations,
    adjustments,
    updatedTasks,
    summary
  };
}
