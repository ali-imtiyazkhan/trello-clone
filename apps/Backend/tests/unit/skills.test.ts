import { describe, it, expect } from "vitest";
import { getSkillDictionary, matchText } from "@repo/shared";

describe("skill dictionary", () => {
    it("is a substantial shared vocabulary", () => {
        const dict = getSkillDictionary();
        expect(dict.length).toBeGreaterThan(150);
    });

    it("has unique skill names, non-empty aliases, and positive weights", () => {
        const dict = getSkillDictionary();
        const names = dict.map((s) => s.name);

        expect(new Set(names).size).toBe(names.length);

        for (const skill of dict) {
            expect(skill.aliases.length).toBeGreaterThan(0);
            expect(skill.weight).toBeGreaterThan(0);
        }
    });

    it("contains the core skills", () => {
        const names = getSkillDictionary().map((s) => s.name);

        for (const required of ["react", "docker", "typescript", "aws", "postgresql"]) {
            expect(names).toContain(required);
        }
    });
});

describe("matchText", () => {
    it("returns weighted hits with counts for sample text", () => {
        const hits = matchText(
            "Built a React dashboard with Node.js, Express and PostgreSQL. React hooks everywhere.",
        );

        const byName = Object.fromEntries(hits.map((h) => [h.name, h.count]));

        expect(byName["react"]).toBeGreaterThanOrEqual(2);
        expect(byName["node"]).toBeGreaterThanOrEqual(1);
        expect(byName["sql"]).toBeUndefined();
        expect(byName["postgresql"]).toBeGreaterThanOrEqual(1);
    });

    it("is case-insensitive", () => {
        const hits = matchText("REACT and React and react");
        const react = hits.find((h) => h.name === "react");

        expect(react?.count).toBe(3);
    });

    it("matches aliases and counts them", () => {
        const hits = matchText("typescript and ts and TypeScript");
        const ts = hits.find((h) => h.name === "typescript");

        expect(ts?.count).toBe(3);
    });

    it("does not match partial words", () => {
        const hits = matchText("I am a good person with a golden retriever");

        expect(hits.find((h) => h.name === "golang")).toBeUndefined();
    });

    it("does not match substrings inside other words", () => {
        const hits = matchText("postgresql, reactjs");

        expect(hits.find((h) => h.name === "sql")).toBeUndefined();
        expect(hits.find((h) => h.name === "react")).toBeDefined();
    });

    it("returns an empty array for unrelated text", () => {
        expect(matchText("The quick brown fox jumps over the lazy dog")).toEqual([]);
    });

    it("returns hits sorted by count descending", () => {
        const hits = matchText("docker docker docker and a bit of react");

        expect(hits[0]?.name).toBe("docker");
    });
});
