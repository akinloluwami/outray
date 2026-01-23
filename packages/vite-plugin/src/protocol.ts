import type { ClientMessage, ServerMessage } from "./types";

export function encodeMessage(message: ClientMessage): string {
  return JSON.stringify(message);
}

export function decodeMessage(data: string): ServerMessage {
  return JSON.parse(data) as ServerMessage;
}
