import { render, screen, within } from "@testing-library/react";
import type { Task } from "@/services/tasks";
import TaskList from "./TaskList";

jest.mock("./actions", () => ({
  toggleTaskDone: jest.fn(),
  removeTask: jest.fn(),
}));

const TASKS: Task[] = [
  { id: "a", title: "Buy milk", done: false },
  { id: "b", title: "Walk dog", done: true },
];

describe("TaskList", () => {
  it("shows an empty state when there are no tasks", () => {
    render(<TaskList tasks={[]} />);

    expect(screen.getByText("No tasks yet. Add your first one above.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders one item per task in order", () => {
    render(<TaskList tasks={TASKS} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Buy milk");
    expect(items[1]).toHaveTextContent("Walk dog");
  });

  it("exposes each task's done state on a uniquely named toggle", () => {
    render(<TaskList tasks={TASKS} />);

    expect(screen.getByRole("button", { name: 'Mark "Buy milk" as done' })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: 'Mark "Walk dog" as done' })).toHaveAttribute("aria-pressed", "true");
  });

  it("names each delete button after its task and submits the task id", () => {
    render(<TaskList tasks={TASKS} />);

    const button = screen.getByRole("button", { name: 'Delete "Walk dog"' });
    const form = button.closest("form");

    expect(form).not.toBeNull();
    expect(new FormData(form!).get("id")).toBe("b");
    expect(within(screen.getAllByRole("listitem")[1]).getByText("Walk dog")).toBeInTheDocument();
  });
});
