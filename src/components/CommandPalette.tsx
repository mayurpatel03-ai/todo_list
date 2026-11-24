import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Columns3,
  Folder,
  Plus,
  Search,
} from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import { getLocalIsoDate, PROJECT_ACCENTS, WorkspaceScreen } from '../types/taskflow';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    tasks,
    projects,
    setActiveScreen,
    setSelectedProjectId,
    setSelectedTaskId,
    createTask,
  } = useTaskFlow();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isCommandPaletteOpen]);

  const trimmed = query.trim().toLowerCase();

  const matchedTasks = useMemo(() => {
    if (!trimmed) return tasks.slice(0, 5);
    return tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(trimmed) ||
          t.description.toLowerCase().includes(trimmed)
      )
      .slice(0, 6);
  }, [tasks, trimmed]);

  const matchedProjects = useMemo(() => {
    if (!trimmed) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(trimmed));
  }, [projects, trimmed]);

  if (!isCommandPaletteOpen) return null;

  const navigateTo = (screen: WorkspaceScreen) => {
    setActiveScreen(screen);
    setIsCommandPaletteOpen(false);
  };

  const handleQuickCreate = async () => {
    if (!query.trim()) return;
    const created = await createTask({
      title: query.trim(),
      projectId: projects[0]?.id || 'proj_core_platform',
      priority: 'medium',
      status: 'backlog',
      dueDate: getLocalIsoDate(0),
    });
    setIsCommandPaletteOpen(false);
    if (created) setSelectedTaskId(created.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-[#0F172A]/40 backdrop-blur-sm"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white border border-[#CBD5E1] rounded-2xl shadow-tf-3 overflow-hidden"
      >
        {/* Top Search & Quick Add Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2E8F0]">
          <Search className="w-4 h-4 text-[#4F46E5] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim() && matchedTasks.length === 0) {
                e.preventDefault();
                void handleQuickCreate();
              }
            }}
            placeholder="Search tasks, jump to a project, or type to quick-add..."
            className="flex-1 text-[14px] text-[#131B2E] placeholder:text-[#94A3B8] focus:outline-none bg-transparent"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-1.5 py-0.5 rounded bg-[#F1F5F9] font-mono text-[11px] text-[#94A3B8]">
              Esc
            </kbd>
          </div>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
          {/* Quick Create Option */}
          {query.trim().length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => void handleQuickCreate()}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#F2F3FF] hover:bg-[#E2E7FF] text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-medium text-[#3525CD] min-w-0">
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="truncate">Create task &ldquo;{query.trim()}&rdquo;</span>
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[11px] text-[#94A3B8] shrink-0">
                  Enter
                </kbd>
              </button>
            </div>
          )}

          {/* Screens */}
          {!trimmed && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.02em] text-[#94A3B8]">
                Screens
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => navigateTo('today')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#334155] hover:bg-[#FAF8FF] hover:text-[#131B2E] cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-[#4F46E5]" />
                  <span>Today Execution</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('board')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#334155] hover:bg-[#FAF8FF] hover:text-[#131B2E] cursor-pointer"
                >
                  <Columns3 className="w-4 h-4 text-[#4F46E5]" />
                  <span>Kanban Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('timeline')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#334155] hover:bg-[#FAF8FF] hover:text-[#131B2E] cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4 text-[#4F46E5]" />
                  <span>Timeline Horizon</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('analytics')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#334155] hover:bg-[#FAF8FF] hover:text-[#131B2E] cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-[#4F46E5]" />
                  <span>Velocity Analytics</span>
                </button>
              </div>
            </div>
          )}

          {/* Matching Projects */}
          {matchedProjects.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.02em] text-[#94A3B8]">
                Projects
              </div>
              <div className="space-y-0.5">
                {matchedProjects.map((project) => {
                  const accent = PROJECT_ACCENTS[project.accent] ?? PROJECT_ACCENTS.indigo;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setIsCommandPaletteOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#334155] hover:bg-[#FAF8FF] hover:text-[#131B2E] text-left cursor-pointer"
                    >
                      <Folder className={`w-4 h-4 ${accent.text}`} />
                      <span className="truncate">{project.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matching Tasks */}
          {matchedTasks.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.02em] text-[#94A3B8]">
                Tasks
              </div>
              <div className="space-y-0.5">
                {matchedTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-[13px] text-[#131B2E] hover:bg-[#FAF8FF] text-left cursor-pointer"
                  >
                    <span className="truncate">{task.title}</span>
                    <span className="text-[11px] font-mono text-[#94A3B8] uppercase shrink-0">
                      {task.priority}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="px-4 py-2.5 bg-[#FAF8FF] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] font-mono text-[#94A3B8]">
              ⌘K
            </kbd>
            <span>Toggle palette</span>
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] font-mono text-[#94A3B8]">
              Enter
            </kbd>
            <span>Create task</span>
          </span>
        </div>
      </div>
    </div>
  );
};
