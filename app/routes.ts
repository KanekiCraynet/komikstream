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
  route("contact", "routes/contact.tsx"),
  route("dmca", "routes/dmca.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  ...prefix("api", [
    route("history", "routes/api.history.tsx"),
    route("subscription/webhook", "routes/api.subscription.webhook.ts"),
  ]),
] satisfies RouteConfig;
