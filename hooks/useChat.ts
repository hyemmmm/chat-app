"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Message, ServerToClient } from "@/types/types";

export function useChat(nickname: string) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. 닉네임 체크
  useEffect(() => {
    if (!nickname) router.replace("/");
    else setMembers([nickname]);
  }, [nickname, router]);

  // 2. 네트워크 상태 감지
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 3. WebSocket 연결
  useEffect(() => {
    if (!nickname) return;

    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join_room", roomId: "lobby", nickname }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as ServerToClient;
        if (["room_state", "member_joined", "member_left"].includes(msg.type)) {
          // @ts-ignore (타입 가드 생략 단순화)
          setMembers(msg.members);
        }
        if (msg.type === "error") console.error(msg.message);
      } catch (e) {
        console.error(e);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [nickname]);

  // 4. 메시지 전송 핸들러
  const sendMessage = (text: string) => {
    if (!text.trim() || !isOnline) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: nickname || "익명",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // UI 업데이트 (추후 WS 전송 로직 추가 필요)
    setMessages((prev) => [...prev, newMessage]);
  };

  return { messages, members, isOnline, sendMessage };
}
