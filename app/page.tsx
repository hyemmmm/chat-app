"use client";

import styled from "@emotion/styled";

export default function Home() {
  return (
    <Page>
      <Card>
        <Title>Chat App</Title>
        <Desc>Next.js + TypeScript + React Query + Recoil + Emotion</Desc>
      </Card>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b0b0c;
  padding: 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
`;

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 22px;
`;

const Desc = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
`;
