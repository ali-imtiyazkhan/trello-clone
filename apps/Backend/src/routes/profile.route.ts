import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { prisma } from "prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

const DICTIONARY: Record<string, string[]> = {
    react: ["react", "reactjs", "react.js", "react native"],
    node: ["node", "nodejs", "express", "nest"],
    typescript: ["typescript", "ts"],
    javascript: ["javascript", "js", "es6"],
    sql: ["sql", "postgres", "postgresql", "mysql", "database"],
    docker: ["docker", "kubernetes", "k8s", "container"],
    python: ["python", "django", "flask"],
    golang: ["go", "golang"],
    rust: ["rust"],
    java: ["java", "spring"],
    aws: ["aws", "s3", "lambda", "ec2", "cloud"],
    git: ["git", "github", "github actions"],
};

function matchSkills(text: string) {
    const lower = text.toLowerCase();

    const hits: { name: string; count: number }[] = [];

    for (const [skill, aliases] of Object.entries(DICTIONARY)) {
        let count = 0;
        for (const alias of aliases) {
            count += lower.split(alias).length - 1;
        }
        if (count > 0) hits.push({ name: skill, count });
    }
    return hits;
}

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

        const hits = matchSkills(text);
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

export default router;