// Ferramentas do canvas (brush, eraser, shapes, etc.)

export enum CanvasTool {
  BRUSH = "brush",
  ERASER = "eraser",
  LINE = "line",
  RECTANGLE = "rectangle",
  CIRCLE = "circle",
  TEXT = "text",
}

export interface ToolConfig {
  type: CanvasTool
  size: number
  color: string
  opacity: number
}

export class CanvasTools {
  private currentTool: CanvasTool = CanvasTool.BRUSH
  private config: ToolConfig = {
    type: CanvasTool.BRUSH,
    size: 5,
    color: "#000000",
    opacity: 1,
  }

  public setTool(tool: CanvasTool) {
    this.currentTool = tool
    this.config.type = tool
  }

  public setSize(size: number) {
    this.config.size = size
  }

  public setColor(color: string) {
    this.config.color = color
  }

  public setOpacity(opacity: number) {
    this.config.opacity = opacity
  }

  public getCurrentTool(): CanvasTool {
    return this.currentTool
  }

  public getConfig(): ToolConfig {
    return { ...this.config }
  }
}
