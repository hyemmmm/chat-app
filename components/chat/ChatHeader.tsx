import styled from "@emotion/styled";

interface ChatHeaderProps {
  nickname: string;
  memberCount: number;
  isOnline: boolean;
}

export default function ChatHeader({
  nickname,
  memberCount,
  isOnline,
}: ChatHeaderProps) {
  return (
    <Header>
      <HeaderLeft>
        <StatusDot isOnline={isOnline} />
        <Title>{nickname}님의 채팅방</Title>
      </HeaderLeft>
      <UserCountBadge>접속 중: {memberCount}명</UserCountBadge>
    </Header>
  );
}

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

const StatusDot = styled.div<{ isOnline: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => (props.isOnline ? "#4caf50" : "#f44336")};
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
