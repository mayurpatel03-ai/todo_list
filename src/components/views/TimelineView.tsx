import React, { useMemo } from 'react';
import { Calendar, ArrowUpRight } from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { getLocalIsoDate, TaskItem } from '../../types/taskflow';
import { TaskRow } from '../TaskRow';

interface HorizonBucket {
  id: string;
  label: string;
  accentClass: string;
  tasks: TaskItem[];
}

export const TimelineView: React.FC = () => {
  const { tasks, selectedProjectId, updateTask } = useTaskFlow();

  const today = getLocalIsoDate(0);
  const tomorrow = getLocalIsoDate(1);
  const weekEnd = getLocalIsoDate(7);

  const buckets = useMemo<HorizonBucket[]>(() => {
    const scoped = (
      selectedProjectId === 'all'
        ? tasks
        : tasks.filter((t) => t.projectId === selectedProjectId)
    ).filter((t) => t.status !== 'completed');

    const sorted = [...scoped].sort((a, b) => {
      const da = a.dueDate || '9999-12-31';
      const db = b.dueDate || '9999-12-31';
      return da.localeCompare(db);
    });

    const overdueList: TaskItem[] = [];
    const todayList: TaskItem[] = [];
    const tomorrowList: TaskItem[] = [];
    const thisWeekList: TaskItem[] = [];
    const laterList: TaskItem[] = [];

    for (const t of sorted) {
      if (!t.dueDate || t.dueDate > weekEnd) {
        laterList.push(t);
      } else if (t.dueDate < today) {
        overdueList.push(t);
      } else if (t.dueDate === today) {
        todayList.push(t);
      } else if (t.dueDate === tomorrow) {
        tomorrowList.push(t);
      } else {
        thisWeekList.push(t);
      }
    }

    return [
      { id: 'overdue', label: 'Overdue', accentClass: 'text-[#EF4444]', tasks: overdueList },
      { id: 'today', label: 'Today', accentClass: 'text-[#3525CD]', tasks: todayList },
      { id: 'tomorrow', label: 'Tomorrow', accentClass: 'text-[#131B2E]', tasks: tomorrowList },
      { id: 'week', label: 'Next 7 Days', accentClass: 'text-[#131B2E]', tasks: thisWeekList },
      { id: 'later', label: 'Later & Unscheduled', accentClass: 'text-[#64748B]', tasks: laterList },
    ];
  }, [tasks, selectedProjectId, today, tomorrow, weekEnd]);

  const moveAllOverdueToToday = async () => {
    const overdue = buckets.find((b) => b.id === 'overdue')?.tasks || [];
    for (const t of overdue) {
      await updateTask(t.id, { dueDate: today });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] sm:text-[28px] font-semibold tracking-[-0.015em] text-[#131B2E]">
            Timeline &amp; Horizon
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Chronological schedule of open deliverables across upcoming milestones.
          </p>
        </div>

        {(buckets.find((b) => b.id === 'overdue')?.tasks.length || 0) > 0 && (
          <button
            type="button"
            onClick={() => void moveAllOverdueToToday()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#FAF8FF] text-[12px] font-medium text-[#334155] transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-[#4F46E5]" />
            Reschedule overdue to Today
          </button>
        )}
      </div>

      <div className="space-y-6">
        {buckets.map((bucket) => (
          <section key={bucket.id} className="space-y-2.5">
            <div className="flex items-center justify-between px-1 border-b border-[#E2E8F0] pb-2">
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${bucket.accentClass}`} />
                <h2 className={`font-display text-[15px] font-semibold ${bucket.accentClass}`}>
                  {bucket.label}
                </h2>
              </div>
              <span className="tabular-nums font-mono text-[12px] text-[#64748B]">
                {bucket.tasks.length}
              </span>
            </div>

            {bucket.tasks.length === 0 ? (
              <p className="px-1 py-2 text-[13px] text-[#94A3B8]">
                No tasks scheduled in this window.
              </p>
            ) : (
              <div className="space-y-2">
                {bucket.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} showProject={selectedProjectId === 'all'} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};
