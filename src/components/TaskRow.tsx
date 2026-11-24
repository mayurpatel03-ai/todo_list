import React from 'react';
import {
  Check,
  Clock,
  Flame,
  Flag,
  Minus,
  Trash2,
} from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import {
  formatShortDate,
  isOverdue,
  PROJECT_ACCENTS,
  TaskItem,
  TaskPriority,
} from '../types/taskflow';
import { Avatar } from './Avatar';

interface TaskRowProps {
  task: TaskItem;
  showProject?: boolean;
}

export const PriorityIndicator: React.FC<{
  priority: TaskPriority;
  desaturated?: boolean;
}> = ({ priority, desaturated }) => {
  if (desaturated) {
    return (
      <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] font-semibold tracking-[0.02em] uppercase bg-[#F1F5F9] text-[#94A3B8] whitespace-nowrap shrink-0">
        {priority}
      </span>
    );
  }

  if (priority === 'high') {
    return (
      <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] font-semibold tracking-[0.02em] uppercase bg-[#FEE2E2] text-[#EF4444] whitespace-nowrap shrink-0">
        <Flame className="w-3 h-3" />
        High
      </span>
    );
  }

  if (priority === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] font-semibold tracking-[0.02em] uppercase bg-[#FEF3C7] text-[#D97706] whitespace-nowrap shrink-0">
        <Flag className="w-3 h-3" />
        Medium
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] font-semibold tracking-[0.02em] uppercase bg-[#F1F5F9] text-[#64748B] whitespace-nowrap shrink-0">
      <Minus className="w-3 h-3" />
      Low
    </span>
  );
};

export const TaskRow: React.FC<TaskRowProps> = ({ task, showProject = true }) => {
  const {
    projects,
    selectedTaskId,
    setSelectedTaskId,
    toggleTaskComplete,
    snoozeTaskOneDay,
    cycleTaskPriority,
    deleteTask,
  } = useTaskFlow();

  const isCompleted = task.status === 'completed';
  const overdue = isOverdue(task.dueDate, task.status);
  const project = projects.find((p) => p.id === task.projectId);
  const accent = project ? PROJECT_ACCENTS[project.accent] : PROJECT_ACCENTS.slate;

  const doneSubtasks = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const isSelected = selectedTaskId === task.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setSelectedTaskId(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedTaskId(task.id);
        }
      }}
      className={`group relative flex items-center gap-3.5 px-4 py-3 bg-white border rounded-xl transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] ${
        isSelected
          ? 'border-[#4F46E5] shadow-tf-2'
          : 'border-[#E2E8F0] shadow-tf-1 hover:shadow-tf-2 hover:border-[#CBD5E1]'
      } ${isCompleted ? 'opacity-55' : ''}`}
    >
      {/* 18px soft-cornered square checkbox */}
      <button
        type="button"
        aria-label={isCompleted ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
        onClick={(e) => {
          e.stopPropagation();
          void toggleTaskComplete(task.id);
        }}
        className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1 ${
          isCompleted
            ? 'bg-[#10B981] border border-[#10B981] text-white'
            : 'bg-transparent border-[1.5px] border-[#CBD5E1] hover:border-[#4F46E5]'
        }`}
      >
        {isCompleted && <Check className="w-3 h-3 stroke-[2.75] animate-check-bounce" />}
      </button>

      {/* Main title + unboxed metadata line */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-[14px] font-medium leading-snug truncate ${
            isCompleted ? 'line-through text-[#64748B]' : 'text-[#0F172A]'
          }`}
        >
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#64748B]">
          {showProject && project && (
            <>
              <span className="inline-flex items-center gap-1.5 text-[#334155] font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} aria-hidden="true" />
                {project.name}
              </span>
              <span aria-hidden="true" className="text-[#CBD5E1]">
                ·
              </span>
            </>
          )}

          {totalSubtasks > 0 && (
            <>
              <span className="tabular-nums font-mono text-[11px] text-[#64748B]">
                {doneSubtasks}/{totalSubtasks} subtasks
              </span>
              <span aria-hidden="true" className="text-[#CBD5E1]">
                ·
              </span>
            </>
          )}

          <span
            className={`tabular-nums text-[12px] font-medium ${
              overdue ? 'text-[#EF4444]' : 'text-[#64748B]'
            }`}
          >
            {overdue ? `Overdue · ${formatShortDate(task.dueDate)}` : formatShortDate(task.dueDate)}
          </span>
        </div>
      </div>

      {/* Hover quick actions */}
      <div
        className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          title="Snooze +1 day"
          aria-label="Snooze task by one day"
          onClick={() => void snoozeTaskOneDay(task.id)}
          className="p-1.5 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Cycle priority"
          aria-label="Cycle task priority"
          onClick={() => void cycleTaskPriority(task.id)}
          className="p-1.5 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Delete task"
          aria-label="Delete task"
          onClick={() => void deleteTask(task.id)}
          className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Priority + Assignee */}
      <div className="flex items-center gap-2.5 shrink-0">
        <PriorityIndicator priority={task.priority} desaturated={isCompleted} />
        <Avatar memberId={task.assigneeId} size="sm" />
      </div>
    </div>
  );
};
