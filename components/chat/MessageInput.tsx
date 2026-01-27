import { useState } from "react";
import styled from "@emotion/styled";

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  connectionStatus: ConnectionStatus; // ✅ 변경
}

export default function MessageInput({
  onSendMessage,
  connectionStatus,
}: MessageInputProps) {
  const [text, setText] = useState("");

  // ✅ 연결된 상태인지 확인하는 헬퍼
  const isConnected = connectionStatus === "connected";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !isConnected) return;
    onSendMessage(text);
    setText("");
  };

  // ✅ 상태별 안내 문구
  const getPlaceholder = () => {
    if (connectionStatus === "connected") return "메시지를 입력하세요...";
    if (connectionStatus === "reconnecting") return "서버에 재연결 중입니다...";
    return "네트워크 연결을 확인해주세요.";
  };

  return (
    <InputArea onSubmit={handleSubmit}>
      <ChatInput
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!isConnected} // ✅ 연결 안 되면 비활성화
        placeholder={getPlaceholder()}
      />
      <SendButton type="submit" disabled={!isConnected || !text.trim()}>
        전송
      </SendButton>
    </InputArea>
  );
}

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
  border-radius: 25px;
  outline: none;
  font-size: 0.95rem;

  /* 비활성화 시 스타일 추가 */
  &:disabled {
    background-color: #f9f9f9;
    cursor: not-allowed;
  }

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
