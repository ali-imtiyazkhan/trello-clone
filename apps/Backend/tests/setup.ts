import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { prisma } from "prisma";

let dbAvailable = false;

beforeAll(async () => {
  // Global test setup
});

afterAll(async () => {
  if (dbAvailable) {
    await prisma.$disconnect();
  }
});

beforeEach(async () => {
  if (!dbAvailable) {
    try {
      await prisma.$connect();
      dbAvailable = true;
    } catch {
      return;
    }
  }
  
  if (!dbAvailable) return;
  
  // Clean database before each test
  try {
    await prisma.comment.deleteMany();
    await prisma.issueMapping.deleteMany();
    await prisma.issue.deleteMany();
    await prisma.section.deleteMany();
    await prisma.board.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();
  } catch {
    dbAvailable = false;
  }
});

afterEach(async () => {
  // Cleanup after each test
});