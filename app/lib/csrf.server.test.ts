import { describe, expect, it } from "vitest";
import { requireSameOrigin } from "./csrf.server";

describe("requireSameOrigin", () => {
  it("accepts same-origin requests", () => {
    expect(
      requireSameOrigin(
        new Request("https://komikstream.test/account", {
          method: "POST",
          headers: { origin: "https://komikstream.test" },
        }),
      ),
    ).toBeNull();
  });

  it("rejects cross-origin and missing-origin requests", () => {
    expect(
      requireSameOrigin(
        new Request("https://komikstream.test/account", {
          method: "POST",
          headers: { origin: "https://evil.test" },
        }),
      )?.status,
    ).toBe(403);
    expect(
      requireSameOrigin(
        new Request("https://komikstream.test/account", { method: "POST" }),
      )?.status,
    ).toBe(403);
  });
});