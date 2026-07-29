import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const paymentEnabled = Boolean(
  process.env.IPAYMU_VA && process.env.IPAYMU_API_KEY,
);

function baseUrl(): string {
  return process.env.IPAYMU_SANDBOX === "true"
    ? "https://sandbox.ipaymu.com/api/v2"
    : "https://my.ipaymu.com/api/v2";
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

function sign(method: string, body: Record<string, unknown>) {
  const va = process.env.IPAYMU_VA ?? "";
  const apiKey = process.env.IPAYMU_API_KEY ?? "";
  const bodyHash = createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex")
    .toLowerCase();
  const signature = createHmac("sha256", apiKey)
    .update(`${method}:${va}:${bodyHash}:${apiKey}`)
    .digest("hex");
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
  return { signature, timestamp };
}

export interface CreatePaymentParams {
  product: string[];
  qty: number[];
  price: number[];
  referenceId: string;
}

/** Create iPaymu redirect payment — returns hosted payment URL. */
export async function createRedirectPayment(params: CreatePaymentParams) {
  const body = {
    product: params.product,
    qty: params.qty,
    price: params.price,
    returnUrl: `${appUrl()}/account?upgrade=success`,
    cancelUrl: `${appUrl()}/account?upgrade=cancelled`,
    notifyUrl: `${appUrl()}/api/subscription/webhook`,
    referenceId: params.referenceId,
  };
  const { signature, timestamp } = sign("POST", body);

  const res = await fetch(`${baseUrl()}/payment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      va: process.env.IPAYMU_VA ?? "",
      signature,
      timestamp,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`iPaymu ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.Status !== 200) throw new Error(`iPaymu: ${json.Message ?? "Unknown"}`);
  return json.Data as { SessionID: string; Url: string };
}

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
