import { Router } from "express";
import type { Response } from "express";
import { prisma } from "prisma";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const route = Router();

route.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  const org = await prisma.organization.create({
    data: {
      name,
      description,
      memberships: { create: { userId: req.userId, role: "OWNER" } },
    },
  });

  res.status(201).json({ message: "Organization created successfully", org });
});

route.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const memberships = await prisma.membership.findMany({
    where: { userId: req.userId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: { boards: true, memberships: true },
          },
        },
      },
    },
  });

  const organizations = memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }));

  res.json({ organizations });
});

route.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: { userId: req.userId, orgId: id },
    },
    include: {
      organization: {
        include: {
          boards: { select: { id: true, title: true } },
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  skills: {
                    select: { id: true, name: true, strength: true, source: true },
                    orderBy: { strength: "desc" },
                    take: 5,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return res.status(404).json({ message: "Organization not found" });
  }

  res.json({ organization: { ...membership.organization, role: membership.role } });
});

route.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { name, description } = req.body;

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: req.userId, orgId: id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ message: "Only owner can update organization" });
  }

  const org = await prisma.organization.update({
    where: { id },
    data: { name, description },
    select: { id: true, name: true, description: true },
  });

  res.json({ message: "Organization updated successfully", org });
});

route.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: req.userId, orgId: id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ message: "Only owner can delete organization" });
  }

  await prisma.organization.delete({ where: { id } });

  res.json({ message: "Organization deleted successfully" });
});

route.get("/:id/members", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: req.userId, orgId: id } },
  });

  if (!membership) {
    return res.status(404).json({ message: "Organization not found" });
  }

  const members = await prisma.membership.findMany({
    where: { orgId: id },
    include: { user: { select: { id: true, username: true, email: true } } },
  });

  res.json({ members });
});

route.post("/:id/members", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { userId, role } = req.body;

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: req.userId, orgId: id } },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: id } },
  });

  if (existing) {
    return res.status(400).json({ message: "User is already a member" });
  }

  const newMember = await prisma.membership.create({
    data: { userId, orgId: id, role: role || "MEMBER" },
    include: { user: { select: { id: true, username: true, email: true } } },
  });

  res.status(201).json({ message: "Member added successfully", member: newMember });
});

route.delete("/:id/members/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.params.userId as string;

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: req.userId, orgId: id } },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  if (userId === req.userId) {
    return res.status(400).json({ message: "Cannot remove yourself" });
  }

  const targetMembership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: id } },
  });

  if (!targetMembership) {
    return res.status(404).json({ message: "Member not found" });
  }

  if (targetMembership.role === "OWNER") {
    return res.status(400).json({ message: "Cannot remove owner" });
  }

  await prisma.membership.delete({
    where: { userId_orgId: { userId, orgId: id } },
  });

  res.json({ message: "Member removed successfully" });
});

route.put("/:id/members/:userId", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.params.userId as string;
  const { role } = req.body;

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: req.userId, orgId: id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ message: "Only owner can change roles" });
  }

  if (!["OWNER", "ADMIN", "MEMBER"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const targetMembership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId: id } },
  });

  if (!targetMembership) {
    return res.status(404).json({ message: "Member not found" });
  }

  if (targetMembership.role === "OWNER" && role !== "OWNER") {
    return res.status(400).json({ message: "Cannot change owner role" });
  }

  const updated = await prisma.membership.update({
    where: { userId_orgId: { userId, orgId: id } },
    data: { role },
    include: { user: { select: { id: true, username: true, email: true } } },
  });

  res.json({ message: "Role updated successfully", member: updated });
});

export default route;