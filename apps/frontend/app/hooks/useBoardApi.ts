"use client";

import axios from "axios";
import type { Section, Issue, Member, Comment, Candidate } from "@/lib/types/board";

const API = "http://localhost:3001/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

export function useBoardApi() {
  // Board
  async function loadBoard(boardId: string) {
    const [sectionsRes, boardRes] = await Promise.all([
      axios.get(`${API}/sections/board/${boardId}`, { headers: getAuthHeaders() }),
      axios.get(`${API}/boards/${boardId}`, { headers: getAuthHeaders() }),
    ]);
    return {
      sections: sectionsRes.data.sections ?? [],
      board: boardRes.data.board,
    };
  }

  async function renameBoard(boardId: string, title: string, orgId: string) {
    await axios.put(`${API}/boards/${boardId}`, { title, orgId }, { headers: getAuthHeaders() });
  }

  async function deleteBoard(boardId: string, orgId: string) {
    await axios.delete(`${API}/boards/${boardId}`, { params: { orgId }, headers: getAuthHeaders() });
  }

  // Sections
  async function createSection(boardId: string, title: string) {
    const res = await axios.post(`${API}/sections`, { title, boardId }, { headers: getAuthHeaders() });
    return res.data.section;
  }

  async function renameSection(sectionId: string, title: string, boardId: string) {
    const res = await axios.put(`${API}/sections/${sectionId}`, { title, boardId }, { headers: getAuthHeaders() });
    return res.data.section;
  }

  async function deleteSection(sectionId: string, boardId: string) {
    await axios.delete(`${API}/sections/${sectionId}`, { params: { boardId }, headers: getAuthHeaders() });
  }

  // Cards (Issues)
  async function createCard(sectionId: string, title: string) {
    const res = await axios.post(`${API}/issues`, { title, sectionId }, { headers: getAuthHeaders() });
    return res.data.issue;
  }

  async function updateCard(sectionId: string, issueId: string, data: { title?: string; description?: string; sectionId?: string }) {
    const res = await axios.put(`${API}/issues/${sectionId}/${issueId}`, data, { headers: getAuthHeaders() });
    return res.data.issue;
  }

  async function deleteCard(sectionId: string, issueId: string) {
    await axios.delete(`${API}/issues/${sectionId}/${issueId}`, { headers: getAuthHeaders() });
  }

  async function moveCard(sourceSectionId: string, issueId: string, targetSectionId: string) {
    await axios.put(`${API}/issues/${sourceSectionId}/${issueId}`, { sectionId: targetSectionId }, { headers: getAuthHeaders() });
  }

  // Assignees
  async function toggleAssignee(sectionId: string, issueId: string, userId: string, isAssigned: boolean) {
    if (isAssigned) {
      await axios.delete(`${API}/issues/${sectionId}/${issueId}/assignees/${userId}`, { headers: getAuthHeaders() });
    } else {
      const res = await axios.post(`${API}/issues/${sectionId}/${issueId}/assignees`, { userId }, { headers: getAuthHeaders() });
      return res.data.assignee;
    }
  }

  // Skills
  async function updateRequiredSkills(sectionId: string, issueId: string, skills: string[]) {
    const res = await axios.put(`${API}/issues/${sectionId}/${issueId}/skills`, { skills }, { headers: getAuthHeaders() });
    return res.data.issue;
  }

  async function suggestAssignees(sectionId: string, issueId: string): Promise<Candidate[]> {
    const res = await axios.post(`${API}/issues/${sectionId}/${issueId}/suggest`, {}, { headers: getAuthHeaders() });
    return res.data.candidates ?? [];
  }

  // Comments
  async function loadComments(sectionId: string, issueId: string): Promise<Comment[]> {
    const res = await axios.get(`${API}/issues/${sectionId}/${issueId}/comments`, { headers: getAuthHeaders() });
    return res.data.comments ?? [];
  }

  async function addComment(sectionId: string, issueId: string, content: string): Promise<Comment> {
    const res = await axios.post(`${API}/issues/${sectionId}/${issueId}/comments`, { content }, { headers: getAuthHeaders() });
    return res.data.comment;
  }

  async function deleteComment(sectionId: string, issueId: string, commentId: string) {
    await axios.delete(`${API}/issues/${sectionId}/${issueId}/comments/${commentId}`, { headers: getAuthHeaders() });
  }

  // Members
  async function loadMembers(orgId: string): Promise<Member[]> {
    const res = await axios.get(`${API}/orgs/${orgId}/members`, { headers: getAuthHeaders() });
    return res.data.members ?? [];
  }

  // Current user
  async function getCurrentUser() {
    const res = await axios.get(`${API}/users/me`, { headers: getAuthHeaders() });
    return res.data.user;
  }

  return {
    loadBoard,
    renameBoard,
    deleteBoard,
    createSection,
    renameSection,
    deleteSection,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    toggleAssignee,
    updateRequiredSkills,
    suggestAssignees,
    loadComments,
    addComment,
    deleteComment,
    loadMembers,
    getCurrentUser,
    getErrorMessage,
  };
}