import { VisualZoomManager } from "./visualZoom"

// Versão corrigida focada no desenho básico com todas as ferramentas funcionais
export interface SimplePaintBoardConfig {
  width: number
  height: number
  onSave?: (imageData: string) => void
  onClear?: () => void
  onDrawingChange?: (hasDrawing: boolean) => void
  disabled?: boolean
  enableZoom?: boolean
}

export class SimplePaintBoard {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: SimplePaintBoardConfig
  private isDrawing = false
  private hasDrawing = false
  private lastX = 0
  private lastY = 0
  private startX = 0
  private startY = 0

  // Configurações de desenho
  private brushSize = 5
  private brushColor = "#000000"
  private brushOpacity = 1
  private currentTool = "brush"

  // Histórico para undo/redo
  private history: ImageData[] = []
  private historyIndex = -1
  private maxHistorySize = 50

  // Canvas temporário para preview de formas
  private previewCanvas: HTMLCanvasElement
  private previewCtx: CanvasRenderingContext2D

  // Managers
  private zoomManager?: VisualZoomManager

  constructor(canvas: HTMLCanvasElement, config: SimplePaintBoardConfig) {
    this.canvas = canvas
    this.config = config

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Não foi possível obter o contexto 2D do canvas")
    }
    this.ctx = ctx

    // Criar canvas de preview para formas
    this.previewCanvas = document.createElement("canvas")
    this.previewCanvas.width = config.width
    this.previewCanvas.height = config.height
    this.previewCanvas.style.position = "absolute"
    this.previewCanvas.style.top = "0"
    this.previewCanvas.style.left = "0"
    this.previewCanvas.style.pointerEvents = "none"
    this.previewCanvas.style.zIndex = "10"

    const previewCtx = this.previewCanvas.getContext("2d")
    if (!previewCtx) {
      throw new Error("Não foi possível obter o contexto 2D do preview")
    }
    this.previewCtx = previewCtx

    // Adicionar preview canvas ao container
    if (canvas.parentElement) {
      canvas.parentElement.style.position = "relative"
      canvas.parentElement.appendChild(this.previewCanvas)
    }

    // Inicializar zoom manager se habilitado
    if (config.enableZoom) {
      this.zoomManager = new VisualZoomManager(canvas, {
        minZoom: 0.25,
        maxZoom: 4,
        zoomStep: 0.25,
        smoothZoom: true,
      })
    }

    this.init()
  }

  private init() {
    // Configurar dimensões
    this.canvas.width = this.config.width
    this.canvas.height = this.config.height

    // Configurações iniciais do contexto
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"
    this.ctx.globalCompositeOperation = "source-over"

    // Configurar eventos
    this.setupEvents()

    // Salvar estado inicial
    this.saveState()

    console.log("SimplePaintBoard inicializado:", {
      width: this.config.width,
      height: this.config.height,
      zoom: !!this.zoomManager,
    })
  }

  private setupEvents() {
    // Eventos de mouse
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this))
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this))
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this))
    this.canvas.addEventListener("mouseout", this.handleMouseUp.bind(this))

    // Eventos de touch para dispositivos móveis
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false })
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false })
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this))

    // Eventos de zoom visual
    if (this.zoomManager) {
      this.canvas.addEventListener("visualzoomchange", this.handleZoomChange.bind(this))
    }

    // Prevenir scroll no touch
    this.canvas.addEventListener("touchstart", (e) => e.preventDefault())
    this.canvas.addEventListener("touchmove", (e) => e.preventDefault())
  }

  private handleZoomChange(e: CustomEvent) {
    const { zoom, percentage } = e.detail
    console.log(`🔍 Zoom visual: ${percentage}%`)

    // Mostrar overlay de zoom temporário
    this.showZoomOverlay(percentage)
  }

  private showZoomOverlay(percentage: number) {
    // Remover overlay existente
    const existingOverlay = document.getElementById("zoom-overlay")
    if (existingOverlay) {
      existingOverlay.remove()
    }

    // Criar novo overlay
    const overlay = document.createElement("div")
    overlay.id = "zoom-overlay"
    overlay.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      z-index: 1000;
      pointer-events: none;
      transition: opacity 0.3s ease;
    `
    overlay.textContent = `${percentage}%`

    // Adicionar ao container do canvas
    if (this.canvas.parentElement) {
      this.canvas.parentElement.appendChild(overlay)
    }

    // Remover após 2 segundos
    setTimeout(() => {
      overlay.style.opacity = "0"
      setTimeout(() => overlay.remove(), 300)
    }, 2000)
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    // Usar o zoom manager se disponível para coordenadas corretas
    if (this.zoomManager) {
      return this.zoomManager.getAdjustedMousePosition(e)
    }

    // Fallback para método tradicional
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  private getTouchPos(e: TouchEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const touch = e.touches[0]

    // Calcular posição considerando zoom visual
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.config.disabled) return

    const pos = this.getMousePos(e)
    this.startDrawing(pos.x, pos.y)
  }

  private handleMouseMove(e: MouseEvent) {
    const pos = this.getMousePos(e)

    if (this.config.disabled) return

    if (this.isDrawing) {
      this.draw(pos.x, pos.y)
    } else if (this.isShapeTool()) {
      // Mostrar preview para ferramentas de forma
      this.showShapePreview(pos.x, pos.y)
    }
  }

  private handleMouseUp() {
    this.stopDrawing()
  }

  private handleTouchStart(e: TouchEvent) {
    if (this.config.disabled) return

    const pos = this.getTouchPos(e)
    this.startDrawing(pos.x, pos.y)
  }

  private handleTouchMove(e: TouchEvent) {
    const pos = this.getTouchPos(e)

    if (this.config.disabled) return

    if (this.isDrawing) {
      this.draw(pos.x, pos.y)
    }
  }

  private handleTouchEnd() {
    this.stopDrawing()
  }

  private isShapeTool(): boolean {
    return ["line", "rectangle", "circle"].includes(this.currentTool)
  }

  private startDrawing(x: number, y: number) {
    this.isDrawing = true
    this.lastX = x
    this.lastY = y
    this.startX = x
    this.startY = y

    // Configurar contexto baseado na ferramenta
    this.setupToolContext()

    if (this.currentTool === "brush" || this.currentTool === "spray") {
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
    } else if (this.currentTool === "text") {
      this.handleTextTool(x, y)
      return
    }

    console.log("🎨 Iniciando desenho em:", { x, y, tool: this.currentTool })
  }

  private setupToolContext() {
    // NÃO limpar o canvas aqui - apenas configurar o contexto
    this.ctx.globalAlpha = this.brushOpacity
    this.ctx.strokeStyle = this.brushColor
    this.ctx.fillStyle = this.brushColor
    this.ctx.lineWidth = this.brushSize
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"

    if (this.currentTool === "eraser") {
      this.ctx.globalCompositeOperation = "destination-out"
    } else {
      this.ctx.globalCompositeOperation = "source-over"
    }
  }

  private draw(x: number, y: number) {
    if (!this.isDrawing) return

    switch (this.currentTool) {
      case "brush":
        this.drawBrush(x, y)
        break
      case "eraser":
        this.drawEraser(x, y)
        break
      case "spray":
        this.drawSpray(x, y)
        break
      case "line":
      case "rectangle":
      case "circle":
        this.showShapePreview(x, y)
        break
    }

    this.lastX = x
    this.lastY = y

    if (!this.hasDrawing) {
      this.setHasDrawing(true)
    }
  }

  private drawBrush(x: number, y: number) {
    this.ctx.lineTo(x, y)
    this.ctx.stroke()
  }

  private drawEraser(x: number, y: number) {
    // Borracha funcional
    this.ctx.lineTo(x, y)
    this.ctx.stroke()
  }

  private drawSpray(x: number, y: number) {
    // Efeito spray com pontos aleatórios
    const density = 20
    const radius = this.brushSize

    for (let i = 0; i < density; i++) {
      const offsetX = (Math.random() - 0.5) * radius * 2
      const offsetY = (Math.random() - 0.5) * radius * 2
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)

      if (distance <= radius) {
        this.ctx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
    }
  }

  private showShapePreview(x: number, y: number) {
    // Limpar preview anterior
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height)

    // Configurar contexto de preview
    this.previewCtx.globalAlpha = this.brushOpacity
    this.previewCtx.strokeStyle = this.brushColor
    this.previewCtx.fillStyle = this.brushColor
    this.previewCtx.lineWidth = this.brushSize
    this.previewCtx.lineCap = "round"
    this.previewCtx.lineJoin = "round"

    // Desenhar preview da forma
    switch (this.currentTool) {
      case "line":
        this.previewCtx.beginPath()
        this.previewCtx.moveTo(this.startX, this.startY)
        this.previewCtx.lineTo(x, y)
        this.previewCtx.stroke()
        break

      case "rectangle":
        const width = x - this.startX
        const height = y - this.startY
        this.previewCtx.strokeRect(this.startX, this.startY, width, height)
        break

      case "circle":
        const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2))
        this.previewCtx.beginPath()
        this.previewCtx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI)
        this.previewCtx.stroke()
        break
    }
  }

  private handleTextTool(x: number, y: number) {
    const text = prompt("Digite o texto:")
    if (text) {
      this.ctx.font = `${this.brushSize * 4}px Arial`
      this.ctx.fillStyle = this.brushColor
      this.ctx.fillText(text, x, y)
      this.saveState()
      this.setHasDrawing(true)
    }
    this.isDrawing = false
  }

  private stopDrawing() {
    if (!this.isDrawing) return

    // Para ferramentas de forma, desenhar no canvas principal
    if (this.isShapeTool()) {
      this.drawFinalShape()
    }

    this.isDrawing = false
    this.ctx.beginPath()

    // Limpar preview
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height)

    // Salvar estado para histórico
    this.saveState()

    console.log("🎨 Desenho finalizado")
  }

  private drawFinalShape() {
    // Desenhar forma final no canvas principal
    switch (this.currentTool) {
      case "line":
        this.ctx.beginPath()
        this.ctx.moveTo(this.startX, this.startY)
        this.ctx.lineTo(this.lastX, this.lastY)
        this.ctx.stroke()
        break

      case "rectangle":
        const width = this.lastX - this.startX
        const height = this.lastY - this.startY
        this.ctx.strokeRect(this.startX, this.startY, width, height)
        break

      case "circle":
        const radius = Math.sqrt(Math.pow(this.lastX - this.startX, 2) + Math.pow(this.lastY - this.startY, 2))
        this.ctx.beginPath()
        this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI)
        this.ctx.stroke()
        break
    }
  }

  private setHasDrawing(hasDrawing: boolean) {
    this.hasDrawing = hasDrawing
    if (this.config.onDrawingChange) {
      this.config.onDrawingChange(hasDrawing)
    }
  }

  private saveState() {
    // Remover estados futuros se estivermos no meio do histórico
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    // Adicionar novo estado
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.history.push(imageData)

    // Limitar tamanho do histórico
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
  }

  private restoreState(imageData: ImageData) {
    this.ctx.putImageData(imageData, 0, 0)
  }

  // Métodos públicos
  public updateConfig(newConfig: Partial<SimplePaintBoardConfig>) {
    // Preservar o desenho atual durante atualizações
    const currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)

    this.config = { ...this.config, ...newConfig }

    if (newConfig.width || newConfig.height) {
      this.canvas.width = this.config.width
      this.canvas.height = this.config.height
      this.previewCanvas.width = this.config.width
      this.previewCanvas.height = this.config.height

      // Restaurar o desenho
      this.ctx.putImageData(currentImageData, 0, 0)
    }

    if (newConfig.disabled !== undefined) {
      this.setDisabled(newConfig.disabled)
    }
  }

  private setDisabled(disabled: boolean) {
    if (disabled) {
      this.canvas.style.pointerEvents = "none"
      this.canvas.style.opacity = "0.5"
    } else {
      this.canvas.style.pointerEvents = "auto"
      this.canvas.style.opacity = "1"
    }
  }

  public save(): string {
    const imageData = this.canvas.toDataURL("image/png")

    if (this.config.onSave) {
      this.config.onSave(imageData)
    }

    return imageData
  }

  public download(filename?: string, format: "png" | "jpg" | "svg" = "png") {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
    const name = filename || `desenho_${timestamp}.${format}`

    let dataUrl: string

    if (format === "svg") {
      // Converter para SVG
      dataUrl = this.exportAsSVG()
    } else if (format === "jpg") {
      dataUrl = this.canvas.toDataURL("image/jpeg", 0.9)
    } else {
      dataUrl = this.canvas.toDataURL("image/png")
    }

    // Criar link de download
    const link = document.createElement("a")
    link.download = name
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log(`📥 Download realizado: ${name}`)
  }

  private exportAsSVG(): string {
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${this.canvas.width}" height="${this.canvas.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <img src="${this.canvas.toDataURL()}" width="${this.canvas.width}" height="${this.canvas.height}"/>
          </div>
        </foreignObject>
      </svg>
    `
    return `data:image/svg+xml;base64,${btoa(svgData)}`
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height)
    this.previewCtx.clearRect(0, 0, this.config.width, this.config.height)
    this.setHasDrawing(false)
    this.saveState()

    if (this.config.onClear) {
      this.config.onClear()
    }
  }

  public dispose() {
    // Remover event listeners
    this.canvas.removeEventListener("mousedown", this.handleMouseDown)
    this.canvas.removeEventListener("mousemove", this.handleMouseMove)
    this.canvas.removeEventListener("mouseup", this.handleMouseUp)
    this.canvas.removeEventListener("mouseout", this.handleMouseUp)
    this.canvas.removeEventListener("touchstart", this.handleTouchStart)
    this.canvas.removeEventListener("touchmove", this.handleTouchMove)
    this.canvas.removeEventListener("touchend", this.handleTouchEnd)

    // Remover preview canvas
    if (this.previewCanvas && this.previewCanvas.parentElement) {
      this.previewCanvas.parentElement.removeChild(this.previewCanvas)
    }

    // Limpar managers
    this.zoomManager?.dispose()
  }

  // Métodos de controle
  public undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.restoreState(this.history[this.historyIndex])
      this.setHasDrawing(this.historyIndex > 0)
    }
  }

  public redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.restoreState(this.history[this.historyIndex])
      this.setHasDrawing(true)
    }
  }

  public setBrushMode() {
    this.currentTool = "brush"
    this.canvas.style.cursor = "crosshair"
  }

  public setEraserMode() {
    this.currentTool = "eraser"
    this.canvas.style.cursor = "grab"
  }

  public setTool(tool: string) {
    this.currentTool = tool

    // Definir cursor apropriado
    switch (tool) {
      case "brush":
      case "spray":
        this.canvas.style.cursor = "crosshair"
        break
      case "eraser":
        this.canvas.style.cursor = "grab"
        break
      case "text":
        this.canvas.style.cursor = "text"
        break
      case "line":
      case "rectangle":
      case "circle":
        this.canvas.style.cursor = "crosshair"
        break
      default:
        this.canvas.style.cursor = "default"
    }
  }

  public setBrushSize(size: number) {
    this.brushSize = Math.max(1, Math.min(100, size))
  }

  public setBrushColor(color: string) {
    // CORREÇÃO: Não limpar o canvas ao mudar cor
    this.brushColor = color
    console.log("🎨 Cor alterada para:", color)
  }

  public setBrushOpacity(opacity: number) {
    this.brushOpacity = Math.max(0, Math.min(1, opacity))
  }

  // Getters
  public getCurrentTool(): string {
    return this.currentTool
  }

  public getBrushSize(): number {
    return this.brushSize
  }

  public getBrushColor(): string {
    return this.brushColor
  }

  public getBrushOpacity(): number {
    return this.brushOpacity
  }

  public canUndo(): boolean {
    return this.historyIndex > 0
  }

  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  // Métodos de zoom
  public zoomIn() {
    this.zoomManager?.zoomIn()
  }

  public zoomOut() {
    this.zoomManager?.zoomOut()
  }

  public resetZoom() {
    this.zoomManager?.resetZoom()
  }

  public getZoom(): number {
    return this.zoomManager?.getZoom() || 1
  }

  public getZoomPercentage(): number {
    return this.zoomManager?.getZoomPercentage() || 100
  }

  public setZoomEnabled(enabled: boolean) {
    this.zoomManager?.setEnabled(enabled)
  }
}
