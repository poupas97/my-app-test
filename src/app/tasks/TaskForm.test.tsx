import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTask } from "./actions";
import TaskForm from "./TaskForm";

jest.mock("./actions", () => ({
  createTask: jest.fn(),
}));

const createTaskMock = jest.mocked(createTask);

beforeEach(() => {
  createTaskMock.mockReset();
});

const setup = () => {
  const user = userEvent.setup();
  render(<TaskForm />);
  return {
    user,
    input: screen.getByLabelText("New task"),
    submit: screen.getByRole("button", { name: "Add task" }),
  };
};

describe("TaskForm", () => {
  it("submits the typed title and clears the input on success", async () => {
    createTaskMock.mockResolvedValue({ status: "success", message: "Task added." });
    const { user, input, submit } = setup();

    await user.type(input, "Buy milk");
    await user.click(submit);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Task added."));
    const formData = createTaskMock.mock.calls[0][1];
    expect(formData.get("title")).toBe("Buy milk");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("keeps the title and flags the input on a validation error", async () => {
    createTaskMock.mockResolvedValue({ status: "error", message: "Title is required." });
    const { user, input, submit } = setup();

    await user.type(input, "   ");
    await user.click(submit);

    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    expect(input).toHaveValue("   ");
    expect(input).toHaveAccessibleDescription("Title is required.");
  });

  it("disables the button while the task is being added", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof createTask>>) => void;
    createTaskMock.mockReturnValue(new Promise((res) => (resolve = res)));
    const { user, input, submit } = setup();

    await user.type(input, "Buy milk");
    await user.click(submit);

    await waitFor(() => expect(submit).toBeDisabled());
    expect(submit).toHaveTextContent("Adding…");

    resolve({ status: "success", message: "Task added." });
    await waitFor(() => expect(submit).toBeEnabled());
  });
});
