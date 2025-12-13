import WebSocket from "ws";
import { Protocol, RequestMessage, ResponseMessage, Message } from "./Protocol";
import { generateId } from "../../../../shared/utils";

interface PendingRequest {
  resolve: (response: ResponseMessage) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class TunnelRouter {
  private tunnels = new Map<string, WebSocket>();
  private pendingRequests = new Map<string, PendingRequest>();

  registerTunnel(tunnelId: string, ws: WebSocket): void {
    this.tunnels.set(tunnelId, ws);
  }

  unregisterTunnel(tunnelId: string): void {
    this.tunnels.delete(tunnelId);
  }

  getTunnel(tunnelId: string): WebSocket | undefined {
    return this.tunnels.get(tunnelId);
  }

  hasTunnel(tunnelId: string): boolean {
    return this.tunnels.has(tunnelId);
  }

  handleMessage(tunnelId: string, message: Message): void {
    if (message.type === "response") {
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.requestId);
        pending.resolve(message);
      }
    }
  }

  async forwardRequest(
    tunnelId: string,
    method: string,
    path: string,
    headers: Record<string, string | string[]>,
    body?: string,
  ): Promise<ResponseMessage> {
    const ws = this.tunnels.get(tunnelId);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("Tunnel not available");
    }

    const requestId = generateId("req");

    const requestMessage: RequestMessage = {
      type: "request",
      requestId,
      method,
      path,
      headers,
      body,
    };

    return new Promise<ResponseMessage>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error("Request timeout"));
      }, 30000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      ws.send(Protocol.encode(requestMessage));
    });
  }
}
