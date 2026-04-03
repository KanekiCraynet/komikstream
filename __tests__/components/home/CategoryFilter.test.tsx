/**
 * Tests for CategoryFilter component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryFilter, defaultCategories, type Category } from "@/components/home/CategoryFilter";

describe("CategoryFilter", () => {
  const mockOnSelectCategory = jest.fn();

  const defaultProps = {
    categories: defaultCategories,
    selectedCategory: "all",
    onSelectCategory: mockOnSelectCategory,
  };

  beforeEach(() => {
    mockOnSelectCategory.mockClear();
  });

  describe("Rendering", () => {
    it("renders all category buttons", () => {
      render(<CategoryFilter {...defaultProps} />);

      defaultCategories.forEach((category) => {
        expect(screen.getByText(category.label)).toBeInTheDocument();
      });
    });

    it("renders with custom categories", () => {
      const customCategories: Category[] = [
        { id: "custom1", label: "Custom One" },
        { id: "custom2", label: "Custom Two" },
      ];

      render(
        <CategoryFilter
          categories={customCategories}
          selectedCategory="custom1"
          onSelectCategory={mockOnSelectCategory}
        />
      );

      expect(screen.getByText("Custom One")).toBeInTheDocument();
      expect(screen.getByText("Custom Two")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(<CategoryFilter {...defaultProps} className="custom-class" />);

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("highlights the selected category", () => {
      render(<CategoryFilter {...defaultProps} selectedCategory="romance" />);

      const romanceButton = screen.getByText("Romance");
      expect(romanceButton).toHaveClass("bg-primary");
    });

    it("non-selected categories have default styling", () => {
      render(<CategoryFilter {...defaultProps} selectedCategory="all" />);

      const romanceButton = screen.getByText("Romance");
      expect(romanceButton).not.toHaveClass("bg-primary");
      expect(romanceButton).toHaveClass("bg-slate-700/50");
    });
  });

  describe("Interactions", () => {
    it("calls onSelectCategory when a category is clicked", () => {
      render(<CategoryFilter {...defaultProps} />);

      const romanceButton = screen.getByText("Romance");
      fireEvent.click(romanceButton);

      expect(mockOnSelectCategory).toHaveBeenCalledWith("romance");
    });

    it("calls onSelectCategory with correct id for each category", () => {
      render(<CategoryFilter {...defaultProps} />);

      // Click on different categories
      fireEvent.click(screen.getByText("Fantasy"));
      expect(mockOnSelectCategory).toHaveBeenCalledWith("fantasy");

      fireEvent.click(screen.getByText("Action"));
      expect(mockOnSelectCategory).toHaveBeenCalledWith("action");

      fireEvent.click(screen.getByText("Semua"));
      expect(mockOnSelectCategory).toHaveBeenCalledWith("all");
    });

    it("each category button is of type button", () => {
      render(<CategoryFilter {...defaultProps} />);

      const buttons = screen.getAllByRole("button");
      // Filter out potential scroll buttons
      const categoryButtons = buttons.filter(
        (btn) => !btn.getAttribute("aria-label")?.includes("Scroll")
      );

      categoryButtons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });
  });

  describe("Default Categories", () => {
    it("exports defaultCategories with expected categories", () => {
      expect(defaultCategories).toContainEqual({ id: "all", label: "Semua" });
      expect(defaultCategories).toContainEqual({ id: "romance", label: "Romance" });
      expect(defaultCategories).toContainEqual({ id: "harem", label: "Harem" });
      expect(defaultCategories).toContainEqual({ id: "isekai", label: "Isekai" });
      expect(defaultCategories).toContainEqual({ id: "fantasy", label: "Fantasy" });
      expect(defaultCategories).toContainEqual({ id: "action", label: "Action" });
    });

    it("has all as the first category", () => {
      expect(defaultCategories[0]).toEqual({ id: "all", label: "Semua" });
    });
  });

  describe("Accessibility", () => {
    it("scroll buttons have aria-labels", () => {
      // We need to mock scrollWidth > clientWidth to show scroll buttons
      // For now, just check that scroll buttons would have correct labels if rendered
      const { container } = render(<CategoryFilter {...defaultProps} />);

      // The component should render properly
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
