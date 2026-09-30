/** @jest-environment node */
import { getProfile, updateProfile, type Profile } from "./profile";

const store = globalThis as typeof globalThis & { __profile?: Profile };

const DEFAULT_PROFILE: Profile = { name: "Jane Doe", avatarUrl: null };

beforeEach(() => {
  delete store.__profile;
});

describe("getProfile", () => {
  it("seeds the default profile on first read", async () => {
    await expect(getProfile()).resolves.toEqual(DEFAULT_PROFILE);
    expect(store.__profile).toEqual(DEFAULT_PROFILE);
  });

  it("returns the existing profile instead of re-seeding", async () => {
    store.__profile = { name: "Existing", avatarUrl: "data:image/png;base64,AA==" };

    await expect(getProfile()).resolves.toEqual({
      name: "Existing",
      avatarUrl: "data:image/png;base64,AA==",
    });
  });
});

describe("updateProfile", () => {
  it("seeds the default profile before applying the first update", async () => {
    await expect(updateProfile({ name: "Ann" })).resolves.toEqual({
      ...DEFAULT_PROFILE,
      name: "Ann",
    });
  });

  it("keeps avatarUrl on a name-only update", async () => {
    await updateProfile({ avatarUrl: "data:image/png;base64,AA==" });

    await expect(updateProfile({ name: "Ann" })).resolves.toEqual({
      name: "Ann",
      avatarUrl: "data:image/png;base64,AA==",
    });
  });

  it("keeps the name on an avatar-only update", async () => {
    await updateProfile({ name: "Ann" });

    await expect(updateProfile({ avatarUrl: "data:image/webp;base64,BB==" })).resolves.toEqual({
      name: "Ann",
      avatarUrl: "data:image/webp;base64,BB==",
    });
  });

  it("persists the update so a later getProfile reflects it", async () => {
    await updateProfile({ name: "Ann", avatarUrl: "data:image/jpeg;base64,CC==" });

    await expect(getProfile()).resolves.toEqual({
      name: "Ann",
      avatarUrl: "data:image/jpeg;base64,CC==",
    });
  });

  it("does not mutate a previously returned profile object", async () => {
    const before = await getProfile();

    await updateProfile({ name: "Ann" });

    expect(before).toEqual(DEFAULT_PROFILE);
  });
});
