import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { prisma } from "prisma";
import { matchText } from "@repo/shared";
import { authMiddleware } from "../middleware/auth";
import { PublicGithubFetcher, fetchGithubWithCache, languageStatsToSkills } from "../services/github.service";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

async function upsertSkill(userId: string, name: string, strength: number, count: number, source: "RESUME" | "GITHUB") {
    const existing = await prisma.userSkill.findUnique({
        where: {
            userId_name: {
                userId: userId,
                name: name,
            },
        },
    });

    if (existing?.source === "MANUAL") return;

    if (existing) {
        await prisma.userSkill.update({
            where: {
                id: existing.id,
            },
            data: {
                strength,
                occurrenceCount: count,
                source,
            },
        });
    } else {
        await prisma.userSkill.create({
            data: {
                userId,
                strength,
                occurrenceCount: count,
                source,
                name,
            },
        });
    }
}

router.post("/resume", authMiddleware, upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "file is required",
        });
    }

    try {
        let text = "";
        if (req.file.originalname.endsWith(".pdf")) {
            const parser = new PDFParse({ data: req.file.buffer });
            const result = await parser.getText();
            text = result.text;
            await parser.destroy();
        } else {
            text = req.file.buffer.toString("utf-8");
        }

        if (!text.trim()) {
            return res.status(400).json({
                message: "could not extract text from this file",
            });
        }

        const hits = matchText(text);
        for (const hit of hits) {
            await upsertSkill(req.user.id, hit.name, Math.min(1, hit.count / 5), hit.count, "RESUME");
        }

        return res.status(201).json({ message: "Resume parsed successfully", skills: hits });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

router.post("/skills", authMiddleware, async (req, res) => {
    const { skills } = req.body as { skills?: { name: string; strength: number }[] };

    if (!Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({
            message: "skills array is required: [{ name, strength }]",
        });
    }

    try {
        const saved = [];
        for (const s of skills) {
            if (!s.name || typeof s.strength !== "number" || s.strength < 1 || s.strength > 5) {
                return res.status(400).json({
                    message: "Each skill needs name and strength between 1 and 5",
                });
            }

            const skill = await prisma.userSkill.upsert({
                where: {
                    userId_name: {
                        userId: req.user.id,
                        name: s.name.toLowerCase(),
                    },
                },
                update: { strength: s.strength / 5, source: "MANUAL", occurrenceCount: 1 },
                create: {
                    userId: req.user.id,
                    name: s.name.toLowerCase(),
                    strength: s.strength / 5,
                    source: "MANUAL",
                    occurrenceCount: 1,
                },
            });
            saved.push(skill);
        }

        return res.status(201).json({ message: "Skills saved successfully", skills: saved });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                githubUsername: true,
                githubSyncedAt: true,
                skills: { orderBy: { strength: "desc" } },
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({ user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/github", authMiddleware, async (req, res) => {
    const { username } = req.body as { username?: string };
    const normalized = username?.trim().replace(/^@/, "");

    if (!normalized) {
        return res.status(400).json({ message: "username is required" });
    }

    try {
        const data = await fetchGithubWithCache(normalized, new PublicGithubFetcher());

        const languageSkills = languageStatsToSkills(data.languages);
        for (const skill of languageSkills) {
            await upsertSkill(req.user.id, skill.name, skill.strength, skill.count, "GITHUB");
        }

        const topicHits = matchText(data.topics.join(" "));
        for (const hit of topicHits) {
            await upsertSkill(req.user.id, hit.name, Math.min(0.6, hit.count * 0.2), hit.count, "GITHUB");
        }

        await prisma.user.update({
            where: { id: req.user.id },
            data: { githubUsername: normalized, githubSyncedAt: new Date() },
        });

        const saved = await prisma.userSkill.findMany({ where: { userId: req.user.id } });

        return res.json({ message: "GitHub profile synced", skills: saved });
    } catch (error) {
        if (error instanceof Error && error.message === "GitHub user not found") {
            return res.status(404).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.delete("/skills/:skillId", authMiddleware, async (req, res) => {
    const { skillId } = req.params;

    try {
        const skill = await prisma.userSkill.findUnique({
            where: { id: skillId as string },
        });

        if (!skill) {
            return res.status(404).json({ message: "Skill not found" });
        }

        if (skill.userId !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own skills" });
        }

        await prisma.userSkill.delete({ where: { id: skillId as string } });

        return res.json({ message: "Skill deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;