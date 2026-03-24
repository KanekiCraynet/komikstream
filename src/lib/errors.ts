import "server-only";

import { NextResponse } from "next/server";
import { DatabaseError, DatabaseUnavailableError, UniqueConstraintError } from "@/lib/db-errors";

// ─── Application Error Base ─────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }

  toResponse(): NextResponse {
    return NextResponse.json({ error: this.message, code: this.code }, { status: this.statusCode });
  }
}

// ─── Concrete Error Types ───────────────────────────────────────────

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
    this.fields = fields;
  }

  override toResponse(): NextResponse {
    return NextResponse.json(
      { error: this.message, code: this.code, ...(this.fields && { fields: this.fields }) },
      { status: this.statusCode }
    );
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class ExternalApiError extends AppError {
  public readonly upstream?: { status?: number; url?: string };

  constructor(message: string, upstream?: { status?: number; url?: string }) {
    super(message, "EXTERNAL_API_ERROR", 502);
    this.name = "ExternalApiError";
    this.upstream = upstream;
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporarily unavailable") {
    super(message, "SERVICE_UNAVAILABLE", 503);
    this.name = "ServiceUnavailableError";
  }
}

export class FeatureNotConfiguredError extends AppError {
  constructor(feature = "Feature") {
    super(`${feature} is not configured`, "NOT_CONFIGURED", 501);
    this.name = "FeatureNotConfiguredError";
  }
}

// ─── Error → Response Mapper ────────────────────────────────────────

/**
 * Convert any error to a safe NextResponse.
 * Maps DatabaseError subtypes, AppError subtypes, and unknown errors.
 */
export function errorToResponse(error: unknown): NextResponse {
  // AppError (includes ValidationError, AuthError, etc.)
  if (error instanceof AppError) {
    return error.toResponse();
  }

  // DatabaseError subtypes from db.ts
  if (error instanceof UniqueConstraintError) {
    return NextResponse.json({ error: error.message, code: "CONFLICT" }, { status: 409 });
  }

  if (error instanceof DatabaseUnavailableError) {
    return NextResponse.json(
      { error: "Service temporarily unavailable", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  if (error instanceof DatabaseError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  // Unknown error — never expose internals
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
