import { create } from "zustand"

// Canvas Store
interface CanvasState {
  isDrawing: boolean
  hasUnsavedChanges: boolean
  canvasSize: {
    width: number
    height: number
  }
  zoom: number
}

interface CanvasStore extends CanvasState {
  setIsDrawing: (isDrawing: boolean) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  setCanvasSize: (width: number, height: number) => void
  setZoom: (zoom: number) => void
  resetCanvas: () => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  isDrawing: false,
  hasUnsavedChanges: false,
  canvasSize: {
    width: 800,
    height: 600,
  },
  zoom: 1,

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

// Tools Store
interface ToolState {
  currentTool: string
  brushSize: number
  brushColor: string
  brushOpacity: number
  eraserSize: number
}

interface ToolsStore extends ToolState {
  setCurrentTool: (tool: string) => void
  setBrushSize: (size: number) => void
  setBrushColor: (color: string) => void
  setBrushOpacity: (opacity: number) => void
  setEraserSize: (size: number) => void
  resetTools: () => void
}

export const useToolsStore = create<ToolsStore>((set) => ({
  currentTool: "brush",
  brushSize: 5,
  brushColor: "#000000",
  brushOpacity: 1,
  eraserSize: 10,

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

// History Store
interface HistoryStore {
  canUndo: boolean
  canRedo: boolean
  historyIndex: number
  maxHistorySize: number
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setHistoryIndex: (index: number) => void
  incrementHistory: () => void
  decrementHistory: () => void
  resetHistory: () => void
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  canUndo: false,
  canRedo: false,
  historyIndex: -1,
  maxHistorySize: 50,

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

// Files Store (placeholder)
export const useFilesStore = create(() => ({
  files: [],
  currentFile: null,
}))

// Shape Store (placeholder)
export const useShapeStore = create(() => ({
  shapes: [],
  selectedShape: null,
}))

// Types
export interface CanvasState {
  isDrawing: boolean
  hasUnsavedChanges: boolean
  canvasSize: {
    width: number
    height: number
  }
  zoom: number
}

export interface ToolState {
  currentTool: string
  brushSize: number
  brushColor: string
  brushOpacity: number
  eraserSize: number
}

export interface HistoryState {
  canUndo: boolean
  canRedo: boolean
  historyIndex: number
  maxHistorySize: number
}
