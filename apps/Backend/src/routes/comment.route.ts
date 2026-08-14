import { Router } from "express";
import { prisma } from "prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/:issueId", authMiddleware, async (req, res) => {
    const { content } = req.body;
    const { issueId } = req.params;

    if (!content || !issueId) {
        return res.status(400).json({
            message: "Please provide the correct input",
        });
    }

    try {
        const issue = await prisma.issue.findUnique({
            where: {
                id: issueId as string,
            },
            include: {
                section: {
                    select: {
                        id: true,
                        board: {
                            select: {
                                id: true,
                                organizationId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!issue) {
            return res.status(404).json({
                message: "Issue doesn't exist",
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.userId,
                    orgId: issue.section.board.organizationId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this organization",
            });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                issueId: issueId as string,
                userId: req.userId,
            },
            select: {
                id: true,
                content: true,
                issueId: true,
                userId: true,
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
});


router.get("/:issueId", authMiddleware, async (req, res) => {
    const { issueId } = req.params;

    if (!issueId) {
        return res.status(400).json({
            message: "Please provide the issue ID",
        });
    }

    try {
        const issue = await prisma.issue.findUnique({
            where: {
                id: issueId as string,
            },
            include: {
                section: {
                    select: {
                        id: true,
                        boardId: true,
                        board: {
                            select: {
                                organizationId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!issue) {
            return res.status(404).json({
                message: "Issue doesn't exist",
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.userId,
                    orgId: issue.section.board.organizationId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this organization",
            });
        }

        const comments = await prisma.comment.findMany({
            where: {
                issueId: issueId as string,
            },
            select: {
                id: true,
                userId: true,
                content: true,
                issueId: true,
            },
        });

        return res.status(200).json({
            message: "All comments for this issue retrieved successfully",
            comments,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

router.get("/:commentId", authMiddleware, async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        return res.status(400).json({
            message: "Please provide the comment ID",
        });
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId as string,
            },
            include: {
                issue: {
                    select: {
                        id: true,
                        section: {
                            select: {
                                board: {
                                    select: {
                                        organizationId: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!comment) {
            return res.status(404).json({
                message: "Comment doesn't exist",
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.userId,
                    orgId: comment.issue.section.board.organizationId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this organization",
            });
        }

        return res.status(200).json({
            message: "Comment retrieved successfully",
            comment: {
                id: comment.id,
                content: comment.content,
                userId: comment.userId,
                issueId: comment.issueId,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});


router.put("/:commentId", authMiddleware, async (req, res) => {
    const { commentId } = req.params;
    const { newContent } = req.body;

    if (!commentId || !newContent) {
        return res.status(400).json({
            message: "Please provide the correct input",
        });
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId as string,
            },
            include: {
                issue: {
                    select: {
                        id: true,
                        section: {
                            select: {
                                board: {
                                    select: {
                                        organizationId: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!comment) {
            return res.status(404).json({
                message: "Comment doesn't exist",
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_orgId: {
                    userId: req.userId,
                    orgId: comment.issue.section.board.organizationId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                message: "You are not a member of this organization",
            });
        }

        if (comment.userId !== req.userId) {
            return res.status(403).json({
                message: "You can only update your own comment",
            });
        }

        const updatedComment = await prisma.comment.update({
            where: {
                id: commentId as string,
            },
            data: {
                content: newContent,
            },
            select: {
                id: true,
                content: true,
                userId: true,
                issueId: true,
            },
        });

        return res.status(200).json({
            message: "Comment successfully updated",
            comment: updatedComment,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

router.delete("/:commentId", authMiddleware, async (req, res) => {
    const { commentId } = req.params;
  
    if (!commentId) {
      return res.status(400).json({
        message: "Please provide the comment ID",
      });
    }
  
    try {
      const comment = await prisma.comment.findUnique({
        where: {
          id: commentId as string,
        },
        include: {
          issue: {
            select: {
              section: {
                select: {
                  board: {
                    select: {
                      organizationId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
  
      if (!comment) {
        return res.status(404).json({
          message: "Comment doesn't exist",
        });
      }
  
      const membership = await prisma.membership.findUnique({
        where: {
          userId_orgId: {
            userId: req.userId,
            orgId: comment.issue.section.board.organizationId,
          },
        },
      });
  
      if (!membership) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }
  
      if (comment.userId !== req.userId) {
        return res.status(403).json({
          message: "You can only delete your own comment",
        });
      }
  
      await prisma.comment.delete({
        where: {
          id: commentId as string,
        },
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
  });


export default router;