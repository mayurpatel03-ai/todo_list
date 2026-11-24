import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTaskFlow } from '../context/TaskFlowContext';
import {
  BLUEPRINT_LIMITS,
  getLocalIsoDate,
  PROJECT_ACCENTS,
  ProjectAccent,
  STATUS_COLUMNS,
  TaskPriority,
  TaskStatus,
  TEAM_MEMBERS,
} from '../types/taskflow';

export const CreateModals: React.FC = () => {
  const {
    isNewTaskModalOpen,
    setIsNewTaskModalOpen,
    newTaskDefaultStatus,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    projects,
    selectedProjectId,
    createTask,
    createProject,
  } = useTaskFlow();

  // Task modal state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('backlog');
  const [dueDate, setDueDate] = useState(getLocalIsoDate(0));
  const [assigneeId, setAssigneeId] = useState(TEAM_MEMBERS[0].id);

  // Project modal state
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectAccent, setProjectAccent] = useState<ProjectAccent>('indigo');

  useEffect(() => {
    if (isNewTaskModalOpen) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus(newTaskDefaultStatus);
      setDueDate(getLocalIsoDate(0));
      setAssigneeId(TEAM_MEMBERS[0].id);
      setProjectId(
        selectedProjectId !== 'all'
          ? selectedProjectId
          : projects[0]?.id || 'proj_core_platform'
      );
    }
  }, [isNewTaskModalOpen, newTaskDefaultStatus, selectedProjectId, projects]);

  useEffect(() => {
    if (isNewProjectModalOpen) {
      setProjectName('');
      setProjectDesc('');
      setProjectAccent('indigo');
    }
  }, [isNewProjectModalOpen]);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask({
      title,
      description,
      projectId,
      priority,
      status,
      dueDate,
      assigneeId,
    });
    setIsNewTaskModalOpen(false);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    await createProject({
      name: projectName,
      description: projectDesc,
      accent: projectAccent,
    });
    setIsNewProjectModalOpen(false);
  };

  return (
    <>
      {/* New Task Dialog */}
      {isNewTaskModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create new task"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-sm"
          onClick={() => setIsNewTaskModalOpen(false)}
        >
          <form
            onSubmit={(e) => void handleTaskSubmit(e)}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-[#CBD5E1] rounded-2xl shadow-tf-3 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-[#131B2E]">
                New Task
              </h2>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#131B2E] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={BLUEPRINT_LIMITS.TASK_TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ship responsive Kanban drag states"
                  className="w-full px-3.5 py-2.5 text-[14px] text-[#131B2E] placeholder:text-[#94A3B8] bg-white border border-[#E2E8F0] rounded-lg tf-input"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={BLUEPRINT_LIMITS.TASK_DESC_MAX}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional scope, context, or links..."
                  className="w-full px-3.5 py-2 text-[14px] text-[#131B2E] placeholder:text-[#94A3B8] bg-white border border-[#E2E8F0] rounded-lg tf-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                    Project
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full h-10 px-3 text-[13px] text-[#131B2E] bg-white border border-[#E2E8F0] rounded-lg tf-input cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full h-10 px-3 text-[13px] text-[#131B2E] bg-white border border-[#E2E8F0] rounded-lg tf-input cursor-pointer"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                    Stage
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full h-10 px-3 text-[13px] text-[#131B2E] bg-white border border-[#E2E8F0] rounded-lg tf-input cursor-pointer"
                  >
                    {STATUS_COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 text-[13px] text-[#131B2E] bg-white border border-[#E2E8F0] rounded-lg tf-input tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] text-[#131B2E] bg-white border border-[#E2E8F0] rounded-lg tf-input cursor-pointer"
                >
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#FAF8FF] border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[13px] font-medium text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.98] disabled:opacity-40 text-[13px] font-medium text-white transition-all cursor-pointer"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Project Dialog */}
      {isNewProjectModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create new project"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-sm"
          onClick={() => setIsNewProjectModalOpen(false)}
        >
          <form
            onSubmit={(e) => void handleProjectSubmit(e)}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-2xl shadow-tf-3 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-[#131B2E]">
                New Project
              </h2>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#131B2E] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={BLUEPRINT_LIMITS.PROJECT_NAME_MAX}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Mobile App V2"
                  className="w-full px-3.5 py-2.5 text-[14px] text-[#131B2E] placeholder:text-[#94A3B8] bg-white border border-[#E2E8F0] rounded-lg tf-input"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#334155] mb-1.5">
                  Summary
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.PROJECT_DESC_MAX}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Short initiative focus..."
                  className="w-full px-3.5 py-2.5 text-[14px] text-[#131B2E] placeholder:text-[#94A3B8] bg-white border border-[#E2E8F0] rounded-lg tf-input"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#334155] mb-2">
                  Color Marker
                </label>
                <div className="flex items-center gap-2.5">
                  {(Object.keys(PROJECT_ACCENTS) as ProjectAccent[]).map((key) => {
                    const accent = PROJECT_ACCENTS[key];
                    const selected = projectAccent === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label={accent.label}
                        onClick={() => setProjectAccent(key)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform cursor-pointer ${
                          selected
                            ? 'border-[#131B2E] scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full ${accent.dot}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#FAF8FF] border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[13px] font-medium text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!projectName.trim()}
                className="px-4 py-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.98] disabled:opacity-40 text-[13px] font-medium text-white transition-all cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
