"use client";

import { useActionState, useState } from "react";
import { createTask, type TaskFormState } from "./actions";
import { TITLE_MAX_LENGTH } from "./validation";
import styles from "./tasks.module.css";

const initialState: TaskFormState = { status: "idle" };

export default function TaskForm() {
  const [title, setTitle] = useState("");

  const [state, formAction, pending] = useActionState(async (prevState: TaskFormState, formData: FormData) => {
    const result = await createTask(prevState, formData);
    // Keep the typed title on errors so it can be fixed instead of retyped.
    if (result.status === "success") setTitle("");
    return result;
  }, initialState);

  const error = state.status === "error" ? state.message : undefined;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <div className={styles.field}>
        <label htmlFor="title" className={styles.label}>
          New task
        </label>
        <div className={styles.inputRow}>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            autoComplete="off"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "title-error" : undefined}
            className={styles.input}
          />
          <button type="submit" className={styles.submit} disabled={pending}>
            {pending ? "Adding…" : "Add task"}
          </button>
        </div>
      </div>

      <p id="title-error" role="status" className={error ? styles.error : styles.success}>
        {state.message}
      </p>
    </form>
  );
}
