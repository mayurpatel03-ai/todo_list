import React, { useMemo, useState } from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import {
  getLocalIsoDate,
  TaskPriority,
  TaskStatus,
} from '../../types/taskflow';
import { TaskRow } from '../TaskRow';

type QuickFilter = 'all' | 'high' | 'in_progress' | 'completed';

export const TodayView: React.FC = () => {
  const {
    tasks,
    projects,
    selectedProjectId,
    isLoadingData,
    createTask,
    openNewTaskModal,
  } = useTaskFlow();

  const [filter, setFilter] = useState<QuickFilter>('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [quickProjectId, setQuickProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveProjectId =
    quickProjectId ||
    (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || 'proj_core_platform');

  const scopedTasks = useMemo(() => {
    const byProject =
      selectedProjectId === 'all'
        ? tasks
        : tasks.filter((t) => t.projectId === selectedProjectId);

    if (filter === 'high') {
      return byProject.filter((t) => t.priority === 'high' && t.status !== 'completed');
    }
    if (filter === 'in_progress') {
      return byProject.filter(
        (t) => t.status === 'in_progress' || t.status === 'in_review'
      );
    }
    if (filter === 'completed') {
      return byProject.filter((t) => t.status === 'completed');
    }
    return byProject;
  }, [tasks, selectedProjectId, filter]);

  const highPriorityOpen = useMemo(
    () => scopedTasks.filter((t) => t.status !== 'completed' && t.priority === 'high'),
    [scopedTasks]
  );

  const activeQueue = useMemo(
    () => scopedTasks.filter((t) => t.status !== 'completed' && t.priority !== 'high'),
    [scopedTasks]
  );

  const completedTasks = useMemo(
    () => scopedTasks.filter((t) => t.status === 'completed'),
    [scopedTasks]
  );

  const openCount = useMemo(
    () =>
      (selectedProjectId === 'all'
        ? tasks
        : tasks.filter((t) => t.projectId === selectedProjectId)
      ).filter((t) => t.status !== 'completed').length,
    [tasks, selectedProjectId]
  );

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetStatus: TaskStatus = filter === 'in_progress' ? 'in_progress' : 'backlog';
      await createTask({
        title: quickTitle,
        projectId: effectiveProjectId,
        priority: quickPriority,
        status: targetStatus,
        dueDate: getLocalIsoDate(0),
      });
      setQuickTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeProjectName =
    selectedProjectId === 'all'
      ? 'Focused Execution'
      : projects.find((p) => p.id === selectedProjectId)?.name || 'Project';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[#64748B]">{todayFormatted}</p>
          <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.015em] text-[#131B2E] mt-1">
            {activeProjectName}
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg self-start sm:self-auto">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'high', label: 'High Priority' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-white text-[#131B2E] shadow-tf-1'
                  : 'text-[#64748B] hover:text-[#131B2E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inline Quick Capture */}
      <form
        onSubmit={(e) => void handleQuickAdd(e)}
        className="bg-white border border-[#E2E8F0] rounded-xl p-2 shadow-tf-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      >
        <div className="flex items-center gap-2.5 flex-1 px-2">
          <Plus className="w-4 h-4 text-[#4F46E5] shrink-0" />
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Capture a task for today..."
            aria-label="Quick capture task title"
            className="w-full py-1.5 text-[14px] text-[#131B2E] placeholder:text-[#94A3B8] focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-1 sm:px-0">
          <select
            value={effectiveProjectId}
            onChange={(e) => setQuickProjectId(e.target.value)}
            aria-label="Task project"
            className="h-8 px-2.5 text-[12px] font-medium text-[#334155] bg-[#FAF8FF] border border-[#E2E8F0] rounded-md tf-input cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
            aria-label="Task priority"
            className="h-8 px-2.5 text-[12px] font-medium text-[#334155] bg-[#FAF8FF] border border-[#E2E8F0] rounded-md tf-input cursor-pointer"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            type="submit"
            disabled={!quickTitle.trim() || isSubmitting}
            className="h-8 px-3.5 rounded-md bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-40 text-white text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Add
          </button>
        </div>
      </form>

      {/* Loading Skeleton State */}
      {isLoadingData ? (
        <div className="space-y-3" aria-label="Loading tasks">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-[66px] bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 flex items-center gap-3.5 animate-pulse"
            >
              <div className="w-[18px] h-[18px] rounded-[4px] bg-[#E2E8F0]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 bg-[#E2E8F0] rounded" />
                <div className="h-2.5 w-1/3 bg-[#F1F5F9] rounded" />
              </div>
              <div className="h-5 w-14 bg-[#F1F5F9] rounded-full" />
            </div>
          ))}
        </div>
      ) : scopedTasks.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center shadow-tf-1">
          <div className="w-11 h-11 rounded-xl bg-[#F2F3FF] text-[#4F46E5] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="font-display text-[18px] font-semibold text-[#131B2E]">
            Clear runway
          </h2>
          <p className="text-[14px] text-[#64748B] mt-1 max-w-sm mx-auto">
            No tasks match this view right now. Capture a new action item or switch filters.
          </p>
          <button
            type="button"
            onClick={() => openNewTaskModal('backlog')}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log First Task
          </button>
        </div>
      ) : (
        <div className="space-y-7">
          {/* Focus & High Priority */}
          {highPriorityOpen.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-[#131B2E]">
                  Focus &amp; High Priority
                </h2>
                <span className="tabular-nums font-mono text-[12px] text-[#64748B]">
                  {highPriorityOpen.length}
                </span>
              </div>
              <div className="space-y-2">
                {highPriorityOpen.map((task) => (
                  <TaskRow key={task.id} task={task} showProject={selectedProjectId === 'all'} />
                ))}
              </div>
            </section>
          )}

          {/* Active Queue */}
          {activeQueue.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-[#131B2E]">
                  Active Queue
                </h2>
                <span className="tabular-nums font-mono text-[12px] text-[#64748B]">
                  {activeQueue.length} of {openCount} open
                </span>
              </div>
              <div className="space-y-2">
                {activeQueue.map((task) => (
                  <TaskRow key={task.id} task={task} showProject={selectedProjectId === 'all'} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completedTasks.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-[#64748B]">
                  Completed
                </h2>
                <span className="tabular-nums font-mono text-[12px] text-[#94A3B8]">
                  {completedTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TaskRow key={task.id} task={task} showProject={selectedProjectId === 'all'} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
