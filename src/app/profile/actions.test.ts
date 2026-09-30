/** @jest-environment node */
import { revalidatePath } from "next/cache";
import { getProfile, type Profile } from "@/services/profile";
import { saveProfile, type ProfileFormState } from "./actions";
import { AVATAR_MAX_BYTES, NAME_MAX_LENGTH } from "./validation";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const revalidatePathMock = jest.mocked(revalidatePath);
const store = globalThis as typeof globalThis & { __profile?: Profile };

const SEEDED: Profile = { name: "Jane Doe", avatarUrl: "data:image/png;base64,T0xE" };
const idle: ProfileFormState = { status: "idle" };

// Minimal PNG signature plus a few arbitrary bytes.
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0x10]);

const buildForm = (fields: { name?: string | File; avatar?: File }) => {
  const formData = new FormData();
  if (fields.name !== undefined) formData.append("name", fields.name);
  if (fields.avatar !== undefined) formData.append("avatar", fields.avatar);
  return formData;
};

// Mirrors what the browser submits for a file input with no file selected.
const emptyFileInput = () => new File([], "", { type: "application/octet-stream" });

beforeEach(() => {
  store.__profile = { ...SEEDED };
  revalidatePathMock.mockClear();
});

describe("saveProfile", () => {
  describe("success", () => {
    it("stores the trimmed name, keeps avatarUrl and revalidates /profile", async () => {
      const result = await saveProfile(idle, buildForm({ name: "  Ann Smith  " }));

      expect(result).toEqual({ status: "success", message: "Profile updated." });
      await expect(getProfile()).resolves.toEqual({ name: "Ann Smith", avatarUrl: SEEDED.avatarUrl });
      expect(revalidatePathMock).toHaveBeenCalledTimes(1);
      expect(revalidatePathMock).toHaveBeenCalledWith("/profile");
    });

    it("treats an empty (zero-byte) file input as no avatar", async () => {
      const result = await saveProfile(idle, buildForm({ name: "Ann", avatar: emptyFileInput() }));

      expect(result.status).toBe("success");
      await expect(getProfile()).resolves.toEqual({ name: "Ann", avatarUrl: SEEDED.avatarUrl });
    });

    it("stores a valid PNG as a base64 data URL of the exact bytes", async () => {
      const avatar = new File([PNG_BYTES], "me.png", { type: "image/png" });

      const result = await saveProfile(idle, buildForm({ name: "Ann", avatar }));

      expect(result.status).toBe("success");
      const expectedBase64 = Buffer.from(PNG_BYTES).toString("base64");
      await expect(getProfile()).resolves.toEqual({
        name: "Ann",
        avatarUrl: `data:image/png;base64,${expectedBase64}`,
      });
      expect(revalidatePathMock).toHaveBeenCalledWith("/profile");
    });

    it("accepts an avatar exactly at the size limit", async () => {
      const avatar = new File([new Uint8Array(AVATAR_MAX_BYTES)], "max.webp", { type: "image/webp" });

      const result = await saveProfile(idle, buildForm({ name: "Ann", avatar }));

      expect(result.status).toBe("success");
      expect((await getProfile()).avatarUrl).toMatch(/^data:image\/webp;base64,/);
    });
  });

  describe("validation errors", () => {
    const expectUntouched = async () => {
      await expect(getProfile()).resolves.toEqual(SEEDED);
      expect(revalidatePathMock).not.toHaveBeenCalled();
    };

    it.each([
      ["blank", "   ", "Name is required."],
      ["too long", "a".repeat(NAME_MAX_LENGTH + 1), `Name must be at most ${NAME_MAX_LENGTH} characters.`],
    ])("rejects a %s name with only errors.name", async (_label, name, message) => {
      const result = await saveProfile(idle, buildForm({ name }));

      expect(result).toEqual({
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { name: message, avatar: undefined },
      });
      await expectUntouched();
    });

    it("returns both errors when name and avatar are invalid", async () => {
      const avatar = new File(["GIF89a"], "anim.gif", { type: "image/gif" });

      const result = await saveProfile(idle, buildForm({ name: "", avatar }));

      expect(result).toEqual({
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: {
          name: "Name is required.",
          avatar: "Avatar must be a PNG, JPEG or WebP image.",
        },
      });
      await expectUntouched();
    });

    it.each([
      [
        "a wrong-type",
        () => new File(["<svg/>"], "x.svg", { type: "image/svg+xml" }),
        "Avatar must be a PNG, JPEG or WebP image.",
      ],
      [
        "an oversized",
        () => new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], "big.png", { type: "image/png" }),
        "Avatar must be 800 KB or smaller.",
      ],
    ])("rejects %s avatar server-side", async (_label, makeAvatar, message) => {
      const result = await saveProfile(idle, buildForm({ name: "Ann", avatar: makeAvatar() }));

      expect(result).toEqual({
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { name: undefined, avatar: message },
      });
      await expectUntouched();
    });

    it.each([
      ["missing", buildForm({})],
      ["a non-string (File)", buildForm({ name: new File(["Ann"], "name.txt", { type: "text/plain" }) })],
    ])("treats a %s name field as empty", async (_label, formData) => {
      const result = await saveProfile(idle, formData);

      expect(result.status).toBe("error");
      expect(result.errors?.name).toBe("Name is required.");
      await expectUntouched();
    });
  });
});
