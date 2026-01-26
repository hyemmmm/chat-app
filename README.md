# Next.js Chat App

![Chat Screenshot](./docs/screenshots/chat.png)

## Tech Stack

- Core: Next.js (App Router), React, TypeScript
- State: React Query, Recoil
- Styling: Emotion
- Package Manager: pnpm

## Purpose

이 프로젝트는 WebSocket 기반 채팅 기능을 직접 구현해보며,
실시간 통신과 관련된 프런트엔드 기술을 학습하기 위한 스터디용 프로젝트입니다.

- Next.js(App Router) 환경에서의 클라이언트 중심 실시간 처리
- WebSocket 기반 메시지 송수신 구조
- ACK 기반 메시지 전송 상태 관리
- 네트워크 불안정 상황에서의 재연결 UX 설계

---

## Features

- 닉네임 입력 후 채팅 참여
- 실시간 메시지 송수신
- 재접속 시 최근 메시지 히스토리 복원 (서버 메모리 기반)
- 메시지 전송 상태 관리 (`sending / sent / failed`)
- 실패 메시지 재전송
- WebSocket 연결 상태 관리 및 자동 재연결

---

## Message Flow

- 메시지 전송 시 optimistic UI로 즉시 `sending` 상태 추가
- 서버 ACK 수신 시 `sent`로 확정
- ACK 실패 시 `failed` 처리
- 서버 echo 중 **내 메시지는 필터링하여 중복 렌더링 방지**

---

## Run

```bash
pnpm install

# Next.js client
pnpm dev

# WebSocket server
pnpm dev:ws
```
