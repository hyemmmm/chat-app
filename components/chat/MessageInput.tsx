import { useState } from "react";
import styled from "@emotion/styled";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isOnline: boolean;
}

export default function MessageInput({
  onSendMessage,
  isOnline,
}: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  return (
    <InputArea onSubmit={handleSubmit}>
      <ChatInput
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!isOnline}
        placeholder={
          isOnline ? "메시지를 입력하세요..." : "연결을 확인해주세요"
        }
      />
      <SendButton type="submit" disabled={!isOnline || !text.trim()}>
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
