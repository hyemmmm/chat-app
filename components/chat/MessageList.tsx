import { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { Message } from "@/types/types";

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  onRetry?: (clientId: string) => void; // ✅ 추가
}

export default function MessageList({
  messages,
  currentUser,
  onRetry,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  return (
    <ChatWindow ref={scrollRef}>
      {messages.map((msg) => {
        const isMe = msg.sender === currentUser;
        const status = msg.status ?? "sent";

        return (
          <MessageBubble key={msg.id ?? msg.clientId} isMe={isMe}>
            <SenderName>{msg.sender}</SenderName>

            <BubbleContent>
              <Text>{msg.text}</Text>

              <Meta>
                <Time>{msg.timestamp}</Time>

                {isMe && status === "sending" && <Badge>전송중</Badge>}

                {isMe && status === "failed" && (
                  <>
                    <BadgeFailed>실패</BadgeFailed>
                    <RetryButton
                      type="button"
                      onClick={() => onRetry?.(msg.clientId)}
                    >
                      재전송
                    </RetryButton>
                  </>
                )}
              </Meta>
            </BubbleContent>
          </MessageBubble>
        );
      })}
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

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Time = styled.span`
  font-size: 0.65rem;
  color: #bbb;
  white-space: nowrap;
`;

const Badge = styled.span`
  font-size: 0.65rem;
  color: #888;
  white-space: nowrap;
`;

const BadgeFailed = styled(Badge)`
  color: #d32f2f;
`;

const RetryButton = styled.button`
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
`;
