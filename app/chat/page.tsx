"use client";

import { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { useSearchParams } from "next/navigation";

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") || "익명";

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 네트워크 상태 감지 (온라인/오프라인)
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

  // 2. 최근 메시지 내역 불러오기 (Local Storage 활용)
  useEffect(() => {
    const savedMessages = localStorage.getItem("chat_history");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // 3. 메시지 추가될 때마다 스크롤 아래로 이동 및 저장
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    if (messages.length > 0) {
      localStorage.setItem("chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // 4. 메시지 전송 함수
  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !isOnline) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: nickname,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // (참고) 실시간 확인 테스트를 위한 가짜 자동 응답 (백엔드 연결 시 삭제)
    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        sender: "상대방",
        text: `"${inputText}"라고 말씀하셨군요!`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1000);
  };

  return (
    <Container>
      <Header>
        <StatusDot isOnline={isOnline} />
        <Title>{nickname}님의 채팅방</Title>
      </Header>

      {/* 네트워크 경고 알림 */}
      {!isOnline && (
        <NetworkErrorNotice>
          현재 네트워크 연결이 불안정하여 메시지를 보낼 수 없습니다.
        </NetworkErrorNotice>
      )}

      <ChatWindow ref={scrollRef}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} isMe={msg.sender === nickname}>
            <SenderName>{msg.sender}</SenderName>
            <BubbleContent>
              <Text>{msg.text}</Text>
              <Time>{msg.timestamp}</Time>
            </BubbleContent>
          </MessageBubble>
        ))}
      </ChatWindow>

      <InputArea onSubmit={sendMessage}>
        <ChatInput
          type="text"
          placeholder={
            isOnline ? "메시지를 입력하세요..." : "연결을 확인해주세요"
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={!isOnline}
        />
        <SendButton type="submit" disabled={!isOnline || !inputText.trim()}>
          전송
        </SendButton>
      </InputArea>
    </Container>
  );
}

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 600px;
  margin: 0 auto;
  border-left: 1px solid #eee;
  border-right: 1px solid #eee;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Title = styled.h2`
  font-size: 1.1rem;
  margin: 0;
`;

const StatusDot = styled.div<{ isOnline: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => (props.isOnline ? "#4caf50" : "#f44336")};
`;

const NetworkErrorNotice = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  text-align: center;
  font-size: 0.9rem;
`;

const ChatWindow = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageBubble = styled.div<{ isMe: boolean }>`
  align-self: ${(props) => (props.isMe ? "flex-end" : "flex-start")};
  max-width: 70%;
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.isMe ? "flex-end" : "flex-start")};
`;

const SenderName = styled.span`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 4px;
`;

const BubbleContent = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
`;

const Text = styled.div`
  background-color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.95rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-break: break-all;
`;

const Time = styled.span`
  font-size: 0.7rem;
  color: #999;
  white-space: nowrap;
`;

const InputArea = styled.form`
  padding: 1rem;
  background: white;
  display: flex;
  gap: 10px;
  border-top: 1px solid #eee;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
  &:focus {
    border-color: #0070f3;
  }
`;

const SendButton = styled.button`
  padding: 0 20px;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;
