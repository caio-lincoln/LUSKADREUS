import { create } from "zustand"

interface ToolState {
  currentTool: string
  brushSize: number
  brushColor: string
  brushOpacity: number
  eraserSize: number
}

interface ToolsStore extends ToolState {
  // Actions
  setCurrentTool: (tool: string) => void
  setBrushSize: (size: number) => void
  setBrushColor: (color: string) => void
  setBrushOpacity: (opacity: number) => void
  setEraserSize: (size: number) => void
  resetTools: () => void
}

export const useToolsStore = create<ToolsStore>((set) => ({
  // Initial state
  currentTool: "brush",
  brushSize: 5,
  brushColor: "#000000",
  brushOpacity: 1,
  eraserSize: 10,

  // Actions
  setCurrentTool: (currentTool) => set({ currentTool }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushOpacity: (brushOpacity) => set({ brushOpacity }),
  setEraserSize: (eraserSize) => set({ eraserSize }),
  resetTools: () =>
    set({
      currentTool: "brush",
      brushSize: 5,
      brushColor: "#000000",
      brushOpacity: 1,
      eraserSize: 10,
    }),
}))
