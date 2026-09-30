import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Profile } from "@/services/profile";
import { saveProfile, type ProfileFormState } from "./actions";
import ProfileForm from "./ProfileForm";
import { AVATAR_MAX_BYTES } from "./validation";

jest.mock("./actions", () => ({
  saveProfile: jest.fn(),
}));

const saveProfileMock = jest.mocked(saveProfile);

const HINT = "PNG, JPEG or WebP, up to 800 KB.";
const TYPE_ERROR = "Avatar must be a PNG, JPEG or WebP image.";
const SIZE_ERROR = "Avatar must be 800 KB or smaller.";

const noAvatar: Profile = { name: "jane Doe", avatarUrl: null };
const withAvatar: Profile = { name: "Jane Doe", avatarUrl: "data:image/png;base64,T0xE" };

const pngFile = (name = "me.png") => new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

// jsdom does not implement object URLs, so stub them with predictable values.
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const createObjectURL = jest.fn<string, [Blob | MediaSource]>();
const revokeObjectURL = jest.fn<void, [string]>();

beforeAll(() => {
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

afterAll(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

beforeEach(() => {
  let counter = 0;
  createObjectURL.mockReset().mockImplementation(() => `blob:preview-${++counter}`);
  revokeObjectURL.mockReset();
  saveProfileMock.mockReset();
});

// The file input's accept attribute would silently drop invalid files, so
// disable it to exercise the component's own validation.
const setup = (profile: Profile = noAvatar) => {
  const user = userEvent.setup({ applyAccept: false });
  const utils = render(<ProfileForm profile={profile} />);
  return {
    user,
    ...utils,
    nameInput: screen.getByLabelText("Name") as HTMLInputElement,
    avatarInput: screen.getByLabelText("Avatar") as HTMLInputElement,
    submitButton: screen.getByRole("button", { name: "Save changes" }),
  };
};

describe("ProfileForm", () => {
  describe("initial render", () => {
    it("prefills the name and shows the avatar hint", () => {
      const { nameInput, avatarInput } = setup(withAvatar);

      expect(nameInput).toHaveValue("Jane Doe");
      expect(screen.getByText(HINT)).toHaveAttribute("id", "avatar-hint");
      expect(avatarInput).toHaveAttribute("aria-invalid", "false");
      expect(avatarInput).toHaveAttribute("aria-describedby", "avatar-hint");
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    it("shows the uppercase initial placeholder when there is no avatar", () => {
      setup(noAvatar);

      expect(screen.getByText("J")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("shows the current avatar image when avatarUrl is set", () => {
      setup(withAvatar);

      expect(screen.getByRole("img", { name: "Jane Doe's avatar" })).toHaveAttribute("src", withAvatar.avatarUrl);
    });
  });

  describe("avatar selection", () => {
    it("shows a preview for a valid file", async () => {
      const { user, avatarInput } = setup(withAvatar);
      const file = pngFile();

      await user.upload(avatarInput, file);

      expect(createObjectURL).toHaveBeenCalledWith(file);
      expect(screen.getByRole("img", { name: "New avatar preview" })).toHaveAttribute("src", "blob:preview-1");
      expect(screen.queryByRole("img", { name: "Jane Doe's avatar" })).not.toBeInTheDocument();
      expect(avatarInput).toHaveAttribute("aria-invalid", "false");
    });

    it("revokes the previous object URL when the file is replaced and on unmount", async () => {
      const { user, avatarInput, unmount } = setup();

      await user.upload(avatarInput, pngFile("first.png"));
      expect(revokeObjectURL).not.toHaveBeenCalled();

      await user.upload(avatarInput, pngFile("second.png"));
      expect(revokeObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenLastCalledWith("blob:preview-1");
      expect(screen.getByRole("img", { name: "New avatar preview" })).toHaveAttribute("src", "blob:preview-2");

      unmount();
      expect(revokeObjectURL).toHaveBeenCalledTimes(2);
      expect(revokeObjectURL).toHaveBeenLastCalledWith("blob:preview-2");
    });

    it.each([
      ["a wrong-type", () => new File(["GIF89a"], "anim.gif", { type: "image/gif" }), TYPE_ERROR],
      [
        "an oversized",
        () => new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], "big.png", { type: "image/png" }),
        SIZE_ERROR,
      ],
    ])("rejects %s file with an accessible error and no preview", async (_label, makeFile, message) => {
      const { user, avatarInput } = setup();

      await user.upload(avatarInput, makeFile());

      const error = screen.getByText(message);
      expect(error).toHaveAttribute("id", "avatar-error");
      expect(avatarInput).toHaveAttribute("aria-invalid", "true");
      expect(avatarInput).toHaveAttribute("aria-describedby", "avatar-error");
      expect(avatarInput).toHaveAccessibleDescription(message);
      expect(screen.queryByText(HINT)).not.toBeInTheDocument();
      expect(avatarInput.value).toBe("");
      expect(avatarInput.files).toHaveLength(0);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(createObjectURL).not.toHaveBeenCalled();
    });

    it("clears a previous client error and preview once a valid file replaces an invalid one", async () => {
      const { user, avatarInput } = setup();

      await user.upload(avatarInput, new File(["GIF89a"], "anim.gif", { type: "image/gif" }));
      expect(screen.getByText(TYPE_ERROR)).toBeInTheDocument();

      await user.upload(avatarInput, pngFile());

      expect(screen.queryByText(TYPE_ERROR)).not.toBeInTheDocument();
      expect(screen.getByText(HINT)).toBeInTheDocument();
      expect(avatarInput).toHaveAttribute("aria-invalid", "false");
      expect(screen.getByRole("img", { name: "New avatar preview" })).toBeInTheDocument();
    });
  });

  describe("submit", () => {
    it("disables the button and shows 'Saving…' while the action is pending", async () => {
      const pending = deferred<ProfileFormState>();
      saveProfileMock.mockReturnValue(pending.promise);
      const { user, submitButton } = setup();

      await user.click(submitButton);

      const savingButton = await screen.findByRole("button", { name: "Saving…" });
      expect(savingButton).toBeDisabled();

      pending.resolve({ status: "success", message: "Profile updated." });

      const idleButton = await screen.findByRole("button", { name: "Save changes" });
      expect(idleButton).toBeEnabled();
    });

    // The avatar field is not asserted here: user-event stubs input.files on the
    // element, but jsdom builds FormData from its internal file list, so the
    // submitted avatar is always an empty File. Server-side avatar handling is
    // covered in actions.test.ts.
    it("submits the typed name to the server action", async () => {
      saveProfileMock.mockResolvedValue({ status: "success", message: "Profile updated." });
      const { user, nameInput, submitButton } = setup();

      await user.clear(nameInput);
      await user.type(nameInput, "Ann Smith");
      await user.click(submitButton);

      await waitFor(() => expect(saveProfileMock).toHaveBeenCalledTimes(1));
      const formData = saveProfileMock.mock.calls[0][1];
      expect(formData.get("name")).toBe("Ann Smith");
    });

    it("renders the server name error and message, keeping the typed name", async () => {
      saveProfileMock.mockResolvedValue({
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { name: "Name is required." },
      });
      const { user, nameInput, submitButton } = setup();

      await user.clear(nameInput);
      await user.type(nameInput, "   ");
      await user.click(submitButton);

      expect(await screen.findByRole("status")).toHaveTextContent("Please fix the highlighted fields.");
      const nameError = screen.getByText("Name is required.");
      expect(nameError).toHaveAttribute("id", "name-error");
      expect(nameInput).toHaveAttribute("aria-invalid", "true");
      expect(nameInput).toHaveAccessibleDescription("Name is required.");
      expect(nameInput).toHaveValue("   ");
    });

    it("preserves a non-blank typed name after an error response", async () => {
      saveProfileMock.mockResolvedValue({
        status: "error",
        message: "Please fix the highlighted fields.",
        errors: { avatar: SIZE_ERROR },
      });
      const { user, nameInput, avatarInput, submitButton } = setup();

      await user.clear(nameInput);
      await user.type(nameInput, "Ann Smith");
      await user.click(submitButton);

      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Please fix the highlighted fields."));
      expect(nameInput).toHaveValue("Ann Smith");
      expect(screen.getByText(SIZE_ERROR)).toHaveAttribute("id", "avatar-error");
      expect(avatarInput).toHaveAttribute("aria-invalid", "true");
      expect(nameInput).toHaveAttribute("aria-invalid", "false");
    });

    it("shows the success message and drops the preview after a successful save", async () => {
      saveProfileMock.mockResolvedValue({ status: "success", message: "Profile updated." });
      const { user, avatarInput, submitButton } = setup();

      await user.upload(avatarInput, pngFile());
      expect(screen.getByRole("img", { name: "New avatar preview" })).toBeInTheDocument();

      await user.click(submitButton);

      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Profile updated."));
      expect(screen.queryByRole("img", { name: "New avatar preview" })).not.toBeInTheDocument();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
      expect(screen.queryByText("Name is required.")).not.toBeInTheDocument();
    });

    // Known production bugs, documented but not yet approved for fixing.
    it.todo(
      "clears a stale client-side avatar error after a successful save (bug: avatarClientError is only reset on file change)",
    );
    it.todo(
      "re-syncs the name input to the saved, trimmed value after a successful save (bug: input keeps untrimmed text)",
    );
    it.todo(
      "rejects a zero-byte image client-side, consistent with the server ignoring it (bug: accepted client-side, silently dropped server-side)",
    );
  });
});
