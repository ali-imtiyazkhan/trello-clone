import { Router } from "express";
import { prisma } from "prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
    const { title, description, sectionId } = req.body;

    if (!title || !sectionId) {
        return res.status(400).json({
            message: "title and sectionId are required",
        });
    }

    try {
        const section = await prisma.section.findUnique({
            where: {
                id: sectionId,
            },
            include: {
                board: {
                    select: {
                        id: true,
                        organizationId: true,
                    },
                },
            },
        });

        if (!section) {
            return res.status(404).json({
                message: "Section doesn't exist",
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: section.board.organizationId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this organization",
            });
        }

        const issue = await prisma.issue.create({
            data: {
                title,
                description,
                sectionId,
                boardId: section.board.id,
            },
            select: {
                id: true,
                title: true,
                description: true,
                boardId: true,
                sectionId: true,
            },
        });

        return res.status(201).json({
            message: "Issue created successfully",
            issue,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});


router.get("/:sectionId", authMiddleware, async (req, res) => {
    const { sectionId } = req.params;

    if (!sectionId) {
        return res.status(400).json({
            message: "Please provide the correct input",
        });
    }

    try {
        const section = await prisma.section.findUnique({
            where: {
                id: sectionId as string,
            },
            include: {
                board: {
                    select: {
                        id: true,
                        organizationId: true,
                    },
                },
            },
        });

        if (!section) {
            return res.status(404).json({
                message: "Section not found",
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.user.id,
                    orgId: section.board.organizationId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this organization",
            });
        }

        const issues = await prisma.issue.findMany({
            where: {
                sectionId: sectionId as string,
            },
            select: {
                id: true,
                title: true,
                description: true,
                boardId: true,
                sectionId: true,
            },
        });

        return res.status(200).json({
            message: "Issues retrieved successfully",
            issues,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

router.get(
    "/:sectionId/:issueId",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId } = req.params;

        if (!sectionId || !issueId) {
            return res.status(400).json({
                message: "Please provide the correct input",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    sectionId: true,
                    boardId: true,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            return res.status(200).json({
                message: "Issue successfully retrieved",
                issue,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.put(
    "/:sectionId/:issueId",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId } = req.params;
        const { title, description, sectionId: newSectionId } = req.body;

        if (!sectionId || !issueId) {
            return res.status(400).json({
                message: "Please provide the correct input",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            let targetSectionId: string = sectionId as string;
            if (newSectionId && newSectionId !== sectionId) {
                const targetSection = await prisma.section.findUnique({
                    where: {
                        id: newSectionId as string,
                    },
                    include: {
                        board: {
                            select: {
                                id: true,
                                organizationId: true,
                            },
                        },
                    },
                });

                if (!targetSection) {
                    return res.status(404).json({
                        message: "Target section doesn't exist",
                    });
                }

                if (targetSection.board.id !== section.board.id) {
                    return res.status(400).json({
                        message: "Cannot move issue to a different board",
                    });
                }

                const targetMembership = await prisma.membership.findUnique({
                    where: {
                        userId_orgId: {
                            orgId: targetSection.board.organizationId,
                            userId: req.user.id,
                        },
                    },
                });

                if (!targetMembership) {
                    return res.status(403).json({
                        message: "You are not a member of the target organization",
                    });
                }

                targetSectionId = newSectionId;
            }

            const updatedIssue = await prisma.issue.update({
                where: { id: issueId as string },
                data: {
                    title: title ?? issue.title,
                    description: description ?? issue.description,
                    sectionId: targetSectionId as string,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    sectionId: true,
                    boardId: true,
                },
            });

            return res.status(200).json({
                message: "Issue updated successfully",
                issue: updatedIssue,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.delete(
    "/:sectionId/:issueId",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId } = req.params;

        if (!sectionId || !issueId) {
            return res.status(400).json({
                message: "Please provide the correct input",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            await prisma.issue.delete({
                where: { id: issueId as string },
            });

            return res.status(200).json({
                message: "Issue deleted successfully",
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.get(
    "/board/:boardId",
    authMiddleware,
    async (req, res) => {
        const { boardId } = req.params;

        if (!boardId) {
            return res.status(400).json({
                message: "Please provide the boardId",
            });
        }

        try {
            const board = await prisma.board.findUnique({
                where: {
                    id: boardId as string,
                },
            });

            if (!board) {
                return res.status(404).json({
                    message: "Board not found",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        userId: req.user.id,
                        orgId: board.organizationId,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issues = await prisma.issue.findMany({
                where: {
                    boardId: boardId as string,
                },
                include: {
                    section: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    assignees: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                },
                            },
                        },
                    },
_count: {
                        select: {
                            comments: true,
                        },
                    },
                },
                orderBy: {
                    id: "asc",
                },
            });

            return res.status(200).json({
                message: "Issues retrieved successfully",
                issues,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.post(
    "/:sectionId/:issueId/assignees",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId } = req.params;
        const { userId } = req.body;

        if (!sectionId || !issueId || !userId) {
            return res.status(400).json({
                message: "sectionId, issueId, and userId are required",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!targetUser) {
                return res.status(404).json({
                    message: "User not found",
                });
            }

            const targetMembership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        userId: userId,
                        orgId: section.board.organizationId,
                    },
                },
            });

            if (!targetMembership) {
                return res.status(403).json({
                    message: "User is not a member of this organization",
                });
            }

            const existingMapping = await prisma.issueMapping.findUnique({
                where: {
                    userId_issueId: {
                        userId: userId,
                        issueId: issueId as string,
                    },
                },
            });

            if (existingMapping) {
                return res.status(400).json({
                    message: "User is already assigned to this issue",
                });
            }

            const mapping = await prisma.issueMapping.create({
                data: {
                    userId: userId,
                    issueId: issueId as string,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            });

            return res.status(201).json({
                message: "Assignee added successfully",
                assignee: mapping,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.get(
    "/:sectionId/:issueId/assignees",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId } = req.params;

        if (!sectionId || !issueId) {
            return res.status(400).json({
                message: "Please provide the correct input",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            const assignees = await prisma.issueMapping.findMany({
                where: {
                    issueId: issueId as string,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            });

            return res.status(200).json({
                message: "Assignees retrieved successfully",
                assignees,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.delete(
    "/:sectionId/:issueId/assignees/:userId",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId, userId } = req.params;

        if (!sectionId || !issueId || !userId) {
            return res.status(400).json({
                message: "Please provide the correct input",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            const mapping = await prisma.issueMapping.findUnique({
                where: {
                    userId_issueId: {
                        userId: userId as string,
                        issueId: issueId as string,
                    },
                },
            });

            if (!mapping) {
                return res.status(404).json({
                    message: "Assignee not found on this issue",
                });
            }

            await prisma.issueMapping.delete({
                where: {
                    userId_issueId: {
                        userId: userId as string,
                        issueId: issueId as string,
                    },
                },
            });

            return res.status(200).json({
                message: "Assignee removed successfully",
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.post(
    "/:sectionId/:issueId/comments",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId } = req.params;
        const { content } = req.body;

        if (!sectionId || !issueId || !content) {
            return res.status(400).json({
                message: "sectionId, issueId, and content are required",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            const comment = await prisma.comment.create({
                data: {
                    content,
                    userId: req.user.id,
                    issueId: issueId as string,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            });

            return res.status(201).json({
                message: "Comment created successfully",
                comment,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.get(
    "/:sectionId/:issueId/comments",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId } = req.params;

        if (!sectionId || !issueId) {
            return res.status(400).json({
                message: "Please provide the correct input",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            const comments = await prisma.comment.findMany({
                where: {
                    issueId: issueId as string,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
                // orderBy: {
                //     createdAt: "asc",
                // },
            });

            return res.status(200).json({
                message: "Comments retrieved successfully",
                comments,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.put(
    "/:sectionId/:issueId/comments/:commentId",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId, commentId } = req.params;
        const { content } = req.body;

        if (!sectionId || !issueId || !commentId || !content) {
            return res.status(400).json({
                message: "sectionId, issueId, commentId, and content are required",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            const comment = await prisma.comment.findFirst({
                where: {
                    id: commentId as string,
                    issueId: issueId as string,
                },
            });

            if (!comment) {
                return res.status(404).json({
                    message: "Comment doesn't exist on this issue",
                });
            }

            if (comment.userId !== req.user.id) {
                return res.status(403).json({
                    message: "You can only edit your own comments",
                });
            }

            const updatedComment = await prisma.comment.update({
                where: { id: commentId as string },
                data: { content },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            });

            return res.status(200).json({
                message: "Comment updated successfully",
                comment: updatedComment,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

router.delete(
    "/:sectionId/:issueId/comments/:commentId",
    authMiddleware,
    async (req, res) => {
        const { sectionId, issueId, commentId } = req.params;

        if (!sectionId || !issueId || !commentId) {
            return res.status(400).json({
                message: "Please provide the correct input",
            });
        }

        try {
            const section = await prisma.section.findUnique({
                where: {
                    id: sectionId as string,
                },
                include: {
                    board: {
                        select: {
                            id: true,
                            organizationId: true,
                        },
                    },
                },
            });

            if (!section) {
                return res.status(404).json({
                    message: "Section doesn't exist",
                });
            }

            const membership = await prisma.membership.findUnique({
                where: {
                    userId_orgId: {
                        orgId: section.board.organizationId,
                        userId: req.user.id,
                    },
                },
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this organization",
                });
            }

            const issue = await prisma.issue.findFirst({
                where: {
                    id: issueId as string,
                    sectionId: sectionId as string,
                },
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Issue doesn't exist in this section",
                });
            }

            const comment = await prisma.comment.findFirst({
                where: {
                    id: commentId as string,
                    issueId: issueId as string,
                },
            });

            if (!comment) {
                return res.status(404).json({
                    message: "Comment doesn't exist on this issue",
                });
            }

            if (comment.userId !== req.user.id) {
                return res.status(403).json({
                    message: "You can only delete your own comments",
                });
            }

            await prisma.comment.delete({
                where: { id: commentId as string },
            });

            return res.status(200).json({
                message: "Comment deleted successfully",
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

export default router;