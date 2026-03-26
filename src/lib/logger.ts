import "server-only";

// ─── Log Levels ─────────────────────────────────────────────────────

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ─── Config ─────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const MIN_LEVEL: LogLevel = IS_PRODUCTION ? "info" : "debug";

// ─── Structured Log Entry ───────────────────────────────────────────

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

// ─── Logger ─────────────────────────────────────────────────────────

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LEVEL];
}

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

function write(entry: LogEntry): void {
  if (IS_PRODUCTION) {
    // Structured JSON for production log aggregators (Vercel, Datadog, etc.)
    const output = JSON.stringify(entry);
    if (entry.level === "error") {
      console.error(output);
    } else if (entry.level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  } else {
    // Human-readable for local development
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { level, message, timestamp: _ts, ...rest } = entry;
    const prefix = `[${level.toUpperCase()}]`;
    const extra = Object.keys(rest).length > 0 ? rest : undefined;
    if (entry.level === "error") {
      console.error(prefix, message, ...(extra ? [extra] : []));
    } else if (entry.level === "warn") {
      console.warn(prefix, message, ...(extra ? [extra] : []));
    } else if (entry.level === "debug") {
      console.debug(prefix, message, ...(extra ? [extra] : []));
    } else {
      console.log(prefix, message, ...(extra ? [extra] : []));
    }
  }
}

// ─── Logger Interface ───────────────────────────────────────────────

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
}

// ─── Public API ─────────────────────────────────────────────────────

export const logger: Logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog("debug")) write(formatEntry("debug", message, meta));
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog("info")) write(formatEntry("info", message, meta));
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog("warn")) write(formatEntry("warn", message, meta));
  },

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    if (!shouldLog("error")) return;

    const errorMeta: Record<string, unknown> = { ...meta };

    if (error instanceof Error) {
      errorMeta.errorName = error.name;
      errorMeta.errorMessage = error.message;
      if (!IS_PRODUCTION) {
        errorMeta.stack = error.stack;
      }
    } else if (error !== undefined) {
      errorMeta.errorRaw = String(error);
    }

    write(formatEntry("error", message, errorMeta));
  },
};

// ─── Trace Logger Factory ───────────────────────────────────────────

/**
 * Creates a child logger that injects a traceId (and optional context)
 * into every log entry. Use in API route handlers:
 *
 *   const log = createTraceLogger(request.headers.get("x-trace-id"));
 *   log.info("Search requested", { query });
 */
export function createTraceLogger(
  traceId: string | null,
  context?: Record<string, unknown>
): Logger {
  const base = { ...(traceId ? { traceId } : {}), ...context };
  return {
    debug: (message, meta) => logger.debug(message, { ...base, ...meta }),
    info: (message, meta) => logger.info(message, { ...base, ...meta }),
    warn: (message, meta) => logger.warn(message, { ...base, ...meta }),
    error: (message, error, meta) => logger.error(message, error, { ...base, ...meta }),
  };
}
