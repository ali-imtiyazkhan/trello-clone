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
});
