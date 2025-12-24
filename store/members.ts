import { atom } from "recoil";

export const membersState = atom<string[]>({
  key: "membersState",
  default: [],
});
