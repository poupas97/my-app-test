import { render, screen, within } from "@testing-library/react";
import Footer, { FOOTER_LINKS } from "./Footer";

const footerLinks = () => within(screen.getByRole("contentinfo")).getAllByRole("link");

describe("Footer", () => {
  it("renders every default link, opening in a new tab safely", () => {
    render(<Footer />);

    const links = footerLinks();

    expect(links.map((link) => link.textContent)).toEqual(FOOTER_LINKS.map(({ label }) => label));
    links.forEach((link, index) => {
      expect(link).toHaveAttribute("href", FOOTER_LINKS[index].href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("renders only the links it is given", () => {
    render(<Footer links={FOOTER_LINKS.filter((link) => link.id !== "learn")} />);

    expect(footerLinks().map((link) => link.textContent)).toEqual(["Examples", "Go to nextjs.org →"]);
  });

  it("keeps the icons out of the accessible link names", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "Learn" })).toBeInTheDocument();
  });
});
