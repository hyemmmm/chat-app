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
  | { type: "error"; message: string }
  | {
      type: "message";
      roomId: string;
      id: number;
      sender: string;
      text: string;
      timestamp: string;
    };
