import { useEffect, useState } from "react";
import type { CommonMessage } from "@repo/shared";
export default function Home() {

  const [message, setMessage] = useState<CommonMessage | null>(null);


  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ADMIN_MESSAGE') {
        setMessage(data.content);
      }
      if (data.type === 'USER_MESSAGE') {
        setMessage(data.content);
      }
      if (data.type === 'ERROR') {
        setMessage(data.content);
      }
      if (data.type === 'INFO') {
        setMessage(data.content);
      }
    }

    ws.onopen = () => {
      console.log('Connected to server');
    }

    ws.onclose = () => {
      console.log('Disconnected from server');
    }

    ws.onerror = (event) => {
      console.log('Error: ', event);
    }

  })


  return <div>{message?.content || 'Hello World'}</div>;
}