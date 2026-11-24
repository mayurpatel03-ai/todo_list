import React from 'react';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import { WorkspaceScreen } from '../types/taskflow';

const SCREEN_TITLES: Record<WorkspaceScreen, string> = {
  today: 'Today',
  board: 'Kanban Board',
  timeline: 'Timeline',
  analytics: 'Velocity',
};

export const TopBar: React.FC = () => {
  const {
    activeScreen,
    selectedProjectId,
    setSelectedProjectId,
    projects,
    setIsCommandPaletteOpen,
    openNewTaskModal,
  } = useTaskFlow();

  const selectedProject =
    selectedProjectId === 'all'
      ? null
      : projects.find((p) => p.id === selectedProjectId) ?? null;

  return (
    <header className="h-16 shrink-0 bg-white/90 backdrop-blur-sm border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between gap-4 sm:gap-8">
      {/* Zone 1: Contextual Breadcrumb Trail */}
      <div className="flex items-center gap-2 min-w-0 text-[14px]">
        <span className="md:hidden font-display font-bold text-[#131B2E] whitespace-nowrap shrink-0">
          TaskFlow
        </span>
        <span className="hidden md:inline font-medium text-[#64748B] whitespace-nowrap shrink-0">
          TaskFlow
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
        <button
          type="button"
          onClick={() => setSelectedProjectId('all')}
          className={`font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            selectedProject
              ? 'text-[#64748B] hover:text-[#131B2E]'
              : 'text-[#131B2E] font-semibold'
          }`}
        >
          {SCREEN_TITLES[activeScreen]}
        </button>

        {selectedProject && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <span className="font-semibold text-[#131B2E] truncate max-w-[160px] sm:max-w-[240px]">
              {selectedProject.name}
            </span>
          </>
        )}
      </div>

      {/* Zone 2 & 3: Quick Search Trigger + 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2.5 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-[#FAF8FF] hover:bg-white hover:border-[#CBD5E1] text-[13px] text-[#64748B] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="hidden sm:inline">Search or jump...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] font-mono text-[11px] text-[#94A3B8]">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => openNewTaskModal('backlog')}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.98] text-white text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
