import { WebSocketServer, WebSocket } from "ws";

type ClientToServer = { type: "join_room"; roomId: string; nickname: string };

type ServerToClient =
  | { type: "room_state"; roomId: string; members: string[] }
  | {
      type: "member_joined";
      roomId: string;
      nickname: string;
      members: string[];
    }
  | { type: "member_left"; roomId: string; nickname: string; members: string[] }
  | { type: "error"; message: string };

type RoomId = string;

const wss = new WebSocketServer({ port: 8080 });

// roomId -> set of sockets
const roomSockets = new Map<RoomId, Set<WebSocket>>();
// socket -> { roomId, nickname }
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
  // 기존 방이 있으면 정리
  leaveRoom(ws);

  socketMeta.set(ws, { roomId, nickname });

  const sockets = roomSockets.get(roomId) ?? new Set<WebSocket>();
  sockets.add(ws);
  roomSockets.set(roomId, sockets);

  // 1) 입장자에게 현재 상태 전달
  safeSend(ws, { type: "room_state", roomId, members: getMembers(roomId) });

  // 2) 방 전체에 "누가 들어옴" 브로드캐스트
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

  // 방 전체에 "누가 나감" 브로드캐스트
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
      msg = JSON.parse(data.toString());
    } catch {
      safeSend(ws, { type: "error", message: "Invalid JSON" });
      return;
    }

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

    safeSend(ws, { type: "error", message: "Unknown message type" });
  });

  ws.on("close", () => {
    leaveRoom(ws);
  });
});

console.log("WS server running on ws://localhost:8080");
