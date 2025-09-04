// Sistema de zoom avançado com scroll wheel
import { PerformanceManager } from "./performance"

export interface ZoomConfig {
  minZoom: number
  maxZoom: number
  zoomStep: number
  smoothZoom: boolean
  centerOnZoom: boolean
}

export class ZoomManager {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: ZoomConfig
  private currentZoom = 1
  private panX = 0
  private panY = 0
  private isDragging = false
  private lastMousePos = { x: 0, y: 0 }
  private performance = PerformanceManager.getInstance()

  constructor(canvas: HTMLCanvasElement, config: Partial<ZoomConfig> = {}) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Contexto 2D não disponível")
    this.ctx = ctx

    this.config = {
      minZoom: 0.1,
      maxZoom: 10,
      zoomStep: 0.1,
      smoothZoom: true,
      centerOnZoom: false,
      ...config,
    }

    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Zoom com scroll wheel
    const handleWheel = this.performance.throttle((e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const rect = this.canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomDirection = e.deltaY > 0 ? -1 : 1
      const newZoom = this.calculateNewZoom(zoomDirection)

      if (this.config.centerOnZoom) {
        this.zoomToCenter(newZoom)
      } else {
        this.zoomToPoint(mouseX, mouseY, newZoom)
      }
    }, 16) // ~60fps

    this.canvas.addEventListener("wheel", handleWheel, { passive: false })

    // Pan com mouse
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this))
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this))
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this))
    this.canvas.addEventListener("mouseleave", this.handleMouseUp.bind(this))

    // Touch gestures para mobile
    this.setupTouchGestures()
  }

  private setupTouchGestures() {
    let initialDistance = 0
    let initialZoom = 1
    let touches: Touch[] = []

    const handleTouchStart = (e: TouchEvent) => {
      touches = Array.from(e.touches)
      if (touches.length === 2) {
        initialDistance = this.getTouchDistance(touches[0], touches[1])
        initialZoom = this.currentZoom
      }
    }

    const handleTouchMove = this.performance.throttle((e: TouchEvent) => {
      e.preventDefault()
      touches = Array.from(e.touches)

      if (touches.length === 2) {
        const currentDistance = this.getTouchDistance(touches[0], touches[1])
        const scale = currentDistance / initialDistance
        const newZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, initialZoom * scale))

        const centerX = (touches[0].clientX + touches[1].clientX) / 2
        const centerY = (touches[0].clientY + touches[1].clientY) / 2
        const rect = this.canvas.getBoundingClientRect()

        this.zoomToPoint(centerX - rect.left, centerY - rect.top, newZoom)
      }
    }, 16)

    this.canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
    this.canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
  }

  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  private calculateNewZoom(direction: number): number {
    const factor = 1 + this.config.zoomStep * direction
    const newZoom = this.currentZoom * factor
    return Math.max(this.config.minZoom, Math.min(this.config.maxZoom, newZoom))
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse button ou Ctrl+Left click para pan
      this.isDragging = true
      this.lastMousePos = { x: e.clientX, y: e.clientY }
      this.canvas.style.cursor = "grabbing"
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.lastMousePos.x
      const deltaY = e.clientY - this.lastMousePos.y

      this.panX += deltaX / this.currentZoom
      this.panY += deltaY / this.currentZoom

      this.lastMousePos = { x: e.clientX, y: e.clientY }
      this.applyTransform()
    }
  }

  private handleMouseUp() {
    this.isDragging = false
    this.canvas.style.cursor = "default"
  }

  public zoomToPoint(x: number, y: number, newZoom: number) {
    const oldZoom = this.currentZoom

    // Calcular novo pan para manter o ponto sob o mouse
    this.panX = x / oldZoom - x / newZoom + this.panX
    this.panY = y / oldZoom - y / newZoom + this.panY

    this.currentZoom = newZoom
    this.applyTransform()
  }

  public zoomToCenter(newZoom: number) {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    this.zoomToPoint(centerX, centerY, newZoom)
  }

  public zoomIn() {
    const newZoom = this.calculateNewZoom(1)
    this.zoomToCenter(newZoom)
  }

  public zoomOut() {
    const newZoom = this.calculateNewZoom(-1)
    this.zoomToCenter(newZoom)
  }

  public resetZoom() {
    this.currentZoom = 1
    this.panX = 0
    this.panY = 0
    this.applyTransform()
  }

  public fitToCanvas() {
    // Implementar fit to canvas baseado no conteúdo
    this.resetZoom()
  }

  private applyTransform() {
    this.performance.scheduleUpdate(() => {
      this.ctx.setTransform(this.currentZoom, 0, 0, this.currentZoom, this.panX, this.panY)
      // Disparar evento de mudança de zoom
      this.canvas.dispatchEvent(
        new CustomEvent("zoomchange", {
          detail: {
            zoom: this.currentZoom,
            panX: this.panX,
            panY: this.panY,
          },
        }),
      )
    })
  }

  public getZoom(): number {
    return this.currentZoom
  }

  public getPan(): { x: number; y: number } {
    return { x: this.panX, y: this.panY }
  }

  public getViewportBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: -this.panX,
      y: -this.panY,
      width: this.canvas.width / this.currentZoom,
      height: this.canvas.height / this.currentZoom,
    }
  }
}
