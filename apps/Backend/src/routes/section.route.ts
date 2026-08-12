import { Router } from "express";
import { prisma } from "prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
    const { title, boardId } = req.body;

    if (!title || !boardId) {
        return res.status(400).json({
            message: "please provide the correct input"
        });
    }

    try {
        const board = await prisma.board.findUnique({
            where: {
                id: boardId
            }
        });

        if (!board) {
            return res.status(404).json({
                message: "Board doesn't exist"
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: board.organizationId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "Not a member of this org"
            });
        }

        const section = await prisma.section.create({
            data: {
                title,
                boardId
            },
            select: {
                id: true,
                title: true,
                boardId: true,
            }
        });

        return res.status(200).json({
            message: "Section created successfully",
            section
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error"
        });
    }
});

router.get("/board/:boardId", authMiddleware, async (req, res) => {
    const { boardId } = req.params;

    try {
        const board = await prisma.board.findUnique({
            where: {
                id: boardId as string
            }
        });

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: board.organizationId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "Not a member of this org"
            });
        }

        const sections = await prisma.section.findMany({
            where: {
                boardId: boardId as string
            },
            select: {
                id: true,
                title: true,
                boardId: true,
                _count: {
                    select: {
                        issues: true
                    }
                }
            }
        });

        return res.status(200).json({
            sections
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error"
        });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { boardId } = req.query;

    if (!boardId) {
        return res.status(400).json({
            message: "boardId query param required"
        });
    }

    try {
        const board = await prisma.board.findUnique({
            where: {
                id: boardId as string
            }
        });

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: board.organizationId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "Not a member of this org"
            });
        }

        const section = await prisma.section.findUnique({
            where: {
                id: id as string,
                boardId: boardId as string
            },
            select: {
                id: true,
                title: true,
                boardId: true,
                _count: {
                    select: {
                        issues: true
                    }
                }
            }
        });

        if (!section) {
            return res.status(404).json({
                message: "Section not found"
            });
        }

        return res.status(200).json({
            section
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error"
        });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { title, boardId } = req.body;

    if (!title || !boardId) {
        return res.status(400).json({
            message: "title and boardId are required"
        });
    }

    try {
        const board = await prisma.board.findUnique({
            where: {
                id: boardId
            }
        });

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: board.organizationId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "Not a member of this org"
            });
        }

        const section = await prisma.section.findUnique({
            where: {
                id: id as string,
                boardId
            }
        });

        if (!section) {
            return res.status(404).json({
                message: "Section not found"
            });
        }

        const updatedSection = await prisma.section.update({
            where: { id: id as string },
            data: { title },
            select: {
                id: true,
                title: true,
                boardId: true,
            }
        });

        return res.status(200).json({
            message: "Section updated successfully",
            section: updatedSection
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error"
        });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { boardId } = req.query;

    if (!boardId) {
        return res.status(400).json({
            message: "boardId query param required"
        });
    }

    try {
        const board = await prisma.board.findUnique({
            where: {
                id: boardId as string
            }
        });

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: board.organizationId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: "Not a member of this org"
            });
        }

        const section = await prisma.section.findUnique({
            where: {
                id: id as string,
                boardId: boardId as string
            }
        });

        if (!section) {
            return res.status(404).json({
                message: "Section not found"
            });
        }

        await prisma.section.delete({
            where: { id: id as string }
        });

        return res.status(200).json({
            message: "Section deleted successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error"
        });
    }
});

export default router;