/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { getTasks, type Task } from "@/services/tasks";
import { createTask, removeTask, toggleTaskDone, type TaskFormState } from "./actions";
import { TITLE_MAX_LENGTH } from "./validation";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const revalidatePathMock = jest.mocked(revalidatePath);
const store = globalThis as typeof globalThis & { __tasks?: Task[] };

const SEEDED: Task[] = [
  { id: "a", title: "Buy milk", done: false },
  { id: "b", title: "Walk dog", done: true },
];
const idle: TaskFormState = { status: "idle" };

const buildForm = (fields: Record<string, string | File>) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
  return formData;
};

beforeEach(() => {
  store.__tasks = [...SEEDED];
  revalidatePathMock.mockClear();
});

const expectUntouched = async () => {
  await expect(getTasks()).resolves.toEqual(SEEDED);
  expect(revalidatePathMock).not.toHaveBeenCalled();
};

describe("createTask", () => {
  it("adds the trimmed title and revalidates /tasks", async () => {
    const result = await createTask(idle, buildForm({ title: "  Call mum  " }));

    expect(result).toEqual({ status: "success", message: "Task added." });
    const tasks = await getTasks();
    expect(tasks).toHaveLength(3);
    expect(tasks[2]).toEqual({ id: expect.any(String), title: "Call mum", done: false });
    expect(revalidatePathMock).toHaveBeenCalledWith("/tasks");
  });

  it.each([
    ["blank", "   ", "Title is required."],
    ["too long", "a".repeat(TITLE_MAX_LENGTH + 1), `Title must be at most ${TITLE_MAX_LENGTH} characters.`],
  ])("rejects a %s title", async (_label, title, message) => {
    const result = await createTask(idle, buildForm({ title }));

    expect(result).toEqual({ status: "error", message });
    await expectUntouched();
  });

  it.each([
    ["missing", {}],
    ["a file instead of text", { title: new File(["x"], "x.txt") }],
  ])("treats a %s title as blank", async (_label, fields) => {
    const result = await createTask(idle, buildForm(fields));

    expect(result).toEqual({ status: "error", message: "Title is required." });
    await expectUntouched();
  });
});

describe("toggleTaskDone", () => {
  it("toggles the task and revalidates /tasks", async () => {
    await toggleTaskDone(buildForm({ id: "a" }));

    await expect(getTasks()).resolves.toEqual([{ ...SEEDED[0], done: true }, SEEDED[1]]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/tasks");
  });

  it("ignores a submission without an id", async () => {
    await toggleTaskDone(buildForm({}));

    await expectUntouched();
  });
});

describe("removeTask", () => {
  it("deletes the task and revalidates /tasks", async () => {
    await removeTask(buildForm({ id: "b" }));

    await expect(getTasks()).resolves.toEqual([SEEDED[0]]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/tasks");
  });

  it("ignores a submission without an id", async () => {
    await removeTask(buildForm({}));

    await expectUntouched();
  });
});
