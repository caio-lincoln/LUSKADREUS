import { fabric } from "./fabricImports"

/**
 * Pincel customizado com sombra e opacidade
 */
export class ShadowBrush extends fabric.PencilBrush {
  shadowColor = "rgba(0, 0, 0, 0.3)"
  shadowBlur = 5
  shadowOffsetX = 2
  shadowOffsetY = 2

  constructor(canvas: fabric.Canvas) {
    super(canvas)
  }

  _render(ctx: CanvasRenderingContext2D) {
    // Configurar sombra
    ctx.shadowColor = this.shadowColor
    ctx.shadowBlur = this.shadowBlur
    ctx.shadowOffsetX = this.shadowOffsetX
    ctx.shadowOffsetY = this.shadowOffsetY

    // Renderizar com sombra
    super._render(ctx)

    // Limpar sombra
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }
}

/**
 * Pincel de spray/aerógrafo customizado
 */
export class SprayBrush extends fabric.BaseBrush {
  density = 20
  dotWidth = 1
  dotWidthVariance = 1
  randomOpacity = false

  constructor(canvas: fabric.Canvas) {
    super(canvas)
  }

  onMouseDown(pointer: fabric.Point) {
    this._points = []
    this._points.push(pointer)
    this._render()
  }

  onMouseMove(pointer: fabric.Point) {
    this._points.push(pointer)
    this._render()
  }

  onMouseUp() {
    this._finalizeAndAddPath()
  }

  _render() {
    const ctx = this.canvas.contextTop
    const points = this._points

    ctx.save()
    ctx.globalAlpha = this.color.includes("rgba") ? 1 : 0.6

    points.forEach((point) => {
      for (let i = 0; i < this.density; i++) {
        const radius = this.width / 2
        const offsetX = (Math.random() - 0.5) * radius * 2
        const offsetY = (Math.random() - 0.5) * radius * 2
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY)

        if (distance <= radius) {
          const dotSize = this.dotWidth + Math.random() * this.dotWidthVariance
          const opacity = this.randomOpacity ? Math.random() * 0.8 + 0.2 : 1

          ctx.globalAlpha = opacity
          ctx.fillStyle = this.color
          ctx.fillRect(point.x + offsetX - dotSize / 2, point.y + offsetY - dotSize / 2, dotSize, dotSize)
        }
      }
    })

    ctx.restore()
  }

  _finalizeAndAddPath() {
    const ctx = this.canvas.contextTop
    this.canvas.clearContext(this.canvas.contextTop)

    // Criar um path com os pontos do spray
    if (this._points && this._points.length > 1) {
      const path = this._createPath()
      if (path) {
        this.canvas.add(path)
        this.canvas.renderAll()
      }
    }
  }

  _createPath(): fabric.Path | null {
    const points = this._points
    if (!points || points.length < 2) return null

    let pathString = `M ${points[0].x} ${points[0].y}`

    for (let i = 1; i < points.length; i++) {
      pathString += ` L ${points[i].x} ${points[i].y}`
    }

    return new fabric.Path(pathString, {
      fill: "",
      stroke: this.color,
      strokeWidth: this.width,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    })
  }

  private _points: fabric.Point[] = []
}

/**
 * Pincel com padrão/textura
 */
export class PatternBrush extends fabric.PatternBrush {
  patternSize = 10
  patternType: "dots" | "lines" | "cross" | "diagonal" = "dots"

  constructor(canvas: fabric.Canvas) {
    super(canvas)
    this.createPattern()
  }

  createPattern() {
    const patternCanvas = document.createElement("canvas")
    const size = this.patternSize
    patternCanvas.width = size
    patternCanvas.height = size

    const ctx = patternCanvas.getContext("2d")!
    ctx.fillStyle = this.color

    switch (this.patternType) {
      case "dots":
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 4, 0, Math.PI * 2)
        ctx.fill()
        break

      case "lines":
        ctx.fillRect(0, size / 2 - 1, size, 2)
        break

      case "cross":
        ctx.fillRect(0, size / 2 - 1, size, 2)
        ctx.fillRect(size / 2 - 1, 0, 2, size)
        break

      case "diagonal":
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(size, size)
        ctx.strokeStyle = this.color
        ctx.lineWidth = 2
        ctx.stroke()
        break
    }

    this.source = patternCanvas
  }

  setPatternType(type: "dots" | "lines" | "cross" | "diagonal") {
    this.patternType = type
    this.createPattern()
  }

  setColor(color: string) {
    this.color = color
    this.createPattern()
  }
}

/**
 * Pincel de caligrafía com pressão simulada
 */
export class CalligraphyBrush extends fabric.PencilBrush {
  angle = 45 // Ângulo da pena em graus
  minWidth = 1
  maxWidth = 10

  constructor(canvas: fabric.Canvas) {
    super(canvas)
  }

  onMouseMove(pointer: fabric.Point, options: any) {
    if (!this._points) this._points = []

    // Calcular velocidade para simular pressão
    const velocity = this._calculateVelocity(pointer)
    const pressure = Math.max(0.1, 1 - velocity / 10)

    // Ajustar largura baseada na "pressão"
    const currentWidth = this.minWidth + (this.maxWidth - this.minWidth) * pressure

    this._points.push({
      x: pointer.x,
      y: pointer.y,
      width: currentWidth,
    })

    super.onMouseMove(pointer, options)
  }

  _render(ctx: CanvasRenderingContext2D) {
    if (!this._points || this._points.length < 2) return

    ctx.save()
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    for (let i = 1; i < this._points.length; i++) {
      const point = this._points[i]
      const prevPoint = this._points[i - 1]

      ctx.beginPath()
      ctx.moveTo(prevPoint.x, prevPoint.y)
      ctx.lineTo(point.x, point.y)
      ctx.strokeStyle = this.color
      ctx.lineWidth = point.width || this.width
      ctx.stroke()
    }

    ctx.restore()
  }

  private _calculateVelocity(currentPoint: fabric.Point): number {
    if (!this._lastPoint || !this._lastTime) {
      this._lastPoint = currentPoint
      this._lastTime = Date.now()
      return 0
    }

    const distance = Math.sqrt(
      Math.pow(currentPoint.x - this._lastPoint.x, 2) + Math.pow(currentPoint.y - this._lastPoint.y, 2),
    )

    const time = Date.now() - this._lastTime
    const velocity = distance / Math.max(time, 1)

    this._lastPoint = currentPoint
    this._lastTime = Date.now()

    return velocity
  }

  private _lastPoint?: fabric.Point
  private _lastTime?: number
  private _points?: Array<fabric.Point & { width?: number }>
}

/**
 * Factory para criar pincéis customizados
 */
export class BrushFactory {
  static createBrush(
    type: "pencil" | "shadow" | "spray" | "pattern" | "calligraphy",
    canvas: fabric.Canvas,
    options: any = {},
  ): fabric.BaseBrush {
    switch (type) {
      case "shadow":
        const shadowBrush = new ShadowBrush(canvas)
        Object.assign(shadowBrush, options)
        return shadowBrush

      case "spray":
        const sprayBrush = new SprayBrush(canvas)
        Object.assign(sprayBrush, options)
        return sprayBrush

      case "pattern":
        const patternBrush = new PatternBrush(canvas)
        Object.assign(patternBrush, options)
        return patternBrush

      case "calligraphy":
        const calligraphyBrush = new CalligraphyBrush(canvas)
        Object.assign(calligraphyBrush, options)
        return calligraphyBrush

      default:
        const pencilBrush = new fabric.PencilBrush(canvas)
        Object.assign(pencilBrush, options)
        return pencilBrush
    }
  }

  static getBrushTypes() {
    return [
      { id: "pencil", name: "Lápis", description: "Pincel básico" },
      { id: "shadow", name: "Sombra", description: "Pincel com sombra" },
      { id: "spray", name: "Spray", description: "Efeito aerógrafo" },
      { id: "pattern", name: "Padrão", description: "Pincel com textura" },
      { id: "calligraphy", name: "Caligrafia", description: "Pincel caligráfico" },
    ]
  }
}

// Declarações de tipos
declare module "fabric" {
  namespace fabric {
    interface Point {
      width?: number
    }
  }
}
