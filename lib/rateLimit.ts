import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  req: NextRequest,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= limit) {
    return NextResponse.json(
      { error: "Masyadong maraming kahilingan. Subukan muli mamaya." },
      { status: 429 }
    );
  }

  entry.count += 1;
  return null;
}
