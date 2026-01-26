import { ServerMessage, ServerToClient } from "@/types/types";
import { WebSocketServer, WebSocket } from "ws";

// 1. 클라이언트가 보내는 메시지 타입 정의 (send_message 추가)
type ClientToServer =
  | { type: "join_room"; roomId: string; nickname: string }
  | {
      type: "send_message";
      roomId: string;
      nickname: string;
      text: string;
      clientMessageId: string;
    };

type RoomId = string;

const wss = new WebSocketServer({ port: 8080 });

const roomSockets = new Map<RoomId, Set<WebSocket>>();
const socketMeta = new Map<WebSocket, { roomId: string; nickname: string }>();

// ✅ room별 메시지 히스토리(메모리 저장)
const roomHistory = new Map<RoomId, ServerMessage[]>();
const HISTORY_LIMIT = 200;

// ✅ id 발급(단순 증가; Date.now()보다 중복/정렬 제어가 쉬움)
let nextMessageId = 1;

function safeSend(ws: WebSocket, payload: ServerToClient) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function broadcast(roomId: string, payload: ServerToClient) {
  const sockets = roomSockets.get(roomId);
  if (!sockets) return;
  for (const s of sockets) safeSend(s, payload);
}

function getMembers(roomId: string): string[] {
  const sockets = roomSockets.get(roomId);
  if (!sockets) return [];
  const members = new Set<string>();
  for (const s of sockets) {
    const meta = socketMeta.get(s);
    if (meta?.roomId === roomId) members.add(meta.nickname);
  }
  return [...members].sort();
}

function getHistory(roomId: string): ServerMessage[] {
  return roomHistory.get(roomId) ?? [];
}

function pushHistory(roomId: string, message: ServerMessage) {
  const prev = roomHistory.get(roomId) ?? [];
  const next = [...prev, message].slice(-HISTORY_LIMIT);
  roomHistory.set(roomId, next);
}

function joinRoom(ws: WebSocket, roomId: string, nickname: string) {
  leaveRoom(ws);

  socketMeta.set(ws, { roomId, nickname });

  const sockets = roomSockets.get(roomId) ?? new Set<WebSocket>();
  sockets.add(ws);
  roomSockets.set(roomId, sockets);

  safeSend(ws, { type: "room_state", roomId, members: getMembers(roomId) });

  broadcast(roomId, {
    type: "member_joined",
    roomId,
    nickname,
    members: getMembers(roomId),
  });

  // ✅ 핵심: 입장 직후, 해당 클라이언트에게만 히스토리 전달
  safeSend(ws, {
    type: "history",
    roomId,
    messages: getHistory(roomId),
  });

  console.log("[send history]", roomId, getHistory(roomId).length);
}

function leaveRoom(ws: WebSocket) {
  const meta = socketMeta.get(ws);
  if (!meta) return;

  const { roomId, nickname } = meta;
  socketMeta.delete(ws);

  const sockets = roomSockets.get(roomId);
  if (!sockets) return;

  sockets.delete(ws);
  if (sockets.size === 0) roomSockets.delete(roomId);

  broadcast(roomId, {
    type: "member_left",
    roomId,
    nickname,
    members: getMembers(roomId),
  });
}

const seenClientMsg = new Map<RoomId, Map<string, number>>();
// roomId -> (clientMessageId -> serverMessageId)

function getSeen(roomId: string, clientMessageId: string) {
  return seenClientMsg.get(roomId)?.get(clientMessageId);
}

function setSeen(
  roomId: string,
  clientMessageId: string,
  serverMessageId: number,
) {
  const m = seenClientMsg.get(roomId) ?? new Map<string, number>();
  m.set(clientMessageId, serverMessageId);
  seenClientMsg.set(roomId, m);
}

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    let msg: ClientToServer;
    try {
      msg = JSON.parse(data.toString()) as ClientToServer;
    } catch {
      safeSend(ws, { type: "error", message: "Invalid JSON" });
      return;
    }

    // 1) 방 입장 처리
    if (msg.type === "join_room") {
      const roomId = msg.roomId?.trim();
      const nickname = msg.nickname?.trim();

      if (!roomId)
        return safeSend(ws, { type: "error", message: "roomId is required" });
      if (!nickname || nickname.length < 2 || nickname.length > 20) {
        return safeSend(ws, {
          type: "error",
          message: "nickname must be 2~20 chars",
        });
      }

      joinRoom(ws, roomId, nickname);
      return;
    }

    // 2) 메시지 전송 처리
    if (msg.type === "send_message") {
      const meta = socketMeta.get(ws);

      // 방에 입장하지 않은 상태로 메시지를 보내려 할 때
      if (!meta) {
        return safeSend(ws, { type: "error", message: "Join room first" });
      }

      const text = msg.text?.trim();
      if (!text) return;

      const clientMessageId = msg.clientMessageId?.trim();
      if (!clientMessageId) {
        return safeSend(ws, {
          type: "error",
          message: "clientMessageId is required",
        });
      }

      // ✅ 재시도 중복이면 저장/브로드캐스트 없이 ack만 재전송
      const already = getSeen(meta.roomId, clientMessageId);
      if (already) {
        safeSend(ws, {
          type: "ack",
          roomId: meta.roomId,
          clientMessageId,
          serverMessageId: already,
        });
        return;
      }

      const message: ServerMessage = {
        id: nextMessageId++,
        sender: meta.nickname,
        text,
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // ✅ 핵심: 저장
      pushHistory(meta.roomId, message);
      setSeen(meta.roomId, clientMessageId, message.id);

      // ✅ 저장된 걸 그대로 브로드캐스트
      broadcast(meta.roomId, {
        type: "message",
        roomId: meta.roomId,
        clientMessageId,
        ...message,
      });

      // 🔴 여기! 특정 텍스트면 ACK를 안 보냄
      if (text === "/dropack") {
        return; // ack 생략 → 클라에서 3초 후 failed
      }

      safeSend(ws, {
        type: "ack",
        roomId: meta.roomId,
        clientMessageId,
        serverMessageId: message.id,
      });
      return;
    }

    safeSend(ws, { type: "error", message: "Unknown message type" });
  });

  ws.on("close", () => {
    leaveRoom(ws);
  });
});

console.log("WS server running on ws://localhost:8080");
