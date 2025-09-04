/**
 * Canvas Nativo com Tamanho Específico 1806 x 725
 * Foco em precisão, estabilidade e tamanho exato
 */

export interface Point {
  x: number
  y: number
  pressure?: number
}

export interface DrawingPath {
  id: string
  points: Point[]
  color: string
  width: number
  tool: string
  opacity: number
  timestamp: number
}

export interface CanvasConfig {
  backgroundColor?: string
  onSave?: (imageData: string) => void
  onClear?: () => void
  onDrawingChange?: (hasDrawing: boolean) => void
  disabled?: boolean
  enableZoom?: boolean
  enableRetinaScaling?: boolean
}

export class NativeCanvasBoard {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: CanvasConfig

  // Estado do desenho
  private isDrawing = false
  private hasDrawing = false
  private currentPath: Point[] = []
  private paths: DrawingPath[] = []

  // Configurações de desenho
  private brushSize = 5
  private brushColor = "#000000"
  private brushOpacity = 1
  private currentTool = "brush"

  // Sistema de zoom e viewport simplificado
  private zoom = 1
  private viewportX = 0
  private viewportY = 0
  private minZoom = 0.1
  private maxZoom = 10

  // Histórico simplificado
  private history: string[] = []
  private historyIndex = -1
  private readonly MAX_HISTORY_SIZE = 20

  // Cache de dimensões
  private canvasRect: DOMRect | null = null
  private devicePixelRatio: number

  // Último ponto para desenho suave
  private lastPoint: Point | null = null

  // Timer para cronômetro
  private startTime: number = Date.now()
  private timerInterval: NodeJS.Timeout | null = null

  // Dimensões específicas do quadro: 1806 x 725
  private readonly CANVAS_WIDTH = 1806
  private readonly CANVAS_HEIGHT = 725
  private displayWidth = 0
  private displayHeight = 0
  private scale = 1

  constructor(canvasElement: HTMLCanvasElement, config: CanvasConfig) {
    this.canvas = canvasElement
    this.config = { enableRetinaScaling: true, ...config }
    this.devicePixelRatio = window.devicePixelRatio || 1

    const ctx = this.canvas.getContext("2d", {
      alpha: true,
      desynchronized: false,
      willReadFrequently: false,
    })

    if (!ctx) {
      throw new Error("Não foi possível obter contexto 2D do canvas")
    }

    this.ctx = ctx
    this.init()
  }

  private setupCanvas() {
    const container = this.canvas.parentElement
    if (!container) return

    // Obter dimensões do container
    const containerRect = container.getBoundingClientRect()
    const containerWidth = Math.max(320, containerRect.width - 40) // Margem de 20px de cada lado
    const containerHeight = Math.max(240, containerRect.height - 40)

    // Calcular escala para manter proporção 1806:725
    const scaleX = containerWidth / this.CANVAS_WIDTH
    const scaleY = containerHeight / this.CANVAS_HEIGHT
    this.scale = Math.min(scaleX, scaleY, 1) // Máximo 100% para não distorcer

    // Calcular dimensões de exibição
    this.displayWidth = this.CANVAS_WIDTH * this.scale
    this.displayHeight = this.CANVAS_HEIGHT * this.scale

    // Configurar canvas com resolução específica
    this.canvas.width = this.CANVAS_WIDTH * this.devicePixelRatio
    this.canvas.height = this.CANVAS_HEIGHT * this.devicePixelRatio

    // Definir tamanho CSS para exibição
    this.canvas.style.width = this.displayWidth + "px"
    this.canvas.style.height = this.displayHeight + "px"

    // Centralizar o canvas no container
    const marginLeft = (containerWidth - this.displayWidth) / 2
    const marginTop = (containerHeight - this.displayHeight) / 2
    this.canvas.style.marginLeft = marginLeft + "px"
    this.canvas.style.marginTop = marginTop + "px"
    this.canvas.style.position = "relative"

    // Escalar contexto para compensar devicePixelRatio
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio)

    // Configurações de qualidade
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = "high"

    // Configurações de estilo para precisão
    this.canvas.style.display = "block"
    this.canvas.style.touchAction = "none"
    this.canvas.style.userSelect = "none"
    this.canvas.style.webkitUserSelect = "none"
    this.canvas.style.msUserSelect = "none"
    this.canvas.style.border = "1px solid #e2e8f0"
    this.canvas.style.borderRadius = "8px"
    this.canvas.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"

    this.updateCanvasRect()

    console.log(`🎯 Canvas configurado com tamanho específico:`, {
      canvasSize: { width: this.CANVAS_WIDTH, height: this.CANVAS_HEIGHT },
      displaySize: { width: this.displayWidth, height: this.displayHeight },
      scale: Math.round(this.scale * 100) + "%",
      devicePixelRatio: this.devicePixelRatio,
    })
  }

  private updateCanvasRect() {
    this.canvasRect = this.canvas.getBoundingClientRect()
  }

  private setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this))
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this))
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this))
    this.canvas.addEventListener("mouseleave", this.handleMouseUp.bind(this))

    // Touch events
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false })
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false })
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this))

    // Zoom
    this.canvas.addEventListener("wheel", this.handleWheel.bind(this), { passive: false })

    // Custom event for optimal view reset
    this.canvas.addEventListener("resetOptimalView", () => {
      this.resetToOptimalView()
    })

    // Resize
    window.addEventListener("resize", this.handleResize.bind(this))

    // Prevent context menu
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault())
  }

  private getEventPoint(e: MouseEvent | TouchEvent): Point {
    // Sempre atualizar o rect para máxima precisão
    this.updateCanvasRect()

    let clientX: number, clientY: number

    if (e instanceof MouseEvent) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      const touch = e.touches[0] || e.changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    }

    const rect = this.canvasRect!

    // Calcular coordenadas relativas ao canvas (0 a displayWidth/Height)
    const relativeX = clientX - rect.left
    const relativeY = clientY - rect.top

    // Converter para coordenadas do canvas real (1806x725)
    const canvasX = (relativeX / this.displayWidth) * this.CANVAS_WIDTH
    const canvasY = (relativeY / this.displayHeight) * this.CANVAS_HEIGHT

    // Aplicar transformações de zoom e viewport
    const worldX = canvasX / this.zoom + this.viewportX
    const worldY = canvasY / this.zoom + this.viewportY

    console.log(
      `📍 Cursor: (${Math.round(relativeX)}, ${Math.round(relativeY)}) → Canvas: (${Math.round(canvasX)}, ${Math.round(canvasY)}) → Mundo: (${Math.round(worldX)}, ${Math.round(worldY)}) | Zoom: ${Math.round(this.zoom * 100)}%`,
    )

    return { x: worldX, y: worldY }
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.config.disabled) return
    e.preventDefault()

    const point = this.getEventPoint(e)
    this.startDrawing(point)
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.config.disabled) return
    e.preventDefault()

    if (this.isDrawing) {
      const point = this.getEventPoint(e)
      this.continueDrawing(point)
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (this.config.disabled) return
    e.preventDefault()
    this.stopDrawing()
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault()
    if (this.config.disabled) return

    const point = this.getEventPoint(e)
    this.startDrawing(point)
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (this.config.disabled || !this.isDrawing) return

    const point = this.getEventPoint(e)
    this.continueDrawing(point)
  }

  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault()
    if (this.config.disabled) return
    this.stopDrawing()
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault()

    // Atualizar rect para máxima precisão
    this.updateCanvasRect()

    const rect = this.canvasRect!

    // Calcular posição do mouse relativa ao canvas
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Converter para coordenadas do canvas
    const canvasMouseX = (mouseX / this.displayWidth) * this.CANVAS_WIDTH
    const canvasMouseY = (mouseY / this.displayHeight) * this.CANVAS_HEIGHT

    // Calcular posição no mundo antes do zoom
    const worldX = canvasMouseX / this.zoom + this.viewportX
    const worldY = canvasMouseY / this.zoom + this.viewportY

    // Calcular novo zoom
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor))

    if (newZoom === this.zoom) return

    // Aplicar novo zoom
    this.zoom = newZoom

    // Ajustar viewport para manter o ponto do mouse fixo
    this.viewportX = worldX - canvasMouseX / this.zoom
    this.viewportY = worldY - canvasMouseY / this.zoom

    // Constrair viewport
    this.constrainViewport()

    // Redesenhar
    this.redraw()

    console.log(
      `🔍 Zoom: ${Math.round(this.zoom * 100)}% | Mouse: (${Math.round(canvasMouseX)}, ${Math.round(canvasMouseY)}) | Viewport: (${Math.round(this.viewportX)}, ${Math.round(this.viewportY)})`,
    )
  }

  private handleResize() {
    // Salvar estado atual
    let imageData: string | null = null
    if (this.hasDrawing) {
      imageData = this.canvas.toDataURL()
    }

    const currentZoom = this.zoom
    const currentViewportX = this.viewportX
    const currentViewportY = this.viewportY

    // Reconfigurar canvas
    this.setupCanvas()

    // Restaurar desenho se existir
    if (imageData) {
      const img = new Image()
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
        this.ctx.drawImage(img, 0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
        this.zoom = currentZoom
        this.viewportX = currentViewportX
        this.viewportY = currentViewportY
        this.redraw()
      }
      img.src = imageData
    } else {
      this.zoom = currentZoom
      this.viewportX = currentViewportX
      this.viewportY = currentViewportY
      this.redraw()
    }
  }

  // Melhorar a funcionalidade da borracha
  private startDrawing(point: Point) {
    this.isDrawing = true
    this.currentPath = [point]
    this.lastPoint = point

    // Configurar contexto para desenho
    this.ctx.save()
    this.ctx.globalAlpha = this.brushOpacity
    this.ctx.lineWidth = this.brushSize
    this.ctx.strokeStyle = this.brushColor
    this.ctx.fillStyle = this.brushColor

    // Configuração corrigida para a borracha
    if (this.currentTool === "eraser") {
      this.ctx.globalCompositeOperation = "destination-out"
      // Aumentar levemente o tamanho da borracha para melhor experiência
      this.ctx.lineWidth = this.brushSize * 1.2
    } else {
      this.ctx.globalCompositeOperation = "source-over"
    }

    // Aplicar transformações de zoom e viewport
    this.ctx.save()
    this.ctx.scale(this.zoom, this.zoom)
    this.ctx.translate(-this.viewportX, -this.viewportY)

    // Desenhar ponto inicial
    this.ctx.beginPath()
    this.ctx.arc(point.x, point.y, this.brushSize / 2, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.restore()

    console.log(`🎨 Iniciando desenho em: (${Math.round(point.x)}, ${Math.round(point.y)})`)
  }

  // Corrigir a função continueDrawing para a borracha
  private continueDrawing(point: Point) {
    if (!this.isDrawing || !this.lastPoint) return

    // Calcular distância para suavização
    const distance = Math.sqrt(Math.pow(point.x - this.lastPoint.x, 2) + Math.pow(point.y - this.lastPoint.y, 2))

    // Desenhar sempre para máxima responsividade
    if (distance < 0.5) return

    this.currentPath.push(point)

    // Aplicar transformações de zoom e viewport
    this.ctx.save()
    this.ctx.scale(this.zoom, this.zoom)
    this.ctx.translate(-this.viewportX, -this.viewportY)

    // Desenhar linha suave
    this.ctx.beginPath()
    this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y)
    this.ctx.lineTo(point.x, point.y)
    this.ctx.stroke()

    // Adicionar um ponto no final para garantir cobertura completa
    if (this.currentTool === "eraser") {
      this.ctx.beginPath()
      this.ctx.arc(point.x, point.y, this.brushSize * 0.6, 0, Math.PI * 2)
      this.ctx.fill()
    }

    this.ctx.restore()

    this.lastPoint = point
  }

  private stopDrawing() {
    if (!this.isDrawing) return

    this.isDrawing = false
    this.ctx.restore()

    if (this.currentPath.length > 0) {
      // Salvar caminho
      const path: DrawingPath = {
        id: this.generateId(),
        points: [...this.currentPath],
        color: this.brushColor,
        width: this.brushSize,
        tool: this.currentTool,
        opacity: this.brushOpacity,
        timestamp: Date.now(),
      }

      this.paths.push(path)
      this.setHasDrawing(true)
      this.saveToHistory()
    }

    this.currentPath = []
    this.lastPoint = null

    console.log(`✅ Desenho finalizado. Total de caminhos: ${this.paths.length}`)
  }

  private redraw() {
    // Limpar canvas
    this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

    // Aplicar fundo
    this.ctx.fillStyle = this.config.backgroundColor || "#ffffff"
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)

    // Aplicar transformações de zoom e viewport
    this.ctx.save()
    this.ctx.scale(this.zoom, this.zoom)
    this.ctx.translate(-this.viewportX, -this.viewportY)

    // Redesenhar todos os caminhos
    this.paths.forEach((path) => {
      this.drawPath(path)
    })

    this.ctx.restore()
  }

  private drawPath(path: DrawingPath) {
    if (path.points.length === 0) return

    this.ctx.save()
    this.ctx.globalAlpha = path.opacity
    this.ctx.lineWidth = path.width
    this.ctx.strokeStyle = path.color
    this.ctx.fillStyle = path.color
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"

    if (path.tool === "eraser") {
      this.ctx.globalCompositeOperation = "destination-out"
    } else {
      this.ctx.globalCompositeOperation = "source-over"
    }

    // Desenhar primeiro ponto
    const firstPoint = path.points[0]
    this.ctx.beginPath()
    this.ctx.arc(firstPoint.x, firstPoint.y, path.width / 2, 0, Math.PI * 2)
    this.ctx.fill()

    // Desenhar linhas se houver mais pontos
    if (path.points.length > 1) {
      this.ctx.beginPath()
      this.ctx.moveTo(firstPoint.x, firstPoint.y)

      for (let i = 1; i < path.points.length; i++) {
        const point = path.points[i]
        this.ctx.lineTo(point.x, point.y)
      }

      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  private setBackground(color: string) {
    this.ctx.save()
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
    this.ctx.restore()
  }

  private setHasDrawing(hasDrawing: boolean) {
    this.hasDrawing = hasDrawing
    if (this.config.onDrawingChange) {
      this.config.onDrawingChange(hasDrawing)
    }
  }

  private saveToHistory() {
    // Remover histórico futuro se estamos no meio
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    // Salvar estado atual
    const imageData = this.canvas.toDataURL()
    this.history.push(imageData)

    // Limitar tamanho do histórico
    if (this.history.length > this.MAX_HISTORY_SIZE) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
  }

  private restoreFromHistory(index: number) {
    if (index < 0 || index >= this.history.length) return

    const imageData = this.history[index]
    const img = new Image()

    img.onload = () => {
      this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
      this.ctx.drawImage(img, 0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
    }

    img.src = imageData
    this.historyIndex = index
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private startTimer() {
    this.startTime = Date.now()
    this.timerInterval = setInterval(() => {
      // O timer será renderizado pelo componente React
    }, 1000)
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  private constrainViewport() {
    // Calcular limites do viewport baseado no zoom atual
    const viewportWidth = this.CANVAS_WIDTH / this.zoom
    const viewportHeight = this.CANVAS_HEIGHT / this.zoom

    // Permitir margem para navegação
    const margin = Math.min(viewportWidth, viewportHeight) * 0.2

    // Limites com margem
    const minX = -margin
    const minY = -margin
    const maxX = this.CANVAS_WIDTH + margin - viewportWidth
    const maxY = this.CANVAS_HEIGHT + margin - viewportHeight

    // Aplicar limites
    this.viewportX = Math.max(minX, Math.min(maxX, this.viewportX))
    this.viewportY = Math.max(minY, Math.min(maxY, this.viewportY))
  }

  private setupResponsiveListeners() {
    const handleOrientationChange = () => {
      setTimeout(() => {
        this.handleResize()
      }, 100)
    }

    const handleViewportChange = () => {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = setTimeout(() => {
        this.handleResize()
      }, 150)
    }

    window.addEventListener("orientationchange", handleOrientationChange)
    window.addEventListener("resize", handleViewportChange)

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        setTimeout(() => {
          this.handleResize()
        }, 200)
      }
    })
  }

  private resizeTimeout: NodeJS.Timeout | null = null

  private init() {
    this.setupCanvas()
    this.setupEventListeners()
    this.setupResponsiveListeners()
    this.setBackground(this.config.backgroundColor || "#ffffff")
    this.saveToHistory()
    this.startTimer()

    // Aplicar auto-fit após inicialização
    setTimeout(() => {
      this.autoFitCanvas()
    }, 100) // Pequeno delay para garantir que o canvas esteja totalmente renderizado

    console.log("✅ Canvas Nativo com Tamanho Específico 1806x725 inicializado")
  }

  private autoFitCanvas() {
    // Para canvas com tamanho específico, centralizar e ajustar zoom inicial
    this.zoom = 1
    this.viewportX = 0
    this.viewportY = 0
    this.redraw()

    console.log(
      `🎯 Canvas 1806x725 configurado: Escala ${Math.round(this.scale * 100)}% | Exibição: ${Math.round(this.displayWidth)}x${Math.round(this.displayHeight)}`,
    )
  }

  // API Pública

  public updateConfig(newConfig: Partial<CanvasConfig>) {
    this.config = { ...this.config, ...newConfig }
    if (newConfig.backgroundColor) {
      this.setBackground(newConfig.backgroundColor)
    }
  }

  public setBrushSize(size: number) {
    this.brushSize = Math.max(1, Math.min(100, size))
  }

  // Corrigir a função setBrushColor para garantir que a cor seja aplicada corretamente
  public setBrushColor(color: string) {
    this.brushColor = color
    // Garantir que estamos no modo pincel quando a cor é alterada
    if (this.currentTool === "eraser") {
      this.currentTool = "brush"
    }
    console.log("🎨 Cor do pincel alterada para:", color)
  }

  public setBrushOpacity(opacity: number) {
    this.brushOpacity = Math.max(0, Math.min(1, opacity))
  }

  public setTool(tool: string) {
    this.currentTool = tool
    console.log("🔧 Ferramenta alterada para:", tool)
  }

  public zoomIn() {
    const centerX = this.CANVAS_WIDTH / 2
    const centerY = this.CANVAS_HEIGHT / 2
    this.zoomToPoint(centerX, centerY, this.zoom * 1.25)
  }

  public zoomOut() {
    const centerX = this.CANVAS_WIDTH / 2
    const centerY = this.CANVAS_HEIGHT / 2
    this.zoomToPoint(centerX, centerY, this.zoom * 0.8)
  }

  public resetZoom() {
    this.zoom = 1
    this.viewportX = 0
    this.viewportY = 0
    this.redraw()
  }

  public getZoom(): number {
    return this.zoom
  }

  public getZoomPercentage(): number {
    return Math.round(this.zoom * 100)
  }

  public undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.restoreFromHistory(this.historyIndex)
      this.setHasDrawing(this.historyIndex > 0)
    }
  }

  public redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.restoreFromHistory(this.historyIndex)
      this.setHasDrawing(true)
    }
  }

  public canUndo(): boolean {
    return this.historyIndex > 0
  }

  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
    this.setBackground(this.config.backgroundColor || "#ffffff")
    this.paths = []
    this.setHasDrawing(false)
    this.saveToHistory()

    if (this.config.onClear) {
      this.config.onClear()
    }
  }

  public save(): string {
    const imageData = this.canvas.toDataURL("image/png", 1.0)

    if (this.config.onSave) {
      this.config.onSave(imageData)
    }

    return imageData
  }

  public hasContent(): boolean {
    return this.hasDrawing
  }

  public getElapsedTime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  public resetTimer() {
    this.startTime = Date.now()
  }

  public dispose() {
    this.stopTimer()

    window.removeEventListener("resize", this.handleResize.bind(this))
    window.removeEventListener("orientationchange", this.handleResize.bind(this))
    document.removeEventListener("visibilitychange", this.handleResize.bind(this))

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
    }

    this.history = []
    this.paths = []
    this.currentPath = []

    console.log("🧹 Canvas Nativo 1806x725 disposed")
  }

  // Métodos de compatibilidade
  public exportCanvas(): string {
    return this.save()
  }
  public getSelectedObjects(): any[] {
    return []
  }
  public getObjectCount(): number {
    return this.paths.length
  }
  public getCurrentTool(): string {
    return this.currentTool
  }
  public getBrushSize(): number {
    return this.brushSize
  }
  public getBrushColor(): string {
    return this.brushColor
  }
  public getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  public getCanvasInfo() {
    return {
      canvasSize: {
        width: this.CANVAS_WIDTH,
        height: this.CANVAS_HEIGHT,
      },
      displaySize: {
        width: this.displayWidth,
        height: this.displayHeight,
      },
      scale: this.scale,
      zoom: this.zoom,
      hasDrawing: this.hasDrawing,
      pathCount: this.paths.length,
      elapsedTime: this.getElapsedTime(),
      deviceType: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
    }
  }

  public zoomToPoint(canvasX: number, canvasY: number, newZoom: number) {
    // Calcular posição no mundo
    const worldX = canvasX / this.zoom + this.viewportX
    const worldY = canvasY / this.zoom + this.viewportY

    // Aplicar novo zoom
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom))

    // Ajustar viewport para manter o ponto fixo
    this.viewportX = worldX - canvasX / this.zoom
    this.viewportY = worldY - canvasY / this.zoom

    // Constrair viewport
    this.constrainViewport()

    // Redesenhar
    this.redraw()
  }

  public zoomToFit() {
    if (this.paths.length === 0) {
      // Se não há desenhos, usar auto-fit padrão
      this.autoFitCanvas()
      return
    }

    // Calcular bounding box de todos os caminhos
    let minX = Number.POSITIVE_INFINITY,
      minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY,
      maxY = Number.NEGATIVE_INFINITY

    this.paths.forEach((path) => {
      path.points.forEach((point) => {
        minX = Math.min(minX, point.x)
        minY = Math.min(minY, point.y)
        maxX = Math.max(maxX, point.x)
        maxY = Math.max(maxY, point.y)
      })
    })

    // Adicionar margem proporcional
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const margin = Math.max(50, Math.min(contentWidth, contentHeight) * 0.1)

    minX -= margin
    minY -= margin
    maxX += margin
    maxY += margin

    const finalContentWidth = maxX - minX
    const finalContentHeight = maxY - minY

    // Calcular zoom para caber na tela com margem
    const zoomX = (this.CANVAS_WIDTH * 0.9) / finalContentWidth
    const zoomY = (this.CANVAS_HEIGHT * 0.9) / finalContentHeight
    const newZoom = Math.min(zoomX, zoomY, this.maxZoom)

    // Centralizar conteúdo
    this.zoom = Math.max(0.1, newZoom)
    this.viewportX = minX - (this.CANVAS_WIDTH / this.zoom - finalContentWidth) / 2
    this.viewportY = minY - (this.CANVAS_HEIGHT / this.zoom - finalContentHeight) / 2

    this.constrainViewport()
    this.redraw()

    console.log(
      `📐 Zoom to fit: ${Math.round(this.zoom * 100)}% | Conteúdo: ${Math.round(finalContentWidth)}x${Math.round(finalContentHeight)}`,
    )
  }

  public optimizeForDevice() {
    const isMobile = window.innerWidth <= 768
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024
    const isLowEnd = navigator.hardwareConcurrency <= 4
    const hasLimitedMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4

    if (isMobile || isLowEnd || hasLimitedMemory) {
      this.MAX_HISTORY_SIZE = 10
      console.log("📱 Otimizado para dispositivo móvel/limitado")
    } else if (isTablet) {
      this.MAX_HISTORY_SIZE = 15
      console.log("📱 Otimizado para tablet")
    } else {
      this.MAX_HISTORY_SIZE = 20
      console.log("🖥️ Otimizado para desktop")
    }

    this.setupCanvas()
  }

  public resetToOptimalView() {
    this.autoFitCanvas()
  }

  public getCanvasScale(): number {
    return this.scale
  }

  public getCanvasDimensions() {
    return {
      width: this.CANVAS_WIDTH,
      height: this.CANVAS_HEIGHT,
      displayWidth: this.displayWidth,
      displayHeight: this.displayHeight,
      scale: this.scale,
    }
  }
}
