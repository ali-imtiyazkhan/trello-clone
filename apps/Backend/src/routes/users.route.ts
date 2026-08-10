import { Router } from "express";
import { prisma } from "prisma";
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import bcrypt from "bcrypt";

const route = Router();

route.use(authMiddleware);

// GET Current user profile
route.get("/me", async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, username: true }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
});

// GET Public profile
route.get("/:id", async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, username: true }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
});

// PATCH Update profile
route.patch("/me", async (req: AuthRequest, res) => {
    const { username, email } = req.body;
    const user = await prisma.user.update({
        where: { id: req.userId },
        data: { username, email },
        select: { id: true, email: true, username: true }
    });
    res.json({ user });
});

// PATCH Change password
route.patch("/me/password", async (req: AuthRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Current password incorrect" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    res.json({ message: "Password updated" });
});

// DELETE Delete account
route.delete("/me", async (req: AuthRequest, res) => {
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ message: "Account deleted" });
});

export default route;