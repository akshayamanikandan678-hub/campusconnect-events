import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext.tsx';
import { Header } from './components/Header.tsx';
import { NavigationTabs } from './components/NavigationTabs.tsx';
import { KanbanBoard } from './components/KanbanBoard.tsx';
import { GanttTimeline } from './components/GanttTimeline.tsx';
import { WorkloadView } from './components/WorkloadView.tsx';
import { ScheduleHealthView } from './components/ScheduleHealthView.tsx';
import { TaskDetailModal } from './components/TaskDetailModal.tsx';
import { AutoSchedulerModal } from './components/AutoSchedulerModal.tsx';
import { AITaskPlannerModal } from './components/AITaskPlannerModal.tsx';
import { CollaborationDrawer } from './components/CollaborationDrawer.tsx';
import { NewTaskModal } from './components/NewTaskModal.tsx';
import { TaskStatus } from './types.ts';

const MainAppContent: React.FC = () => {
  const { activeTab } = useProject();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState<TaskStatus>('todo');

  const handleOpenNewTask = (defaultStatus?: TaskStatus) => {
    if (defaultStatus) {
      setNewTaskDefaultStatus(defaultStatus);
    }
    setIsNewTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Top Application Header */}
      <Header />

      {/* Navigation Tabs and Search / Filter controls */}
      <NavigationTabs onOpenNewTask={() => handleOpenNewTask('todo')} />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'board' && <KanbanBoard onOpenNewTask={handleOpenNewTask} />}
        {activeTab === 'gantt' && <GanttTimeline />}
        {activeTab === 'workload' && <WorkloadView />}
        {activeTab === 'schedule' && <ScheduleHealthView />}
      </main>

      {/* Global Modals & Drawers */}
      <TaskDetailModal />
      <AutoSchedulerModal />
      <AITaskPlannerModal />
      <CollaborationDrawer />
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        defaultStatus={newTaskDefaultStatus}
      />
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <MainAppContent />
    </ProjectProvider>
  );
}
