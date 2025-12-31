"use client";

import styled from "@emotion/styled";

interface UserListProps {
  members: string[];
  currentUser: string;
}

export default function UserList({ members, currentUser }: UserListProps) {
  return (
    <ListWrapper>
      {members.map((m) => {
        const isMe = m === currentUser;
        return (
          <UserItem key={m} isMe={isMe}>
            <UserStatusDot />
            <UserNickname>
              {m} {isMe && "(나)"}
            </UserNickname>
          </UserItem>
        );
      })}
    </ListWrapper>
  );
}

const ListWrapper = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const UserItem = styled.li<{ isMe: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 0.95rem;
  color: ${(props) => (props.isMe ? "#0070f3" : "#333")};
  font-weight: ${(props) => (props.isMe ? "600" : "400")};
`;

const UserStatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4caf50;
`;

const UserNickname = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
