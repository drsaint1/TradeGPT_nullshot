import type { Server } from "http";
import { WebSocketServer } from "ws";

interface SocketEvent<T = unknown> {
  type: string;
  payload: T;
}

export class SocketHub {
  private wss?: WebSocketServer;

  attach(server: Server): void {
    this.wss = new WebSocketServer({ server });
    this.wss.on("connection", (socket) => {
      socket.send(JSON.stringify({ type: "connection", payload: "connected" }));
    });
  }

  broadcast<T>(event: SocketEvent<T>): void {
    if (!this.wss) {
      return;
    }
    const data = JSON.stringify(event);
    this.wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    });
  }
}
