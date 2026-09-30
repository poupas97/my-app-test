"use server";

import { revalidatePath } from "next/cache";
import { updateProfile, type Profile } from "@/services/profile";
import { validateAvatar, validateName } from "./validation";

export type ProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: { name?: string; avatar?: string };
};

export const saveProfile = async (_prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> => {
  const nameField = formData.get("name");
  const name = typeof nameField === "string" ? nameField : "";
  const avatar = formData.get("avatar");

  const nameError = validateName(name);
  // An empty file input is still submitted as a zero-byte File.
  const hasAvatar = avatar instanceof File && avatar.size > 0;
  const avatarError = hasAvatar ? validateAvatar(avatar) : null;

  if (nameError || avatarError) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: {
        name: nameError ?? undefined,
        avatar: avatarError ?? undefined,
      },
    };
  }

  const changes: Partial<Profile> = { name: name.trim() };

  if (hasAvatar) {
    const base64 = Buffer.from(await avatar.arrayBuffer()).toString("base64");
    changes.avatarUrl = `data:${avatar.type};base64,${base64}`;
  }

  await updateProfile(changes);
  revalidatePath("/profile");

  return { status: "success", message: "Profile updated." };
};
