import { create } from "zustand";

interface MentorState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useMentorStore = create<MentorState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}));
