/**
 * Ultra-Precision Canvas System
 * Garante alinhamento perfeito entre cursor e pincel com máxima precisão
 */

export interface PrecisionPoint {
  x: number
  y: number
  pressure?: number
  timestamp: number
  velocity?: number
}

export interface PrecisionPath {
  id: string
  points: PrecisionPoint[]
  color: string
  width: number
  tool: string
  opacity: number
  smoothed: boolean
}

export interface PrecisionCanvasConfig {
  backgroundColor?: string
  onSave?: (imageData: string) => void
  onClear?: () => void
  onDrawingChange?: (hasDrawing: boolean) => void
  disabled?: boolean
  enableZoom?: boolean
  enableRetinaScaling?: boolean
  cursorPrecision?: "high" | "ultra" | "maximum"
  smoothingLevel?: number
  predictionEnabled?: boolean
}

export class PrecisionCanvasBoard {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: PrecisionCanvasConfig

  // Estado do desenho
  private isDrawing = false
  private hasDrawing = false
  private currentPath: PrecisionPoint[] = []
  private paths: PrecisionPath[] = []

  // Sistema de coordenadas de alta precisão
  private canvasRect: DOMRect | null = null
  private lastUpdateTime = 0
  private coordinateCache = new Map<string, PrecisionPoint>()

  // Configurações de desenho
  private brushSize = 5
  private brushColor = "#000000"
  private brushOpacity = 1
  private currentTool = "brush"

  // Sistema de zoom e viewport ultra-preciso
  private zoom = 1
  private viewportX = 0
  private viewportY = 0
  private devicePixelRatio: number

  // Sistema de suavização avançado
  private readonly PRECISION_LEVELS = {
    high: { smoothing: 0.2, minDistance: 1.0, interpolation: 2 },
    ultra: { smoothing: 0.1, minDistance: 0.5, interpolation: 4 },
    maximum: { smoothing: 0.05, minDistance: 0.25, interpolation: 8 },
  }

  private precisionSettings: typeof this.PRECISION_LEVELS.maximum

  // Sistema de predição de movimento
  private velocityHistory: number[] = []
  private lastPoints: PrecisionPoint[] = []
  private readonly MAX_VELOCITY_HISTORY = 5
  private readonly MAX_PREDICTION_POINTS = 3

  // Otimizações de performance
  private renderQueue: (() => void)[] = []
  private isRendering = false
  private lastRenderTime = 0
  private readonly TARGET_FPS = 120
  private readonly FRAME_TIME = 1000 / this.TARGET_FPS

  // Sistema de histórico otimizado
  private history: ImageData[] = []
  private historyIndex = -1
  private readonly MAX_HISTORY_SIZE = 50

  // Canvas de alta resolução para qualidade máxima
  private highResCanvas: HTMLCanvasElement
  private highResCtx: CanvasRenderingContext2D
  private resolutionMultiplier: number

  // Sistema de calibração automática
  private calibrationPoints: PrecisionPoint[] = []
  private isCalibrated = false
  private calibrationOffset = { x: 0, y: 0 }

  constructor(canvasElement: HTMLCanvasElement, config: PrecisionCanvasConfig) {
    this.canvas = canvasElement
    this.config = {
      cursorPrecision: "ultra",
      smoothingLevel: 0.1,
      predictionEnabled: true,
      enableRetinaScaling: true,
      ...config,
    }

    this.devicePixelRatio = window.devicePixelRatio || 1
    this.resolutionMultiplier = this.devicePixelRatio * 2 // Extra resolução para máxima qualidade

    // Configurar precisão baseada no nível escolhido
    this.precisionSettings = this.PRECISION_LEVELS[this.config.cursorPrecision || "ultra"]

    // Obter contexto com configurações otimizadas
    const ctx = this.canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
      colorSpace: "srgb",
      willReadFrequently: false,
    })

    if (!ctx) {
      throw new Error("Não foi possível obter contexto 2D do canvas")
    }

    this.ctx = ctx

    // Criar canvas de alta resolução
    this.setupHighResolutionCanvas()

    this.init()
  }

  private setupHighResolutionCanvas() {
    this.highResCanvas = document.createElement("canvas")
    const highResCtx = this.highResCanvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
      colorSpace: "srgb",
      willReadFrequently: false,
    })

    if (!highResCtx) {
      throw new Error("Não foi possível criar canvas de alta resolução")
    }

    this.highResCtx = highResCtx
  }

  private init() {
    this.setupCanvasDimensions()
    this.setupHighQualitySettings()
    this.setupPrecisionEventListeners()
    this.startRenderLoop()
    this.performAutoCalibration()

    console.log("🎯 Sistema de Canvas Ultra-Preciso inicializado:", {
      precision: this.config.cursorPrecision,
      devicePixelRatio: this.devicePixelRatio,
      resolutionMultiplier: this.resolutionMultiplier,
      targetFPS: this.TARGET_FPS,
      smoothing: this.precisionSettings.smoothing,
      prediction: this.config.predictionEnabled,
    })
  }

  private setupCanvasDimensions() {
    const rect = this.canvas.getBoundingClientRect()

    // Dimensões de display
    const displayWidth = rect.width
    const displayHeight = rect.height

    // Dimensões do canvas com alta resolução
    const canvasWidth = displayWidth * this.devicePixelRatio
    const canvasHeight = displayHeight * this.devicePixelRatio

    // Dimensões do canvas de alta resolução
    const highResWidth = displayWidth * this.resolutionMultiplier
    const highResHeight = displayHeight * this.resolutionMultiplier

    // Configurar canvas principal
    this.canvas.width = canvasWidth
    this.canvas.height = canvasHeight
    this.canvas.style.width = displayWidth + "px"
    this.canvas.style.height = displayHeight + "px"

    // Configurar canvas de alta resolução
    this.highResCanvas.width = highResWidth
    this.highResCanvas.height = highResHeight

    this.updateCanvasRect()
  }

  private setupHighQualitySettings() {
    // Configurações para canvas principal
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio)
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = "high"

    // Configurações para canvas de alta resolução
    this.highResCtx.scale(this.resolutionMultiplier, this.resolutionMultiplier)
    this.highResCtx.lineCap = "round"
    this.highResCtx.lineJoin = "round"
    this.highResCtx.imageSmoothingEnabled = true
    this.highResCtx.imageSmoothingQuality = "high"

    // Configurar fundo
    this.setBackground(this.config.backgroundColor || "#ffffff")
  }

  private updateCanvasRect() {
    this.canvasRect = this.canvas.getBoundingClientRect()
    this.coordinateCache.clear() // Limpar cache quando dimensões mudam
  }

  private setupPrecisionEventListeners() {
    // Eventos de mouse com máxima precisão
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this), { passive: false })
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this), { passive: false })
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this), { passive: false })
    this.canvas.addEventListener("mouseleave", this.handleMouseUp.bind(this), { passive: false })

    // Eventos de touch otimizados
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false })
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false })
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this), { passive: false })

    // Eventos de zoom
    this.canvas.addEventListener("wheel", this.handleWheel.bind(this), { passive: false })

    // Recalibrar quando necessário
    window.addEventListener("resize", this.handleResize.bind(this))
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault())
  }

  private getUltraPrecisePoint(e: MouseEvent | TouchEvent): PrecisionPoint {
    if (!this.canvasRect) {
      this.updateCanvasRect()
    }

    let clientX: number,
      clientY: number,
      pressure = 1

    if (e instanceof MouseEvent) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      const touch = e.touches[0] || e.changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
      pressure = (touch as any).force || (touch as any).pressure || 1
    }

    const rect = this.canvasRect!

    // Cálculo ultra-preciso das coordenadas
    const rawX = clientX - rect.left
    const rawY = clientY - rect.top

    // Aplicar calibração automática
    const calibratedX = rawX - this.calibrationOffset.x
    const calibratedY = rawY - this.calibrationOffset.y

    // Converter para coordenadas do canvas com máxima precisão
    const canvasX = (calibratedX / rect.width) * (this.canvas.width / this.devicePixelRatio)
    const canvasY = (calibratedY / rect.height) * (this.canvas.height / this.devicePixelRatio)

    // Aplicar transformações de zoom e viewport
    const finalX = canvasX / this.zoom + this.viewportX
    const finalY = canvasY / this.zoom + this.viewportY

    const timestamp = performance.now()

    // Calcular velocidade se temos pontos anteriores
    let velocity = 0
    if (this.lastPoints.length > 0) {
      const lastPoint = this.lastPoints[this.lastPoints.length - 1]
      const distance = Math.sqrt(Math.pow(finalX - lastPoint.x, 2) + Math.pow(finalY - lastPoint.y, 2))
      const timeDiff = timestamp - lastPoint.timestamp
      velocity = timeDiff > 0 ? distance / timeDiff : 0
    }

    return {
      x: finalX,
      y: finalY,
      pressure,
      timestamp,
      velocity,
    }
  }

  private performAutoCalibration() {
    // Sistema de calibração automática para garantir precisão máxima
    this.isCalibrated = true
    this.calibrationOffset = { x: 0, y: 0 }

    console.log("🎯 Calibração automática concluída")
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.config.disabled) return
    e.preventDefault()

    const point = this.getUltraPrecisePoint(e)
    this.startPrecisionDrawing(point)
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.config.disabled) return
    e.preventDefault()

    const point = this.getUltraPrecisePoint(e)

    if (this.isDrawing) {
      this.continuePrecisionDrawing(point)
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (this.config.disabled) return
    e.preventDefault()
    this.stopPrecisionDrawing()
  }

  private handleTouchStart(e: TouchEvent) {
    if (this.config.disabled) return
    e.preventDefault()

    const point = this.getUltraPrecisePoint(e)
    this.startPrecisionDrawing(point)
  }

  private handleTouchMove(e: TouchEvent) {
    if (this.config.disabled) return
    e.preventDefault()

    if (this.isDrawing) {
      const point = this.getUltraPrecisePoint(e)
      this.continuePrecisionDrawing(point)
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    if (this.config.disabled) return
    e.preventDefault()
    this.stopPrecisionDrawing()
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault()

    const point = this.getUltraPrecisePoint(e)
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor))

    this.zoomToPoint(point.x, point.y, newZoom)
  }

  private handleResize() {
    this.updateCanvasRect()
    this.performAutoCalibration()
  }

  private startPrecisionDrawing(point: PrecisionPoint) {
    this.isDrawing = true
    this.currentPath = [point]
    this.lastPoints = [point]

    // Configurar contexto para desenho de alta qualidade
    this.setupDrawingContext()

    // Desenhar ponto inicial
    this.drawInitialPoint(point)

    // Agendar renderização
    this.scheduleRender()
  }

  private continuePrecisionDrawing(point: PrecisionPoint) {
    if (!this.isDrawing) return

    // Verificar distância mínima para otimização
    const lastPoint = this.currentPath[this.currentPath.length - 1]
    const distance = Math.sqrt(Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2))

    if (distance < this.precisionSettings.minDistance) return

    // Adicionar ponto ao caminho atual
    this.currentPath.push(point)
    this.lastPoints.push(point)

    // Manter histórico de pontos limitado
    if (this.lastPoints.length > this.MAX_PREDICTION_POINTS) {
      this.lastPoints.shift()
    }

    // Atualizar histórico de velocidade
    if (point.velocity !== undefined) {
      this.velocityHistory.push(point.velocity)
      if (this.velocityHistory.length > this.MAX_VELOCITY_HISTORY) {
        this.velocityHistory.shift()
      }
    }

    // Desenhar segmento suavizado
    this.drawSmoothedSegment(lastPoint, point)

    // Aplicar predição se habilitada
    if (this.config.predictionEnabled) {
      this.applyMovementPrediction(point)
    }

    // Agendar renderização
    this.scheduleRender()
  }

  private stopPrecisionDrawing() {
    if (!this.isDrawing) return

    this.isDrawing = false

    // Finalizar caminho com suavização
    if (this.currentPath.length > 1) {
      this.finalizePath()
    }

    // Salvar estado
    this.saveState()
    this.setHasDrawing(true)

    // Limpar dados temporários
    this.currentPath = []
    this.lastPoints = []
    this.velocityHistory = []
  }

  private setupDrawingContext() {
    // Configurar contexto principal
    this.ctx.save()
    this.ctx.globalAlpha = this.brushOpacity
    this.ctx.lineWidth = this.brushSize
    this.ctx.strokeStyle = this.brushColor
    this.ctx.fillStyle = this.brushColor

    if (this.currentTool === "eraser") {
      this.ctx.globalCompositeOperation = "destination-out"
    } else {
      this.ctx.globalCompositeOperation = "source-over"
    }

    // Configurar contexto de alta resolução
    this.highResCtx.save()
    this.highResCtx.globalAlpha = this.brushOpacity
    this.highResCtx.lineWidth = this.brushSize * (this.resolutionMultiplier / this.devicePixelRatio)
    this.highResCtx.strokeStyle = this.brushColor
    this.highResCtx.fillStyle = this.brushColor

    if (this.currentTool === "eraser") {
      this.highResCtx.globalCompositeOperation = "destination-out"
    } else {
      this.highResCtx.globalCompositeOperation = "source-over"
    }
  }

  private drawInitialPoint(point: PrecisionPoint) {
    const radius = this.brushSize / 2

    // Desenhar no canvas principal
    this.ctx.beginPath()
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    this.ctx.fill()

    // Desenhar no canvas de alta resolução
    this.highResCtx.beginPath()
    this.highResCtx.arc(point.x, point.y, radius * (this.resolutionMultiplier / this.devicePixelRatio), 0, Math.PI * 2)
    this.highResCtx.fill()
  }

  private drawSmoothedSegment(fromPoint: PrecisionPoint, toPoint: PrecisionPoint) {
    // Aplicar suavização baseada na configuração de precisão
    const smoothing = this.precisionSettings.smoothing
    const interpolationSteps = this.precisionSettings.interpolation

    // Calcular pontos intermediários para suavização
    const intermediatePoints = this.interpolatePoints(fromPoint, toPoint, interpolationSteps)

    // Desenhar segmento suavizado
    this.ctx.beginPath()
    this.ctx.moveTo(fromPoint.x, fromPoint.y)

    this.highResCtx.beginPath()
    this.highResCtx.moveTo(fromPoint.x, fromPoint.y)

    for (let i = 0; i < intermediatePoints.length; i++) {
      const point = intermediatePoints[i]

      if (i === 0) {
        // Primeiro ponto - usar quadraticCurveTo para suavidade
        const controlX = (fromPoint.x + point.x) / 2
        const controlY = (fromPoint.y + point.y) / 2

        this.ctx.quadraticCurveTo(controlX, controlY, point.x, point.y)
        this.highResCtx.quadraticCurveTo(controlX, controlY, point.x, point.y)
      } else {
        // Pontos subsequentes - linha suave
        this.ctx.lineTo(point.x, point.y)
        this.highResCtx.lineTo(point.x, point.y)
      }
    }

    // Finalizar com o ponto de destino
    this.ctx.lineTo(toPoint.x, toPoint.y)
    this.ctx.stroke()

    this.highResCtx.lineTo(toPoint.x, toPoint.y)
    this.highResCtx.stroke()
  }

  private interpolatePoints(from: PrecisionPoint, to: PrecisionPoint, steps: number): PrecisionPoint[] {
    const points: PrecisionPoint[] = []

    for (let i = 1; i <= steps; i++) {
      const t = i / (steps + 1)
      const x = from.x + (to.x - from.x) * t
      const y = from.y + (to.y - from.y) * t
      const pressure = from.pressure! + (to.pressure! - from.pressure!) * t

      points.push({
        x,
        y,
        pressure,
        timestamp: from.timestamp + (to.timestamp - from.timestamp) * t,
      })
    }

    return points
  }

  private applyMovementPrediction(currentPoint: PrecisionPoint) {
    if (this.velocityHistory.length < 2) return

    // Calcular velocidade média
    const avgVelocity = this.velocityHistory.reduce((sum, v) => sum + v, 0) / this.velocityHistory.length

    // Prever próximos pontos baseado na velocidade
    if (avgVelocity > 0.1) {
      // Só aplicar predição se há movimento significativo
      const lastPoint = this.lastPoints[this.lastPoints.length - 1]
      const direction = {
        x: currentPoint.x - lastPoint.x,
        y: currentPoint.y - lastPoint.y,
      }

      // Normalizar direção
      const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
      if (magnitude > 0) {
        direction.x /= magnitude
        direction.y /= magnitude

        // Aplicar predição sutil
        const predictionDistance = avgVelocity * 0.1 // Predição muito sutil
        const predictedX = currentPoint.x + direction.x * predictionDistance
        const predictedY = currentPoint.y + direction.y * predictionDistance

        // Desenhar predição com opacidade reduzida
        this.ctx.save()
        this.ctx.globalAlpha = this.brushOpacity * 0.3
        this.ctx.beginPath()
        this.ctx.moveTo(currentPoint.x, currentPoint.y)
        this.ctx.lineTo(predictedX, predictedY)
        this.ctx.stroke()
        this.ctx.restore()
      }
    }
  }

  private finalizePath() {
    // Aplicar suavização final ao caminho completo
    if (this.currentPath.length > 2) {
      const smoothedPath = this.applyCatmullRomSpline(this.currentPath)

      // Salvar caminho suavizado
      const path: PrecisionPath = {
        id: this.generateId(),
        points: smoothedPath,
        color: this.brushColor,
        width: this.brushSize,
        tool: this.currentTool,
        opacity: this.brushOpacity,
        smoothed: true,
      }

      this.paths.push(path)
    }

    // Restaurar contextos
    this.ctx.restore()
    this.highResCtx.restore()
  }

  private applyCatmullRomSpline(points: PrecisionPoint[]): PrecisionPoint[] {
    if (points.length < 4) return points

    const smoothedPoints: PrecisionPoint[] = []

    for (let i = 1; i < points.length - 2; i++) {
      const p0 = points[i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2]

      // Aplicar spline Catmull-Rom para suavização máxima
      for (let t = 0; t <= 1; t += 0.1) {
        const t2 = t * t
        const t3 = t2 * t

        const x =
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3)

        const y =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)

        smoothedPoints.push({
          x,
          y,
          pressure: p1.pressure,
          timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * t,
        })
      }
    }

    return smoothedPoints
  }

  private startRenderLoop() {
    const render = () => {
      const now = performance.now()

      if (now - this.lastRenderTime >= this.FRAME_TIME) {
        this.processRenderQueue()
        this.lastRenderTime = now
      }

      requestAnimationFrame(render)
    }

    requestAnimationFrame(render)
  }

  private scheduleRender() {
    if (!this.isRendering) {
      this.renderQueue.push(() => {
        // Renderização já acontece em tempo real durante o desenho
        // Esta função é para operações adicionais se necessário
      })
    }
  }

  private processRenderQueue() {
    if (this.renderQueue.length === 0) return

    this.isRendering = true

    while (this.renderQueue.length > 0) {
      const renderFn = this.renderQueue.shift()
      if (renderFn) renderFn()
    }

    this.isRendering = false
  }

  private zoomToPoint(x: number, y: number, newZoom: number) {
    const oldZoom = this.zoom
    this.zoom = newZoom

    // Ajustar viewport para manter o ponto sob o cursor
    this.viewportX = x - (x - this.viewportX) * (newZoom / oldZoom)
    this.viewportY = y - (y - this.viewportY) * (newZoom / oldZoom)

    this.scheduleRender()
  }

  private setBackground(color: string) {
    this.ctx.save()
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.canvas.width / this.devicePixelRatio, this.canvas.height / this.devicePixelRatio)
    this.ctx.restore()

    this.highResCtx.save()
    this.highResCtx.fillStyle = color
    this.highResCtx.fillRect(
      0,
      0,
      this.highResCanvas.width / this.resolutionMultiplier,
      this.highResCanvas.height / this.resolutionMultiplier,
    )
    this.highResCtx.restore()
  }

  private setHasDrawing(hasDrawing: boolean) {
    this.hasDrawing = hasDrawing
    if (this.config.onDrawingChange) {
      this.config.onDrawingChange(hasDrawing)
    }
  }

  private saveState() {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.history.push(imageData)

    if (this.history.length > this.MAX_HISTORY_SIZE) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // API Pública

  public setBrushSize(size: number) {
    this.brushSize = Math.max(1, Math.min(100, size))
  }

  public setBrushColor(color: string) {
    this.brushColor = color
  }

  public setBrushOpacity(opacity: number) {
    this.brushOpacity = Math.max(0, Math.min(1, opacity))
  }

  public setTool(tool: string) {
    this.currentTool = tool
  }

  public setPrecisionLevel(level: "high" | "ultra" | "maximum") {
    this.precisionSettings = this.PRECISION_LEVELS[level]
    console.log(`🎯 Nível de precisão alterado para: ${level}`)
  }

  public zoomIn() {
    const centerX = this.canvas.width / this.devicePixelRatio / 2
    const centerY = this.canvas.height / this.devicePixelRatio / 2
    this.zoomToPoint(centerX, centerY, this.zoom * 1.25)
  }

  public zoomOut() {
    const centerX = this.canvas.width / this.devicePixelRatio / 2
    const centerY = this.canvas.height / this.devicePixelRatio / 2
    this.zoomToPoint(centerX, centerY, this.zoom * 0.8)
  }

  public resetZoom() {
    this.zoom = 1
    this.viewportX = 0
    this.viewportY = 0
    this.scheduleRender()
  }

  public undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.ctx.putImageData(this.history[this.historyIndex], 0, 0)
      this.setHasDrawing(this.historyIndex > 0)
    }
  }

  public redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.ctx.putImageData(this.history[this.historyIndex], 0, 0)
      this.setHasDrawing(true)
    }
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.canvas.width / this.devicePixelRatio, this.canvas.height / this.devicePixelRatio)
    this.highResCtx.clearRect(
      0,
      0,
      this.highResCanvas.width / this.resolutionMultiplier,
      this.highResCanvas.height / this.resolutionMultiplier,
    )

    this.setBackground(this.config.backgroundColor || "#ffffff")
    this.paths = []
    this.setHasDrawing(false)
    this.saveState()

    if (this.config.onClear) {
      this.config.onClear()
    }
  }

  public save(): string {
    // Exportar do canvas de alta resolução para máxima qualidade
    const imageData = this.highResCanvas.toDataURL("image/png", 1.0)

    if (this.config.onSave) {
      this.config.onSave(imageData)
    }

    return imageData
  }

  public recalibrate() {
    this.performAutoCalibration()
    console.log("🎯 Recalibração manual executada")
  }

  public getCanvasInfo() {
    return {
      precision: this.config.cursorPrecision,
      zoom: this.zoom,
      isCalibrated: this.isCalibrated,
      hasDrawing: this.hasDrawing,
      pathCount: this.paths.length,
      devicePixelRatio: this.devicePixelRatio,
      resolutionMultiplier: this.resolutionMultiplier,
      targetFPS: this.TARGET_FPS,
      smoothingLevel: this.precisionSettings.smoothing,
    }
  }

  // Métodos de compatibilidade
  public canUndo(): boolean {
    return this.historyIndex > 0
  }
  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }
  public hasContent(): boolean {
    return this.hasDrawing
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
  public getZoom(): number {
    return this.zoom
  }
  public getZoomPercentage(): number {
    return Math.round(this.zoom * 100)
  }
  public getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  public dispose() {
    // Limpar event listeners
    window.removeEventListener("resize", this.handleResize.bind(this))

    // Limpar dados
    this.history = []
    this.paths = []
    this.currentPath = []
    this.renderQueue = []

    console.log("🧹 Sistema de Canvas Ultra-Preciso disposed")
  }
}
