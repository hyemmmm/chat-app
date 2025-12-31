import { WebSocketServer, WebSocket } from "ws";

// 1. 클라이언트가 보내는 메시지 타입 정의 (send_message 추가)
type ClientToServer =
  | { type: "join_room"; roomId: string; nickname: string }
  | { type: "send_message"; roomId: string; nickname: string; text: string }; // [NEW]

// 2. 서버가 클라이언트에게 보내는 메시지 타입 정의 (message 추가)
type ServerToClient =
  | { type: "room_state"; roomId: string; members: string[] }
  | {
      type: "member_joined";
      roomId: string;
      nickname: string;
      members: string[];
    }
  | { type: "member_left"; roomId: string; nickname: string; members: string[] }
  | { type: "error"; message: string }
  | {
      type: "message";
      roomId: string;
      id: number;
      sender: string;
      text: string;
      timestamp: string;
    };

type RoomId = string;

const wss = new WebSocketServer({ port: 8080 });

const roomSockets = new Map<RoomId, Set<WebSocket>>();
const socketMeta = new Map<WebSocket, { roomId: string; nickname: string }>();

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

      if (!msg.text || !msg.text.trim()) {
        return; // 빈 메시지 무시
      }

      // 서버 시간을 찍어서 브로드캐스트
      broadcast(meta.roomId, {
        type: "message",
        roomId: meta.roomId,
        id: Date.now(),
        sender: meta.nickname, // 위조 방지를 위해 서버가 알고 있는 닉네임 사용
        text: msg.text.trim(),
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
