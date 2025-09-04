import { create } from "zustand"
import type { HistoryState } from "./types"

interface HistoryStore extends HistoryState {
  // Actions
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setHistoryIndex: (index: number) => void
  incrementHistory: () => void
  decrementHistory: () => void
  resetHistory: () => void
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  // Initial state
  canUndo: false,
  canRedo: false,
  historyIndex: -1,
  maxHistorySize: 50,

  // Actions
  setCanUndo: (canUndo) => set({ canUndo }),
  setCanRedo: (canRedo) => set({ canRedo }),
  setHistoryIndex: (historyIndex) => set({ historyIndex }),
  incrementHistory: () => {
    const { historyIndex, maxHistorySize } = get()
    const newIndex = Math.min(historyIndex + 1, maxHistorySize - 1)
    set({
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: false,
    })
  },
  decrementHistory: () => {
    const { historyIndex } = get()
    const newIndex = Math.max(historyIndex - 1, -1)
    set({
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
    })
  },
  resetHistory: () =>
    set({
      canUndo: false,
      canRedo: false,
      historyIndex: -1,
    }),
}))
