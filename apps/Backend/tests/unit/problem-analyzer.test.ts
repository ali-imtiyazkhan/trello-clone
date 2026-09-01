import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { analyzeProblem } from "../../src/services/problem-analyzer.service";

describe("analyzeProblem", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn() as any;
    process.env.GROQ_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GROQ_API_KEY;
  });

  it("throws when GROQ_API_KEY is not configured", async () => {
    delete process.env.GROQ_API_KEY;
    await expect(analyzeProblem("Some description")).rejects.toThrow("GROQ_API_KEY not configured");
  });

  it("calls Groq API with correct parameters", async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            requiredSkills: [{ name: "react", weight: 5 }, { name: "typescript", weight: 4 }],
            suggestedRoles: ["frontend"],
            complexity: "medium",
            estimatedHours: 30,
          }),
        },
      }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await analyzeProblem("Build a React dashboard with TypeScript for a hackathon");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-key",
        }),
        body: expect.stringContaining("react"),
      })
    );

    expect(result.requiredSkills).toEqual([
      { name: "react", weight: 5 },
      { name: "typescript", weight: 4 },
    ]);
    expect(result.suggestedRoles).toEqual(["frontend"]);
    expect(result.complexity).toBe("medium");
    expect(result.estimatedHours).toBe(30);
  });

  it("throws on API error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(analyzeProblem("Some description")).rejects.toThrow("Groq API error: 401 - Unauthorized");
  });

  it("throws on invalid JSON response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "not valid json" } }],
      }),
    });

    await expect(analyzeProblem("Some description")).rejects.toThrow("Failed to parse LLM response as JSON");
  });

  it("throws on empty response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    await expect(analyzeProblem("Some description")).rejects.toThrow("No response from LLM");
  });

  it("uses default values when LLM omits optional fields", async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            requiredSkills: [{ name: "react", weight: 3 }],
          }),
        },
      }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await analyzeProblem("Build a simple React app");

    expect(result.requiredSkills).toEqual([{ name: "react", weight: 3 }]);
    expect(result.suggestedRoles).toEqual([]);
    expect(result.complexity).toBe("medium");
    expect(result.estimatedHours).toBe(40);
  });
});