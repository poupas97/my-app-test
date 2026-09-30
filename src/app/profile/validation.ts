export const NAME_MAX_LENGTH = 50;

// Server Actions reject request bodies over 1 MB by default, so the avatar
// limit stays below that to leave room for the rest of the form data.
export const AVATAR_MAX_BYTES = 800 * 1024;

export const AVATAR_MIME_TYPES: readonly string[] = ["image/png", "image/jpeg", "image/webp"];

export const validateName = (name: string): string | null => {
  const trimmed = name.trim();

  if (!trimmed) return "Name is required.";
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters.`;
  }

  return null;
};

export const validateAvatar = (file: Pick<File, "size" | "type">): string | null => {
  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    return "Avatar must be a PNG, JPEG or WebP image.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Avatar must be 800 KB or smaller.";
  }

  return null;
};
