/**
 * Tests for SearchBar component
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/ui/SearchBar";

// Mock useRouter
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

describe("SearchBar", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders with default placeholder", () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText("Cari komik atau anime...")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<SearchBar placeholder="Search something..." />);
    expect(screen.getByPlaceholderText("Search something...")).toBeInTheDocument();
  });

  it("renders with default value", () => {
    render(<SearchBar defaultValue="One Piece" />);
    expect(screen.getByDisplayValue("One Piece")).toBeInTheDocument();
  });

  it("updates value on input change", async () => {
    render(<SearchBar />);
    const input = screen.getByRole("searchbox");

    await userEvent.type(input, "Naruto");
    expect(input).toHaveValue("Naruto");
  });

  it("shows clear button when value is present", async () => {
    render(<SearchBar defaultValue="test" />);

    // The clear button (X) should be visible
    const clearButton = screen.getByRole("button", { name: /hapus pencarian/i });
    expect(clearButton).toBeInTheDocument();
  });

  it("clears input when clear button is clicked", async () => {
    render(<SearchBar defaultValue="test" />);
    const input = screen.getByRole("searchbox");

    // Find and click the clear button
    const clearButton = screen.getByRole("button", { name: /hapus pencarian/i });

    if (clearButton) {
      await userEvent.click(clearButton);
    }
    expect(input).toHaveValue("");
  });

  it("has disabled search button when input is empty", () => {
    render(<SearchBar />);
    const searchButton = screen.getByRole("button", { name: /^cari$/i });
    expect(searchButton).toBeDisabled();
  });

  it("enables search button when input has value", async () => {
    render(<SearchBar />);
    const input = screen.getByRole("searchbox");

    await userEvent.type(input, "test");

    const searchButton = screen.getByRole("button", { name: /^cari$/i });
    expect(searchButton).not.toBeDisabled();
  });

  it("applies custom className", () => {
    render(<SearchBar className="custom-search" />);
    const container = screen.getByRole("searchbox").closest("div")?.parentElement;
    expect(container).toHaveClass("custom-search");
  });

  it("triggers search on Enter key", async () => {
    render(<SearchBar searchPath="/komik/search" />);
    const input = screen.getByRole("searchbox");

    await userEvent.type(input, "Dragon Ball{enter}");

    // Router push should be called
    expect(mockPush).toHaveBeenCalled();
  });

  it("navigates to correct search path on submit", async () => {
    render(<SearchBar searchPath="/anime/search" />);
    const input = screen.getByRole("searchbox");

    await userEvent.type(input, "Bleach");

    const searchButton = screen.getByRole("button", { name: /^cari$/i });
    await userEvent.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith("/anime/search?q=Bleach");
  });

  it("defaults to komik search path when no searchPath provided", async () => {
    render(<SearchBar />);
    const input = screen.getByRole("searchbox");

    await userEvent.type(input, "Test");

    const searchButton = screen.getByRole("button", { name: /^cari$/i });
    await userEvent.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith("/komik/search?q=Test");
  });

  it("trims whitespace from search query", async () => {
    render(<SearchBar searchPath="/search" />);
    const input = screen.getByRole("searchbox");

    await userEvent.type(input, "  hello world  ");

    const searchButton = screen.getByRole("button", { name: /^cari$/i });
    await userEvent.click(searchButton);

    expect(mockPush).toHaveBeenCalledWith("/search?q=hello%20world");
  });

  it("does not search with only whitespace", async () => {
    render(<SearchBar />);
    const input = screen.getByRole("searchbox");

    await userEvent.type(input, "   ");

    const searchButton = screen.getByRole("button", { name: /^cari$/i });
    expect(searchButton).toBeDisabled();
  });
});
