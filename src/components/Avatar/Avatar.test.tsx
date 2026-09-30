import { render, screen } from "@testing-library/react";
import Avatar from "./Avatar";

describe("Avatar", () => {
  it("shows the image with a default alt based on the name", () => {
    render(<Avatar name="Jane Doe" src="data:image/png;base64,AAAA" />);

    const image = screen.getByRole("img", { name: "Jane Doe's avatar" });
    expect(image).toHaveAttribute("src", "data:image/png;base64,AAAA");
    expect(image).toHaveAttribute("width", "96");
  });

  it("uses a custom alt and size when given", () => {
    render(<Avatar name="Jane" src="blob:preview" alt="New avatar preview" size={40} />);

    const image = screen.getByRole("img", { name: "New avatar preview" });
    expect(image).toHaveAttribute("width", "40");
    expect(image).toHaveAttribute("height", "40");
  });

  it("falls back to the uppercase initial, hidden from assistive tech", () => {
    const { container } = render(<Avatar name="jane" src={null} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const placeholder = container.firstElementChild;
    expect(placeholder).toHaveTextContent("J");
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
  });
});
