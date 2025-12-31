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

  // 3. WebSocket 연결 및 수신 로직
  useEffect(() => {
    if (!nickname) return;

    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      // 입장 메시지 전송
      ws.send(JSON.stringify({ type: "join_room", roomId: "lobby", nickname }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as ServerToClient;

        console.log(msg);

        // [기존] 멤버 입장/퇴장/상태 관리
        if ("members" in msg) {
          setMembers(msg.members);
        }

        // 실시간 메시지 수신 처리
        if (msg.type === "message") {
          const newMessage: Message = {
            id: msg.id,
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.timestamp,
          };
          setMessages((prev) => [...prev, newMessage]);
        }

        if (msg.type === "error") {
          console.error("[WS Error]", msg.message);
        }
      } catch (e) {
        console.error("메시지 파싱 에러", e);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [nickname]);

  // 4. 메시지 전송 핸들러
  const sendMessage = (text: string) => {
    // 빈 값이나 오프라인이면 중단
    if (!text.trim() || !isOnline) return;

    // 웹소켓이 연결되어 있지 않으면 중단
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("웹소켓이 연결되지 않았습니다.");
      return;
    }

    // 로컬 상태 업데이트(setState)를 하지 않고, 서버로 전송만 함!
    // 서버가 브로드캐스트 해주면 onmessage에서 받아서 처리.
    wsRef.current.send(
      JSON.stringify({
        type: "send_message",
        roomId: "lobby",
        nickname,
        text,
      })
    );
  };

  return { messages, members, isOnline, sendMessage };
}
