/**
 * Tests for HomeSidebar component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { HomeSidebar } from "@/components/home/HomeSidebar";
import type { Komik, Anime } from "@/types";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({
    alt,
    src,
    onError,
    ...props
  }: {
    alt: string;
    src: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
    unoptimized?: boolean;
    onError?: () => void;
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

type RankingItem = (Komik | Anime) & {
  itemType: "komik" | "anime";
  points?: number;
  views?: number;
};

describe("HomeSidebar", () => {
  const mockKomikRankingItem: RankingItem = {
    manga_id: "test-komik-1",
    title: "Test Komik Title",
    thumbnail: "https://example.com/komik-cover.jpg",
    author: "Test Author",
    rating: 8.5,
    type: "Manhwa",
    itemType: "komik",
    points: 1500,
  };

  const mockAnimeRankingItem: RankingItem = {
    urlId: "test-anime-1",
    title: "Test Anime Title",
    poster: "https://example.com/anime-poster.jpg",
    studio: "Test Studio",
    rating: 9.0,
    score: 9.0,
    type: "TV",
    itemType: "anime",
    points: 1200,
  } as RankingItem;

  const mockRankingItems: RankingItem[] = [
    mockKomikRankingItem,
    mockAnimeRankingItem,
    { ...mockKomikRankingItem, manga_id: "test-2", title: "Third Item", points: 1000 },
    { ...mockKomikRankingItem, manga_id: "test-3", title: "Fourth Item", points: 800 },
    { ...mockKomikRankingItem, manga_id: "test-4", title: "Fifth Item", points: 600 },
  ];

  describe("Rendering", () => {
    it("renders the sidebar with all sections", () => {
      render(<HomeSidebar />);

      // Top Readers Card
      expect(screen.getByText("Top Pembaca")).toBeInTheDocument();
      expect(screen.getByText("Siapa Sepuh Disini?")).toBeInTheDocument();

      // Announcements Card
      expect(screen.getByText("Pengumuman")).toBeInTheDocument();
      expect(screen.getByText("Info Terbaru")).toBeInTheDocument();

      // Rankings Section
      expect(screen.getByText("Peringkat Mingguan")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(<HomeSidebar className="custom-class" />);
      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("renders action buttons in Top Readers card", () => {
      render(<HomeSidebar />);
      expect(screen.getByText("Lihat")).toBeInTheDocument();
    });

    it("renders action buttons in Announcements card", () => {
      render(<HomeSidebar />);
      expect(screen.getByText("Cek")).toBeInTheDocument();
    });
  });

  describe("Rankings Section", () => {
    it("shows empty state when no ranking items", () => {
      render(<HomeSidebar rankingItems={[]} />);
      expect(screen.getByText("Belum ada data ranking")).toBeInTheDocument();
    });

    it("renders ranking items when provided", () => {
      render(<HomeSidebar rankingItems={mockRankingItems} />);
      expect(screen.getByText("Test Komik Title")).toBeInTheDocument();
      expect(screen.getByText("Test Anime Title")).toBeInTheDocument();
    });

    it("displays first item with special styling (Juara 1)", () => {
      render(<HomeSidebar rankingItems={mockRankingItems} />);
      expect(screen.getByText("Juara 1")).toBeInTheDocument();
    });

    it("displays ranking numbers correctly", () => {
      render(<HomeSidebar rankingItems={mockRankingItems} />);
      expect(screen.getByText("#1")).toBeInTheDocument();
    });

    it("displays points for ranking items", () => {
      render(<HomeSidebar rankingItems={mockRankingItems} />);
      expect(screen.getByText("1500 Poin")).toBeInTheDocument();
    });

    it("limits displayed items to 5", () => {
      const manyItems = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockKomikRankingItem,
          manga_id: `test-${i}`,
          title: `Item ${i}`,
          points: 1000 - i * 100,
        }));

      render(<HomeSidebar rankingItems={manyItems} />);

      // Should only show 5 items
      expect(screen.getByText("Item 0")).toBeInTheDocument();
      expect(screen.getByText("Item 4")).toBeInTheDocument();
      expect(screen.queryByText("Item 5")).not.toBeInTheDocument();
    });

    it("links komik items to correct URL", () => {
      render(<HomeSidebar rankingItems={[mockKomikRankingItem]} />);
      const link = screen.getByText("Test Komik Title").closest("a");
      expect(link).toHaveAttribute("href", "/komik/test-komik-1");
    });

    it("links anime items to correct URL", () => {
      render(<HomeSidebar rankingItems={[mockAnimeRankingItem]} />);
      const link = screen.getByText("Test Anime Title").closest("a");
      expect(link).toHaveAttribute("href", "/anime/test-anime-1");
    });
  });

  describe("Ranking Tabs", () => {
    it("renders all period tabs", () => {
      render(<HomeSidebar rankingItems={mockRankingItems} />);
      expect(screen.getByText("Harian")).toBeInTheDocument();
      expect(screen.getByText("Mingguan")).toBeInTheDocument();
      expect(screen.getByText("Bulanan")).toBeInTheDocument();
    });

    it("weekly tab is selected by default", () => {
      render(<HomeSidebar rankingItems={mockRankingItems} />);
      const weeklyTab = screen.getByText("Mingguan");
      expect(weeklyTab).toHaveClass("bg-primary");
    });

    it("changes active tab on click", () => {
      render(<HomeSidebar rankingItems={mockRankingItems} />);

      const dailyTab = screen.getByText("Harian");
      fireEvent.click(dailyTab);
      expect(dailyTab).toHaveClass("bg-primary");

      const monthlyTab = screen.getByText("Bulanan");
      fireEvent.click(monthlyTab);
      expect(monthlyTab).toHaveClass("bg-primary");
    });
  });

  describe("Edge Cases", () => {
    it("handles items without optional fields", () => {
      const itemWithoutOptionals: RankingItem = {
        manga_id: "minimal-komik",
        title: "Minimal Komik",
        itemType: "komik",
        type: "Manga",
      };

      render(<HomeSidebar rankingItems={[itemWithoutOptionals]} />);
      expect(screen.getByText("Minimal Komik")).toBeInTheDocument();
      expect(screen.getByText("0 Poin")).toBeInTheDocument();
    });

    it("handles empty title gracefully", () => {
      const itemWithoutTitle: RankingItem = {
        manga_id: "no-title",
        title: "",
        itemType: "komik",
        type: "Manga",
        points: 100,
      };

      render(<HomeSidebar rankingItems={[itemWithoutTitle]} />);
      // Should show "Untitled" as fallback
      expect(screen.getByText("Untitled")).toBeInTheDocument();
    });
  });
});
