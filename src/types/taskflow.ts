export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';
export type ProjectAccent = 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
export type WorkspaceScreen = 'today' | 'board' | 'timeline' | 'analytics';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  accent: ProjectAccent;
  archived: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TaskItem {
  id: string;
  ownerId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD or ''
  assigneeId: string;
  subtasks: Subtask[];
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarUrl: string;
  color: string;
}

// Validation limits synchronized verbatim with firebase-blueprint.json & firestore.rules
export const BLUEPRINT_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  MAX_ID_LEN: 128,
  PROJECT_NAME_MAX: 80,
  PROJECT_DESC_MAX: 300,
  TASK_TITLE_MAX: 160,
  TASK_DESC_MAX: 2000,
  SUBTASK_TITLE_MAX: 200,
  MAX_SUBTASKS: 15,
  DUE_DATE_MAX: 32,
  ASSIGNEE_ID_MAX: 64,
} as const;

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member_maya',
    name: 'Maya Lin',
    role: 'Product Design',
    initials: 'ML',
    avatarUrl: '/src/assets/images/avatar_maya_lin_1795511110277.jpg',
    color: 'bg-[#E2DFFF] text-[#3525CD]',
  },
  {
    id: 'member_daniel',
    name: 'Daniel Kerr',
    role: 'Systems Eng',
    initials: 'DK',
    avatarUrl: '/src/assets/images/avatar_daniel_kerr_1795511111598.jpg',
    color: 'bg-[#D1FAE5] text-[#065F46]',
  },
  {
    id: 'member_elena',
    name: 'Elena Rostova',
    role: 'Eng Lead',
    initials: 'ER',
    avatarUrl: '/src/assets/images/avatar_elena_rostova_1795511111088.jpg',
    color: 'bg-[#FEF3C7] text-[#92400E]',
  },
];

export const PROJECT_ACCENTS: Record<
  ProjectAccent,
  { label: string; dot: string; subtleBg: string; text: string }
> = {
  indigo: {
    label: 'Indigo',
    dot: 'bg-[#4F46E5]',
    subtleBg: 'bg-[#EEF2FF]',
    text: 'text-[#3525CD]',
  },
  emerald: {
    label: 'Emerald',
    dot: 'bg-[#10B981]',
    subtleBg: 'bg-[#ECFDF5]',
    text: 'text-[#047857]',
  },
  amber: {
    label: 'Amber',
    dot: 'bg-[#F59E0B]',
    subtleBg: 'bg-[#FFFBEB]',
    text: 'text-[#B45309]',
  },
  rose: {
    label: 'Rose',
    dot: 'bg-[#EF4444]',
    subtleBg: 'bg-[#FEF2F2]',
    text: 'text-[#B91C1C]',
  },
  slate: {
    label: 'Slate',
    dot: 'bg-[#64748B]',
    subtleBg: 'bg-[#F1F5F9]',
    text: 'text-[#334155]',
  },
};

export const STATUS_COLUMNS: { id: TaskStatus; label: string; shortLabel: string }[] = [
  { id: 'backlog', label: 'Backlog', shortLabel: 'Backlog' },
  { id: 'in_progress', label: 'In Progress', shortLabel: 'In Progress' },
  { id: 'in_review', label: 'In Review', shortLabel: 'In Review' },
  { id: 'completed', label: 'Completed', shortLabel: 'Done' },
];

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, BLUEPRINT_LIMITS.MAX_ID_LEN);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return sanitizeId(`${prefix}_${Date.now().toString(36)}_${rand}`);
}

export function getLocalIsoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return 'No due date';
  const today = getLocalIsoDate(0);
  const tomorrow = getLocalIsoDate(1);
  const yesterday = getLocalIsoDate(-1);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr;
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isOverdue(dateStr: string, status: TaskStatus): boolean {
  if (!dateStr || status === 'completed') return false;
  return dateStr < getLocalIsoDate(0);
}

export function buildStarterData(ownerId: string): { projects: Project[]; tasks: TaskItem[] } {
  const projects: Project[] = [
    {
      id: 'proj_core_platform',
      ownerId,
      name: 'Core Platform',
      description: 'Latency budgets, auth hardening, and workspace sync reliability.',
      accent: 'indigo',
      archived: false,
    },
    {
      id: 'proj_design_system',
      ownerId,
      name: 'Design System 2.0',
      description: 'Scandinavian token architecture, accessible primitives, and motion curves.',
      accent: 'emerald',
      archived: false,
    },
    {
      id: 'proj_q4_launch',
      ownerId,
      name: 'Q4 Customer Launch',
      description: 'Onboarding checklist, migration playbooks, and release readiness.',
      accent: 'amber',
      archived: false,
    },
  ];

  const tasks: TaskItem[] = [
    {
      id: 'task_101',
      ownerId,
      projectId: 'proj_core_platform',
      title: 'Finalize keyboard command palette latency budget',
      description:
        'Profile index filtering across 2,500 cached tasks and keep keystroke-to-render under 16ms.',
      status: 'in_progress',
      priority: 'high',
      dueDate: getLocalIsoDate(0),
      assigneeId: 'member_daniel',
      order: 1,
      subtasks: [
        { id: 'sub_1', title: 'Benchmark fuzzy search memoization', done: true },
        { id: 'sub_2', title: 'Add Esc focus restoration to trigger', done: true },
        { id: 'sub_3', title: 'Verify ⌘K shortcut across macOS and Windows', done: false },
      ],
    },
    {
      id: 'task_102',
      ownerId,
      projectId: 'proj_design_system',
      title: 'Audit WCAG AA contrast across priority tags and muted labels',
      description:
        'Verify 4.5:1 text contrast on all neutral slate surfaces and semantic badges.',
      status: 'in_review',
      priority: 'high',
      dueDate: getLocalIsoDate(0),
      assigneeId: 'member_maya',
      order: 2,
      subtasks: [
        { id: 'sub_4', title: 'Test #64748B on #FAF8FF canvas', done: true },
        { id: 'sub_5', title: 'Verify focus-visible indigo ring visibility', done: false },
      ],
    },
    {
      id: 'task_103',
      ownerId,
      projectId: 'proj_q4_launch',
      title: 'Publish workspace migration guide for enterprise admins',
      description:
        'Document CSV import mapping, role permissions, and audit log retention policies.',
      status: 'in_progress',
      priority: 'medium',
      dueDate: getLocalIsoDate(1),
      assigneeId: 'member_elena',
      order: 3,
      subtasks: [
        { id: 'sub_6', title: 'Draft CSV column schema reference', done: true },
        { id: 'sub_7', title: 'Record 2-minute walkthrough script', done: false },
        { id: 'sub_8', title: 'Review with solutions engineering', done: false },
      ],
    },
    {
      id: 'task_104',
      ownerId,
      projectId: 'proj_core_platform',
      title: 'Resolve optimistic rollback race condition on offline reconnect',
      description:
        'Ensure pending status updates reconcile cleanly without duplicating subtask entries.',
      status: 'backlog',
      priority: 'high',
      dueDate: getLocalIsoDate(-1),
      assigneeId: 'member_daniel',
      order: 4,
      subtasks: [
        { id: 'sub_9', title: 'Reproduce offline queue flush in dev', done: false },
        { id: 'sub_10', title: 'Add idempotency key to task mutations', done: false },
      ],
    },
    {
      id: 'task_105',
      ownerId,
      projectId: 'proj_design_system',
      title: 'Standardize tabular numerals on timeline and sprint counters',
      description:
        'Apply font-variant-numeric: tabular-nums across due dates, subtask ratios, and velocity bars.',
      status: 'completed',
      priority: 'low',
      dueDate: getLocalIsoDate(0),
      assigneeId: 'member_maya',
      order: 5,
      subtasks: [
        { id: 'sub_11', title: 'Update TaskRow metadata slot', done: true },
        { id: 'sub_12', title: 'Update Kanban column header badge', done: true },
      ],
    },
    {
      id: 'task_106',
      ownerId,
      projectId: 'proj_q4_launch',
      title: 'Prepare customer advisory board demo environment',
      description:
        'Seed realistic multi-project board state and validate zero-latency view switching.',
      status: 'backlog',
      priority: 'medium',
      dueDate: getLocalIsoDate(2),
      assigneeId: 'member_elena',
      order: 6,
      subtasks: [],
    },
    {
      id: 'task_107',
      ownerId,
      projectId: 'proj_design_system',
      title: 'Refine mobile bottom navigation touch targets to 44px minimum',
      description:
        'Ensure comfortable thumb reachability and keep sticky height under 15% of viewport.',
      status: 'completed',
      priority: 'medium',
      dueDate: getLocalIsoDate(-1),
      assigneeId: 'member_maya',
      order: 7,
      subtasks: [
        { id: 'sub_13', title: 'Verify 390px iPhone viewport spacing', done: true },
      ],
    },
    {
      id: 'task_108',
      ownerId,
      projectId: 'proj_core_platform',
      title: 'Configure automated weekly workspace digest export',
      description:
        'Generate clean JSON/CSV summary of completed milestones per project.',
      status: 'backlog',
      priority: 'low',
      dueDate: getLocalIsoDate(4),
      assigneeId: 'member_daniel',
      order: 8,
      subtasks: [],
    },
  ];

  return { projects, tasks };
}
