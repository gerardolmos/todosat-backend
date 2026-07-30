interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface LocalRateLimitContext {
  ip?: string;

  set(
    name: string,
    value: string,
  ): void;
}

interface LocalRateLimitOptions {
  name: string;
  maxRequestsEnv: string;
  windowMsEnv: string;
  defaultMaxRequests: number;
  defaultWindowMs: number;
}

const DEFAULT_MAX_ENTRIES = 10_000;
const MIN_MAX_ENTRIES = 100;
const MAX_MAX_ENTRIES = 100_000;
const MAX_CLIENT_KEY_LENGTH = 128;
const MAX_CLEANUP_INTERVAL_MS = 60_000;

function readPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
}

function readMaxEntries(): number {
  const parsed =
    readPositiveInteger(
      process.env
        .RATE_LIMIT_MAX_ENTRIES,
      DEFAULT_MAX_ENTRIES,
    );

  return Math.min(
    MAX_MAX_ENTRIES,
    Math.max(
      MIN_MAX_ENTRIES,
      parsed,
    ),
  );
}

function normalizeClientKey(
  value: string | undefined,
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "unknown";
  }

  return value
    .trim()
    .slice(
      0,
      MAX_CLIENT_KEY_LENGTH,
    );
}

export class
BoundedInMemoryRateLimiter {
  private readonly entries =
    new Map<string, RateLimitEntry>();

  private lastCleanupAt = 0;

  constructor(
    private readonly maxEntries:
      number,
  ) {
    if (
      !Number.isSafeInteger(
        maxEntries,
      ) ||
      maxEntries <= 0
    ) {
      throw new TypeError(
        "maxEntries debe ser un entero positivo.",
      );
    }
  }

  get size(): number {
    return this.entries.size;
  }

  consume({
    key,
    maxRequests,
    windowMs,
    now = Date.now(),
  }: {
    key: string;
    maxRequests: number;
    windowMs: number;
    now?: number;
  }): RateLimitResult {
    if (
      !Number.isSafeInteger(
        maxRequests,
      ) ||
      maxRequests <= 0 ||
      !Number.isSafeInteger(
        windowMs,
      ) ||
      windowMs <= 0
    ) {
      throw new TypeError(
        "El límite y la ventana deben ser enteros positivos.",
      );
    }

    const cleanupInterval =
      Math.min(
        windowMs,
        MAX_CLEANUP_INTERVAL_MS,
      );

    if (
      now - this.lastCleanupAt >=
        cleanupInterval ||
      this.entries.size >=
        this.maxEntries
    ) {
      this.removeExpired(now);
      this.lastCleanupAt = now;
    }

    const current =
      this.entries.get(key);

    if (
      !current ||
      current.resetAt <= now
    ) {
      this.ensureCapacity();

      const resetAt =
        now + windowMs;

      this.entries.set(key, {
        count: 1,
        resetAt,
      });

      return {
        allowed: true,
        limit: maxRequests,
        remaining:
          Math.max(
            0,
            maxRequests - 1,
          ),
        resetAt,
        retryAfterSeconds: 0,
      };
    }

    if (
      current.count >=
      maxRequests
    ) {
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetAt:
          current.resetAt,
        retryAfterSeconds:
          Math.max(
            1,
            Math.ceil(
              (
                current.resetAt -
                now
              ) / 1000,
            ),
          ),
      };
    }

    current.count += 1;

    return {
      allowed: true,
      limit: maxRequests,
      remaining:
        Math.max(
          0,
          maxRequests -
            current.count,
        ),
      resetAt:
        current.resetAt,
      retryAfterSeconds: 0,
    };
  }

  private removeExpired(
    now: number,
  ) {
    for (
      const [key, entry]
      of this.entries
    ) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  private ensureCapacity() {
    if (
      this.entries.size <
      this.maxEntries
    ) {
      return;
    }

    let earliestKey:
      string | null = null;

    let earliestResetAt =
      Number.POSITIVE_INFINITY;

    for (
      const [key, entry]
      of this.entries
    ) {
      if (
        entry.resetAt <
        earliestResetAt
      ) {
        earliestKey = key;
        earliestResetAt =
          entry.resetAt;
      }
    }

    if (earliestKey) {
      this.entries.delete(
        earliestKey,
      );
    }
  }
}

export function createLocalRateLimit(
  options: LocalRateLimitOptions,
) {
  const limiter =
    new BoundedInMemoryRateLimiter(
      readMaxEntries(),
    );

  return function applyRateLimit(
    ctx: LocalRateLimitContext,
  ): boolean {
    const maxRequests =
      readPositiveInteger(
        process.env[
          options.maxRequestsEnv
        ],
        options
          .defaultMaxRequests,
      );

    const windowMs =
      readPositiveInteger(
        process.env[
          options.windowMsEnv
        ],
        options.defaultWindowMs,
      );

    const result =
      limiter.consume({
        key:
          `${options.name}:${
            normalizeClientKey(
              ctx.ip,
            )
          }`,
        maxRequests,
        windowMs,
      });

    ctx.set(
      "X-RateLimit-Limit",
      String(result.limit),
    );

    ctx.set(
      "X-RateLimit-Remaining",
      String(result.remaining),
    );

    ctx.set(
      "X-RateLimit-Reset",
      String(
        Math.ceil(
          result.resetAt / 1000,
        ),
      ),
    );

    if (!result.allowed) {
      ctx.set(
        "Retry-After",
        String(
          result
            .retryAfterSeconds,
        ),
      );
    }

    return result.allowed;
  };
}
