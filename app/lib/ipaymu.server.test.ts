import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyIpaymuSignature } from "./ipaymu.server";

const va = "1179000899";
const apiKey = "test-key";
const body = JSON.stringify({ trx_id: "trx-1", reference_id: "user-1" });

function signatureFor(raw: string) {
  const hash = createHash("sha256").update(raw).digest("hex").toLowerCase();
  return createHmac("sha256", apiKey)
    .update(`POST:${va}:${hash}:${apiKey}`)
    .digest("hex");
}

describe("verifyIpaymuSignature", () => {
  it("accepts signature for exact raw body", () => {
    expect(verifyIpaymuSignature(body, signatureFor(body), va, apiKey)).toBe(true);
  });

  it("rejects changed body and malformed signature", () => {
    expect(verifyIpaymuSignature(`${body} `, signatureFor(body), va, apiKey)).toBe(false);
    expect(verifyIpaymuSignature(body, "not-hex", va, apiKey)).toBe(false);
  });
});
