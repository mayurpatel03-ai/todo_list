import React, { useMemo } from 'react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { isOverdue, PROJECT_ACCENTS, TEAM_MEMBERS } from '../../types/taskflow';
import { Avatar } from '../Avatar';

export const AnalyticsView: React.FC = () => {
  const { tasks, projects, selectedProjectId } = useTaskFlow();

  const scopedTasks = useMemo(
    () =>
      selectedProjectId === 'all'
        ? tasks
        : tasks.filter((t) => t.projectId === selectedProjectId),
    [tasks, selectedProjectId]
  );

  const metrics = useMemo(() => {
    const total = scopedTasks.length;
    const completed = scopedTasks.filter((t) => t.status === 'completed').length;
    const inProgress = scopedTasks.filter(
      (t) => t.status === 'in_progress' || t.status === 'in_review'
    ).length;
    const highOpen = scopedTasks.filter(
      (t) => t.priority === 'high' && t.status !== 'completed'
    ).length;
    const overdueCount = scopedTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, highOpen, overdueCount, completionRate };
  }, [scopedTasks]);

  const statusDistribution = useMemo(() => {
    const groups = [
      { label: 'Backlog', count: scopedTasks.filter((t) => t.status === 'backlog').length, bar: 'bg-[#94A3B8]' },
      { label: 'In Progress', count: scopedTasks.filter((t) => t.status === 'in_progress').length, bar: 'bg-[#4F46E5]' },
      { label: 'In Review', count: scopedTasks.filter((t) => t.status === 'in_review').length, bar: 'bg-[#F59E0B]' },
      { label: 'Completed', count: scopedTasks.filter((t) => t.status === 'completed').length, bar: 'bg-[#10B981]' },
    ];
    const max = Math.max(1, ...groups.map((g) => g.count));
    return groups.map((g) => ({ ...g, pct: Math.round((g.count / max) * 100) }));
  }, [scopedTasks]);

  const projectProgress = useMemo(() => {
    return projects.map((project) => {
      const pTasks = tasks.filter((t) => t.projectId === project.id);
      const done = pTasks.filter((t) => t.status === 'completed').length;
      const pct = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;
      return { project, total: pTasks.length, done, pct };
    });
  }, [projects, tasks]);

  const memberLoad = useMemo(() => {
    return TEAM_MEMBERS.map((member) => {
      const assigned = scopedTasks.filter((t) => t.assigneeId === member.id);
      const open = assigned.filter((t) => t.status !== 'completed').length;
      const done = assigned.filter((t) => t.status === 'completed').length;
      return { member, open, done };
    });
  }, [scopedTasks]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
      <div>
        <h1 className="font-display text-[24px] sm:text-[28px] font-semibold tracking-[-0.015em] text-[#131B2E]">
          Workspace Velocity
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5">
          Live operational throughput derived directly from active tasks and project milestones.
        </p>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-tf-1">
          <p className="text-[12px] font-medium text-[#64748B]">Completion Rate</p>
          <p className="mt-2 font-display text-[28px] font-bold tracking-tight text-[#131B2E] tabular-nums">
            {metrics.completionRate}%
          </p>
          <p className="mt-1 text-[12px] text-[#10B981] font-medium tabular-nums">
            {metrics.completed} of {metrics.total} tasks closed
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-tf-1">
          <p className="text-[12px] font-medium text-[#64748B]">Active In Flight</p>
          <p className="mt-2 font-display text-[28px] font-bold tracking-tight text-[#131B2E] tabular-nums">
            {metrics.inProgress}
          </p>
          <p className="mt-1 text-[12px] text-[#4F46E5] font-medium">
            In progress or review
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-tf-1">
          <p className="text-[12px] font-medium text-[#64748B]">High Priority Open</p>
          <p className="mt-2 font-display text-[28px] font-bold tracking-tight text-[#131B2E] tabular-nums">
            {metrics.highOpen}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">Requires operator focus</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-tf-1">
          <p className="text-[12px] font-medium text-[#64748B]">Past Due</p>
          <p
            className={`mt-2 font-display text-[28px] font-bold tracking-tight tabular-nums ${
              metrics.overdueCount > 0 ? 'text-[#EF4444]' : 'text-[#131B2E]'
            }`}
          >
            {metrics.overdueCount}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">Open past target date</p>
        </div>
      </div>

      {/* Stage Distribution & Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-tf-1 space-y-5">
          <div>
            <h2 className="font-display text-[17px] font-semibold text-[#131B2E]">
              Workflow Stage Breakdown
            </h2>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              Distribution of tasks across current Kanban columns.
            </p>
          </div>

          <div className="space-y-4">
            {statusDistribution.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-[#334155]">{item.label}</span>
                  <span className="tabular-nums font-mono text-[12px] text-[#64748B]">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${item.bar}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-tf-1 space-y-5">
          <div>
            <h2 className="font-display text-[17px] font-semibold text-[#131B2E]">
              Project Completion
            </h2>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              Milestone progress across active workspace initiatives.
            </p>
          </div>

          <div className="space-y-4">
            {projectProgress.map(({ project, total, done, pct }) => {
              const accent = PROJECT_ACCENTS[project.accent] ?? PROJECT_ACCENTS.indigo;
              return (
                <div key={project.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="inline-flex items-center gap-2 font-medium text-[#131B2E]">
                      <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                      {project.name}
                    </span>
                    <span className="tabular-nums font-mono text-[12px] text-[#64748B]">
                      {done}/{total} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${accent.dot}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Team Workload Table */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-tf-1">
        <h2 className="font-display text-[17px] font-semibold text-[#131B2E] mb-4">
          Operator Workload
        </h2>
        <div className="divide-y divide-[#F1F5F9]">
          {memberLoad.map(({ member, open, done }) => (
            <div key={member.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar memberId={member.id} size="md" />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#131B2E] truncate">
                    {member.name}
                  </p>
                  <p className="text-[12px] text-[#64748B] truncate">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0 text-[13px] tabular-nums font-mono">
                <div className="text-right">
                  <span className="font-semibold text-[#131B2E]">{open}</span>
                  <span className="text-[#64748B] ml-1.5 font-sans text-[12px]">open</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-[#10B981]">{done}</span>
                  <span className="text-[#64748B] ml-1.5 font-sans text-[12px]">done</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
