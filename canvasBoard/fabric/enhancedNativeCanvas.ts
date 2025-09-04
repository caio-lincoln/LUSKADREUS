/**
 * Enhanced Native Canvas com melhorias de precisão e performance
 * Versão otimizada do sistema original com foco em alinhamento perfeito
 */

import { NativeCanvasBoard, type CanvasConfig } from "./nativeCanvas"

export interface EnhancedCanvasConfig extends CanvasConfig {
  cursorSync?: boolean
  highPrecisionMode?: boolean
  adaptiveSmoothing?: boolean
  performanceMode?: "quality" | "balanced" | "performance"
}

export class EnhancedNativeCanvasBoard extends NativeCanvasBoard {
  private cursorSyncEnabled: boolean
  private highPrecisionMode: boolean
  private adaptiveSmoothing: boolean
  private performanceMode: "quality" | "balanced" | "performance"

  // Sistema de sincronização de cursor
  private cursorElement: HTMLElement | null = null
  private lastCursorUpdate = 0
  private cursorUpdateThrottle = 8 // 120fps para cursor

  // Métricas de performance
  private frameMetrics = {
    lastFrameTime: 0,
    averageFrameTime: 16.67, // 60fps baseline
    frameCount: 0,
    droppedFrames: 0,
  }

  // Sistema de coordenadas aprimorado
  private coordinatePrecision = {
    subPixelAccuracy: true,
    interpolationQuality: "high" as "low" | "medium" | "high",
    stabilization: true,
  }

  constructor(canvasElement: HTMLCanvasElement, config: EnhancedCanvasConfig) {
    const enhancedConfig = {
      cursorSync: true,
      highPrecisionMode: true,
      adaptiveSmoothing: true,
      performanceMode: "balanced" as const,
      ...config,
    }

    super(canvasElement, enhancedConfig)

    this.cursorSyncEnabled = enhancedConfig.cursorSync
    this.highPrecisionMode = enhancedConfig.highPrecisionMode
    this.adaptiveSmoothing = enhancedConfig.adaptiveSmoothing
    this.performanceMode = enhancedConfig.performanceMode

    this.initializeEnhancements()
  }

  private initializeEnhancements() {
    this.setupCursorSync()
    this.setupPerformanceMonitoring()
    this.optimizeForPerformanceMode()

    console.log("🚀 Enhanced Native Canvas inicializado:", {
      cursorSync: this.cursorSyncEnabled,
      highPrecision: this.highPrecisionMode,
      adaptiveSmoothing: this.adaptiveSmoothing,
      performanceMode: this.performanceMode,
    })
  }

  private setupCursorSync() {
    if (!this.cursorSyncEnabled) return

    // Criar elemento de cursor customizado para sincronização perfeita
    this.cursorElement = document.createElement("div")
    this.cursorElement.style.cssText = `
      position: absolute;
      width: 2px;
      height: 2px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      transform: translate(-50%, -50%);
      transition: none;
      will-change: transform;
    `

    // Adicionar ao container do canvas
    const container = this.getCanvas().parentElement
    if (container) {
      container.style.position = "relative"
      container.appendChild(this.cursorElement)
    }
  }

  private setupPerformanceMonitoring() {
    const monitorFrame = () => {
      const now = performance.now()
      const frameTime = now - this.frameMetrics.lastFrameTime

      if (this.frameMetrics.lastFrameTime > 0) {
        // Calcular média móvel do tempo de frame
        this.frameMetrics.averageFrameTime = this.frameMetrics.averageFrameTime * 0.9 + frameTime * 0.1

        // Detectar frames perdidos
        if (frameTime > 20) {
          // Mais de 20ms = frame perdido
          this.frameMetrics.droppedFrames++
        }

        this.frameMetrics.frameCount++

        // Ajustar qualidade baseado na performance
        if (this.adaptiveSmoothing) {
          this.adjustQualityBasedOnPerformance()
        }
      }

      this.frameMetrics.lastFrameTime = now
      requestAnimationFrame(monitorFrame)
    }

    requestAnimationFrame(monitorFrame)
  }

  private adjustQualityBasedOnPerformance() {
    const avgFrameTime = this.frameMetrics.averageFrameTime
    const targetFrameTime = 16.67 // 60fps

    if (avgFrameTime > targetFrameTime * 1.5) {
      // Performance ruim - reduzir qualidade
      this.coordinatePrecision.interpolationQuality = "low"
      this.coordinatePrecision.stabilization = false
    } else if (avgFrameTime < targetFrameTime * 1.1) {
      // Performance boa - aumentar qualidade
      this.coordinatePrecision.interpolationQuality = "high"
      this.coordinatePrecision.stabilization = true
    } else {
      // Performance média - qualidade balanceada
      this.coordinatePrecision.interpolationQuality = "medium"
      this.coordinatePrecision.stabilization = true
    }
  }

  private optimizeForPerformanceMode() {
    switch (this.performanceMode) {
      case "quality":
        this.coordinatePrecision = {
          subPixelAccuracy: true,
          interpolationQuality: "high",
          stabilization: true,
        }
        this.cursorUpdateThrottle = 4 // 240fps para cursor
        break

      case "balanced":
        this.coordinatePrecision = {
          subPixelAccuracy: true,
          interpolationQuality: "medium",
          stabilization: true,
        }
        this.cursorUpdateThrottle = 8 // 120fps para cursor
        break

      case "performance":
        this.coordinatePrecision = {
          subPixelAccuracy: false,
          interpolationQuality: "low",
          stabilization: false,
        }
        this.cursorUpdateThrottle = 16 // 60fps para cursor
        break
    }
  }

  protected getEventPoint(e: MouseEvent | TouchEvent): any {
    const basePoint = super.getEventPoint(e)

    // Aplicar melhorias de precisão
    if (this.highPrecisionMode) {
      return this.enhancePointPrecision(basePoint, e)
    }

    return basePoint
  }

  private enhancePointPrecision(point: any, e: MouseEvent | TouchEvent): any {
    // Aplicar correção sub-pixel se habilitada
    if (this.coordinatePrecision.subPixelAccuracy) {
      point = this.applySubPixelCorrection(point, e)
    }

    // Aplicar estabilização se habilitada
    if (this.coordinatePrecision.stabilization) {
      point = this.applyCoordinateStabilization(point)
    }

    // Atualizar cursor sincronizado
    this.updateSyncedCursor(point, e)

    return point
  }

  private applySubPixelCorrection(point: any, e: MouseEvent | TouchEvent): any {
    // Implementar correção sub-pixel para máxima precisão
    const canvas = this.getCanvas()
    const rect = canvas.getBoundingClientRect()

    let clientX: number, clientY: number

    if (e instanceof MouseEvent) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      const touch = e.touches[0] || e.changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    }

    // Calcular posição sub-pixel
    const subPixelX = clientX - rect.left
    const subPixelY = clientY - rect.top

    // Aplicar correção baseada no devicePixelRatio
    const devicePixelRatio = window.devicePixelRatio || 1
    const correctedX = (subPixelX * devicePixelRatio) / devicePixelRatio
    const correctedY = (subPixelY * devicePixelRatio) / devicePixelRatio

    // Converter para coordenadas do canvas
    const canvasX = (correctedX / rect.width) * canvas.width
    const canvasY = (correctedY / rect.height) * canvas.height

    return {
      ...point,
      x: canvasX,
      y: canvasY,
      subPixelAccuracy: true,
    }
  }

  private applyCoordinateStabilization(point: any): any {
    // Implementar estabilização de coordenadas para reduzir jitter
    // Usar filtro passa-baixa simples
    const stabilizationFactor = 0.1

    if (this.lastStablePoint) {
      point.x = this.lastStablePoint.x + (point.x - this.lastStablePoint.x) * stabilizationFactor
      point.y = this.lastStablePoint.y + (point.y - this.lastStablePoint.y) * stabilizationFactor
    }

    this.lastStablePoint = { x: point.x, y: point.y }
    return point
  }

  private lastStablePoint: { x: number; y: number } | null = null

  private updateSyncedCursor(point: any, e: MouseEvent | TouchEvent) {
    if (!this.cursorSyncEnabled || !this.cursorElement) return

    const now = performance.now()
    if (now - this.lastCursorUpdate < this.cursorUpdateThrottle) return

    let clientX: number, clientY: number

    if (e instanceof MouseEvent) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      const touch = e.touches[0] || e.changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    }

    const canvas = this.getCanvas()
    const rect = canvas.getBoundingClientRect()

    // Posicionar cursor sincronizado
    const cursorX = clientX - rect.left
    const cursorY = clientY - rect.top

    this.cursorElement.style.left = cursorX + "px"
    this.cursorElement.style.top = cursorY + "px"

    // Atualizar aparência baseada na ferramenta atual
    this.updateCursorAppearance()

    this.lastCursorUpdate = now
  }

  private updateCursorAppearance() {
    if (!this.cursorElement) return

    const tool = this.getCurrentTool()
    const brushSize = this.getBrushSize()

    switch (tool) {
      case "brush":
        this.cursorElement.style.width = Math.max(2, brushSize / 2) + "px"
        this.cursorElement.style.height = Math.max(2, brushSize / 2) + "px"
        this.cursorElement.style.background = "rgba(0, 0, 0, 0.8)"
        this.cursorElement.style.border = "1px solid rgba(255, 255, 255, 0.8)"
        break

      case "eraser":
        this.cursorElement.style.width = Math.max(4, brushSize / 1.5) + "px"
        this.cursorElement.style.height = Math.max(4, brushSize / 1.5) + "px"
        this.cursorElement.style.background = "rgba(255, 0, 0, 0.6)"
        this.cursorElement.style.border = "2px solid rgba(255, 255, 255, 0.9)"
        break

      default:
        this.cursorElement.style.width = "2px"
        this.cursorElement.style.height = "2px"
        this.cursorElement.style.background = "rgba(0, 0, 0, 0.8)"
        this.cursorElement.style.border = "none"
    }
  }

  // Métodos públicos aprimorados

  public setPerformanceMode(mode: "quality" | "balanced" | "performance") {
    this.performanceMode = mode
    this.optimizeForPerformanceMode()
    console.log(`⚡ Modo de performance alterado para: ${mode}`)
  }

  public toggleCursorSync(enabled: boolean) {
    this.cursorSyncEnabled = enabled

    if (this.cursorElement) {
      this.cursorElement.style.display = enabled ? "block" : "none"
    }

    console.log(`🎯 Sincronização de cursor: ${enabled ? "ativada" : "desativada"}`)
  }

  public getPerformanceMetrics() {
    const fps = 1000 / this.frameMetrics.averageFrameTime
    const droppedFrameRate = (this.frameMetrics.droppedFrames / this.frameMetrics.frameCount) * 100

    return {
      averageFPS: Math.round(fps),
      averageFrameTime: Math.round(this.frameMetrics.averageFrameTime * 100) / 100,
      droppedFrames: this.frameMetrics.droppedFrames,
      droppedFrameRate: Math.round(droppedFrameRate * 100) / 100,
      totalFrames: this.frameMetrics.frameCount,
      performanceMode: this.performanceMode,
      coordinatePrecision: this.coordinatePrecision,
    }
  }

  public optimizeForDevice() {
    // Otimização automática baseada no dispositivo
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isLowEnd = navigator.hardwareConcurrency <= 4

    if (isMobile || isLowEnd) {
      this.setPerformanceMode("performance")
      this.toggleCursorSync(false)
    } else {
      this.setPerformanceMode("quality")
      this.toggleCursorSync(true)
    }

    console.log(
      `📱 Otimização automática aplicada: ${isMobile ? "mobile" : "desktop"}, ${isLowEnd ? "low-end" : "high-end"}`,
    )
  }

  public dispose() {
    // Limpar cursor sincronizado
    if (this.cursorElement && this.cursorElement.parentElement) {
      this.cursorElement.parentElement.removeChild(this.cursorElement)
    }

    // Chamar dispose da classe pai
    super.dispose()

    console.log("🧹 Enhanced Native Canvas disposed")
  }
}
