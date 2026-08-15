export type Assignee = {
  user: { id: string; username: string; email: string };
};

export type Issue = {
  id: string;
  title: string;
  description: string | null;
  sectionId: string;
  requiredSkills: string[];
  assignees: Assignee[];
  _count?: { comments: number };
};

export type Section = {
  id: string;
  title: string;
  boardId: string;
  issues: Issue[];
  _count: { issues: number };
};

export type Member = {
  user: { id: string; username: string; email: string };
};

export type Comment = {
  id: string;
  content: string;
  user: { id: string; username: string; email: string };
};

export type ActiveUser = { userId: string; username?: string };

export type Candidate = {
  userId: string;
  username: string;
  score: number;
  precision: number;
  load: number;
  matchedSkills: { skill: string; strength: number }[];
  missingSkills: string[];
};

export type ChatMessage = {
  userId?: string;
  username?: string;
  message: string;
  timestamp?: string;
};
