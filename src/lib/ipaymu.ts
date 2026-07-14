import crypto from 'crypto'

export const paymentEnabled = Boolean(process.env.IPAYMU_VA && process.env.IPAYMU_API_KEY)

const VA = () => process.env.IPAYMU_VA!
const API_KEY = () => process.env.IPAYMU_API_KEY!
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function baseUrl(): string {
  return process.env.IPAYMU_SANDBOX === 'true'
    ? 'https://sandbox.ipaymu.com/api/v2'
    : 'https://my.ipaymu.com/api/v2'
}

/** iPaymu HMAC SHA256 signature + timestamp */
function sign(method: string, body: Record<string, unknown>) {
  const bodyStr = JSON.stringify(body)
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex').toLowerCase()
  const toSign = `${method}:${VA()}:${bodyHash}:${API_KEY()}`
  const signature = crypto.createHmac('sha256', API_KEY()).update(toSign).digest('hex')
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  return { signature, timestamp: ts }
}

export interface CreatePaymentParams {
  product: string[]
  qty: number[]
  price: number[]
  referenceId: string
  returnUrl?: string
  cancelUrl?: string
  notifyUrl?: string
}

/** Create iPaymu redirect payment → user goes to iPaymu page, pays, gets redirected back */
export async function createRedirectPayment(params: CreatePaymentParams) {
  const body = {
    product: params.product,
    qty: params.qty,
    price: params.price,
    returnUrl: params.returnUrl ?? `${APP_URL()}/account?upgrade=success`,
    cancelUrl: params.cancelUrl ?? `${APP_URL()}/account?upgrade=cancelled`,
    notifyUrl: params.notifyUrl ?? `${APP_URL()}/api/subscription/webhook`,
    referenceId: params.referenceId,
  }

  const { signature, timestamp } = sign('POST', body)

  const res = await fetch(`${baseUrl()}/payment`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      va: VA(),
      signature,
      timestamp,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`iPaymu ${res.status}: ${text}`)
  }

  const json = await res.json()
  if (json.Status !== 200) throw new Error(`iPaymu: ${json.Message ?? 'Unknown'}`)

  return json.Data as { SessionID: string; Url: string }
}

/** Verify iPaymu webhook HMAC signature against raw request body */
export function verifySignature(body: string, signature: string): boolean {
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex').toLowerCase()
  const toSign = `POST:${VA()}:${bodyHash}:${API_KEY()}`
  const expected = crypto.createHmac('sha256', API_KEY()).update(toSign).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return expected === signature
  }
}
