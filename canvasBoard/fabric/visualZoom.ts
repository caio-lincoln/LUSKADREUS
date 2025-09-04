// Sistema de zoom visual que não afeta o desenho
export interface VisualZoomConfig {
  minZoom: number
  maxZoom: number
  zoomStep: number
  smoothZoom: boolean
}

export class VisualZoomManager {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private config: VisualZoomConfig
  private currentZoom = 1
  private isEnabled = true

  constructor(canvas: HTMLCanvasElement, config: Partial<VisualZoomConfig> = {}) {
    this.canvas = canvas

    // Encontrar ou criar container
    this.container = canvas.parentElement || document.body

    this.config = {
      minZoom: 0.25,
      maxZoom: 4,
      zoomStep: 0.25,
      smoothZoom: true,
      ...config,
    }

    this.setupEventListeners()
    this.setupContainerStyles()
  }

  private setupContainerStyles() {
    // Garantir que o container tenha overflow hidden para não mostrar scrollbars
    const containerStyle = this.container.style
    containerStyle.overflow = "hidden"
    containerStyle.position = "relative"

    // Configurar estilos do canvas para zoom visual
    const canvasStyle = this.canvas.style
    canvasStyle.transformOrigin = "center center"
    canvasStyle.transition = this.config.smoothZoom ? "transform 0.2s ease-out" : "none"
  }

  private setupEventListeners() {
    // Zoom com scroll wheel - apenas no canvas
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const zoomDirection = e.deltaY > 0 ? -1 : 1
      const newZoom = this.calculateNewZoom(zoomDirection)

      this.setZoom(newZoom)
    }

    this.canvas.addEventListener("wheel", handleWheel, { passive: false })

    // Prevenir zoom do navegador
    this.canvas.addEventListener("gesturestart", (e) => e.preventDefault())
    this.canvas.addEventListener("gesturechange", (e) => e.preventDefault())
    this.canvas.addEventListener("gestureend", (e) => e.preventDefault())
  }

  private calculateNewZoom(direction: number): number {
    const factor = 1 + this.config.zoomStep * direction
    const newZoom = this.currentZoom * factor
    return Math.max(this.config.minZoom, Math.min(this.config.maxZoom, newZoom))
  }

  public setZoom(zoom: number) {
    if (!this.isEnabled) return

    const clampedZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom))
    this.currentZoom = clampedZoom

    // Aplicar zoom visual apenas com transform scale
    this.canvas.style.transform = `scale(${this.currentZoom})`

    // Disparar evento de mudança de zoom
    this.canvas.dispatchEvent(
      new CustomEvent("visualzoomchange", {
        detail: {
          zoom: this.currentZoom,
          percentage: Math.round(this.currentZoom * 100),
        },
      }),
    )

    console.log(`🔍 Zoom visual alterado para: ${Math.round(this.currentZoom * 100)}%`)
  }

  public zoomIn() {
    const newZoom = this.calculateNewZoom(1)
    this.setZoom(newZoom)
  }

  public zoomOut() {
    const newZoom = this.calculateNewZoom(-1)
    this.setZoom(newZoom)
  }

  public resetZoom() {
    this.setZoom(1)
  }

  public fitToContainer() {
    // Calcular zoom para caber no container
    const containerRect = this.container.getBoundingClientRect()
    const canvasRect = this.canvas.getBoundingClientRect()

    const scaleX = containerRect.width / this.canvas.width
    const scaleY = containerRect.height / this.canvas.height
    const scale = Math.min(scaleX, scaleY, 1) // Não aumentar além do tamanho original

    this.setZoom(scale)
  }

  public getZoom(): number {
    return this.currentZoom
  }

  public getZoomPercentage(): number {
    return Math.round(this.currentZoom * 100)
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    if (!enabled) {
      this.resetZoom()
    }
  }

  public isZoomEnabled(): boolean {
    return this.isEnabled
  }

  // Método para converter coordenadas do mouse considerando o zoom visual
  public getAdjustedMousePosition(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()

    // Calcular posição considerando o zoom visual
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  public dispose() {
    // Resetar estilos
    this.canvas.style.transform = ""
    this.canvas.style.transformOrigin = ""
    this.canvas.style.transition = ""

    // Remover event listeners seria feito aqui se tivéssemos referências
    console.log("🔍 VisualZoomManager disposed")
  }
}
