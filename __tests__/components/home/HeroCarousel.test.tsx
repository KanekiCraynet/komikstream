/**
 * Tests for HeroCarousel component
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import type { Komik, Anime } from "@/types";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({
    alt,
    src,
    ...props
  }: {
    alt: string;
    src: string;
    fill?: boolean;
    className?: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} {...props} />;
  },
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  },
}));

type FeaturedItem = (Komik | Anime) & { itemType: "komik" | "anime" };

describe("HeroCarousel", () => {
  const mockKomikItem: FeaturedItem = {
    manga_id: "test-komik-1",
    title: "Test Komik Title",
    thumbnail: "https://example.com/komik-cover.jpg",
    description: "This is a test komik description",
    rating: 8.5,
    type: "Manhwa",
    itemType: "komik",
  };

  const mockAnimeItem: FeaturedItem = {
    urlId: "test-anime-1",
    title: "Test Anime Title",
    poster: "https://example.com/anime-poster.jpg",
    synopsis: "This is a test anime synopsis",
    rating: 9.0,
    score: 9.0,
    type: "TV",
    itemType: "anime",
  } as FeaturedItem;

  const mockItems: FeaturedItem[] = [mockKomikItem, mockAnimeItem];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Rendering", () => {
    it("renders nothing when items array is empty", () => {
      const { container } = render(<HeroCarousel items={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders the carousel with featured items", () => {
      render(<HeroCarousel items={mockItems} />);
      expect(screen.getByText("Test Komik Title")).toBeInTheDocument();
    });

    it("displays the first item by default", () => {
      render(<HeroCarousel items={mockItems} />);
      expect(screen.getByText("Test Komik Title")).toBeInTheDocument();
      expect(screen.getByText(/This is a test komik description/)).toBeInTheDocument();
    });

    it("displays rating badge", () => {
      render(<HeroCarousel items={mockItems} />);
      expect(screen.getByText("8.5")).toBeInTheDocument();
    });

    it("renders action buttons", () => {
      render(<HeroCarousel items={mockItems} />);
      expect(screen.getByText("Baca Sekarang")).toBeInTheDocument();
      expect(screen.getByText("Simpan")).toBeInTheDocument();
    });

    it("links to correct page for komik", () => {
      render(<HeroCarousel items={[mockKomikItem]} />);
      const readButton = screen.getByText("Baca Sekarang").closest("a");
      expect(readButton).toHaveAttribute("href", "/komik/test-komik-1");
    });

    it("links to correct page for anime", () => {
      render(<HeroCarousel items={[mockAnimeItem]} />);
      const watchButton = screen.getByText("Tonton Sekarang").closest("a");
      expect(watchButton).toHaveAttribute("href", "/anime/test-anime-1");
    });

    it("applies custom className", () => {
      const { container } = render(<HeroCarousel items={mockItems} className="custom-class" />);
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Navigation", () => {
    it("renders navigation buttons when multiple items", () => {
      render(<HeroCarousel items={mockItems} />);
      // There should be prev/next buttons
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it("navigates to next item when next button is clicked", () => {
      render(<HeroCarousel items={mockItems} />);
      const nextButton = screen.getByLabelText("Next slide");
      fireEvent.click(nextButton);
      expect(screen.getByText("Test Anime Title")).toBeInTheDocument();
    });

    it("navigates to previous item when prev button is clicked", () => {
      render(<HeroCarousel items={mockItems} />);
      const prevButton = screen.getByLabelText("Previous slide");
      fireEvent.click(prevButton);
      // Should wrap to the last item
      expect(screen.getByText("Test Anime Title")).toBeInTheDocument();
    });

    it("renders slide indicator dots", () => {
      render(<HeroCarousel items={mockItems} />);
      const dots = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-label")?.includes("Go to slide"));
      expect(dots).toHaveLength(2);
    });

    it("navigates to specific slide when dot is clicked", () => {
      render(<HeroCarousel items={mockItems} />);
      const secondDot = screen.getByLabelText("Go to slide 2");
      fireEvent.click(secondDot);
      expect(screen.getByText("Test Anime Title")).toBeInTheDocument();
    });
  });

  describe("Auto-play", () => {
    it("auto-plays to next slide after interval", () => {
      render(<HeroCarousel items={mockItems} />);
      expect(screen.getByText("Test Komik Title")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(6000);
      });

      expect(screen.getByText("Test Anime Title")).toBeInTheDocument();
    });

    it("pauses auto-play on mouse enter", () => {
      render(<HeroCarousel items={mockItems} />);
      const section = screen.getByText("Test Komik Title").closest("section");

      fireEvent.mouseEnter(section!);

      act(() => {
        jest.advanceTimersByTime(6000);
      });

      // Should still show first item (auto-play paused)
      expect(screen.getByText("Test Komik Title")).toBeInTheDocument();
    });

    it("resumes auto-play on mouse leave", () => {
      render(<HeroCarousel items={mockItems} />);
      const section = screen.getByText("Test Komik Title").closest("section");

      fireEvent.mouseEnter(section!);
      fireEvent.mouseLeave(section!);

      act(() => {
        jest.advanceTimersByTime(6000);
      });

      expect(screen.getByText("Test Anime Title")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles single item without navigation buttons", () => {
      render(<HeroCarousel items={[mockKomikItem]} />);
      expect(screen.getByText("Test Komik Title")).toBeInTheDocument();
    });

    it("handles item without description", () => {
      const itemWithoutDescription: FeaturedItem = {
        ...mockKomikItem,
        description: undefined,
      };
      render(<HeroCarousel items={[itemWithoutDescription]} />);
      expect(screen.getByText("Test Komik Title")).toBeInTheDocument();
    });

    it("handles item without rating", () => {
      const itemWithoutRating: FeaturedItem = {
        ...mockKomikItem,
        rating: undefined,
      };
      render(<HeroCarousel items={[itemWithoutRating]} />);
      // Rating badge should not be displayed when rating is N/A
      expect(screen.queryByText("8.5")).not.toBeInTheDocument();
      // But the item should still render
      expect(screen.getByText("Test Komik Title")).toBeInTheDocument();
    });

    it("limits to maximum 5 items", () => {
      const manyItems: FeaturedItem[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockKomikItem,
          manga_id: `test-${i}`,
          title: `Test Item ${i}`,
        }));

      render(<HeroCarousel items={manyItems} />);
      const dots = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-label")?.includes("Go to slide"));
      expect(dots).toHaveLength(5);
    });
  });
});
