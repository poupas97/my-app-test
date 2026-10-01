import type { Metadata } from "next";
import { connection } from "next/server";
import { getTasks } from "@/services/tasks";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import styles from "./tasks.module.css";

export const metadata: Metadata = {
  title: "Tasks",
};

export default async function TasksPage() {
  // Tasks are per-request data, so opt out of static prerendering.
  await connection();
  const tasks = await getTasks();
  const doneCount = tasks.filter((task) => task.done).length;

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tasks</h1>
        {tasks.length > 0 && (
          <p className={styles.summary}>
            {doneCount} of {tasks.length} done
          </p>
        )}
      </div>
      <TaskForm />
      <TaskList tasks={tasks} />
    </main>
  );
}
