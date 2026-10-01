export const TITLE_MAX_LENGTH = 100;

export const validateTitle = (title: string): string | null => {
  const trimmed = title.trim();

  if (!trimmed) return "Title is required.";
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return `Title must be at most ${TITLE_MAX_LENGTH} characters.`;
  }

  return null;
};
