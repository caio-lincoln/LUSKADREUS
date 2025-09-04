// Sistema de colaboração em tempo real
export interface CollaborationEvent {
  type: "draw" | "erase" | "clear" | "undo" | "redo" | "cursor"
  userId: string
  timestamp: number
  data: any
}

export interface User {
  id: string
  name: string
  color: string
  cursor?: { x: number; y: number }
  isActive: boolean
}

// Mock PerformanceManager to resolve lint error.  In a real application, this would be properly imported or defined.
class PerformanceManager {
  private static instance: PerformanceManager

  private constructor() {}

  public static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager()
    }
    return PerformanceManager.instance
  }

  public throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean
    let lastFunc: ReturnType<typeof setTimeout>
    let lastRan: number

    return function (this: any, ...args: Parameters<T>): ReturnType<T> | void {
      if (!inThrottle) {
        func.apply(this, args)
        lastRan = Date.now()
        inThrottle = true
      } else {
        clearTimeout(lastFunc)
        lastFunc = setTimeout(
          () => {
            if (Date.now() - lastRan >= limit) {
              func.apply(this, args)
              lastRan = Date.now()
            }
          },
          limit - (Date.now() - lastRan),
        )
      }
    } as T
  }
}

export class CollaborationManager {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private websocket: WebSocket | null = null
  private users: Map<string, User> = new Map()
  private currentUserId: string
  private roomId: string
  private eventQueue: CollaborationEvent[] = []
  private isConnected = false

  constructor(canvas: HTMLCanvasElement, roomId: string, userId: string) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Contexto 2D não disponível")
    this.ctx = ctx

    this.roomId = roomId
    this.currentUserId = userId
    this.setupCursorTracking()
  }

  public async connect(websocketUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(websocketUrl)

      this.websocket.onopen = () => {
        this.isConnected = true
        this.sendEvent({
          type: "join",
          roomId: this.roomId,
          userId: this.currentUserId,
        })
        resolve()
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleRemoteEvent(data)
        } catch (error) {
          console.error("Erro ao processar mensagem:", error)
        }
      }

      this.websocket.onclose = () => {
        this.isConnected = false
        // Tentar reconectar após 3 segundos
        setTimeout(() => this.connect(websocketUrl), 3000)
      }

      this.websocket.onerror = (error) => {
        reject(error)
      }
    })
  }

  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    this.isConnected = false
  }

  public sendDrawEvent(path: { x: number; y: number }[], tool: string, color: string, size: number): void {
    const event: CollaborationEvent = {
      type: "draw",
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { path, tool, color, size },
    }

    this.sendEvent(event)
  }

  public sendEraseEvent(path: { x: number; y: number }[], size: number): void {
    const event: CollaborationEvent = {
      type: "erase",
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: { path, size },
    }

    this.sendEvent(event)
  }

  public sendClearEvent(): void {
    const event: CollaborationEvent = {
      type: "clear",
      userId: this.currentUserId,
      timestamp: Date.now(),
      data: {},
    }

    this.sendEvent(event)
  }

  private sendEvent(event: any): void {
    if (this.isConnected && this.websocket) {
      this.websocket.send(JSON.stringify(event))
    } else {
      // Adicionar à fila para enviar quando reconectar
      this.eventQueue.push(event)
    }
  }

  private handleRemoteEvent(event: CollaborationEvent): void {
    // Ignorar eventos próprios
    if (event.userId === this.currentUserId) return

    switch (event.type) {
      case "draw":
        this.applyRemoteDraw(event)
        break
      case "erase":
        this.applyRemoteErase(event)
        break
      case "clear":
        this.applyRemoteClear(event)
        break
      case "cursor":
        this.updateRemoteCursor(event)
        break
      case "user_joined":
        this.addUser(event.data)
        break
      case "user_left":
        this.removeUser(event.userId)
        break
    }
  }

  private applyRemoteDraw(event: CollaborationEvent): void {
    const { path, tool, color, size } = event.data

    this.ctx.save()
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = size
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"

    this.ctx.beginPath()
    if (path.length > 0) {
      this.ctx.moveTo(path[0].x, path[0].y)
      for (let i = 1; i < path.length; i++) {
        this.ctx.lineTo(path[i].x, path[i].y)
      }
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  private applyRemoteErase(event: CollaborationEvent): void {
    const { path, size } = event.data

    this.ctx.save()
    this.ctx.globalCompositeOperation = "destination-out"
    this.ctx.lineWidth = size
    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"

    this.ctx.beginPath()
    if (path.length > 0) {
      this.ctx.moveTo(path[0].x, path[0].y)
      for (let i = 1; i < path.length; i++) {
        this.ctx.lineTo(path[i].x, path[i].y)
      }
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  private applyRemoteClear(event: CollaborationEvent): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private updateRemoteCursor(event: CollaborationEvent): void {
    const user = this.users.get(event.userId)
    if (user) {
      user.cursor = event.data.cursor
      this.renderCursors()
    }
  }

  private setupCursorTracking(): void {
    const performance = PerformanceManager.getInstance()

    const sendCursor = performance.throttle((e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect()
      const cursor = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      this.sendEvent({
        type: "cursor",
        userId: this.currentUserId,
        timestamp: Date.now(),
        data: { cursor },
      })
    }, 50) // 20fps para cursores

    this.canvas.addEventListener("mousemove", sendCursor)
  }

  private renderCursors(): void {
    // Criar overlay para cursores se não existir
    let cursorOverlay = document.getElementById("cursor-overlay") as HTMLCanvasElement
    if (!cursorOverlay) {
      cursorOverlay = document.createElement("canvas")
      cursorOverlay.id = "cursor-overlay"
      cursorOverlay.width = this.canvas.width
      cursorOverlay.height = this.canvas.height
      cursorOverlay.style.position = "absolute"
      cursorOverlay.style.top = "0"
      cursorOverlay.style.left = "0"
      cursorOverlay.style.pointerEvents = "none"
      cursorOverlay.style.zIndex = "1000"
      this.canvas.parentElement?.appendChild(cursorOverlay)
    }

    const overlayCtx = cursorOverlay.getContext("2d")!
    overlayCtx.clearRect(0, 0, cursorOverlay.width, cursorOverlay.height)

    // Renderizar cursores dos outros usuários
    for (const user of this.users.values()) {
      if (user.cursor && user.isActive && user.id !== this.currentUserId) {
        this.drawUserCursor(overlayCtx, user)
      }
    }
  }

  private drawUserCursor(ctx: CanvasRenderingContext2D, user: User): void {
    if (!user.cursor) return

    ctx.save()

    // Desenhar cursor
    ctx.fillStyle = user.color
    ctx.beginPath()
    ctx.arc(user.cursor.x, user.cursor.y, 8, 0, Math.PI * 2)
    ctx.fill()

    // Desenhar nome do usuário
    ctx.fillStyle = "white"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(user.name, user.cursor.x, user.cursor.y - 15)

    ctx.restore()
  }

  private addUser(userData: User): void {
    this.users.set(userData.id, userData)
  }

  private removeUser(userId: string): void {
    this.users.delete(userId)
    this.renderCursors()
  }

  public getConnectedUsers(): User[] {
    return Array.from(this.users.values()).filter((user) => user.isActive)
  }

  public isUserConnected(): boolean {
    return this.isConnected
  }
}
