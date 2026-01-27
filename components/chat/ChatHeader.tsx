import { ConnectionStatus } from "@/types/types";
import styled from "@emotion/styled";

interface ChatHeaderProps {
  nickname: string;
  memberCount: number;
  connectionStatus: ConnectionStatus; // ✅ 변경
}

export default function ChatHeader({
  nickname,
  memberCount,
  connectionStatus,
}: ChatHeaderProps) {
  return (
    <Header>
      <HeaderLeft>
        <StatusDot status={connectionStatus} />
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

// ✅ 상태에 따른 색상 매핑
const StatusDot = styled.div<{ status: ConnectionStatus }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => {
    switch (props.status) {
      case "connected":
        return "#4caf50"; // 초록 (연결됨)
      case "reconnecting":
        return "#ff9800"; // 주황 (재연결 중)
      case "disconnected":
        return "#f44336"; // 빨강 (끊김)
      default:
        return "#9e9e9e"; // 회색 (알수없음)
    }
  }};
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
