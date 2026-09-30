import type { Metadata } from "next";
import { connection } from "next/server";
import { getProfile } from "@/services/profile";
import ProfileForm from "./ProfileForm";
import styles from "./profile.module.css";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  // The profile is per-request data, so opt out of static prerendering.
  await connection();
  const profile = await getProfile();

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Profile</h1>
      <ProfileForm profile={profile} />
    </main>
  );
}
