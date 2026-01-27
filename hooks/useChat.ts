"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ConnectionStatus, Message, ServerToClient } from "@/types/types";

const MAX_RETRIES = 2; // 최대 자동 재시도 횟수

export function useChat(nickname: string) {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<string[]>([]);

  // ✅ isOnline 대신 상세 연결 상태 관리
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  const wsRef = useRef<WebSocket | null>(null);

  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null); // 재연결 타이머
  const retryCount = useRef(0); // 재시도 횟수 카운터

  // ack 타임아웃 및 재전송 저장소
  const pendingTimers = useRef<Map<string, number>>(new Map());
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

  // 2. WebSocket 연결 함수 (useCallback으로 분리)
  const connect = useCallback(() => {
    if (!nickname) return;

    // 이미 연결 중이거나 연결된 상태면 스킵
    if (
      wsRef.current?.readyState === WebSocket.CONNECTING ||
      wsRef.current?.readyState === WebSocket.OPEN
    )
      return;

    // ✅ 연결 시도 시 상태 업데이트
    setConnectionStatus("reconnecting");

    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      // ✅ 연결 성공
      setConnectionStatus("connected");
      ws.send(JSON.stringify({ type: "join_room", roomId: "lobby", nickname }));

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      retryCount.current = 0; // 카운트 리셋
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as ServerToClient;

        if ("members" in msg) {
          setMembers(msg.members);
          return;
        }

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

        if (msg.type === "message") {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            if (msg.sender === nickname) return prev;
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

    // ✅ 연결 종료 (서버 다운, 네트워크 끊김 등)
    ws.onclose = () => {
      wsRef.current = null;

      // ✅ [재연결 전략 수정]
      // 1회차: 0ms (즉시 재시도) -> 단순 렉인지 확인
      // 2회차: 2000ms (2초 쉬고 재시도) -> 서버 재부팅 대기
      const RETRY_DELAYS = [0, 2000];

      if (retryCount.current < MAX_RETRIES) {
        setConnectionStatus("reconnecting"); // 노란불 유지

        const delay = RETRY_DELAYS[retryCount.current] ?? 3000;

        console.log(
          `🔄 재연결 시도 (${retryCount.current + 1}/${MAX_RETRIES}) - 대기: ${delay}ms`,
        );
        retryCount.current += 1;

        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        // 🔴 모든 시도 실패 -> 빨간불 + 버튼 등장
        console.warn("🚫 자동 재연결 실패. 수동 전환.");
        setConnectionStatus("disconnected");
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
      ws.close(); // 에러 발생 시 닫고 onclose 트리거
    };
  }, [nickname]);

  // ✅ 수동 재연결 (버튼 클릭용)
  const manualReconnect = () => {
    retryCount.current = 0; // 카운트 초기화가 핵심
    connect();
  };

  // 3. 최초 진입 시 및 윈도우 네트워크 상태 감지
  useEffect(() => {
    connect(); // 최초 연결

    // 브라우저 자체가 오프라인이 되면 즉시 disconnected 처리
    const handleOffline = () => {
      if (wsRef.current) wsRef.current.close();
      setConnectionStatus("disconnected");
    };

    // 브라우저가 온라인으로 돌아오면 즉시 재연결 시도
    const handleOnline = () => {
      connect();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      // 컴포넌트 언마운트 시 정리
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();

      for (const t of pendingTimers.current.values()) window.clearTimeout(t);
    };
  }, [connect]);

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

  const sendMessage = (text: string) => {
    // ✅ 연결 상태 체크 강화
    if (!text.trim() || connectionStatus !== "connected") return;

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

    setMessages((prev) => [
      ...prev,
      { clientId, sender: nickname, text, timestamp, status: "sending" },
    ]);

    pendingText.current.set(clientId, text);

    ws.send(
      JSON.stringify({
        type: "send_message",
        roomId: "lobby",
        nickname,
        text,
        clientMessageId: clientId,
      }),
    );

    startFailTimer(clientId);
  };

  const retryMessage = (clientId: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return; // 여기도 체크

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
        clientMessageId: clientId,
      }),
    );

    startFailTimer(clientId);
  };

  // ✅ connectionStatus 리턴 추가
  return {
    messages,
    members,
    connectionStatus,
    sendMessage,
    retryMessage,
    manualReconnect,
  };
}
