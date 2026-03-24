/**
 * Database Error Types (Prisma-free)
 *
 * Extracted from db.ts to break the transitive import chain:
 *   errors.ts → db.ts → @prisma/client
 *
 * These classes are plain Error subclasses with NO Prisma dependency,
 * so any file that imports them does NOT pull in @prisma/client.
 * This is critical for Cloudflare Workers where a failed Prisma import
 * would crash routes that don't even use the database.
 */

// ─── Prisma Error Codes ─────────────────────────────────────────────
// Ref: https://www.prisma.io/docs/orm/reference/error-reference
export const PRISMA_ERROR = {
  UNIQUE_CONSTRAINT: "P2002",
  NOT_FOUND: "P2025",
  FOREIGN_KEY: "P2003",
  INVALID_INPUT: "P2006",
} as const;

// ─── Database Error Types ───────────────────────────────────────────

export class DatabaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly meta?: Record<string, unknown>;

  constructor(message: string, code: string, statusCode: number, meta?: Record<string, unknown>) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.statusCode = statusCode;
    this.meta = meta;
  }
}

export class UniqueConstraintError extends DatabaseError {
  constructor(fields?: string[]) {
    const fieldStr = fields?.join(", ") || "unknown";
    super(`Record already exists (duplicate: ${fieldStr})`, PRISMA_ERROR.UNIQUE_CONSTRAINT, 409, {
      fields,
    });
    this.name = "UniqueConstraintError";
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(model?: string) {
    super(`${model || "Record"} not found`, PRISMA_ERROR.NOT_FOUND, 404, { model });
    this.name = "RecordNotFoundError";
  }
}

export class DatabaseUnavailableError extends DatabaseError {
  constructor() {
    super("Database is not configured or unavailable", "DB_UNAVAILABLE", 503);
    this.name = "DatabaseUnavailableError";
  }
}
