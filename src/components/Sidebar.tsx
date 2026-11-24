import React from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Columns3,
  FolderPlus,
  Layers,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import { PROJECT_ACCENTS, WorkspaceScreen } from '../types/taskflow';

const NAV_ITEMS: {
  id: WorkspaceScreen;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'today', label: 'Today', icon: CheckSquare },
  { id: 'board', label: 'Board', icon: Columns3 },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  { id: 'analytics', label: 'Velocity', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  const {
    user,
    projects,
    tasks,
    activeScreen,
    setActiveScreen,
    selectedProjectId,
    setSelectedProjectId,
    sidebarCollapsed,
    setSidebarCollapsed,
    setIsNewProjectModalOpen,
    openNewTaskModal,
    signIn,
    signOut,
  } = useTaskFlow();

  const openTaskCount = (projectId: string) =>
    tasks.filter((t) => t.projectId === projectId && t.status !== 'completed').length;

  const totalOpenTasks = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <>
      {/* Desktop Collapsible Global Rail (64px mini / 240px expanded) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-white border-r border-[#E2E8F0] transition-[width] duration-200 select-none ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center border-b border-[#E2E8F0] px-4 ${
            sidebarCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => {
                setActiveScreen('today');
                setSelectedProjectId('all');
              }}
              className="flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] rounded-md"
            >
              <span className="w-7 h-7 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center font-display font-bold text-sm">
                T
              </span>
              <span className="font-display font-bold text-[17px] tracking-tight text-[#131B2E] whitespace-nowrap">
                TaskFlow
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#131B2E] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Workspace Navigation */}
        <div className="p-3 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.02em] uppercase text-[#94A3B8]">
              Workspace
            </div>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[14px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  active
                    ? 'bg-[#F2F3FF] text-[#3525CD]'
                    : 'text-[#464555] hover:bg-[#F8FAFC] hover:text-[#131B2E]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#4F46E5]' : ''}`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-[#E2E8F0]">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? 'justify-center py-1' : 'justify-between px-2.5 py-1.5'
            }`}
          >
            {!sidebarCollapsed && (
              <span className="text-[11px] font-semibold tracking-[0.02em] uppercase text-[#94A3B8]">
                Projects
              </span>
            )}
            <button
              type="button"
              title="New project"
              aria-label="New project"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="p-1 rounded-md text-[#64748B] hover:text-[#4F46E5] hover:bg-[#F2F3FF] transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-1 space-y-0.5">
            <button
              type="button"
              title={sidebarCollapsed ? 'All Projects' : undefined}
              onClick={() => setSelectedProjectId('all')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                sidebarCollapsed ? 'justify-center' : 'justify-between'
              } ${
                selectedProjectId === 'all'
                  ? 'bg-[#F2F3FF] text-[#3525CD]'
                  : 'text-[#464555] hover:bg-[#F8FAFC] hover:text-[#131B2E]'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">All Projects</span>}
              </span>
              {!sidebarCollapsed && (
                <span className="tabular-nums font-mono text-[11px] text-[#64748B]">
                  {totalOpenTasks}
                </span>
              )}
            </button>

            {projects.map((project) => {
              const accent = PROJECT_ACCENTS[project.accent] ?? PROJECT_ACCENTS.indigo;
              const active = selectedProjectId === project.id;
              const count = openTaskCount(project.id);
              return (
                <button
                  key={project.id}
                  type="button"
                  title={sidebarCollapsed ? project.name : undefined}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    sidebarCollapsed ? 'justify-center' : 'justify-between'
                  } ${
                    active
                      ? 'bg-[#F2F3FF] text-[#3525CD]'
                      : 'text-[#464555] hover:bg-[#F8FAFC] hover:text-[#131B2E]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${accent.dot}`} />
                    {!sidebarCollapsed && <span className="truncate">{project.name}</span>}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="tabular-nums font-mono text-[11px] text-[#64748B]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account & Cloud Sync Footer */}
        <div className="p-3 border-t border-[#E2E8F0]">
          {user ? (
            <div
              className={`flex items-center gap-2.5 ${
                sidebarCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-[#E2E8F0] shrink-0"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-[#E2DFFF] text-[#3525CD] font-semibold text-xs flex items-center justify-center shrink-0">
                    {(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}
                  </span>
                )}
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#131B2E] truncate">
                      {user.displayName || 'Workspace User'}
                    </p>
                    <p className="text-[11px] text-[#10B981] font-medium truncate">
                      Cloud synced
                    </p>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <button
                  type="button"
                  title="Sign out"
                  aria-label="Sign out"
                  onClick={() => void signOut()}
                  className="p-1.5 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void signIn()}
              title={sidebarCollapsed ? 'Sign in with Google' : undefined}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium border border-[#E2E8F0] bg-[#FAF8FF] text-[#131B2E] hover:bg-[#F2F3FF] hover:border-[#C7C4D8] transition-colors cursor-pointer ${
                sidebarCollapsed ? 'justify-center px-0' : 'justify-center'
              }`}
            >
              <LogIn className="w-4 h-4 text-[#4F46E5] shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">Sign in to sync</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Floating Quick-Add Trigger */}
      <button
        type="button"
        aria-label="Quick add task"
        onClick={() => openNewTaskModal('backlog')}
        className="md:hidden fixed right-4 bottom-[72px] z-30 w-12 h-12 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 text-white shadow-tf-3 flex items-center justify-center transition-transform cursor-pointer"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Mobile Fixed Bottom Navigation Bar (56px) */}
      <nav
        aria-label="Mobile workspace navigation"
        className="md:hidden fixed bottom-0 inset-x-0 h-14 z-30 bg-white border-t border-[#E2E8F0] flex items-center justify-around px-2"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScreen(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] h-11 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                active ? 'text-[#4F46E5]' : 'text-[#64748B]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
