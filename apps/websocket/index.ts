import { WebSocket, WebSocketServer } from "ws";

const PORT = Number(process.env.PORT) || 8080
const wss = new WebSocketServer({ port: PORT });

interface UserSession {
    userId: string
    username?: string
}

// boardId -> socket -> session
const rooms = new Map<string, Map<WebSocket, UserSession>>();

function sendToSocket(socket: WebSocket, payload: object) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload))
    }
}

function broadcastToRoom(boardId: string, payload: object, excludeSocket?: WebSocket) {
    const roomUsers = rooms.get(boardId)
    if (!roomUsers) return

    const messageString = JSON.stringify(payload)
    for (const [socket] of roomUsers.entries()) {
        if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
            socket.send(messageString)
        }
    }
}

wss.on("connection", (socket) => {
    console.log("client connected")

    socket.on("message", (msg) => {
        try {
            const data = JSON.parse(msg.toString())

            switch (data.type) {
                case "JOIN_ROOM": {
                    const { boardId, userId, username } = data.data || {}

                    if (!boardId || !userId) {
                        sendToSocket(socket, { type: "ERROR", data: { message: "boardId and userId required" } })
                        return
                    }

                    const room = rooms.get(boardId) ?? new Map<WebSocket, UserSession>()
                    if (!room.has(socket)) {
                        room.set(socket, { userId, username })
                        rooms.set(boardId, room)
                    }

                    const activeUsers = Array.from(room.values()).map((session) => ({
                        userId: session.userId,
                        username: session.username,
                        joinedAt: new Date(),
                    }))

                    sendToSocket(socket, {
                        type: "ROOM_JOINED",
                        data: { boardId, userId, activeUsers },
                    })

                    broadcastToRoom(boardId, {
                        type: "USER_JOINED",
                        data: {
                            boardId,
                            userId,
                            username,
                            timestamp: new Date().toISOString(),
                        },
                    }, socket)

                    console.log(`[WS] User '${userId}' joined room '${boardId}'`)
                    break
                }

                case "LEAVE_ROOM": {
                    const { boardId } = data.data || {}
                    if (!boardId) return

                    const room = rooms.get(boardId)
                    if (room) {
                        const session = room.get(socket)
                        room.delete(socket)
                        if (room.size === 0) rooms.delete(boardId)

                        if (session) {
                            broadcastToRoom(boardId, {
                                type: "USER_LEFT",
                                data: {
                                    boardId,
                                    userId: session.userId,
                                    username: session.username,
                                    timestamp: new Date().toISOString(),
                                },
                            }, socket)
                        }
                    }
                    break
                }

                case "CREATE_SECTION":
                case "UPDATE_SECTION":
                case "DELETE_SECTION": {
                    const { boardId, section, sectionId } = data.data || {}
                    if (!boardId) return

                    const responseType =
                        data.type === "CREATE_SECTION" ? "SECTION_CREATED"
                        : data.type === "UPDATE_SECTION" ? "SECTION_UPDATED"
                        : "SECTION_DELETED"

                    broadcastToRoom(boardId, {
                        type: responseType,
                        data: {
                            boardId,
                            section,
                            sectionId,
                            timestamp: new Date().toISOString(),
                        },
                    })
                    break
                }

                case "CREATE_CARD":
                case "UPDATE_CARD":
                case "DELETE_CARD": {
                    const { boardId, card, cardId } = data.data || {}
                    if (!boardId) return

                    const responseType =
                        data.type === "CREATE_CARD" ? "CARD_CREATED"
                        : data.type === "UPDATE_CARD" ? "CARD_UPDATED"
                        : "CARD_DELETED"

                    broadcastToRoom(boardId, {
                        type: responseType,
                        data: {
                            boardId,
                            card,
                            cardId,
                            timestamp: new Date().toISOString(),
                        },
                    })
                    break
                }

                case "MOVE_CARD": {
                    const { boardId, userId, issueId, sourceSectionId, targetSectionId, newIndex } = data.data || {}
                    if (!boardId || !issueId) return

                    broadcastToRoom(boardId, {
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
                    })
                    break
                }

                case "SEND_MESSAGE": {
                    const { boardId, userId, username, message } = data.data || {}
                    if (!boardId || !message) return

                    broadcastToRoom(boardId, {
                        type: "NEW_MESSAGE",
                        data: {
                            boardId,
                            userId,
                            username,
                            message,
                            timestamp: new Date().toISOString(),
                        },
                    })
                    break
                }

                case "PING": {
                    sendToSocket(socket, {
                        type: "PONG",
                        data: { timestamp: new Date().toISOString() },
                    })
                    break
                }

                default: {
                    sendToSocket(socket, {
                        type: "ERROR",
                        data: { message: `Unknown message type: '${data.type}'` },
                    })
                }
            }
        } catch (err) {
            sendToSocket(socket, {
                type: "ERROR",
                data: { message: "Invalid JSON format" },
            })
        }
    })

    socket.on("close", () => {
        console.log("client disconnected")
        for (const [boardId, room] of rooms.entries()) {
            const session = room.get(socket)
            if (session) {
                room.delete(socket)
                if (room.size === 0) rooms.delete(boardId)
                broadcastToRoom(boardId, {
                    type: "USER_LEFT",
                    data: {
                        boardId,
                        userId: session.userId,
                        username: session.username,
                        timestamp: new Date().toISOString(),
                    },
                }, socket)
            }
        }
    })
})