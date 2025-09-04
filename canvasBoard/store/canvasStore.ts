import { create } from "zustand"
import type { CanvasState } from "./types"

interface CanvasStore extends CanvasState {
  // Actions
  setIsDrawing: (isDrawing: boolean) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  setCanvasSize: (width: number, height: number) => void
  setZoom: (zoom: number) => void
  resetCanvas: () => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Initial state
  isDrawing: false,
  hasUnsavedChanges: false,
  canvasSize: {
    width: 800,
    height: 600,
  },
  zoom: 1,

  // Actions
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
  setCanvasSize: (width, height) =>
    set({
      canvasSize: { width, height },
    }),
  setZoom: (zoom) => set({ zoom }),
  resetCanvas: () =>
    set({
      isDrawing: false,
      hasUnsavedChanges: false,
      zoom: 1,
    }),
}))
