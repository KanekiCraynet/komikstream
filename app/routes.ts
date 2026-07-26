import {
  type RouteConfig,
  index,
  route,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("manga", "routes/manga._index.tsx"),
  route("manga/:slug", "routes/manga.$slug.tsx"),
  route("chapter/:chapterId", "routes/chapter.$chapterId.tsx"),
  route("search", "routes/search.tsx"),
  route("bookmark", "routes/bookmark.tsx"),
  route("history", "routes/history.tsx"),
  route("account", "routes/account.tsx"),
  route("sign-in/*", "routes/sign-in.tsx"),
  route("sign-up/*", "routes/sign-up.tsx"),
  route("contact", "routes/contact.tsx"),
  route("dmca", "routes/dmca.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  ...prefix("api", [
    route("history", "routes/api.history.tsx"),
    route("bookmarks", "routes/api.bookmarks.ts"),
    route("health", "routes/api.health.ts"),
    route("push/subscribe", "routes/api.push.subscribe.ts"),
    route("push/unsubscribe", "routes/api.push.unsubscribe.ts"),
    route("subscription/create", "routes/api.subscription.create.ts"),
    route("subscription/status", "routes/api.subscription.status.ts"),
    route("subscription/webhook", "routes/api.subscription.webhook.ts"),
    route("webhooks/clerk", "routes/api.webhooks.clerk.ts"),
  ]),
] satisfies RouteConfig;
