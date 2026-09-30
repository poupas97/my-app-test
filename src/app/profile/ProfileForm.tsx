"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import Avatar from "@/components/Avatar/Avatar";
import type { Profile } from "@/services/profile";
import { saveProfile, type ProfileFormState } from "./actions";
import { AVATAR_MIME_TYPES, NAME_MAX_LENGTH, validateAvatar } from "./validation";
import styles from "./profile.module.css";

const initialState: ProfileFormState = { status: "idle" };

type ProfileFormProps = {
  profile: Profile;
};

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [name, setName] = useState(profile.name);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarClientError, setAvatarClientError] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState(async (prevState: ProfileFormState, formData: FormData) => {
    const result = await saveProfile(prevState, formData);
    // React resets the file input after the action, so drop its preview.
    setPreview(null);
    return result;
  }, initialState);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPreview(null);
      setAvatarClientError(null);
      return;
    }

    const error = validateAvatar(file);
    setAvatarClientError(error);

    if (error) {
      event.target.value = "";
      setPreview(null);
      return;
    }

    setPreview(URL.createObjectURL(file));
  };

  const nameError = state.errors?.name;
  const avatarError = avatarClientError ?? state.errors?.avatar;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <div className={styles.avatarRow}>
        <Avatar
          name={profile.name}
          src={preview ?? profile.avatarUrl}
          alt={preview ? "New avatar preview" : undefined}
        />

        <div className={styles.field}>
          <label htmlFor="avatar" className={styles.label}>
            Avatar
          </label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept={AVATAR_MIME_TYPES.join(",")}
            onChange={handleAvatarChange}
            aria-invalid={Boolean(avatarError)}
            aria-describedby={avatarError ? "avatar-error" : "avatar-hint"}
            className={styles.fileInput}
          />
          {avatarError ? (
            <p id="avatar-error" className={styles.error}>
              {avatarError}
            </p>
          ) : (
            <p id="avatar-hint" className={styles.hint}>
              PNG, JPEG or WebP, up to 800 KB.
            </p>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="name"
          required
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "name-error" : undefined}
          className={styles.input}
        />
        {nameError && (
          <p id="name-error" className={styles.error}>
            {nameError}
          </p>
        )}
      </div>

      <p role="status" className={state.status === "error" ? styles.error : styles.success}>
        {state.message}
      </p>

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
