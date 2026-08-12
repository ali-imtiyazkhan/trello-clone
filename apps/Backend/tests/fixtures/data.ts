import { vi } from "vitest";

export const mockUser = {
  id: "user-1",
  username: "testuser",
  email: "test@example.com",
  password: "hashedpassword",
};

export const mockOrg = {
  id: "org-1",
  name: "Test Org",
  description: "Test Description",
};

export const mockBoard = {
  id: "board-1",
  title: "Test Board",
  organizationId: "org-1",
};

export const mockSection = {
  id: "section-1",
  title: "Test Section",
  boardId: "board-1",
};

export const mockIssue = {
  id: "issue-1",
  title: "Test Issue",
  description: "Test Description",
  boardId: "board-1",
  sectionId: "section-1",
};