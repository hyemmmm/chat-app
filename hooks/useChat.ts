"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Message, ServerToClient } from "@/types/types";

export function useChat(nickname: string) {
  const router = useRouter();

  // ✅ UI용 메시지로 변경
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);

  // ack 타임아웃 관리
  const pendingTimers = useRef<Map<string, number>>(new Map());
  // 재전송을 위해 text 저장
  const pendingText = useRef<Map<string, string>>(new Map());

  const clearPendingTimer = (clientId: string) => {
    const t = pendingTimers.current.get(clientId);
    if (t) window.clearTimeout(t);
    pendingTimers.current.delete(clientId);
  };

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
      ws.send(JSON.stringify({ type: "join_room", roomId: "lobby", nickname }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as ServerToClient;

        // 멤버 상태
        if ("members" in msg) {
          setMembers(msg.members);
          return;
        }

        // ✅ history: ServerMessage[] -> UI Message[]
        if (msg.type === "history") {
          setMessages(
            msg.messages.map((m) => ({
              id: m.id,
              clientId: `server-${m.id}`,
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp,
              status: "sent",
            })),
          );
          return;
        }

        // ✅ ack: 내 optimistic 메시지 확정
        if (msg.type === "ack") {
          clearPendingTimer(msg.clientMessageId);
          pendingText.current.delete(msg.clientMessageId);

          setMessages((prev) =>
            prev.map((m) =>
              m.clientId === msg.clientMessageId
                ? { ...m, id: msg.serverMessageId, status: "sent" }
                : m,
            ),
          );
          return;
        }

        // ✅ message: 실시간 수신 (다른 사람 메시지)
        if (msg.type === "message") {
          setMessages((prev) => {
            // ✅ 이미 들어온 server id면 중복 방지
            if (prev.some((m) => m.id === msg.id)) return prev;

            // ✅ 내 메시지는 optimistic + ACK로만 확정(서버 echo는 무시)
            if (msg.sender === nickname) return prev;

            // ✅ 다른 사람 메시지만 append
            return [
              ...prev,
              {
                id: msg.id,
                clientId: `server-${msg.id}`,
                sender: msg.sender,
                text: msg.text,
                timestamp: msg.timestamp,
                status: "sent",
              },
            ];
          });
          return;
        }

        if (msg.type === "error") {
          console.error("[WS Error]", msg.message);
        }
      } catch (e) {
        console.error("메시지 파싱 에러", e);
      }
    };

    return () => {
      // 타이머 정리
      for (const t of pendingTimers.current.values()) window.clearTimeout(t);
      pendingTimers.current.clear();
      pendingText.current.clear();

      ws.close();
      wsRef.current = null;
    };
  }, [nickname, router]);

  const startFailTimer = (clientId: string) => {
    clearPendingTimer(clientId);

    const t = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientId === clientId ? { ...m, status: "failed" } : m,
        ),
      );
    }, 3000);

    pendingTimers.current.set(clientId, t);
  };

  // 4. 메시지 전송 핸들러 (optimistic + ack timeout)
  const sendMessage = (text: string) => {
    if (!text.trim() || !isOnline) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("웹소켓이 연결되지 않았습니다.");
      return;
    }

    const clientId = crypto.randomUUID();
    const timestamp = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // ✅ UI에 먼저 추가
    setMessages((prev) => [
      ...prev,
      { clientId, sender: nickname, text, timestamp, status: "sending" },
    ]);

    // 재전송용 저장
    pendingText.current.set(clientId, text);

    // ✅ 전송
    ws.send(
      JSON.stringify({
        type: "send_message",
        roomId: "lobby",
        nickname,
        text,
        clientMessageId: clientId,
      }),
    );

    // ✅ ack 안 오면 failed
    startFailTimer(clientId);
  };

  // ✅ 재전송
  const retryMessage = (clientId: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const text = pendingText.current.get(clientId);
    if (!text) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.clientId === clientId ? { ...m, status: "sending" } : m,
      ),
    );

    ws.send(
      JSON.stringify({
        type: "send_message",
        roomId: "lobby",
        nickname,
        text,
        clientMessageId: clientId, // ✅ 같은 id로 재전송(중복 방지)
      }),
    );

    startFailTimer(clientId);
  };

  return { messages, members, isOnline, sendMessage, retryMessage };
}
