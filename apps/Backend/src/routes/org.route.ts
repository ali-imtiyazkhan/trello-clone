import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "prisma"
import { authMiddleware } from "../middleware/auth";

const route = Router()

route.post("/", authMiddleware, async (req: Request, res: Response) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ message: "Name and description are required" });
    }

    const org = await prisma.organization.create({
        data: {
            name,
            description,
            memberships: { create: { userId: req.user.id, role: "OWNER", } }
        }
    })

    res.status(201).json({ message: "Organization created successfully", org });
})

export default route