export type MessageStatus = "sent" | "sending" | "failed";

export type Message = {
  id?: number; // 서버 확정 후 생김(기존 number였다면 optional로)
  clientId: string; // UI에서 항상 존재(crypto.randomUUID())
  sender: string;
  text: string;
  timestamp: string;
  status?: MessageStatus; // 기본 sent
};

export type ServerMessage = {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
};

export type ServerToClient =
  | { type: "room_state"; roomId: string; members: string[] }
  | {
      type: "member_joined";
      roomId: string;
      nickname: string;
      members: string[];
    }
  | { type: "member_left"; roomId: string; nickname: string; members: string[] }
  | {
      // ✅ 재접속 / 최초 입장 시 내려주는 메시지 히스토리
      type: "history";
      roomId: string;
      messages: ServerMessage[];
    }
  | { type: "error"; message: string }
  | {
      type: "message";
      roomId: string;
      id: number;
      sender: string;
      text: string;
      timestamp: string;
      clientMessageId?: string;
    }
  | {
      type: "ack";
      roomId: string;
      clientMessageId: string;
      serverMessageId: number;
    };

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
