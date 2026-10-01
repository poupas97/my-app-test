"use server";

import { revalidatePath } from "next/cache";
import { addTask, deleteTask, toggleTask } from "@/services/tasks";
import { validateTitle } from "./validation";

export type TaskFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const readString = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
};

export const createTask = async (_prevState: TaskFormState, formData: FormData): Promise<TaskFormState> => {
  const title = readString(formData, "title");
  const error = validateTitle(title);

  if (error) return { status: "error", message: error };

  await addTask(title.trim());
  revalidatePath("/tasks");

  return { status: "success", message: "Task added." };
};

export const toggleTaskDone = async (formData: FormData): Promise<void> => {
  const id = readString(formData, "id");
  if (!id) return;

  await toggleTask(id);
  revalidatePath("/tasks");
};

export const removeTask = async (formData: FormData): Promise<void> => {
  const id = readString(formData, "id");
  if (!id) return;

  await deleteTask(id);
  revalidatePath("/tasks");
};
