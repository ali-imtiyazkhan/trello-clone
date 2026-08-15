"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = "ws://localhost:8080";

export type ActiveUser = { userId: string; username?: string };

export type WebSocketMessage =
  | { type: "ROOM_JOINED"; data: { boardId: string; userId: string; activeUsers: ActiveUser[] } }
  | { type: "USER_JOINED"; data: { boardId: string; userId: string; username?: string; timestamp: string } }
  | { type: "USER_LEFT"; data: { boardId: string; userId: string; username?: string; timestamp: string } }
  | { type: "NEW_MESSAGE"; data: { userId?: string; username?: string; message: string; timestamp?: string } }
  | { type: "SECTION_CREATED"; data: { boardId: string; section: { id: string; title: string; boardId: string; issues: any[]; _count: { issues: number } }; timestamp: string } }
  | { type: "SECTION_UPDATED"; data: { boardId: string; section: { id: string; title: string }; timestamp: string } }
  | { type: "SECTION_DELETED"; data: { boardId: string; sectionId: string; timestamp: string } }
  | { type: "CARD_CREATED"; data: { boardId: string; card: any; timestamp: string } }
  | { type: "CARD_UPDATED"; data: { boardId: string; card: any; timestamp: string } }
  | { type: "CARD_DELETED"; data: { boardId: string; cardId: string; timestamp: string } }
  | { type: "CARD_MOVED"; data: { boardId: string; issueId: string; sourceSectionId: string; targetSectionId: string; timestamp: string } }
  | { type: "CARD_ASSIGNED"; data: { boardId: string; cardId: string; userId: string; username?: string; cardTitle?: string; score?: number; timestamp: string } }
  | { type: "PROFILE_UPDATED"; data: { boardId: string; userId: string; username?: string; timestamp: string } }
  | { type: "ERROR"; data: { message: string } };

interface UseBoardWebSocketOptions {
  boardId: string;
  userId: string;
  username: string;
  onSectionCreated?: (section: any) => void;
  onSectionUpdated?: (section: any) => void;
  onSectionDeleted?: (sectionId: string) => void;
  onCardCreated?: (card: any) => void;
  onCardUpdated?: (card: any) => void;
  onCardDeleted?: (cardId: string) => void;
  onCardMoved?: (data: { issueId: string; sourceSectionId: string; targetSectionId: string }) => void;
  onCardAssigned?: (data: any) => void;
  onProfileUpdated?: (data: any) => void;
  onNewMessage?: (message: any) => void;
  onActiveUsersChange?: (users: ActiveUser[]) => void;
  onUserJoined?: (user: ActiveUser) => void;
  onUserLeft?: (userId: string) => void;
  onError?: (message: string) => void;
}

export function useBoardWebSocket({
  boardId,
  userId,
  username,
  onSectionCreated,
  onSectionUpdated,
  onSectionDeleted,
  onCardCreated,
  onCardUpdated,
  onCardDeleted,
  onCardMoved,
  onCardAssigned,
  onProfileUpdated,
  onNewMessage,
  onActiveUsersChange,
  onUserJoined,
  onUserLeft,
  onError,
}: UseBoardWebSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const disposedRef = useRef(false);

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!boardId || !userId) return;

    disposedRef.current = false;
    let ws: WebSocket | null = null;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposedRef.current) return;
        setConnected(true);
        if (ws) {
          ws.send(JSON.stringify({
            type: "JOIN_ROOM",
            data: { boardId, userId, username },
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case "ROOM_JOINED":
              setActiveUsers(message.data.activeUsers ?? []);
              onActiveUsersChange?.(message.data.activeUsers ?? []);
              break;

            case "USER_JOINED":
              setActiveUsers((prev) => {
                if (prev.some((u) => u.userId === message.data.userId)) return prev;
                const newUsers = [...prev, { userId: message.data.userId, username: message.data.username }];
                onActiveUsersChange?.(newUsers);
                return newUsers;
              });
              onUserJoined?.({ userId: message.data.userId, username: message.data.username });
              break;

            case "USER_LEFT":
              setActiveUsers((prev) => {
                const newUsers = prev.filter((u) => u.userId !== message.data.userId);
                onActiveUsersChange?.(newUsers);
                return newUsers;
              });
              onUserLeft?.(message.data.userId);
              break;

            case "NEW_MESSAGE":
              onNewMessage?.(message.data);
              break;

            case "SECTION_CREATED":
              onSectionCreated?.(message.data.section);
              break;

            case "SECTION_UPDATED":
              onSectionUpdated?.(message.data.section);
              break;

            case "SECTION_DELETED":
              onSectionDeleted?.(message.data.sectionId);
              break;

            case "CARD_CREATED":
              onCardCreated?.(message.data.card);
              break;

            case "CARD_UPDATED":
              onCardUpdated?.(message.data.card);
              break;

            case "CARD_DELETED":
              onCardDeleted?.(message.data.cardId);
              break;

            case "CARD_MOVED":
              onCardMoved?.({
                issueId: message.data.issueId,
                sourceSectionId: message.data.sourceSectionId,
                targetSectionId: message.data.targetSectionId,
              });
              break;

            case "CARD_ASSIGNED":
              onCardAssigned?.(message.data);
              break;

            case "PROFILE_UPDATED":
              onProfileUpdated?.(message.data);
              break;

            case "ERROR":
              onError?.(message.data.message);
              break;
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        if (disposedRef.current) return;
        setConnected(false);
        setActiveUsers([]);
        onActiveUsersChange?.([]);
      };
    }

    connect();

    return () => {
      disposedRef.current = true;
      if (ws) {
        ws.send(JSON.stringify({ type: "LEAVE_ROOM", data: { boardId } }));
        ws.close();
      }
      wsRef.current = null;
    };
  }, [
    boardId,
    userId,
    username,
    onSectionCreated,
    onSectionUpdated,
    onSectionDeleted,
    onCardCreated,
    onCardUpdated,
    onCardDeleted,
    onCardMoved,
    onCardAssigned,
    onProfileUpdated,
    onNewMessage,
    onActiveUsersChange,
    onUserJoined,
    onUserLeft,
    onError,
  ]);

  return { connected, activeUsers, send };
}