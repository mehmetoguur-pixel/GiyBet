import { NextRequest } from "next/server";

export function jsonRequest(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    search?: Record<string, string>;
  },
): NextRequest {
  const url = new URL(path, "http://localhost:3000");
  if (options?.search) {
    for (const [key, value] of Object.entries(options.search)) {
      url.searchParams.set(key, value);
    }
  }
  return new NextRequest(url, {
    method: options?.method ?? "GET",
    headers: options?.headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}
