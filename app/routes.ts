import {
  type RouteConfig,
  index,
  layout,
  route,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("manga/:slug", "routes/manga.$slug.tsx"),
  route("chapter/:chapterId", "routes/chapter.$chapterId.tsx"),
  ...prefix("api", [
    route("history", "routes/api.history.tsx"),
    route("subscription/webhook", "routes/api.subscription.webhook.ts"),
  ]),
] satisfies RouteConfig;
