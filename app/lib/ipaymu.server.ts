import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const paymentEnabled = Boolean(
  process.env.IPAYMU_VA && process.env.IPAYMU_API_KEY,
);

export function verifyIpaymuSignature(
  rawBody: string,
  signature: string,
  va = process.env.IPAYMU_VA ?? "",
  apiKey = process.env.IPAYMU_API_KEY ?? "",
): boolean {
  if (!va || !apiKey) return false;

  const hash = createHash("sha256")
    .update(rawBody)
    .digest("hex")
    .toLowerCase();
  const expected = createHmac("sha256", apiKey)
    .update(`POST:${va}:${hash}:${apiKey}`)
    .digest();

  try {
    const actual = Buffer.from(signature, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
