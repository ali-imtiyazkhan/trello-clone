import { vi } from "vitest";

export function createMockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: "user-1" },
    ...overrides,
  };
}

export function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

export async function createAuthToken(userId: string): Promise<string> {
  return "test-token";
}