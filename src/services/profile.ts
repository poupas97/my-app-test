export type Profile = {
  name: string;
  avatarUrl: string | null;
};

// In-memory mock until a real profile API exists. Stored on globalThis so it
// survives dev hot reloads; it resets whenever the server restarts.
const store = globalThis as typeof globalThis & { __profile?: Profile };

export const getProfile = async (): Promise<Profile> => {
  store.__profile ??= { name: "Jane Doe", avatarUrl: null };

  return store.__profile;
};

export const updateProfile = async (changes: Partial<Profile>): Promise<Profile> => {
  const current = await getProfile();
  store.__profile = { ...current, ...changes };

  return store.__profile;
};
