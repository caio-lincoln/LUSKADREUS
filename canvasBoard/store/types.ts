// Types compartilhados entre os stores

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
