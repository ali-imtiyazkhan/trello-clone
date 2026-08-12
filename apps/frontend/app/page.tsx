"use client";

import { useEffect, useState } from "react";
import type { ServerMessage, NewMessageMessage } from "@repo/shared";

export default function Home() {
  const [messages, setMessages] = useState<Array<NewMessageMessage['data'] & { type: string }>>([]);
  const [users, setUsers] = useState<Array<{ userId: string; username?: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data);

      switch (msg.type) {
        case 'ROOM_JOINED': {
          console.log('Joined room:', msg.data.boardId);
          setUsers(msg.data.activeUsers);
          break;
        }
        case 'USER_JOINED': {
          const data = msg.data;
          setUsers(prev => [...prev, { userId: data.userId, username: data.username }]);
          break;
        }
        case 'USER_LEFT': {
          const data = msg.data;
          setUsers(prev => prev.filter(u => u.userId !== data.userId));
          break;
        }
        case 'NEW_MESSAGE': {
          const data = msg.data;
          setMessages(prev => [...prev, { ...data, type: msg.type }]);
          break;
        }
        case 'ERROR': {
          const data = msg.data;
          setError(data.message);
          console.error('Server error:', data.message);
          break;
        }
        case 'PONG': {
          console.log('Pong received');
          break;
        }
        default:
          console.log('Unhandled message type:', msg.type, msg.data);
      }
    };

    ws.onopen = () => {
      console.log('Connected to server');
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        data: { boardId: 'board-1', userId: 'user-1', username: 'TestUser' }
      }));
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
    };

    ws.onerror = (event) => {
      console.log('Error: ', event);
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Trello Clone - WebSocket Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Connected Users:</strong>
        <ul>
          {users.map(u => (
            <li key={u.userId}>{u.username || u.userId}</li>
          ))}
        </ul>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      <div style={{ border: '1px solid #ccc', padding: '10px', height: '300px', overflow: 'auto' }}>
        <strong>Messages:</strong>
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: '5px 0', padding: '5px', background: '#f5f5f5' }}>
            <strong>{msg.username || msg.userId}:</strong> {msg.message}
            <br />
            <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}