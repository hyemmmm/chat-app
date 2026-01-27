"use client";

import { useSearchParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import styled from "@emotion/styled";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import UserList from "@/components/chat/UserList";
import { ConnectionStatus } from "@/types/types";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const nickname = (searchParams.get("nickname") || "").trim();

  const {
    messages,
    members,
    connectionStatus,
    sendMessage,
    retryMessage,
    manualReconnect,
  } = useChat(nickname);

  if (!nickname) return null;

  return (
    <Container>
      <ChatHeader
        nickname={nickname}
        memberCount={members.length}
        connectionStatus={connectionStatus}
      />

      {/* ✅ 연결 상태 알림 배너 (버튼 추가됨) */}
      {connectionStatus !== "connected" && (
        <NetworkErrorNotice status={connectionStatus}>
          {connectionStatus === "reconnecting" ? (
            // 1. 재연결 중 (노란색, 버튼 없음)
            <span>서버와 연결이 끊겨 재연결을 시도 중입니다...</span>
          ) : (
            // 2. 연결 끊김 (빨간색, 버튼 있음)
            <ReconnectWrapper>
              <span>네트워크 연결이 끊어졌습니다.</span>
              <RetryButton onClick={manualReconnect}>
                ↻ 다시 연결하기
              </RetryButton>
            </ReconnectWrapper>
          )}
        </NetworkErrorNotice>
      )}

      <MainLayout>
        {/* 채팅 영역 */}
        <ChatSection>
          <MessageList
            messages={messages}
            currentUser={nickname}
            onRetry={retryMessage}
          />
          <MessageInput
            onSendMessage={sendMessage}
            connectionStatus={connectionStatus}
          />
        </ChatSection>

        {/* 사이드바 영역 */}
        <UserListSidebar>
          <SidebarTitle>접속자 목록</SidebarTitle>
          <UserList members={members} currentUser={nickname} />
        </UserListSidebar>
      </MainLayout>
    </Container>
  );
}

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

const NetworkErrorNotice = styled.div<{ status: ConnectionStatus }>`
  background-color: ${(props) =>
    props.status === "reconnecting" ? "#fff3cd" : "#ffebee"};
  color: ${(props) =>
    props.status === "reconnecting" ? "#856404" : "#c62828"};
  padding: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  /* 내용 중앙 정렬을 위해 Flexbox 사용 */
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: background-color 0.3s;
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

const ReconnectWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

// ✅ 재연결 버튼 스타일 추가
const RetryButton = styled.button`
  background: white;
  border: 1px solid #ef9a9a; /* 연한 빨강 테두리 */
  color: #c62828;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  display: flex;
  align-items: center;

  &:hover {
    background-color: #ffcdd2; /* 호버 시 약간 붉은 배경 */
    border-color: #c62828;
  }

  &:active {
    transform: scale(0.98);
  }
`;
