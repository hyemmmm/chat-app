"use client";

import { useSearchParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import styled from "@emotion/styled";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import UserList from "@/components/chat/UserList";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const nickname = (searchParams.get("nickname") || "").trim();

  const { messages, members, isOnline, sendMessage } = useChat(nickname);

  if (!nickname) return null;

  return (
    <Container>
      <ChatHeader
        nickname={nickname}
        memberCount={members.length}
        isOnline={isOnline}
      />

      {!isOnline && (
        <NetworkErrorNotice>
          현재 네트워크 연결이 불안정하여 채팅 이용이 어렵습니다.
        </NetworkErrorNotice>
      )}

      <MainLayout>
        {/* 채팅 영역 */}
        <ChatSection>
          <MessageList messages={messages} currentUser={nickname} />
          <MessageInput onSendMessage={sendMessage} isOnline={isOnline} />
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

const NetworkErrorNotice = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  text-align: center;
  font-size: 0.9rem;
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
