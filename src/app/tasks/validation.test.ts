import { TITLE_MAX_LENGTH, validateTitle } from "./validation";

describe("validateTitle", () => {
  it.each([
    ["a normal title", "Buy milk"],
    ["a title at the limit", "a".repeat(TITLE_MAX_LENGTH)],
    ["a title that fits once trimmed", `  ${"a".repeat(TITLE_MAX_LENGTH)}  `],
  ])("accepts %s", (_label, title) => {
    expect(validateTitle(title)).toBeNull();
  });

  it.each(["", "   "])("requires a non-blank title (%j)", (title) => {
    expect(validateTitle(title)).toBe("Title is required.");
  });

  it("rejects a title over the limit", () => {
    expect(validateTitle("a".repeat(TITLE_MAX_LENGTH + 1))).toBe(
      `Title must be at most ${TITLE_MAX_LENGTH} characters.`,
    );
  });
});
