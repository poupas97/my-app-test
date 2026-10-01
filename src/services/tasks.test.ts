/** @jest-environment node */
import { addTask, deleteTask, getTasks, toggleTask, type Task } from "./tasks";

const store = globalThis as typeof globalThis & { __tasks?: Task[] };

const SEEDED: Task[] = [
  { id: "a", title: "Buy milk", done: false },
  { id: "b", title: "Walk dog", done: true },
];

beforeEach(() => {
  delete store.__tasks;
});

describe("getTasks", () => {
  it("starts with an empty list", async () => {
    await expect(getTasks()).resolves.toEqual([]);
  });

  it("returns the existing tasks", async () => {
    store.__tasks = [...SEEDED];

    await expect(getTasks()).resolves.toEqual(SEEDED);
  });
});

describe("addTask", () => {
  it("appends a not-done task with a unique id", async () => {
    const first = await addTask("First");
    const second = await addTask("Second");

    expect(first).toEqual({ id: expect.any(String), title: "First", done: false });
    expect(second.id).not.toBe(first.id);
    await expect(getTasks()).resolves.toEqual([first, second]);
  });

  it("does not mutate a previously returned list", async () => {
    const before = await getTasks();

    await addTask("First");

    expect(before).toEqual([]);
  });
});

describe("toggleTask", () => {
  beforeEach(() => {
    store.__tasks = [...SEEDED];
  });

  it("flips done on the matching task only", async () => {
    await expect(toggleTask("a")).resolves.toEqual({ ...SEEDED[0], done: true });
    await expect(toggleTask("b")).resolves.toEqual({ ...SEEDED[1], done: false });

    await expect(getTasks()).resolves.toEqual([
      { ...SEEDED[0], done: true },
      { ...SEEDED[1], done: false },
    ]);
  });

  it("returns null and changes nothing for an unknown id", async () => {
    await expect(toggleTask("missing")).resolves.toBeNull();
    await expect(getTasks()).resolves.toEqual(SEEDED);
  });
});

describe("deleteTask", () => {
  beforeEach(() => {
    store.__tasks = [...SEEDED];
  });

  it("removes the matching task and reports it", async () => {
    await expect(deleteTask("a")).resolves.toBe(true);
    await expect(getTasks()).resolves.toEqual([SEEDED[1]]);
  });

  it("returns false and changes nothing for an unknown id", async () => {
    await expect(deleteTask("missing")).resolves.toBe(false);
    await expect(getTasks()).resolves.toEqual(SEEDED);
  });
});
