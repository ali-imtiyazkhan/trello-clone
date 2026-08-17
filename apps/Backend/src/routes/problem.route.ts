import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { analyzeProblem } from "../services/problem-analyzer.service";
import { scoreCandidates } from "@repo/shared";
import { prisma } from "prisma";

const router = Router();

router.post("/analyze", authMiddleware, async (req, res) => {
    const { description } = req.body as { description?: string };

    if (!description || description.trim().length < 50) {
        return res.status(400).json({
            message: "Description must be at least 50 characters",
        });
    }

    try {
        const analysis = await analyzeProblem(description.trim());
        return res.json({ analysis });
    } catch (error) {
        console.error("Problem analysis error:", error);
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Analysis failed",
        });
    }
});

router.post("/distribute", authMiddleware, async (req, res) => {
    const { description, organizationId } = req.body as {
        description?: string;
        organizationId?: string;
    };

    if (!description || description.trim().length < 50) {
        return res.status(400).json({
            message: "Description must be at least 50 characters",
        });
    }

    if (!organizationId) {
        return res.status(400).json({
            message: "organizationId is required",
        });
    }

    try {
        const analysis = await analyzeProblem(description.trim());

        const memberships = await prisma.membership.findMany({
            where: { orgId: organizationId },
            include: {
                user: {
                    include: { skills: true },
                },
            },
        });

        const members = memberships.map((m) => ({
            userId: m.user.id,
            username: m.user.username,
            skills: Object.fromEntries(
                m.user.skills.map((s) => [s.name, s.strength])
            ),
        }));

        const loadOf = async (userId: string) => {
            const assigned = await prisma.issueMapping.count({
                where: { userId },
            });
            return assigned;
        };

        const loadMap = new Map<string, number>();
        for (const m of members) {
            loadMap.set(m.userId, await loadOf(m.userId));
        }

        const scores = scoreCandidates({
            requiredSkills: analysis.requiredSkills,
            members,
            loadOf: (userId) => loadMap.get(userId) ?? 0,
        });

        return res.json({ analysis, distribution: scores });
    } catch (error) {
        console.error("Work distribution error:", error);
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Distribution failed",
        });
    }
});

export default router;