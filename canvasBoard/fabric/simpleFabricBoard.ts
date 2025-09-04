export class SimpleFabricBoard {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private isDrawing = false
  private lastX = 0
  private lastY = 0
  private config: any

  constructor(canvasElement: HTMLCanvasElement, config: any) {
    this.canvas = canvasElement
    this.config = config

    const context = canvasElement.getContext("2d")
    if (!context) {
      throw new Error("Could not get 2D context from canvas")
    }
    this.ctx = context

    this.setupCanvas()
    this.bindEvents()

    console.log("✅ SimpleFabricBoard initialized as fallback")
  }

  private setupCanvas() {
    this.canvas.width = this.config.width || 800
    this.canvas.height = this.config.height || 600
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"
    this.ctx.strokeStyle = "#000000"
    this.ctx.lineWidth = 5
  }

  private bindEvents() {
    this.canvas.addEventListener("mousedown", this.startDrawing.bind(this))
    this.canvas.addEventListener("mousemove", this.draw.bind(this))
    this.canvas.addEventListener("mouseup", this.stopDrawing.bind(this))
    this.canvas.addEventListener("mouseout", this.stopDrawing.bind(this))
  }

  private startDrawing(e: MouseEvent) {
    this.isDrawing = true
    const rect = this.canvas.getBoundingClientRect()
    this.lastX = e.clientX - rect.left
    this.lastY = e.clientY - rect.top
  }

  private draw(e: MouseEvent) {
    if (!this.isDrawing) return

    const rect = this.canvas.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    this.ctx.beginPath()
    this.ctx.moveTo(this.lastX, this.lastY)
    this.ctx.lineTo(currentX, currentY)
    this.ctx.stroke()

    this.lastX = currentX
    this.lastY = currentY

    if (this.config.onDrawingChange) {
      this.config.onDrawingChange(true)
    }
  }

  private stopDrawing() {
    this.isDrawing = false
  }

  // Public API methods to maintain compatibility
  setTool(tool: string) {
    console.log("Tool changed to:", tool)
  }

  setBrushSize(size: number) {
    this.ctx.lineWidth = size
  }

  setBrushColor(color: string) {
    this.ctx.strokeStyle = color
  }

  setBrushOpacity(opacity: number) {
    this.ctx.globalAlpha = opacity
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.config.onDrawingChange) {
      this.config.onDrawingChange(false)
    }
  }

  save() {
    return this.canvas.toDataURL("image/png")
  }

  download(filename?: string, format = "png") {
    const link = document.createElement("a")
    link.download = filename || `drawing.${format}`
    link.href = this.canvas.toDataURL(`image/${format}`)
    link.click()
  }

  undo() {
    console.log("Undo not implemented in fallback mode")
  }

  redo() {
    console.log("Redo not implemented in fallback mode")
  }

  canUndo() {
    return false
  }

  canRedo() {
    return false
  }

  zoomIn() {
    console.log("Zoom not implemented in fallback mode")
  }

  zoomOut() {
    console.log("Zoom not implemented in fallback mode")
  }

  resetZoom() {
    console.log("Reset zoom not implemented in fallback mode")
  }

  getZoomPercentage() {
    return 100
  }

  dispose() {
    // Clean up event listeners
    this.canvas.removeEventListener("mousedown", this.startDrawing.bind(this))
    this.canvas.removeEventListener("mousemove", this.draw.bind(this))
    this.canvas.removeEventListener("mouseup", this.stopDrawing.bind(this))
    this.canvas.removeEventListener("mouseout", this.stopDrawing.bind(this))
  }
}
