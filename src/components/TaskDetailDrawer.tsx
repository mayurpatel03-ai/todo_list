import React, { useEffect, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import {
  BLUEPRINT_LIMITS,
  generateId,
  STATUS_COLUMNS,
  Subtask,
  TaskPriority,
  TaskStatus,
  TEAM_MEMBERS,
} from '../types/taskflow';
import { Avatar } from './Avatar';

export const TaskDetailDrawer: React.FC = () => {
  const {
    selectedTask,
    setSelectedTaskId,
    projects,
    updateTask,
    deleteTask,
  } = useTaskFlow();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description);
    }
  }, [selectedTask?.id, selectedTask?.title, selectedTask?.description]);

  if (!selectedTask) return null;

  const commitTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== selectedTask.title) {
      void updateTask(selectedTask.id, { title: trimmed });
    } else if (!trimmed) {
      setTitle(selectedTask.title);
    }
  };

  const commitDescription = () => {
    if (description !== selectedTask.description) {
      void updateTask(selectedTask.id, { description });
    }
  };

  const handleToggleSubtask = (subId: string) => {
    const next: Subtask[] = selectedTask.subtasks.map((s) =>
      s.id === subId ? { ...s, done: !s.done } : s
    );
    void updateTask(selectedTask.id, { subtasks: next });
  };

  const handleDeleteSubtask = (subId: string) => {
    const next = selectedTask.subtasks.filter((s) => s.id !== subId);
    void updateTask(selectedTask.id, { subtasks: next });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubtaskTitle.trim().slice(0, BLUEPRINT_LIMITS.SUBTASK_TITLE_MAX);
    if (!trimmed || selectedTask.subtasks.length >= BLUEPRINT_LIMITS.MAX_SUBTASKS) return;
    const next: Subtask[] = [
      ...selectedTask.subtasks,
      { id: generateId('sub'), title: trimmed, done: false },
    ];
    setNewSubtaskTitle('');
    void updateTask(selectedTask.id, { subtasks: next });
  };

  const doneSubs = selectedTask.subtasks.filter((s) => s.done).length;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-[#0F172A]/25 backdrop-blur-[2px]"
      onClick={() => setSelectedTaskId(null)}
    >
      <aside
        aria-label="Task details"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white h-full border-l border-[#E2E8F0] shadow-tf-3 flex flex-col overflow-hidden"
      >
        {/* Top Drawer Bar */}
        <div className="h-14 px-6 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                void updateTask(selectedTask.id, {
                  status: selectedTask.status === 'completed' ? 'in_progress' : 'completed',
                })
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer ${
                selectedTask.status === 'completed'
                  ? 'bg-[#ECFDF5] border-[#10B981] text-[#047857]'
                  : 'bg-white border-[#E2E8F0] text-[#334155] hover:bg-[#FAF8FF]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {selectedTask.status === 'completed' ? 'Completed' : 'Mark Complete'}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Delete task"
              onClick={() => void deleteTask(selectedTask.id)}
              className="p-2 rounded-lg bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA] transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Close detail panel"
              onClick={() => setSelectedTaskId(null)}
              className="p-2 rounded-lg text-[#64748B] hover:text-[#131B2E] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Editable Title */}
          <div>
            <input
              type="text"
              value={title}
              maxLength={BLUEPRINT_LIMITS.TASK_TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              aria-label="Task title"
              className="w-full font-display text-[20px] font-semibold tracking-[-0.01em] text-[#131B2E] bg-transparent border border-transparent focus:border-[#4F46E5] rounded-lg px-2 py-1 -mx-2 focus:outline-none"
            />
          </div>

          {/* Metadata Fields Grid */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.02em] uppercase text-[#64748B] mb-1.5">
                Status
              </label>
              <select
                value={selectedTask.status}
                onChange={(e) =>
                  void updateTask(selectedTask.id, { status: e.target.value as TaskStatus })
                }
                className="w-full h-9 px-3 text-[13px] font-medium text-[#131B2E] bg-white border border-[#E2E8F0] rounded-lg tf-input cursor-pointer"
              >
                {STATUS_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.02em] uppercase text-[#64748B] mb-1.5">
                Priority
              </label>
              <select
                value={selectedTask.priority}
                onChange={(e) =>
                  void updateTask(selectedTask.id, { priority: e.target.value as TaskPriority })
                }
                className="w-full h-9 px-3 text-[13px] font-medium text-[#131B2E] bg-white border border-[#E2E8F0] rounded-lg tf-input cursor-pointer"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.02em] uppercase text-[#64748B] mb-1.5">
                Project
              </label>
              <select
                value={selectedTask.projectId}
                onChange={(e) => void updateTask(selectedTask.id, { projectId: e.target.value })}
                className="w-full h-9 px-3 text-[13px] font-medium text-[#131B2E] bg-white border border-[#E2E8F0] rounded-lg tf-input cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.02em] uppercase text-[#64748B] mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={selectedTask.dueDate}
                onChange={(e) => void updateTask(selectedTask.id, { dueDate: e.target.value })}
                className="w-full h-9 px-3 text-[13px] font-medium text-[#131B2E] bg-white border border-[#E2E8F0] rounded-lg tf-input tabular-nums"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.02em] uppercase text-[#64748B] mb-2">
              Assignee
            </label>
            <div className="flex flex-wrap gap-2">
              {TEAM_MEMBERS.map((member) => {
                const active = selectedTask.assigneeId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => void updateTask(selectedTask.id, { assigneeId: member.id })}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#F2F3FF] border-[#4F46E5] text-[#3525CD]'
                        : 'bg-white border-[#E2E8F0] text-[#334155] hover:bg-[#FAF8FF]'
                    }`}
                  >
                    <Avatar memberId={member.id} size="sm" />
                    <span>{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.02em] uppercase text-[#64748B] mb-1.5">
              Notes &amp; Context
            </label>
            <textarea
              rows={4}
              value={description}
              maxLength={BLUEPRINT_LIMITS.TASK_DESC_MAX}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={commitDescription}
              placeholder="Add acceptance criteria, links, or operator notes..."
              className="w-full px-3.5 py-2.5 text-[14px] text-[#131B2E] placeholder:text-[#94A3B8] bg-white border border-[#E2E8F0] rounded-lg tf-input resize-y leading-relaxed"
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="pt-2 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[14px] font-semibold text-[#131B2E]">
                Subtasks
              </h3>
              <span className="tabular-nums font-mono text-[12px] text-[#64748B]">
                {doneSubs}/{selectedTask.subtasks.length}
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              {selectedTask.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg bg-[#FAF8FF] border border-[#E2E8F0]"
                >
                  <button
                    type="button"
                    aria-label={sub.done ? `Uncheck ${sub.title}` : `Check ${sub.title}`}
                    onClick={() => handleToggleSubtask(sub.id)}
                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      sub.done
                        ? 'bg-[#10B981] border border-[#10B981] text-white'
                        : 'border-[1.5px] border-[#CBD5E1] bg-white hover:border-[#4F46E5]'
                    }`}
                  >
                    {sub.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                  <span
                    className={`flex-1 text-[13px] ${
                      sub.done ? 'line-through text-[#64748B]' : 'text-[#131B2E]'
                    }`}
                  >
                    {sub.title}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove subtask ${sub.title}`}
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#94A3B8] hover:text-[#DC2626] transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {selectedTask.subtasks.length < BLUEPRINT_LIMITS.MAX_SUBTASKS ? (
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  maxLength={BLUEPRINT_LIMITS.SUBTASK_TITLE_MAX}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-1 h-9 px-3 text-[13px] text-[#131B2E] placeholder:text-[#94A3B8] bg-white border border-[#E2E8F0] rounded-lg tf-input"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim()}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] disabled:opacity-40 text-[12px] font-medium text-[#334155] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </form>
            ) : (
              <p className="text-[12px] text-[#64748B]">
                Maximum of {BLUEPRINT_LIMITS.MAX_SUBTASKS} subtasks reached for this item.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
