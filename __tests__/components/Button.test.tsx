/**
 * Tests for Button component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies default variant styles", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary");
  });

  it("applies secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-secondary");
  });

  it("applies outline variant styles", () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-2");
  });

  it("applies ghost variant styles", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("hover:bg-accent");
  });

  it("applies destructive variant styles", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive");
  });

  it("applies link variant styles", () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("underline-offset-4");
  });

  it("applies small size styles", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-9");
  });

  it("applies large size styles", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-12");
  });

  it("applies icon size styles", () => {
    render(<Button size="icon">🔍</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-11", "w-11");
  });

  it("merges custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref Test</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("passes through additional props", () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>
    );
    const button = screen.getByTestId("submit-btn");
    expect(button).toHaveAttribute("type", "submit");
  });
});
