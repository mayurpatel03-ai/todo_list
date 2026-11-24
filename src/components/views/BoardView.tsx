import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import {
  formatShortDate,
  isOverdue,
  PROJECT_ACCENTS,
  STATUS_COLUMNS,
  TaskItem,
  TaskStatus,
} from '../../types/taskflow';
import { Avatar } from '../Avatar';
import { PriorityIndicator } from '../TaskRow';

export const BoardView: React.FC = () => {
  const {
    tasks,
    projects,
    selectedProjectId,
    setSelectedTaskId,
    updateTask,
    toggleTaskComplete,
    openNewTaskModal,
  } = useTaskFlow();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const filteredTasks = useMemo(
    () =>
      selectedProjectId === 'all'
        ? tasks
        : tasks.filter((t) => t.projectId === selectedProjectId),
    [tasks, selectedProjectId]
  );

  const handleDrop = async (targetStatus: TaskStatus) => {
    setDragOverCol(null);
    if (!draggedTaskId) return;
    const task = tasks.find((t) => t.id === draggedTaskId);
    setDraggedTaskId(null);
    if (task && task.status !== targetStatus) {
      await updateTask(task.id, { status: targetStatus });
    }
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    const idx = STATUS_COLUMNS.findIndex((c) => c.id === current);
    return idx >= 0 && idx < STATUS_COLUMNS.length - 1 ? STATUS_COLUMNS[idx + 1].id : null;
  };

  const renderCard = (task: TaskItem) => {
    const project = projects.find((p) => p.id === task.projectId);
    const accent = project ? PROJECT_ACCENTS[project.accent] : PROJECT_ACCENTS.slate;
    const isCompleted = task.status === 'completed';
    const overdue = isOverdue(task.dueDate, task.status);
    const doneSubs = task.subtasks.filter((s) => s.done).length;
    const nextStatus = getNextStatus(task.status);

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => {
          setDraggedTaskId(task.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => {
          setDraggedTaskId(null);
          setDragOverCol(null);
        }}
        onClick={() => setSelectedTaskId(task.id)}
        className={`group bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-tf-1 hover:shadow-tf-2 hover:border-[#CBD5E1] transition-all duration-150 cursor-pointer select-none ${
          draggedTaskId === task.id ? 'opacity-50 scale-[0.98]' : ''
        } ${isCompleted ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <PriorityIndicator priority={task.priority} desaturated={isCompleted} />

          <div className="flex items-center gap-1">
            {nextStatus && (
              <button
                type="button"
                title="Advance stage"
                aria-label="Advance task to next column"
                onClick={(e) => {
                  e.stopPropagation();
                  void updateTask(task.id, { status: nextStatus });
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#64748B] hover:text-[#4F46E5] hover:bg-[#F2F3FF] transition-all cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              aria-label={isCompleted ? 'Reopen task' : 'Complete task'}
              onClick={(e) => {
                e.stopPropagation();
                void toggleTaskComplete(task.id);
              }}
              className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                isCompleted
                  ? 'bg-[#10B981] border border-[#10B981] text-white'
                  : 'border-[1.5px] border-[#CBD5E1] hover:border-[#4F46E5]'
              }`}
            >
              {isCompleted && <Check className="w-3 h-3 stroke-[2.75]" />}
            </button>
          </div>
        </div>

        <h3
          className={`mt-2.5 text-[14px] font-medium leading-snug ${
            isCompleted ? 'line-through text-[#64748B]' : 'text-[#0F172A]'
          }`}
        >
          {task.title}
        </h3>

        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 text-[12px] text-[#64748B]">
            {project && (
              <span className="inline-flex items-center gap-1.5 truncate">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accent.dot}`} />
                <span className="truncate">{project.name}</span>
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span className="tabular-nums font-mono text-[11px] shrink-0">
                {doneSubs}/{task.subtasks.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`tabular-nums text-[11px] font-medium ${
                overdue ? 'text-[#EF4444]' : 'text-[#64748B]'
              }`}
            >
              {formatShortDate(task.dueDate)}
            </span>
            <Avatar memberId={task.assigneeId} size="sm" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[24px] sm:text-[28px] font-semibold tracking-[-0.015em] text-[#131B2E]">
            Kanban Board
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Drag cards across workflow stages or click any item to edit subtasks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start pb-8">
        {STATUS_COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCol !== col.id) setDragOverCol(col.id);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => {
                e.preventDefault();
                void handleDrop(col.id);
              }}
              className={`rounded-2xl p-3.5 transition-colors border ${
                isOver
                  ? 'bg-[#EEF2FF] border-[#4F46E5]'
                  : 'bg-[#F2F3FF]/70 border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="font-display text-[14px] font-semibold text-[#131B2E]">
                  {col.label}
                </h2>
                <span className="tabular-nums font-mono text-[12px] font-medium text-[#64748B]">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[120px]">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-[12px] text-[#94A3B8] border border-dashed border-[#CBD5E1] rounded-xl">
                    No tasks in {col.label}
                  </div>
                ) : (
                  colTasks.map(renderCard)
                )}
              </div>

              <button
                type="button"
                onClick={() => openNewTaskModal(col.id)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium text-[#64748B] hover:text-[#131B2E] hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add task
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
