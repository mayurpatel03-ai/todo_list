import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
} from '../lib/firebase';
import {
  BLUEPRINT_LIMITS,
  buildStarterData,
  generateId,
  getLocalIsoDate,
  Project,
  ProjectAccent,
  sanitizeId,
  Subtask,
  TaskItem,
  TaskPriority,
  TaskStatus,
  WorkspaceScreen,
} from '../types/taskflow';

const LOCAL_STORAGE_KEY = 'taskflow_local_workspace_v1';

interface LocalWorkspaceState {
  projects: Project[];
  tasks: TaskItem[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assigneeId?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  accent?: ProjectAccent;
}

interface TaskFlowContextValue {
  user: User | null;
  authReady: boolean;
  isLoadingData: boolean;
  isSyncing: boolean;
  projects: Project[];
  tasks: TaskItem[];
  activeScreen: WorkspaceScreen;
  setActiveScreen: (screen: WorkspaceScreen) => void;
  selectedProjectId: string | 'all';
  setSelectedProjectId: (projectId: string | 'all') => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (taskId: string | null) => void;
  selectedTask: TaskItem | null;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isNewTaskModalOpen: boolean;
  setIsNewTaskModalOpen: (open: boolean) => void;
  newTaskDefaultStatus: TaskStatus;
  openNewTaskModal: (defaultStatus?: TaskStatus) => void;
  isNewProjectModalOpen: boolean;
  setIsNewProjectModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  dismissToast: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<TaskItem | null>;
  updateTask: (
    taskId: string,
    patch: Partial<
      Pick<
        TaskItem,
        | 'title'
        | 'description'
        | 'status'
        | 'priority'
        | 'dueDate'
        | 'assigneeId'
        | 'projectId'
        | 'subtasks'
        | 'order'
      >
    >
  ) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  snoozeTaskOneDay: (taskId: string) => Promise<void>;
  cycleTaskPriority: (taskId: string) => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project | null>;
  archiveProject: (projectId: string) => Promise<void>;
}

const TaskFlowContext = createContext<TaskFlowContextValue | null>(null);

function sanitizeSubtasks(raw: Subtask[]): Subtask[] {
  return raw
    .slice(0, BLUEPRINT_LIMITS.MAX_SUBTASKS)
    .map((s) => ({
      id: sanitizeId(s.id || generateId('sub')),
      title: (s.title || 'Subtask').trim().slice(0, BLUEPRINT_LIMITS.SUBTASK_TITLE_MAX) || 'Subtask',
      done: Boolean(s.done),
    }));
}

function loadLocalWorkspace(): LocalWorkspaceState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalWorkspaceState;
      if (Array.isArray(parsed.projects) && Array.isArray(parsed.tasks) && parsed.projects.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore corrupt localStorage
  }
  const starter = buildStarterData('local_operator');
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(starter));
  } catch {
    // Ignore storage quota errors
  }
  return starter;
}

export const TaskFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const [activeScreen, setActiveScreen] = useState<WorkspaceScreen>('today');
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState<TaskStatus>('backlog');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K for Command Palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        else if (isNewTaskModalOpen) setIsNewTaskModalOpen(false);
        else if (isNewProjectModalOpen) setIsNewProjectModalOpen(false);
        else if (selectedTaskId) setSelectedTaskId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCommandPaletteOpen, isNewTaskModalOpen, isNewProjectModalOpen, selectedTaskId]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Ensure user private profile & seed starter workspace if empty
  const ensureUserWorkspaceInitialized = useCallback(async (firebaseUser: User) => {
    const uid = firebaseUser.uid;
    const profilePath = `users/${uid}/private/profile`;
    const profileRef = doc(db, 'users', uid, 'private', 'profile');

    try {
      const snap = await getDoc(profileRef);
      const safeEmail = (firebaseUser.email || 'user@taskflow.app').slice(0, 254);
      const safeDisplayName = (firebaseUser.displayName || 'TaskFlow Operator').slice(0, 100);

      if (!snap.exists()) {
        await setDoc(profileRef, {
          uid,
          email: safeEmail,
          displayName: safeDisplayName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Seed starter projects + tasks atomically in one batch
        const starter = buildStarterData(uid);
        const batch = writeBatch(db);

        for (const p of starter.projects) {
          const pRef = doc(db, 'users', uid, 'projects', p.id);
          batch.set(pRef, {
            id: p.id,
            ownerId: uid,
            name: p.name.slice(0, BLUEPRINT_LIMITS.PROJECT_NAME_MAX),
            description: p.description.slice(0, BLUEPRINT_LIMITS.PROJECT_DESC_MAX),
            accent: p.accent,
            archived: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        for (const t of starter.tasks) {
          const tRef = doc(db, 'users', uid, 'tasks', t.id);
          batch.set(tRef, {
            id: t.id,
            ownerId: uid,
            projectId: t.projectId,
            title: t.title.slice(0, BLUEPRINT_LIMITS.TASK_TITLE_MAX),
            description: t.description.slice(0, BLUEPRINT_LIMITS.TASK_DESC_MAX),
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate.slice(0, BLUEPRINT_LIMITS.DUE_DATE_MAX),
            assigneeId: t.assigneeId.slice(0, BLUEPRINT_LIMITS.ASSIGNEE_ID_MAX),
            subtasks: sanitizeSubtasks(t.subtasks),
            order: t.order,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        await batch.commit();
      } else {
        await updateDoc(profileRef, {
          email: safeEmail,
          displayName: safeDisplayName,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, profilePath);
    }
  }, []);

  // Sync projects & tasks from Firestore (when signed in) or localStorage (preview mode)
  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      const local = loadLocalWorkspace();
      setProjects(local.projects);
      setTasks(local.tasks);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    let cancelled = false;
    let unsubProjects = () => {};
    let unsubTasks = () => {};

    const startSync = async () => {
      try {
        await ensureUserWorkspaceInitialized(user);
      } catch (err) {
        if (!cancelled) setFatalError(err as Error);
        return;
      }

      if (cancelled) return;

      const projectsPath = `users/${user.uid}/projects`;
      const tasksPath = `users/${user.uid}/tasks`;

      const projectsQuery = query(
        collection(db, projectsPath),
        where('ownerId', '==', user.uid)
      );
      const tasksQuery = query(
        collection(db, tasksPath),
        where('ownerId', '==', user.uid)
      );

      unsubProjects = onSnapshot(
        projectsQuery,
        (snapshot) => {
          const list: Project[] = snapshot.docs.map((d) => d.data() as Project);
          setProjects(list.filter((p) => !p.archived));
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.LIST, projectsPath);
          } catch (err) {
            setFatalError(err as Error);
          }
        }
      );

      unsubTasks = onSnapshot(
        tasksQuery,
        (snapshot) => {
          const list: TaskItem[] = snapshot.docs
            .map((d) => d.data() as TaskItem)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setTasks(list);
          setIsLoadingData(false);
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.LIST, tasksPath);
          } catch (err) {
            setFatalError(err as Error);
          }
        }
      );
    };

    void startSync();

    return () => {
      cancelled = true;
      unsubProjects();
      unsubTasks();
    };
  }, [authReady, user, ensureUserWorkspaceInitialized]);

  // Persist local workspace changes when signed out
  const saveLocalState = useCallback((nextProjects: Project[], nextTasks: TaskItem[]) => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ projects: nextProjects, tasks: nextTasks })
      );
    } catch {
      // Ignore quota errors
    }
  }, []);

  if (fatalError) {
    throw fatalError;
  }

  const signIn = useCallback(async () => {
    try {
      await signInWithGoogle();
      showToast('Signed in to TaskFlow Cloud Sync');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled';
      if (!msg.includes('popup-closed-by-user')) {
        showToast('Unable to complete Google sign-in');
      }
    }
  }, [showToast]);

  const signOut = useCallback(async () => {
    await signOutUser();
    setSelectedTaskId(null);
    setSelectedProjectId('all');
    showToast('Signed out · Switched to local preview');
  }, [showToast]);

  const openNewTaskModal = useCallback((defaultStatus: TaskStatus = 'backlog') => {
    setNewTaskDefaultStatus(defaultStatus);
    setIsNewTaskModalOpen(true);
  }, []);

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<TaskItem | null> => {
      const trimmedTitle = input.title.trim().slice(0, BLUEPRINT_LIMITS.TASK_TITLE_MAX);
      if (!trimmedTitle) return null;

      const fallbackProject = projects[0]?.id || 'proj_core_platform';
      const targetProjectId = projects.some((p) => p.id === input.projectId)
        ? input.projectId
        : fallbackProject;

      const taskId = generateId('task');
      const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order || 0), 0);
      const ownerId = user ? user.uid : 'local_operator';

      const newTask: TaskItem = {
        id: taskId,
        ownerId,
        projectId: targetProjectId,
        title: trimmedTitle,
        description: (input.description || '').trim().slice(0, BLUEPRINT_LIMITS.TASK_DESC_MAX),
        status: input.status || 'backlog',
        priority: input.priority || 'medium',
        dueDate: (input.dueDate ?? getLocalIsoDate(0)).slice(0, BLUEPRINT_LIMITS.DUE_DATE_MAX),
        assigneeId: sanitizeId(input.assigneeId || 'member_maya').slice(
          0,
          BLUEPRINT_LIMITS.ASSIGNEE_ID_MAX
        ),
        subtasks: [],
        order: maxOrder + 1,
      };

      if (!user) {
        const nextTasks = [...tasks, newTask];
        setTasks(nextTasks);
        saveLocalState(projects, nextTasks);
        showToast('Task created');
        return newTask;
      }

      const path = `users/${user.uid}/tasks/${taskId}`;
      setIsSyncing(true);
      try {
        await setDoc(doc(db, path), {
          ...newTask,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Task saved');
        return newTask;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    [projects, tasks, user, saveLocalState, showToast]
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      patch: Partial<
        Pick<
          TaskItem,
          | 'title'
          | 'description'
          | 'status'
          | 'priority'
          | 'dueDate'
          | 'assigneeId'
          | 'projectId'
          | 'subtasks'
          | 'order'
        >
      >
    ) => {
      const existingTask = tasks.find((t) => t.id === taskId);
      if (!existingTask) return;

      const sanitizedPatch: Record<string, unknown> = {};
      if (patch.title !== undefined) {
        const t = patch.title.trim().slice(0, BLUEPRINT_LIMITS.TASK_TITLE_MAX);
        if (!t) return;
        sanitizedPatch.title = t;
      }
      if (patch.description !== undefined) {
        sanitizedPatch.description = patch.description
          .trim()
          .slice(0, BLUEPRINT_LIMITS.TASK_DESC_MAX);
      }
      if (patch.status !== undefined) sanitizedPatch.status = patch.status;
      if (patch.priority !== undefined) sanitizedPatch.priority = patch.priority;
      if (patch.dueDate !== undefined) {
        sanitizedPatch.dueDate = patch.dueDate.slice(0, BLUEPRINT_LIMITS.DUE_DATE_MAX);
      }
      if (patch.assigneeId !== undefined) {
        sanitizedPatch.assigneeId = sanitizeId(patch.assigneeId).slice(
          0,
          BLUEPRINT_LIMITS.ASSIGNEE_ID_MAX
        );
      }
      if (patch.projectId !== undefined && projects.some((p) => p.id === patch.projectId)) {
        sanitizedPatch.projectId = patch.projectId;
      }
      if (patch.subtasks !== undefined) {
        sanitizedPatch.subtasks = sanitizeSubtasks(patch.subtasks);
      }
      if (patch.order !== undefined) sanitizedPatch.order = patch.order;

      if (!user) {
        const nextTasks = tasks.map((t) =>
          t.id === taskId ? { ...t, ...(sanitizedPatch as Partial<TaskItem>) } : t
        );
        setTasks(nextTasks);
        saveLocalState(projects, nextTasks);
        return;
      }

      const path = `users/${user.uid}/tasks/${taskId}`;
      setIsSyncing(true);
      try {
        await updateDoc(doc(db, path), {
          ...sanitizedPatch,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setIsSyncing(false);
      }
    },
    [tasks, projects, user, saveLocalState]
  );

  const toggleTaskComplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const nextStatus: TaskStatus = task.status === 'completed' ? 'in_progress' : 'completed';
      await updateTask(taskId, { status: nextStatus });
    },
    [tasks, updateTask]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }

      if (!user) {
        const nextTasks = tasks.filter((t) => t.id !== taskId);
        setTasks(nextTasks);
        saveLocalState(projects, nextTasks);
        showToast('Task deleted');
        return;
      }

      const path = `users/${user.uid}/tasks/${taskId}`;
      setIsSyncing(true);
      try {
        await deleteDoc(doc(db, path));
        showToast('Task deleted');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      } finally {
        setIsSyncing(false);
      }
    },
    [selectedTaskId, tasks, projects, user, saveLocalState, showToast]
  );

  const snoozeTaskOneDay = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const baseDateStr = task.dueDate || getLocalIsoDate(0);
      const parts = baseDateStr.split('-').map(Number);
      const d =
        parts.length === 3 && !parts.some(Number.isNaN)
          ? new Date(parts[0], parts[1] - 1, parts[2])
          : new Date();
      d.setDate(d.getDate() + 1);
      const nextDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      await updateTask(taskId, { dueDate: nextDate });
      showToast('Snoozed +1 day');
    },
    [tasks, updateTask, showToast]
  );

  const cycleTaskPriority = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const order: TaskPriority[] = ['high', 'medium', 'low'];
      const next = order[(order.indexOf(task.priority) + 1) % order.length];
      await updateTask(taskId, { priority: next });
    },
    [tasks, updateTask]
  );

  const createProject = useCallback(
    async (input: CreateProjectInput): Promise<Project | null> => {
      const trimmedName = input.name.trim().slice(0, BLUEPRINT_LIMITS.PROJECT_NAME_MAX);
      if (!trimmedName) return null;

      const projectId = generateId('proj');
      const ownerId = user ? user.uid : 'local_operator';
      const newProject: Project = {
        id: projectId,
        ownerId,
        name: trimmedName,
        description: (input.description || '').trim().slice(0, BLUEPRINT_LIMITS.PROJECT_DESC_MAX),
        accent: input.accent || 'indigo',
        archived: false,
      };

      if (!user) {
        const nextProjects = [...projects, newProject];
        setProjects(nextProjects);
        saveLocalState(nextProjects, tasks);
        setSelectedProjectId(projectId);
        showToast(`Created "${trimmedName}"`);
        return newProject;
      }

      const path = `users/${user.uid}/projects/${projectId}`;
      setIsSyncing(true);
      try {
        await setDoc(doc(db, path), {
          ...newProject,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setSelectedProjectId(projectId);
        showToast(`Created "${trimmedName}"`);
        return newProject;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    [projects, tasks, user, saveLocalState, showToast]
  );

  const archiveProject = useCallback(
    async (projectId: string) => {
      if (projects.length <= 1) {
        showToast('At least one active project is required');
        return;
      }
      if (!user) {
        const nextProjects = projects.filter((p) => p.id !== projectId);
        setProjects(nextProjects);
        saveLocalState(nextProjects, tasks);
        if (selectedProjectId === projectId) setSelectedProjectId('all');
        showToast('Project archived');
        return;
      }

      const path = `users/${user.uid}/projects/${projectId}`;
      setIsSyncing(true);
      try {
        await updateDoc(doc(db, path), {
          archived: true,
          updatedAt: serverTimestamp(),
        });
        if (selectedProjectId === projectId) setSelectedProjectId('all');
        showToast('Project archived');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setIsSyncing(false);
      }
    },
    [projects, tasks, user, selectedProjectId, saveLocalState, showToast]
  );

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const value = useMemo<TaskFlowContextValue>(
    () => ({
      user,
      authReady,
      isLoadingData,
      isSyncing,
      projects,
      tasks,
      activeScreen,
      setActiveScreen,
      selectedProjectId,
      setSelectedProjectId,
      selectedTaskId,
      setSelectedTaskId,
      selectedTask,
      sidebarCollapsed,
      setSidebarCollapsed,
      isCommandPaletteOpen,
      setIsCommandPaletteOpen,
      isNewTaskModalOpen,
      setIsNewTaskModalOpen,
      newTaskDefaultStatus,
      openNewTaskModal,
      isNewProjectModalOpen,
      setIsNewProjectModalOpen,
      toastMessage,
      dismissToast: () => setToastMessage(null),
      signIn,
      signOut,
      createTask,
      updateTask,
      toggleTaskComplete,
      deleteTask,
      snoozeTaskOneDay,
      cycleTaskPriority,
      createProject,
      archiveProject,
    }),
    [
      user,
      authReady,
      isLoadingData,
      isSyncing,
      projects,
      tasks,
      activeScreen,
      selectedProjectId,
      selectedTaskId,
      selectedTask,
      sidebarCollapsed,
      isCommandPaletteOpen,
      isNewTaskModalOpen,
      newTaskDefaultStatus,
      openNewTaskModal,
      isNewProjectModalOpen,
      toastMessage,
      signIn,
      signOut,
      createTask,
      updateTask,
      toggleTaskComplete,
      deleteTask,
      snoozeTaskOneDay,
      cycleTaskPriority,
      createProject,
      archiveProject,
    ]
  );

  return <TaskFlowContext.Provider value={value}>{children}</TaskFlowContext.Provider>;
};

export function useTaskFlow(): TaskFlowContextValue {
  const ctx = useContext(TaskFlowContext);
  if (!ctx) {
    throw new Error('useTaskFlow must be used inside TaskFlowProvider');
  }
  return ctx;
}
