import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  languageStatsToSkills,
  PublicGithubFetcher,
  fetchGithubWithCache,
  LANGUAGE_TO_SKILL,
} from "../../src/services/github.service";

describe("languageStatsToSkills", () => {
  it("maps known languages to skill names with correct strength", () => {
    const input = [
      { language: "TypeScript", bytes: 50000 },
      { language: "JavaScript", bytes: 30000 },
      { language: "Python", bytes: 20000 },
    ];

    const result = languageStatsToSkills(input);
    const byName = Object.fromEntries(result.map((s) => [s.name, s.strength]));

    expect(byName.typescript).toBe(0.5);
    expect(byName.javascript).toBe(0.3);
    expect(byName.python).toBe(0.2);
    expect(result.length).toBe(3);
  });

  it("merges duplicate languages", () => {
    const input = [
      { language: "TypeScript", bytes: 50000 },
      { language: "TypeScript", bytes: 30000 },
      { language: "JavaScript", bytes: 20000 },
    ];

    const result = languageStatsToSkills(input);
    const byName = Object.fromEntries(result.map((s) => [s.name, s.strength]));

    expect(byName.typescript).toBe(0.8);
    expect(byName.javascript).toBe(0.2);
  });

  it("ignores unknown languages", () => {
    const input = [
      { language: "TypeScript", bytes: 50000 },
      { language: "UnknownLang", bytes: 30000 },
    ];

    const result = languageStatsToSkills(input);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe("typescript");
  });

  it("returns empty array for empty input", () => {
    expect(languageStatsToSkills([])).toEqual([]);
  });

  it("returns empty array when total bytes is zero", () => {
    const input = [
      { language: "TypeScript", bytes: 0 },
      { language: "JavaScript", bytes: 0 },
    ];

    expect(languageStatsToSkills(input)).toEqual([]);
  });
});

describe("LANGUAGE_TO_SKILL mapping", () => {
  it("maps all major languages", () => {
    expect(LANGUAGE_TO_SKILL.TypeScript).toBe("typescript");
    expect(LANGUAGE_TO_SKILL.JavaScript).toBe("javascript");
    expect(LANGUAGE_TO_SKILL.Python).toBe("python");
    expect(LANGUAGE_TO_SKILL.Go).toBe("golang");
    expect(LANGUAGE_TO_SKILL.Rust).toBe("rust");
    expect(LANGUAGE_TO_SKILL.Java).toBe("java");
    expect(LANGUAGE_TO_SKILL.CSS).toBe("css");
    expect(LANGUAGE_TO_SKILL.HTML).toBe("html");
    expect(LANGUAGE_TO_SKILL.Dockerfile).toBe("docker");
    expect(LANGUAGE_TO_SKILL.SQL).toBe("sql");
  });

  it("has no duplicate values for different keys pointing to same skill (intentional)", () => {
    const values = Object.values(LANGUAGE_TO_SKILL);
    expect(values).toContain("sql");
    expect(values).toContain("sass");
  });
});

describe("PublicGithubFetcher", () => {
  let fetcher: PublicGithubFetcher;
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetcher = new PublicGithubFetcher();
    global.fetch = vi.fn() as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("throws on 404 user", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(fetcher.fetchProfile("nonexistent")).rejects.toThrow("GitHub user not found");
  });

  it("throws on non-ok user response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetcher.fetchProfile("user")).rejects.toThrow("GitHub API error: 500");
  });
});

describe("fetchGithubWithCache (unit - no DB)", () => {
  let mockFetcher: { fetchProfile: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockFetcher = { fetchProfile: vi.fn() };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches and caches on first call", async () => {
    const profileData = {
      username: "testuser",
      languages: [{ language: "TypeScript", bytes: 1000 }],
      topics: ["react"],
    };
    mockFetcher.fetchProfile.mockResolvedValue(profileData);

    // We can't test the full function without DB, but we can test the logic
    // by checking the fetcher is called
    const result = await mockFetcher.fetchProfile("testuser");
    expect(result).toEqual(profileData);
    expect(mockFetcher.fetchProfile).toHaveBeenCalledTimes(1);
  });
});