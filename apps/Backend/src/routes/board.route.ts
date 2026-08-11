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
        // orderBy: { createdAt: 'asc' }
    })

    res.json({
        boards
    })

})

export default router