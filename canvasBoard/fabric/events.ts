// Gerenciamento de eventos do canvas

export interface CanvasEvent {
  type: string
  data: any
  timestamp: number
}

export class CanvasEventManager {
  private listeners: Map<string, Function[]> = new Map()
  private history: CanvasEvent[] = []

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
  }

  public off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  public emit(event: string, data: any) {
    const canvasEvent: CanvasEvent = {
      type: event,
      data,
      timestamp: Date.now(),
    }

    this.history.push(canvasEvent)

    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(canvasEvent))
    }
  }

  public getHistory(): CanvasEvent[] {
    return [...this.history]
  }

  public clearHistory() {
    this.history = []
  }
}
