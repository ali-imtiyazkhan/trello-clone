import { WebSocketServer, WebSocket } from "ws";

// Standard Port Configuration
const PORT = Number(process.env.PORT) || 8080;

// Internal Session State
export interface UserSession {
  userId: string;
  username?: string;
  socket: WebSocket;
  joinedAt: Date;
}

export interface ExtWebSocket extends WebSocket {
  isAlive?: boolean;
}

// In-Memory Storage:
// Map boardId -> Map(WebSocket -> UserSession)
const rooms = new Map<string, Map<WebSocket, UserSession>>();

// Map WebSocket -> Set of boardIds joined
const socketRooms = new Map<WebSocket, Set<string>>();

/**
 * Send payload to a specific socket if open
 */
function sendToSocket(socket: WebSocket, payload: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

/**
 * Broadcast payload to all sockets in a room, optionally excluding sender socket
 */
function broadcastToRoom(
  boardId: string,
  payload: object,
  excludeSocket?: WebSocket
): void {
  const roomUsers = rooms.get(boardId);
  if (!roomUsers) return;

  const messageString = JSON.stringify(payload);

  for (const [socket] of roomUsers.entries()) {
    if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
      socket.send(messageString);
    }
  }
}

/**
 * Handles user disconnection and cleans up all active rooms for the socket
 */
function handleDisconnect(socket: WebSocket): void {
  const userBoardIds = socketRooms.get(socket);
  if (!userBoardIds) return;

  for (const boardId of userBoardIds) {
    const roomUsers = rooms.get(boardId);
    if (roomUsers) {
      const session = roomUsers.get(socket);
      roomUsers.delete(socket);

      if (session) {
        console.log(`[WS] User '${session.userId}' left room '${boardId}'`);
        broadcastToRoom(boardId, {
          type: "USER_LEFT",
          data: {
            boardId,
            userId: session.userId,
            username: session.username,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Cleanup empty rooms
      if (roomUsers.size === 0) {
        rooms.delete(boardId);
        console.log(`[WS] Room '${boardId}' deleted (empty)`);
      }
    }
  }

  socketRooms.delete(socket);
}

// Create WebSocket Server
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);

// Heartbeat ping interval to clean dead connections (every 30s)
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const extWs = ws as ExtWebSocket;
    if (extWs.isAlive === false) {
      console.log("[WS] Terminating stale socket connection");
      handleDisconnect(extWs);
      return extWs.terminate();
    }
    extWs.isAlive = false;
    extWs.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(heartbeatInterval);
});

wss.on("connection", (socket: ExtWebSocket) => {
  socket.isAlive = true;

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  console.log("[WS] New client connected");

  socket.on("message", (rawMessage) => {
    let parsedMessage: any;
    try {
      parsedMessage = JSON.parse(rawMessage.toString());
    } catch (err) {
      sendToSocket(socket, {
        type: "ERROR",
        data: { message: "Invalid JSON format" },
      });
      return;
    }

    const { type, data } = parsedMessage || {};

    if (!type || typeof type !== "string") {
      sendToSocket(socket, {
        type: "ERROR",
        data: { message: "Missing or invalid message 'type'" },
      });
      return;
    }

    switch (type) {
      case "JOIN_ROOM": {
        const { boardId, userId, username } = data || {};
        if (!boardId || !userId) {
          sendToSocket(socket, {
            type: "ERROR",
            data: { message: "JOIN_ROOM requires 'boardId' and 'userId'" },
          });
          return;
        }

        // Initialize room if not exists
        if (!rooms.has(boardId)) {
          rooms.set(boardId, new Map());
        }
        const roomUsers = rooms.get(boardId)!;

        // Save session
        const session: UserSession = {
          userId,
          username,
          socket,
          joinedAt: new Date(),
        };
        roomUsers.set(socket, session);

        // Track board for socket
        if (!socketRooms.has(socket)) {
          socketRooms.set(socket, new Set());
        }
        socketRooms.get(socket)!.add(boardId);

        console.log(`[WS] User '${userId}' joined room '${boardId}'`);

        // Get active users in room for confirmation response
        const activeUsers = Array.from(roomUsers.values()).map((user) => ({
          userId: user.userId,
          username: user.username,
          joinedAt: user.joinedAt,
        }));

        // Send acknowledgement to the user
        sendToSocket(socket, {
          type: "ROOM_JOINED",
          data: {
            boardId,
            userId,
            activeUsers,
          },
        });

        // Notify other room participants
        broadcastToRoom(
          boardId,
          {
            type: "USER_JOINED",
            data: {
              boardId,
              userId,
              username,
              timestamp: new Date().toISOString(),
            },
          },
          socket
        );
        break;
      }

      case "LEAVE_ROOM": {
        const { boardId, userId } = data || {};
        if (!boardId) return;

        const roomUsers = rooms.get(boardId);
        if (roomUsers) {
          const session = roomUsers.get(socket);
          roomUsers.delete(socket);

          if (session) {
            broadcastToRoom(boardId, {
              type: "USER_LEFT",
              data: {
                boardId,
                userId: userId || session.userId,
                username: session.username,
                timestamp: new Date().toISOString(),
              },
            });
          }

          if (roomUsers.size === 0) {
            rooms.delete(boardId);
          }
        }

        const userBoards = socketRooms.get(socket);
        if (userBoards) {
          userBoards.delete(boardId);
        }
        break;
      }

      case "SEND_MESSAGE": {
        const { boardId, userId, username, message } = data || {};
        if (!boardId || !message) {
          sendToSocket(socket, {
            type: "ERROR",
            data: { message: "SEND_MESSAGE requires 'boardId' and 'message'" },
          });
          return;
        }

        broadcastToRoom(
          boardId,
          {
            type: "NEW_MESSAGE",
            data: {
              boardId,
              userId,
              username,
              message,
              timestamp: new Date().toISOString(),
            },
          },
          socket
        );
        break;
      }

      case "MOVE_CARD": {
        const { boardId, userId, issueId, sourceSectionId, targetSectionId, newIndex } = data || {};
        if (!boardId || !issueId) {
          sendToSocket(socket, {
            type: "ERROR",
            data: { message: "MOVE_CARD requires 'boardId' and 'issueId'" },
          });
          return;
        }

        broadcastToRoom(
          boardId,
          {
            type: "CARD_MOVED",
            data: {
              boardId,
              userId,
              issueId,
              sourceSectionId,
              targetSectionId,
              newIndex,
              timestamp: new Date().toISOString(),
            },
          },
          socket
        );
        break;
      }

      case "CREATE_CARD":
      case "UPDATE_CARD":
      case "DELETE_CARD": {
        const { boardId, userId, card, cardId } = data || {};
        if (!boardId) return;

        const responseType =
          type === "CREATE_CARD"
            ? "CARD_CREATED"
            : type === "UPDATE_CARD"
            ? "CARD_UPDATED"
            : "CARD_DELETED";

        broadcastToRoom(
          boardId,
          {
            type: responseType,
            data: {
              boardId,
              userId,
              card,
              cardId,
              timestamp: new Date().toISOString(),
            },
          },
          socket
        );
        break;
      }

      case "CREATE_SECTION":
      case "UPDATE_SECTION":
      case "DELETE_SECTION": {
        const { boardId, userId, section, sectionId } = data || {};
        if (!boardId) return;

        const responseType =
          type === "CREATE_SECTION"
            ? "SECTION_CREATED"
            : type === "UPDATE_SECTION"
            ? "SECTION_UPDATED"
            : "SECTION_DELETED";

        broadcastToRoom(
          boardId,
          {
            type: responseType,
            data: {
              boardId,
              userId,
              section,
              sectionId,
              timestamp: new Date().toISOString(),
            },
          },
          socket
        );
        break;
      }

      case "PING": {
        sendToSocket(socket, {
          type: "PONG",
          data: { timestamp: new Date().toISOString() },
        });
        break;
      }

      default: {
        sendToSocket(socket, {
          type: "ERROR",
          data: { message: `Unknown message type: '${type}'` },
        });
        break;
      }
    }
  });

  socket.on("close", () => {
    console.log("[WS] Client connection closed");
    handleDisconnect(socket);
  });

  socket.on("error", (err) => {
    console.error("[WS] Socket error:", err);
    handleDisconnect(socket);
  });
});