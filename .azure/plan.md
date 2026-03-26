# Azure Deployment Plan — KuroManga

## Status: Ready for Validation

## Mode: MODIFY (adding Azure App Service alongside existing Cloudflare Workers)

## Architecture

- **Compute**: Azure App Service (Linux B1, Node 24-lts, Indonesia Central)
- **App Name**: kuromanga
- **Domain**: kuromanga-eqh9frdqdzbjf9h4.indonesiacentral-01.azurewebsites.net
- **Custom Domain**: kuromanga.me
- **VNet**: kuromangaVnet/kuromangaAppSubnet
- **Edge**: Cloudflare Workers Free (thin proxy with KV cache + rate limiting)

## Stack

- **Framework**: Next.js 16.1.7 (standalone output for Azure)
- **Runtime**: Node.js 24-lts
- **Auth**: Clerk
- **ORM**: Prisma v7 + PostgreSQL
- **Deployment**: Code (zip deploy via GitHub Actions)

## IaC Recipe: None (App Service already provisioned manually)

## Services

| Azure Service | Purpose |
|---|---|
| App Service (B1 Linux) | Next.js application host |
| App Service Plan (ASP-kuromanga-84e8) | Compute plan |
| VNet (kuromangaVnet) | Network isolation |

## Deployment

- **Method**: GitHub Actions → `azure/webapps-deploy@v3` (zip deploy)
- **Build**: `BUILD_TARGET=azure next build` → `.next/standalone`
- **Startup**: `node .next/standalone/server.js`
- **Auth**: OIDC federated credentials (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID)

## Environment Variables

| Variable | Source |
|---|---|
| DATABASE_URL | App Service Configuration (secret) |
| CLERK_SECRET_KEY | App Service Configuration (secret) |
| CLERK_WEBHOOK_SECRET | App Service Configuration (secret) |
| CRON_SECRET | App Service Configuration (secret) |
| NEXT_PUBLIC_* | App Service Configuration (plaintext) |
| NODE_ENV | production |
| PORT | 3000 |

## Security

- Access restrictions: Cloudflare IPv4 ranges + Azure health probe only
- SSL: Cloudflare Full (strict) → App Service managed cert
- No secrets in CI build logs (OIDC, no long-lived credentials)

## Files Changed

| File | Action |
|---|---|
| workers/proxy/index.ts | Created — thin CF Worker proxy |
| workers/proxy/tsconfig.json | Created — Worker TypeScript config |
| wrangler.jsonc | Modified — thin proxy config |
| next.config.ts | Modified — BUILD_TARGET conditionals |
| package.json | Modified — added build:azure script |
| src/middleware.ts | Modified — trace ID preservation |
| .github/workflows/deploy-azure.yml | Created — Azure CI/CD |
| .github/workflows/deploy-production.yml | Modified — simplified for proxy |
