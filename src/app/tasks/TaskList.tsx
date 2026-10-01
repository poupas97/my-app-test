import type { Task } from "@/services/tasks";
import { removeTask, toggleTaskDone } from "./actions";
import styles from "./tasks.module.css";

type TaskListProps = {
  tasks: Task[];
};

export default function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className={styles.empty}>No tasks yet. Add your first one above.</p>;
  }

  return (
    <ul className={styles.list}>
      {tasks.map(({ id, title, done }) => (
        <li key={id} className={styles.item} data-done={done}>
          <form action={toggleTaskDone}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={styles.check} aria-pressed={done}>
              <span className={styles.srOnly}>{`Mark "${title}" as done`}</span>
            </button>
          </form>

          <span className={styles.itemTitle}>{title}</span>

          <form action={removeTask}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={styles.delete}>
              Delete<span className={styles.srOnly}>{` "${title}"`}</span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
