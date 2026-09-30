import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { isActivePath } from "./NavLinks";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = jest.mocked(usePathname);

const renderAt = (pathname: string) => {
  mockUsePathname.mockReturnValue(pathname);
  return render(<Navbar />);
};

const mainNav = () => screen.getByRole("navigation", { name: "Main" });

describe("Navbar", () => {
  it("links the brand to the home page", () => {
    renderAt("/");

    expect(screen.getByRole("link", { name: "My App" })).toHaveAttribute("href", "/");
  });

  it("renders every main route in the main navigation", () => {
    renderAt("/");

    const links = within(mainNav()).getAllByRole("link");

    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Home", "/"],
      ["F1", "/f1"],
      ["F2", "/f2"],
      ["Profile", "/profile"],
    ]);
  });

  it.each([
    ["/", "Home"],
    ["/f1", "F1"],
    ["/f1/f11", "F1"],
    ["/f2", "F2"],
    ["/profile", "Profile"],
  ])("marks only the current route as active on %s", (pathname, label) => {
    renderAt(pathname);

    const current = within(mainNav())
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(label);
  });

  describe("mobile menu", () => {
    it("starts closed and controls the link list", () => {
      renderAt("/");

      const toggle = screen.getByRole("button", { name: "Menu" });
      const list = within(mainNav()).getByRole("list");

      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveAttribute("aria-controls", list.id);
      expect(list).toHaveAttribute("data-open", "false");
    });

    it("opens and closes when the toggle is clicked", async () => {
      const user = userEvent.setup();
      renderAt("/");
      const toggle = screen.getByRole("button", { name: "Menu" });
      const list = within(mainNav()).getByRole("list");

      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(list).toHaveAttribute("data-open", "true");

      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(list).toHaveAttribute("data-open", "false");
    });

    it("closes when a link is chosen", async () => {
      const user = userEvent.setup();
      renderAt("/");
      const toggle = screen.getByRole("button", { name: "Menu" });

      const link = within(mainNav()).getByRole("link", { name: "F2" });
      // jsdom can't perform real page navigations; only the menu state matters here.
      link.addEventListener("click", (event) => event.preventDefault());

      await user.click(toggle);
      await user.click(link);

      expect(toggle).toHaveAttribute("aria-expanded", "false");
    });

    it("closes on Escape and returns focus to the toggle", async () => {
      const user = userEvent.setup();
      renderAt("/");
      const toggle = screen.getByRole("button", { name: "Menu" });

      await user.click(toggle);
      within(mainNav()).getByRole("link", { name: "Profile" }).focus();
      await user.keyboard("{Escape}");

      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveFocus();
    });
  });
});

describe("isActivePath", () => {
  it.each([
    ["/", "/", true],
    ["/f1", "/", false],
    ["/f1", "/f1", true],
    ["/f1/f11", "/f1", true],
    ["/f10", "/f1", false],
    ["/profile", "/f1", false],
  ])("pathname %s with href %s -> %s", (pathname, href, expected) => {
    expect(isActivePath(pathname, href)).toBe(expected);
  });
});
