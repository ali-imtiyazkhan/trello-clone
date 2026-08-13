import { Router } from "express";
import { prisma } from "prisma";
import { authMiddleware } from "../middleware/auth";
const router = Router()

router.post("/", authMiddleware, async (req, res) => {
    const { title, organizationId } = req.body;

    if (!title || !organizationId) {
        res.status(400).json({
            message: "please provide the correct input"
        })
        return
    }

    try {

        const checkOrg = await prisma.organization.findUnique({
            where: {
                id: organizationId
            }
        })
        if (!checkOrg) {
            res.status(400).json({
                message: "org doesn't exist in the db"
            })
            return
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: organizationId
                }
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "Not a member of this org"
            })
        }

        const result = await prisma.board.create({
            data: {
                title: title,
                organizationId
            },
            select: {
                id: true,
                title: true,
                organizationId: true,
            }
        })

        res.status(200).json({
            message: "board created successfully",
            result
        })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error"
        })
    }
})

router.get("/", authMiddleware, async (req, res) => {
    const { orgId } = req.query

    if (!orgId) {
        return res.status(400).json({
            message: "orgId query param required"
        })
    }

    const membership = await prisma.membership.findUnique({
        where: {
            userId_orgId: {
                userId: req.user.id,
                orgId: orgId as string
            }
        }
    })

    if (!membership) {
        return res.status(403).json({
            message: "Not a member of this org"
        })
    }

    const boards = await prisma.board.findMany({
        where: {
            organizationId: orgId as string
        },
        select: {
            id: true,
            title: true,
            _count: {
                select: {
                    issues: true,
                    sections: true
                }
            }
        },
    })

    res.json({
        boards
    })

})

router.get("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params
    const { orgId } = req.query

    if (!orgId) {
        return res.status(400).json({
            message: "orgId query param required"
        })
    }

    try {
        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: orgId as string
                }
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "Not a member of this org"
            })
        }

        const board = await prisma.board.findUnique({
            where: {
                id: id as string,
                organizationId: orgId as string
            },
            select: {
                id: true,
                title: true,
                organizationId: true,
                _count: {
                    select: {
                        sections: true,
                        issues: true
                    }
                }
            }
        })

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            })
        }

        return res.status(200).json({
            message: "Board data retrieved successfully",
            board
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error"
        })
    }

})

router.put("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params
    const { title, orgId } = req.body

    if (!title || !orgId) {
        return res.status(400).json({
            message: "title and orgId are required"
        })
    }

    try {
        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId
                }
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "Not a member of this org"
            })
        }

        const board = await prisma.board.findUnique({
            where: {
                id: id as string,
                organizationId: orgId
            }
        })

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            })
        }

        const updatedBoard = await prisma.board.update({
            where: { id: id as string },
            data: { title },
            select: {
                id: true,
                title: true,
                organizationId: true,
            }
        })

        return res.status(200).json({
            message: "Board updated successfully",
            board: updatedBoard
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error"
        })
    }
})

router.delete("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params
    const { orgId } = req.query

    if (!orgId) {
        return res.status(400).json({
            message: "orgId query param required"
        })
    }

    try {
        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: orgId as string
                }
            }
        })

        if (!membership) {
            return res.status(403).json({
                message: "Not a member of this org"
            })
        }

        const board = await prisma.board.findUnique({
            where: {
                id: id as string,
                organizationId: orgId as string
            }
        })

        if (!board) {
            return res.status(404).json({
                message: "Board not found"
            })
        }

        await prisma.board.delete({
            where: { id: id as string }
        })

        return res.status(200).json({
            message: "Board deleted successfully"
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "internal server error"
        })
    }
})

export default router