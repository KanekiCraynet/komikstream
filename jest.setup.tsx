import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  useParams: () => ({}),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    blurDataURL: _blurDataURL,
    placeholder: _placeholder,
    quality: _quality,
    loader: _loader,
    ...props
  }: {
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean;
    blurDataURL?: string;
    placeholder?: string;
    quality?: number;
    loader?: unknown;
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    // These Next.js Image props are intentionally stripped - they don't apply to native <img>
    void [_fill, _priority, _unoptimized, _blurDataURL, _placeholder, _quality, _loader];
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: jest.fn(),
    resolvedTheme: "dark",
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Suppress known harmless console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = args.map(String).join(" ");
    if (
      msg.includes("Warning: ReactDOM.render") ||
      msg.includes("Warning: An update to") ||
      msg.includes("act(...)")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
