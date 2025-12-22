"use client";

import { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const [nickname, setNickname] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 자동 포커스 권장 사항 반영
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleJoin = () => {
    if (nickname.trim()) {
      // 닉네임을 들고 채팅 페이지로 이동 (예: /chat?name=...)
      router.push(`/chat?nickname=${encodeURIComponent(nickname)}`);
    }
  };

  return (
    <Container>
      <Title>채팅방 입장</Title>

      <Input
        ref={inputRef}
        type="text"
        placeholder="닉네임을 입력하세요"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
      />

      <JoinButton onClick={handleJoin} disabled={!nickname.trim()}>
        입장하기
      </JoinButton>
    </Container>
  );
}

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background-color: #f8f9fa;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 2rem;
`;

const Input = styled.input`
  width: 300px;
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #0070f3;
  }
`;

const JoinButton = styled.button`
  margin-top: 1rem;
  width: 300px;
  padding: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background-color: #0070f3; // Primary Color
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s, background-color 0.2s;

  &:hover {
    background-color: #0051bb;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;
