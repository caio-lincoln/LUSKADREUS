// Sistema de debug visual para eventos de desenho
export interface DebugEvent {
  type: "mousedown" | "mousemove" | "mouseup" | "touchstart" | "touchmove" | "touchend" | "draw" | "clear"
  position?: { x: number; y: number }
  timestamp: number
  data?: any
}

export class VisualDebugger {
  private canvas: HTMLCanvasElement
  private debugOverlay: HTMLCanvasElement
  private debugCtx: CanvasRenderingContext2D
  private events: DebugEvent[] = []
  private maxEvents = 50
  private isEnabled = true
  private debugPanel: HTMLElement | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.createDebugOverlay()
    this.createDebugPanel()
  }

  private createDebugOverlay() {
    // Criar canvas overlay para debug visual
    this.debugOverlay = document.createElement("canvas")
    this.debugOverlay.id = "debug-overlay"
    this.debugOverlay.width = this.canvas.width
    this.debugOverlay.height = this.canvas.height
    this.debugOverlay.style.position = "absolute"
    this.debugOverlay.style.top = "0"
    this.debugOverlay.style.left = "0"
    this.debugOverlay.style.pointerEvents = "none"
    this.debugOverlay.style.zIndex = "1000"
    this.debugOverlay.style.border = "2px solid #e5e7eb"
    this.debugOverlay.style.borderRadius = "8px"

    const ctx = this.debugOverlay.getContext("2d")
    if (!ctx) throw new Error("Contexto debug não disponível")
    this.debugCtx = ctx

    // Inserir após o canvas principal
    if (this.canvas.parentElement) {
      this.canvas.parentElement.style.position = "relative"
      this.canvas.parentElement.appendChild(this.debugOverlay)
    }
  }

  private createDebugPanel() {
    // Criar painel de debug
    this.debugPanel = document.createElement("div")
    this.debugPanel.id = "debug-panel"
    this.debugPanel.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      max-width: 300px;
      z-index: 1001;
      backdrop-filter: blur(10px);
    `

    if (this.canvas.parentElement) {
      this.canvas.parentElement.appendChild(this.debugPanel)
    }

    this.updateDebugPanel()
  }

  public logEvent(event: DebugEvent) {
    if (!this.isEnabled) return

    // Adicionar timestamp se não fornecido
    if (!event.timestamp) {
      event.timestamp = Date.now()
    }

    // Adicionar à lista de eventos
    this.events.push(event)

    // Limitar número de eventos
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    // Atualizar visualizações
    this.renderDebugOverlay(event)
    this.updateDebugPanel()

    console.log("🎨 Debug Event:", event)
  }

  private renderDebugOverlay(event: DebugEvent) {
    // Limpar overlay anterior
    this.debugCtx.clearRect(0, 0, this.debugOverlay.width, this.debugOverlay.height)

    // Renderizar evento atual
    if (event.position) {
      this.renderEventIndicator(event)
    }

    // Renderizar trail dos últimos eventos
    this.renderEventTrail()

    // Renderizar status geral
    this.renderStatus()
  }

  private renderEventIndicator(event: DebugEvent) {
    const { x, y } = event.position!

    this.debugCtx.save()

    // Cor baseada no tipo de evento
    const colors = {
      mousedown: "#ff4444",
      mousemove: "#44ff44",
      mouseup: "#4444ff",
      touchstart: "#ff8844",
      touchmove: "#88ff44",
      touchend: "#4488ff",
      draw: "#ffff44",
      clear: "#ff44ff",
    }

    this.debugCtx.fillStyle = colors[event.type] || "#ffffff"
    this.debugCtx.strokeStyle = "#000000"
    this.debugCtx.lineWidth = 2

    // Desenhar círculo indicador
    this.debugCtx.beginPath()
    this.debugCtx.arc(x, y, 8, 0, Math.PI * 2)
    this.debugCtx.fill()
    this.debugCtx.stroke()

    // Desenhar label
    this.debugCtx.fillStyle = "#000000"
    this.debugCtx.font = "10px Arial"
    this.debugCtx.textAlign = "center"
    this.debugCtx.fillText(event.type, x, y - 15)

    // Desenhar coordenadas
    this.debugCtx.fillText(`(${Math.round(x)}, ${Math.round(y)})`, x, y + 25)

    this.debugCtx.restore()
  }

  private renderEventTrail() {
    // Renderizar trail dos últimos 10 eventos com posição
    const recentEvents = this.events.filter((e) => e.position).slice(-10)

    if (recentEvents.length < 2) return

    this.debugCtx.save()
    this.debugCtx.strokeStyle = "rgba(255, 255, 0, 0.5)"
    this.debugCtx.lineWidth = 2
    this.debugCtx.setLineDash([5, 5])

    this.debugCtx.beginPath()
    const firstEvent = recentEvents[0]
    this.debugCtx.moveTo(firstEvent.position!.x, firstEvent.position!.y)

    for (let i = 1; i < recentEvents.length; i++) {
      const event = recentEvents[i]
      this.debugCtx.lineTo(event.position!.x, event.position!.y)
    }

    this.debugCtx.stroke()
    this.debugCtx.restore()
  }

  private renderStatus() {
    // Renderizar status no canto superior esquerdo
    this.debugCtx.save()
    this.debugCtx.fillStyle = "rgba(0, 0, 0, 0.7)"
    this.debugCtx.fillRect(10, 10, 200, 80)

    this.debugCtx.fillStyle = "#ffffff"
    this.debugCtx.font = "12px Arial"
    this.debugCtx.textAlign = "left"

    const recentEvent = this.events[this.events.length - 1]
    const eventCount = this.events.length
    const drawEvents = this.events.filter((e) => e.type === "draw").length

    this.debugCtx.fillText(`Eventos: ${eventCount}`, 15, 25)
    this.debugCtx.fillText(`Desenhos: ${drawEvents}`, 15, 40)
    this.debugCtx.fillText(`Último: ${recentEvent?.type || "none"}`, 15, 55)
    this.debugCtx.fillText(`Debug: ${this.isEnabled ? "ON" : "OFF"}`, 15, 70)

    this.debugCtx.restore()
  }

  private updateDebugPanel() {
    if (!this.debugPanel) return

    const recentEvents = this.events.slice(-5).reverse()
    const eventCount = this.events.length
    const drawEvents = this.events.filter((e) => e.type === "draw").length

    this.debugPanel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #ffff44;">
        🎨 Canvas Debug
      </div>
      <div style="margin-bottom: 5px;">
        Total Events: <span style="color: #44ff44;">${eventCount}</span>
      </div>
      <div style="margin-bottom: 5px;">
        Draw Events: <span style="color: #ff4444;">${drawEvents}</span>
      </div>
      <div style="margin-bottom: 10px;">
        Status: <span style="color: ${this.isEnabled ? "#44ff44" : "#ff4444"};">
          ${this.isEnabled ? "ACTIVE" : "DISABLED"}
        </span>
      </div>
      <div style="margin-bottom: 5px; font-weight: bold;">Recent Events:</div>
      ${recentEvents
        .map(
          (event) => `
        <div style="margin: 2px 0; padding: 2px; background: rgba(255,255,255,0.1); border-radius: 3px;">
          <span style="color: #ffff44;">${event.type}</span>
          ${event.position ? `<span style="color: #44ff44;"> (${Math.round(event.position.x)}, ${Math.round(event.position.y)})</span>` : ""}
          <span style="color: #888; font-size: 10px;"> ${new Date(event.timestamp).toLocaleTimeString()}</span>
        </div>
      `,
        )
        .join("")}
    `
  }

  public toggle() {
    this.isEnabled = !this.isEnabled
    if (!this.isEnabled) {
      this.debugCtx.clearRect(0, 0, this.debugOverlay.width, this.debugOverlay.height)
    }
    this.updateDebugPanel()
  }

  public clear() {
    this.events = []
    this.debugCtx.clearRect(0, 0, this.debugOverlay.width, this.debugOverlay.height)
    this.updateDebugPanel()
  }

  public resize(width: number, height: number) {
    this.debugOverlay.width = width
    this.debugOverlay.height = height
  }

  public dispose() {
    if (this.debugOverlay && this.debugOverlay.parentElement) {
      this.debugOverlay.parentElement.removeChild(this.debugOverlay)
    }
    if (this.debugPanel && this.debugPanel.parentElement) {
      this.debugPanel.parentElement.removeChild(this.debugPanel)
    }
  }
}
