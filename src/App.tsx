import React from 'react';
import { CommandPalette } from './components/CommandPalette';
import { CreateModals } from './components/CreateModals';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { TopBar } from './components/TopBar';
import { AnalyticsView } from './components/views/AnalyticsView';
import { BoardView } from './components/views/BoardView';
import { TimelineView } from './components/views/TimelineView';
import { TodayView } from './components/views/TodayView';
import { TaskFlowProvider, useTaskFlow } from './context/TaskFlowContext';

const WorkspaceShell: React.FC = () => {
  const { activeScreen, toastMessage, dismissToast } = useTaskFlow();

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#131B2E] flex">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen pb-16 md:pb-0">
        <TopBar />

        <main className="flex-1 min-w-0 overflow-y-auto">
          {activeScreen === 'today' && <TodayView />}
          {activeScreen === 'board' && <BoardView />}
          {activeScreen === 'timeline' && <TimelineView />}
          {activeScreen === 'analytics' && <AnalyticsView />}
        </main>
      </div>

      <TaskDetailDrawer />
      <CommandPalette />
      <CreateModals />

      {toastMessage && (
        <div
          role="status"
          onClick={dismissToast}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-2.5 rounded-xl bg-[#283044] text-[#EEF0FF] text-[13px] font-medium shadow-tf-3 cursor-pointer"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <TaskFlowProvider>
        <WorkspaceShell />
      </TaskFlowProvider>
    </ErrorBoundary>
  );
}
