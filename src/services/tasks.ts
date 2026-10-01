export type Task = {
  id: string;
  title: string;
  done: boolean;
};

// In-memory mock until a real tasks API exists. Stored on globalThis so it
// survives dev hot reloads; it resets whenever the server restarts.
const store = globalThis as typeof globalThis & { __tasks?: Task[] };

export const getTasks = async (): Promise<Task[]> => {
  store.__tasks ??= [];

  return store.__tasks;
};

export const addTask = async (title: string): Promise<Task> => {
  const task: Task = { id: crypto.randomUUID(), title, done: false };
  store.__tasks = [...(await getTasks()), task];

  return task;
};

// Unknown ids are a no-op and return null, e.g. a task deleted in another tab.
export const toggleTask = async (id: string): Promise<Task | null> => {
  const tasks = await getTasks();
  const current = tasks.find((task) => task.id === id);

  if (!current) return null;

  const updated: Task = { ...current, done: !current.done };
  store.__tasks = tasks.map((task) => (task.id === id ? updated : task));

  return updated;
};

export const deleteTask = async (id: string): Promise<boolean> => {
  const tasks = await getTasks();
  const remaining = tasks.filter((task) => task.id !== id);
  store.__tasks = remaining;

  return remaining.length !== tasks.length;
};
