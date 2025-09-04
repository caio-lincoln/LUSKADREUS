import { PerformanceManager } from "./performance"
import { ZoomManager } from "./zoom"
import { AccessibilityManager } from "./accessibility"
import { ExportManager } from "./export"
import { LayerManager } from "./layers"
import { CollaborationManager } from "./collaboration"

export interface PaintBoardConfig {
  width: number
  height: number
  onSave?: (imageData: string) => void
  onClear?: () => void
  onDrawingChange?: (hasDrawing: boolean) => void
  disabled?: boolean
  enableCollaboration?: boolean
  roomId?: string
  userId?: string
  websocketUrl?: string
}

export class PaintBoard {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: PaintBoardConfig
  private isDrawing = false
  private hasDrawing = false
  private lastX = 0
  private lastY = 0
  private currentPath: { x: number; y: number }[] = []

  // Configurações de desenho
  private brushSize = 5
  private brushColor = "#000000"
  private brushOpacity = 1
  private currentTool = "brush"

  // Histórico para undo/redo
  private history: ImageData[] = []
  private historyIndex = -1
  private maxHistorySize = 50

  // Managers
  private performance: PerformanceManager
  private zoomManager: ZoomManager
  private accessibilityManager: AccessibilityManager
  private exportManager: ExportManager
  private layerManager: LayerManager
  private collaborationManager?: CollaborationManager

  constructor(canvas: HTMLCanvasElement, config: PaintBoardConfig) {
    this.canvas = canvas
    this.config = config

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Não foi possível obter o contexto 2D do canvas")
    }
    this.ctx = ctx

    // Inicializar managers
    this.performance = PerformanceManager.getInstance()
    this.zoomManager = new ZoomManager(canvas, {
      minZoom: 0.1,
      maxZoom: 10,
      zoomStep: 0.1,
      smoothZoom: true,
    })
    this.accessibilityManager = new AccessibilityManager(canvas)
    this.exportManager = new ExportManager(canvas)
    this.layerManager = new LayerManager(canvas)

    this.init()
  }

  private async init() {
    // Configurar dimensões
    this.canvas.width = this.config.width
    this.canvas.height = this.config.height

    // Configurações iniciais do contexto
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"
    this.ctx.globalCompositeOperation = "source-over"

    // Configurar eventos
    this.setupEvents()

    // Configurar colaboração se habilitada
    if (this.config.enableCollaboration && this.config.roomId && this.config.userId && this.config.websocketUrl) {
      this.collaborationManager = new CollaborationManager(this.canvas, this.config.roomId, this.config.userId)
      try {
        await this.collaborationManager.connect(this.config.websocketUrl)
      } catch (error) {
        console.warn("Falha ao conectar colaboração:", error)
      }
    }

    // Salvar estado inicial
    this.saveState()

    // Configurar atalhos de acessibilidade
    this.setupAccessibilityShortcuts()

    console.log("PaintBoard inicializado com sucesso", {
      width: this.config.width,
      height: this.config.height,
      collaboration: !!this.collaborationManager,
    })
  }

  private setupEvents() {
    // Eventos de mouse com throttling
    const throttledMouseMove = this.performance.throttle(this.handleMouseMove.bind(this), 16) // 60fps

    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this))
    this.canvas.addEventListener("mousemove", throttledMouseMove)
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this))
    this.canvas.addEventListener("mouseout", this.handleMouseUp.bind(this))

    // Eventos de touch para dispositivos móveis
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false })
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false })
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this))

    // Eventos de zoom
    this.canvas.addEventListener("zoomchange", this.handleZoomChange.bind(this))

    // Prevenir comportamentos padrão
    this.canvas.addEventListener("touchstart", (e) => e.preventDefault())
    this.canvas.addEventListener("touchmove", (e) => e.preventDefault())
  }

  private setupAccessibilityShortcuts() {
    // Registrar atalhos específicos do canvas
    this.accessibilityManager.registerShortcut("ctrl+z", () => {
      this.undo()
      this.accessibilityManager.announce("Ação desfeita")
    })

    this.accessibilityManager.registerShortcut("ctrl+y", () => {
      this.redo()
      this.accessibilityManager.announce("Ação refeita")
    })

    this.accessibilityManager.registerShortcut("ctrl+shift+z", () => {
      this.redo()
      this.accessibilityManager.announce("Ação refeita")
    })

    this.accessibilityManager.registerShortcut("ctrl+s", () => {
      this.save()
      this.accessibilityManager.announce("Desenho salvo")
    })

    this.accessibilityManager.registerShortcut("delete", () => {
      this.clear()
      this.accessibilityManager.announce("Canvas limpo")
    })

    // Atalhos de ferramentas
    this.accessibilityManager.registerShortcut("b", () => {
      this.setBrushMode()
      this.accessibilityManager.announceToolChange("Pincel")
    })

    this.accessibilityManager.registerShortcut("e", () => {
      this.setEraserMode()
      this.accessibilityManager.announceToolChange("Borracha")
    })

    // Atalhos de zoom
    this.accessibilityManager.registerShortcut("ctrl+=", () => {
      this.zoomManager.zoomIn()
    })

    this.accessibilityManager.registerShortcut("ctrl+-", () => {
      this.zoomManager.zoomOut()
    })

    this.accessibilityManager.registerShortcut("ctrl+0", () => {
      this.zoomManager.resetZoom()
    })
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  private getTouchPos(e: TouchEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const touch = e.touches[0]
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.config.disabled) return

    // Verificar se é para pan (botão do meio ou Ctrl+clique)
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      return // Deixar o ZoomManager lidar com isso
    }

    const pos = this.getMousePos(e)
    this.startDrawing(pos.x, pos.y)
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.config.disabled || !this.isDrawing) return

    const pos = this.getMousePos(e)
    this.draw(pos.x, pos.y)
  }

  private handleMouseUp() {
    this.stopDrawing()
  }

  private handleTouchStart(e: TouchEvent) {
    if (this.config.disabled || e.touches.length > 1) return

    const pos = this.getTouchPos(e)
    this.startDrawing(pos.x, pos.y)
  }

  private handleTouchMove(e: TouchEvent) {
    if (this.config.disabled || !this.isDrawing || e.touches.length > 1) return

    const pos = this.getTouchPos(e)
    this.draw(pos.x, pos.y)
  }

  private handleTouchEnd() {
    this.stopDrawing()
  }

  private handleZoomChange(e: CustomEvent) {
    const { zoom } = e.detail
    this.accessibilityManager.announceZoomChange(zoom)
  }

  private startDrawing(x: number, y: number) {
    this.isDrawing = true
    this.lastX = x
    this.lastY = y
    this.currentPath = [{ x, y }]

    // Configurar contexto principal
    this.ctx.globalAlpha = this.brushOpacity
    this.ctx.strokeStyle = this.brushColor
    this.ctx.lineWidth = this.brushSize
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"

    if (this.currentTool === "eraser") {
      this.ctx.globalCompositeOperation = "destination-out"
    } else {
      this.ctx.globalCompositeOperation = "source-over"
    }

    // Começar novo path no contexto principal
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)

    // Também configurar camada ativa se existir
    const activeLayer = this.layerManager.getActiveLayer()
    if (activeLayer && !activeLayer.locked) {
      const layerCtx = activeLayer.ctx
      layerCtx.globalAlpha = this.brushOpacity
      layerCtx.strokeStyle = this.brushColor
      layerCtx.lineWidth = this.brushSize
      layerCtx.lineCap = "round"
      layerCtx.lineJoin = "round"

      if (this.currentTool === "eraser") {
        layerCtx.globalCompositeOperation = "destination-out"
      } else {
        layerCtx.globalCompositeOperation = "source-over"
      }

      layerCtx.beginPath()
      layerCtx.moveTo(x, y)
    }

    this.accessibilityManager.announceDrawingAction("Iniciando desenho")
  }

  private draw(x: number, y: number) {
    if (!this.isDrawing) return

    // Usar o contexto principal para desenho direto
    this.ctx.lineTo(x, y)
    this.ctx.stroke()

    // Também atualizar a camada ativa se existir
    const activeLayer = this.layerManager.getActiveLayer()
    if (activeLayer && !activeLayer.locked) {
      activeLayer.ctx.lineTo(x, y)
      activeLayer.ctx.stroke()
    }

    this.currentPath.push({ x, y })
    this.lastX = x
    this.lastY = y

    if (!this.hasDrawing) {
      this.setHasDrawing(true)
    }
  }

  private stopDrawing() {
    if (!this.isDrawing) return

    this.isDrawing = false

    // Finalizar path no contexto principal
    this.ctx.beginPath()

    // Finalizar path na camada ativa
    const activeLayer = this.layerManager.getActiveLayer()
    if (activeLayer) {
      activeLayer.ctx.beginPath()
    }

    // Enviar evento de colaboração
    if (this.collaborationManager && this.currentPath.length > 0) {
      if (this.currentTool === "eraser") {
        this.collaborationManager.sendEraseEvent(this.currentPath, this.brushSize)
      } else {
        this.collaborationManager.sendDrawEvent(this.currentPath, this.currentTool, this.brushColor, this.brushSize)
      }
    }

    // Salvar estado para histórico
    this.saveState()
    this.currentPath = []

    this.accessibilityManager.announceDrawingAction("Desenho finalizado")
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

  // Métodos públicos aprimorados

  public updateConfig(newConfig: Partial<PaintBoardConfig>) {
    this.config = { ...this.config, ...newConfig }

    if (newConfig.width || newConfig.height) {
      this.canvas.width = this.config.width
      this.canvas.height = this.config.height
      this.layerManager.resizeLayers(this.config.width, this.config.height)
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

  public async save(format: "png" | "jpg" | "svg" | "json" | "pdf" = "png"): Promise<string> {
    const exportData = await this.exportManager.exportCanvas(
      {
        format,
        width: this.canvas.width,
        height: this.canvas.height,
        quality: 0.9,
        backgroundColor: "#ffffff",
        includeMetadata: true,
      },
      {
        version: "1.0",
        timestamp: Date.now(),
        title: "Desenho ArtSketch",
        description: "Desenho criado na plataforma ArtSketch",
      },
    )

    if (this.config.onSave) {
      this.config.onSave(typeof exportData === "string" ? exportData : "")
    }

    return typeof exportData === "string" ? exportData : ""
  }

  public download(filename?: string, format: "png" | "jpg" | "svg" | "json" | "pdf" = "png") {
    this.save(format).then((data) => {
      const name = filename || `desenho_${Date.now()}.${format}`
      this.exportManager.downloadFile(data, name)
    })
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height)
    this.layerManager.getAllLayers().forEach((layer) => {
      layer.ctx.clearRect(0, 0, this.config.width, this.config.height)
    })

    this.setHasDrawing(false)
    this.saveState()

    if (this.collaborationManager) {
      this.collaborationManager.sendClearEvent()
    }

    if (this.config.onClear) {
      this.config.onClear()
    }
  }

  public dispose() {
    // Limpar event listeners
    this.canvas.removeEventListener("mousedown", this.handleMouseDown)
    this.canvas.removeEventListener("mousemove", this.handleMouseMove)
    this.canvas.removeEventListener("mouseup", this.handleMouseUp)
    this.canvas.removeEventListener("mouseout", this.handleMouseUp)
    this.canvas.removeEventListener("touchstart", this.handleTouchStart)
    this.canvas.removeEventListener("touchmove", this.handleTouchMove)
    this.canvas.removeEventListener("touchend", this.handleTouchEnd)

    // Limpar managers
    this.accessibilityManager.dispose()
    if (this.collaborationManager) {
      this.collaborationManager.disconnect()
    }
  }

  // Métodos de controle aprimorados

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

  public setBrushSize(size: number) {
    this.brushSize = Math.max(1, Math.min(100, size))
  }

  public setBrushColor(color: string) {
    this.brushColor = color
  }

  public setBrushOpacity(opacity: number) {
    this.brushOpacity = Math.max(0, Math.min(1, opacity))
  }

  // Getters aprimorados

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

  public getZoom(): number {
    return this.zoomManager.getZoom()
  }

  public getLayerManager(): LayerManager {
    return this.layerManager
  }

  public getCollaborationManager(): CollaborationManager | undefined {
    return this.collaborationManager
  }

  // Métodos de zoom públicos

  public zoomIn() {
    this.zoomManager.zoomIn()
  }

  public zoomOut() {
    this.zoomManager.zoomOut()
  }

  public resetZoom() {
    this.zoomManager.resetZoom()
  }

  public zoomToFit() {
    this.zoomManager.fitToCanvas()
  }

  // Métodos de importação

  public async importImage(file: File): Promise<void> {
    await this.exportManager.importFromImage(file)
    this.saveState()
    this.setHasDrawing(true)
  }

  public async importJSON(jsonData: string): Promise<void> {
    await this.exportManager.importFromJSON(jsonData)
    this.saveState()
    this.setHasDrawing(true)
  }
}
