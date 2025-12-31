import { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { Message } from "@/types/types";

interface MessageListProps {
  messages: Message[];
  currentUser: string;
}

export default function MessageList({
  messages,
  currentUser,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  return (
    <ChatWindow ref={scrollRef}>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} isMe={msg.sender === currentUser}>
          <SenderName>{msg.sender}</SenderName>
          <BubbleContent>
            <Text>{msg.text}</Text>
            <Time>{msg.timestamp}</Time>
          </BubbleContent>
        </MessageBubble>
      ))}
    </ChatWindow>
  );
}

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
