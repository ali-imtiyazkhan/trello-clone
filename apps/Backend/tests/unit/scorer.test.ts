import { describe, it, expect } from "vitest";
import { scoreCandidates } from "@repo/shared";

const members = [
    { userId: "alice", username: "alice", skills: { react: 0.8, docker: 0.5 } },
    { userId: "bob", username: "bob", skills: { react: 0.9 } },
    { userId: "carol", username: "carol", skills: { go: 1 } },
];

describe("scoreCandidates", () => {
    it("ranks the strongest match first", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 1 }],
            members,
            loadOf: () => 0,
        });

        expect(results[0]?.userId).toBe("bob");
        expect(results[0]?.score).toBe(0.9);
        expect(results[0]?.precision).toBe(0.9);
        expect(results[0]?.matchedSkills).toEqual([{ skill: "react", strength: 0.9 }]);
        expect(results[0]?.missingSkills).toEqual([]);
    });

    it("penalizes busy members", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 1 }],
            members: [
                { userId: "idle", username: "idle", skills: { react: 0.8 } },
                { userId: "busy", username: "busy", skills: { react: 0.9 } },
            ],
            loadOf: (id) => (id === "busy" ? 4 : 0),
        });

        expect(results[0]?.userId).toBe("idle");
    });

    it("reports missing skills and precision", () => {
        const results = scoreCandidates({
            requiredSkills: [
                { name: "react", weight: 1 },
                { name: "docker", weight: 1 },
            ],
            members: [{ userId: "react-only", username: "react-only", skills: { react: 0.8 } }],
            loadOf: () => 0,
        });

        expect(results[0]?.missingSkills).toEqual(["docker"]);
        expect(results[0]?.precision).toBe(0.4);
    });

    it("scores zero when no required skills", () => {
        const results = scoreCandidates({ requiredSkills: [], members, loadOf: () => 0 });

        for (const c of results) {
            expect(c.score).toBe(0);
            expect(c.precision).toBe(0);
        }
    });

    it("respects skill weights", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 2 }],
            members: [
                { userId: "a", username: "a", skills: { react: 0.5 } },
                { userId: "b", username: "b", skills: { docker: 1 } },
            ],
            loadOf: () => 0,
        });

        expect(results[0]?.userId).toBe("a");
    });

    it("handles empty members array", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 1 }],
            members: [],
            loadOf: () => 0,
        });

        expect(results).toEqual([]);
    });

    it("handles members with no skills", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 1 }],
            members: [{ userId: "nobody", username: "nobody", skills: {} }],
            loadOf: () => 0,
        });

        expect(results[0]?.score).toBe(0);
        expect(results[0]?.precision).toBe(0);
        expect(results[0]?.matchedSkills).toEqual([]);
        expect(results[0]?.missingSkills).toEqual(["react"]);
    });

    it("calculates precision correctly with multiple weighted skills", () => {
        const results = scoreCandidates({
            requiredSkills: [
                { name: "react", weight: 3 },
                { name: "docker", weight: 1 },
                { name: "typescript", weight: 1 },
            ],
            members: [{ userId: "dev", username: "dev", skills: { react: 1, docker: 1 } }],
            loadOf: () => 0,
        });

        expect(results[0]?.precision).toBe(0.8);
        expect(results[0]?.matchedSkills).toEqual([
            { skill: "react", strength: 1 },
            { skill: "docker", strength: 1 },
        ]);
        expect(results[0]?.missingSkills).toEqual(["typescript"]);
    });

    it("uses load factor correctly in score formula", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 1 }],
            members: [
                { userId: "idle", username: "idle", skills: { react: 1 } },
                { userId: "busy", username: "busy", skills: { react: 1 } },
            ],
            loadOf: (id) => (id === "busy" ? 3 : 0),
        });

        expect(results[0]?.userId).toBe("idle");
        expect(results[0]?.score).toBe(1);
        expect(results[1]?.score).toBeCloseTo(1 / (1 + 3 * 0.25), 2);
    });

    it("handles fractional strengths correctly", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 1 }],
            members: [
                { userId: "junior", username: "junior", skills: { react: 0.33 } },
                { userId: "senior", username: "senior", skills: { react: 0.67 } },
            ],
            loadOf: () => 0,
        });

        expect(results[0]?.userId).toBe("senior");
        expect(results[0]?.score).toBe(0.67);
        expect(results[1]?.score).toBe(0.33);
    });

    it("returns all candidates sorted by score descending", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 1 }],
            members: [
                { userId: "low", username: "low", skills: { react: 0.2 } },
                { userId: "high", username: "high", skills: { react: 0.9 } },
                { userId: "mid", username: "mid", skills: { react: 0.5 } },
            ],
            loadOf: () => 0,
        });

        expect(results.map((r) => r.userId)).toEqual(["high", "mid", "low"]);
    });

    it("includes load in candidate output", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 1 }],
            members: [{ userId: "busy", username: "busy", skills: { react: 1 } }],
            loadOf: (id) => 5,
        });

        expect(results[0]?.load).toBe(5);
    });

    it("handles zero weight skills gracefully", () => {
        const results = scoreCandidates({
            requiredSkills: [{ name: "react", weight: 0 }],
            members: [{ userId: "dev", username: "dev", skills: { react: 1 } }],
            loadOf: () => 0,
        });

        expect(results[0]?.precision).toBe(0);
        expect(results[0]?.score).toBe(0);
    });
});
