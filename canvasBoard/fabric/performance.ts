// Sistema de performance e otimização
export class PerformanceManager {
  private static instance: PerformanceManager
  private frameId: number | null = null
  private pendingUpdates: Set<() => void> = new Set()
  private lastFrameTime = 0
  private targetFPS = 60
  private frameInterval = 1000 / this.targetFPS

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager()
    }
    return PerformanceManager.instance
  }

  // Debounce para eventos intensivos
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }) as T
  }

  // Throttle para eventos contínuos
  throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }) as T
  }

  // Agendamento de atualizações com requestAnimationFrame
  scheduleUpdate(callback: () => void) {
    this.pendingUpdates.add(callback)
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.processUpdates.bind(this))
    }
  }

  private processUpdates = (currentTime: number) => {
    if (currentTime - this.lastFrameTime >= this.frameInterval) {
      this.pendingUpdates.forEach((callback) => {
        try {
          callback()
        } catch (error) {
          console.error("Erro ao processar atualização:", error)
        }
      })
      this.pendingUpdates.clear()
      this.lastFrameTime = currentTime
    }
    this.frameId = null
  }

  // Virtualização para grandes quantidades de objetos
  virtualizeObjects<T>(
    objects: T[],
    viewportBounds: { x: number; y: number; width: number; height: number },
    getObjectBounds: (obj: T) => { x: number; y: number; width: number; height: number },
  ): T[] {
    return objects.filter((obj) => {
      const bounds = getObjectBounds(obj)
      return this.intersects(viewportBounds, bounds)
    })
  }

  private intersects(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number },
  ): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    )
  }

  // Lazy loading de recursos
  async lazyLoadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  // Pool de objetos para reutilização
  createObjectPool<T>(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    const pool: T[] = []
    const active: Set<T> = new Set()

    // Pré-popular o pool
    for (let i = 0; i < initialSize; i++) {
      pool.push(createFn())
    }

    return {
      acquire(): T {
        let obj = pool.pop()
        if (!obj) {
          obj = createFn()
        }
        active.add(obj)
        return obj
      },
      release(obj: T) {
        if (active.has(obj)) {
          active.delete(obj)
          resetFn(obj)
          pool.push(obj)
        }
      },
      clear() {
        pool.length = 0
        active.clear()
      },
    }
  }
}
