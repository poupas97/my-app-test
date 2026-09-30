import { AVATAR_MAX_BYTES, NAME_MAX_LENGTH, validateAvatar, validateName } from "./validation";

describe("validateName", () => {
  it.each(["", "   ", "\t\n"])("requires a non-blank name (%j)", (name) => {
    expect(validateName(name)).toBe("Name is required.");
  });

  it("accepts a name at the maximum length", () => {
    expect(validateName("a".repeat(NAME_MAX_LENGTH))).toBeNull();
  });

  it("rejects a name over the maximum length", () => {
    expect(validateName("a".repeat(NAME_MAX_LENGTH + 1))).toBe(`Name must be at most ${NAME_MAX_LENGTH} characters.`);
  });

  it("ignores surrounding whitespace when checking the length", () => {
    expect(validateName(`  ${"a".repeat(NAME_MAX_LENGTH)}  `)).toBeNull();
  });
});

describe("validateAvatar", () => {
  it.each(["image/png", "image/jpeg", "image/webp"])("accepts %s", (type) => {
    expect(validateAvatar({ type, size: 1024 })).toBeNull();
  });

  it.each(["image/gif", "image/svg+xml", "IMAGE/PNG", ""])("rejects type %j", (type) => {
    expect(validateAvatar({ type, size: 1024 })).toBe("Avatar must be a PNG, JPEG or WebP image.");
  });

  it("accepts a file at the size limit", () => {
    expect(validateAvatar({ type: "image/png", size: AVATAR_MAX_BYTES })).toBeNull();
  });

  it("rejects a file over the size limit", () => {
    expect(validateAvatar({ type: "image/png", size: AVATAR_MAX_BYTES + 1 })).toBe("Avatar must be 800 KB or smaller.");
  });

  it("reports the type error before the size error", () => {
    expect(validateAvatar({ type: "image/gif", size: AVATAR_MAX_BYTES + 1 })).toBe(
      "Avatar must be a PNG, JPEG or WebP image.",
    );
  });
});
