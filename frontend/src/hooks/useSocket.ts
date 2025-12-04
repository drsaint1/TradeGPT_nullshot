import { useEffect, useRef } from "react";

interface SocketEvent<T = unknown> {
  type: string;
  payload: T;
}

export function useSocket(url: string, onEvent: (event: SocketEvent) => void) {
  const socketRef = useRef<WebSocket>();

  useEffect(() => {
    const socket = new WebSocket(url.replace(/^http/, "ws"));
    socketRef.current = socket;

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as SocketEvent;
        onEvent(data);
      } catch (err) {
        console.warn("Failed to parse socket payload", err);
      }
    });

    return () => {
      socket.close();
    };
  }, [url, onEvent]);
}
