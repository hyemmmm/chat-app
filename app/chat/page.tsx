"use client";

import { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { useSearchParams, useRouter } from "next/navigation";

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
}

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

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nickname = (searchParams.get("nickname") || "").trim();

  // --- Chat state ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  // --- Presence state (from WS server) ---
  const [members, setMembers] = useState<string[]>(nickname ? [nickname] : []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 1) 네트워크 상태 감지 (브라우저 네트워크)
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

  // 2) 메시지 추가 시 스크롤 하단 이동
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  // 3) 닉네임 없으면 입장 불가 → 홈으로
  useEffect(() => {
    if (!nickname) {
      router.replace("/");
    }
  }, [nickname, router]);

  // 4) WS 연결 + join_room 전송 + 멤버 리스트 수신
  useEffect(() => {
    if (!nickname) return;

    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId: "lobby", // 방 고정
          nickname,
        })
      );
    };

    ws.onmessage = (evt) => {
      let msg: ServerToClient;
      try {
        msg = JSON.parse(evt.data) as ServerToClient;
      } catch {
        return;
      }

      if (msg.type === "room_state") setMembers(msg.members);
      if (msg.type === "member_joined") setMembers(msg.members);
      if (msg.type === "member_left") setMembers(msg.members);

      if (msg.type === "error") {
        console.error("[WS error]", msg.message);
      }
    };

    ws.onclose = () => {
      // 오늘 범위에서는 재연결 로직은 다음 단계
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [nickname]);

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !isOnline) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: nickname || "익명",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // NOTE: 오늘 범위는 "UI로만 메시지 추가". (WS broadcast는 다음 단계)
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
  };

  if (!nickname) return null;

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <StatusDot isOnline={isOnline} />
          <Title>{nickname}님의 채팅방</Title>
        </HeaderLeft>
        <UserCountBadge>접속 중: {members.length}명</UserCountBadge>
      </Header>

      {!isOnline && (
        <NetworkErrorNotice>
          현재 네트워크 연결이 불안정하여 채팅 이용이 어렵습니다.
        </NetworkErrorNotice>
      )}

      <MainLayout>
        {/* 왼쪽: 채팅 영역 */}
        <ChatSection>
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
        </ChatSection>

        {/* 오른쪽: 접속자 목록 사이드바 */}
        <UserListSidebar>
          <SidebarTitle>접속자 목록</SidebarTitle>
          <UserList>
            {members.map((m) => {
              const isMe = m === nickname;
              return (
                <UserItem key={m} isMe={isMe}>
                  <UserStatusDot />
                  <UserNickname>
                    {m} {isMe && "(나)"}
                  </UserNickname>
                </UserItem>
              );
            })}
          </UserList>
        </UserListSidebar>
      </MainLayout>
    </Container>
  );
}

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 900px; /* 사이드바를 위해 가로폭 확장 */
  margin: 0 auto;
  background-color: #f5f5f5;
  border-left: 1px solid #eee;
  border-right: 1px solid #eee;
`;

const Header = styled.header`
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Title = styled.h2`
  font-size: 1.1rem;
  margin: 0;
`;

const UserCountBadge = styled.span`
  background: #eef5ff;
  color: #0070f3;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
`;

const StatusDot = styled.div<{ isOnline: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => (props.isOnline ? "#4caf50" : "#f44336")};
`;

const MainLayout = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden; /* 내부 스크롤을 위해 고정 */
`;

const ChatSection = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
`;

const UserListSidebar = styled.aside`
  width: 200px;
  background-color: #fcfcfc;
  border-left: 1px solid #eee;
  padding: 1.5rem 1rem;
  @media (max-width: 600px) {
    display: none; /* 모바일에서는 사이드바 숨김 */
  }
`;

const SidebarTitle = styled.h3`
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const UserList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const UserItem = styled.li<{ isMe: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 0.95rem;
  color: ${(props) => (props.isMe ? "#0070f3" : "#333")};
  font-weight: ${(props) => (props.isMe ? "600" : "400")};
`;

const UserStatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4caf50;
`;

const UserNickname = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageBubble = styled.div<{ isMe: boolean }>`
  align-self: ${(props) => (props.isMe ? "flex-end" : "flex-start")};
  max-width: 75%;
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.isMe ? "flex-end" : "flex-start")};
`;

const SenderName = styled.span`
  font-size: 0.75rem;
  color: #888;
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
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  word-break: break-all;
`;

const Time = styled.span`
  font-size: 0.65rem;
  color: #bbb;
  white-space: nowrap;
`;

const InputArea = styled.form`
  padding: 1.2rem;
  background: white;
  display: flex;
  gap: 10px;
  border-top: 1px solid #eee;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 25px; /* 둥근 입력창 */
  outline: none;
  font-size: 0.95rem;
  &:focus {
    border-color: #0070f3;
  }
`;

const SendButton = styled.button`
  padding: 0 24px;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background-color: #005bb5;
  }
`;
