export interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
}

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
      messages: Message[];
    }
  | { type: "error"; message: string }
  | {
      type: "message";
      roomId: string;
      id: number;
      sender: string;
      text: string;
      timestamp: string;
    }
  | {
      type: "error";
      message: string;
    };
