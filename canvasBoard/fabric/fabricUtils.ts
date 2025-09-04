import { fabric } from "./fabricImports"
import { v4 as uuidv4 } from "uuid"
import _ from "lodash"

export interface HighQualityCanvasOptions {
  width: number
  height: number
  backgroundColor?: string
  enableRetinaScaling?: boolean
  preserveObjectStacking?: boolean
  selectionColor?: string
  borderColor?: string
  cornerColor?: string
  cornerStyle?: "rect" | "circle"
  borderDashArray?: number[]
  transparentCorners?: boolean
}

/**
 * Inicializa um canvas Fabric.js com configurações de alta qualidade
 * Replicando padrões profissionais do paint-board-main
 */
export function initHighQualityFabricCanvas(
  canvasEl: HTMLCanvasElement,
  options: HighQualityCanvasOptions,
): fabric.Canvas {
  // Configurações padrão de alta qualidade
  const defaultOptions: Required<HighQualityCanvasOptions> = {
    width: options.width,
    height: options.height,
    backgroundColor: options.backgroundColor || "#ffffff",
    enableRetinaScaling: true,
    preserveObjectStacking: true,
    selectionColor: "rgba(101, 204, 138, 0.3)",
    borderColor: "#65CC8A",
    cornerColor: "#65CC8A",
    cornerStyle: "circle",
    borderDashArray: [3, 3],
    transparentCorners: false,
  }

  const config = { ...defaultOptions, ...options }

  // Criar canvas com configurações de alta qualidade
  const canvas = new fabric.Canvas(canvasEl, {
    width: config.width,
    height: config.height,
    backgroundColor: config.backgroundColor,
    selectionColor: config.selectionColor,
    preserveObjectStacking: config.preserveObjectStacking,
    enableRetinaScaling: config.enableRetinaScaling,
    backgroundVpt: false,
    allowTouchScrolling: false,
    selection: true,
    skipTargetFind: false,
    perPixelTargetFind: true,
    targetFindTolerance: 4,
  })

  // Configurar protótipos dos objetos para aparência consistente
  setupObjectPrototypes(config)

  // Configurar eventos de alta qualidade
  setupHighQualityEvents(canvas)

  // Configurar zoom e viewport
  setupZoomAndViewport(canvas)

  // Configurar redimensionamento responsivo
  setupResponsiveResize(canvas, canvasEl)

  console.log("🎨 Canvas Fabric.js de alta qualidade inicializado:", {
    width: config.width,
    height: config.height,
    retinaScaling: config.enableRetinaScaling,
    devicePixelRatio: window.devicePixelRatio || 1,
  })

  return canvas
}

/**
 * Configura os protótipos dos objetos Fabric.js para aparência consistente
 */
function setupObjectPrototypes(config: Required<HighQualityCanvasOptions>) {
  // Configurações globais para todos os objetos
  fabric.Object.prototype.set({
    borderColor: config.borderColor,
    cornerColor: config.cornerColor,
    cornerStyle: config.cornerStyle,
    borderDashArray: config.borderDashArray,
    transparentCorners: config.transparentCorners,
    cornerSize: 8,
    borderOpacityWhenMoving: 0.8,
    borderScaleFactor: 2,
    rotatingPointOffset: 40,
    objectCaching: true,
    statefullCache: true,
    noScaleCache: false,
  })

  // Configurações específicas para linhas
  fabric.Line.prototype.set({
    strokeLineJoin: "round",
    strokeLineCap: "round",
    fill: "",
    stroke: "#000000",
    strokeWidth: 2,
  })

  // Configurações para paths (desenho livre)
  fabric.Path.prototype.set({
    strokeLineJoin: "round",
    strokeLineCap: "round",
    fill: "",
    stroke: "#000000",
    strokeWidth: 2,
  })

  // Configurações para círculos
  fabric.Circle.prototype.set({
    fill: "transparent",
    stroke: "#000000",
    strokeWidth: 2,
  })

  // Configurações para retângulos
  fabric.Rect.prototype.set({
    fill: "transparent",
    stroke: "#000000",
    strokeWidth: 2,
  })

  // Configurações para texto
  fabric.Text.prototype.set({
    fontFamily: "Arial, sans-serif",
    fontSize: 20,
    fill: "#000000",
    textAlign: "left",
  })
}

/**
 * Configura eventos de alta qualidade para melhor performance
 */
function setupHighQualityEvents(canvas: fabric.Canvas) {
  // Throttle de eventos de mouse para melhor performance
  const throttledMouseMove = _.throttle((e: fabric.IEvent) => {
    // Lógica customizada para mouse move se necessário
  }, 16) // 60fps

  canvas.on("mouse:move", throttledMouseMove)

  // Eventos de seleção com feedback visual
  canvas.on("selection:created", (e) => {
    console.log("🎯 Objeto selecionado:", e.selected?.length)
  })

  canvas.on("selection:cleared", () => {
    console.log("🎯 Seleção limpa")
  })

  // Eventos de modificação de objetos
  canvas.on("object:modified", (e) => {
    if (e.target) {
      // Adicionar ID único se não existir
      if (!e.target.id) {
        e.target.set("id", uuidv4())
      }
      console.log("✏️ Objeto modificado:", e.target.id)
    }
  })

  // Evento de renderização para debug
  canvas.on("after:render", () => {
    // Performance monitoring se necessário
  })
}

/**
 * Configura sistema de zoom centralizado e viewport
 */
function setupZoomAndViewport(canvas: fabric.Canvas) {
  // Zoom centralizado
  canvas.zoomToCenter = function (zoomLevel: number) {
    const center = new fabric.Point(this.width! / 2, this.height! / 2)
    this.zoomToPoint(center, zoomLevel)
  }

  // Zoom suave
  canvas.smoothZoom = function (targetZoom: number, duration = 300) {
    const currentZoom = this.getZoom()
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const zoom = currentZoom + (targetZoom - currentZoom) * easeOut

      this.zoomToCenter(zoom)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  // Configurar limites de zoom
  canvas.on("mouse:wheel", (opt) => {
    const delta = opt.e.deltaY
    let zoom = canvas.getZoom()
    zoom *= 0.999 ** delta

    // Limites de zoom
    zoom = Math.max(0.1, Math.min(5, zoom))

    const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY)
    canvas.zoomToPoint(point, zoom)

    opt.e.preventDefault()
    opt.e.stopPropagation()
  })
}

/**
 * Configura redimensionamento responsivo do canvas
 */
function setupResponsiveResize(canvas: fabric.Canvas, canvasEl: HTMLCanvasElement) {
  const resizeCanvas = _.debounce(() => {
    const container = canvasEl.parentElement
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const maxWidth = containerRect.width - 40 // padding
    const maxHeight = window.innerHeight - 200 // espaço para controles

    // Manter aspect ratio
    const aspectRatio = canvas.width! / canvas.height!
    let newWidth = Math.min(maxWidth, canvas.width!)
    let newHeight = newWidth / aspectRatio

    if (newHeight > maxHeight) {
      newHeight = maxHeight
      newWidth = newHeight * aspectRatio
    }

    // Aplicar novo tamanho mantendo o conteúdo
    const zoom = canvas.getZoom()
    canvas.setDimensions({
      width: newWidth,
      height: newHeight,
    })
    canvas.setZoom(zoom)
    canvas.renderAll()

    console.log("📐 Canvas redimensionado:", { width: newWidth, height: newHeight })
  }, 250)

  window.addEventListener("resize", resizeCanvas)

  // Cleanup function
  canvas.disposeResize = () => {
    window.removeEventListener("resize", resizeCanvas)
  }
}

/**
 * Utilitários para exportação em alta resolução
 */
export class HighResolutionExporter {
  static exportCanvas(
    canvas: fabric.Canvas,
    options: {
      format?: "png" | "jpeg" | "svg"
      quality?: number
      multiplier?: number
      width?: number
      height?: number
    } = {},
  ): string {
    const { format = "png", quality = 1, multiplier = window.devicePixelRatio || 1, width, height } = options

    if (format === "svg") {
      return canvas.toSVG({
        width: width || canvas.width,
        height: height || canvas.height,
        viewBox: {
          x: 0,
          y: 0,
          width: width || canvas.width!,
          height: height || canvas.height!,
        },
      })
    }

    return canvas.toDataURL({
      format: format === "jpeg" ? "jpeg" : "png",
      quality,
      multiplier,
      width,
      height,
      enableRetinaScaling: true,
    })
  }

  static downloadCanvas(
    canvas: fabric.Canvas,
    filename = `drawing_${Date.now()}`,
    options: Parameters<typeof HighResolutionExporter.exportCanvas>[1] = {},
  ) {
    const dataURL = this.exportCanvas(canvas, options)
    const link = document.createElement("a")

    link.download = `${filename}.${options.format || "png"}`
    link.href = dataURL

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log(`📥 Download realizado: ${link.download}`)
  }
}

/**
 * Mixins para extensões customizadas
 */
export const FabricMixins = {
  // Mixin para adicionar funcionalidades de histórico
  HistoryMixin: {
    initHistory(this: fabric.Canvas) {
      this._history = []
      this._historyIndex = -1
      this._maxHistorySize = 50

      this.saveState = function () {
        // Remover estados futuros
        if (this._historyIndex < this._history.length - 1) {
          this._history = this._history.slice(0, this._historyIndex + 1)
        }

        // Adicionar novo estado
        const state = JSON.stringify(this.toJSON(["id"]))
        this._history.push(state)

        // Limitar tamanho
        if (this._history.length > this._maxHistorySize) {
          this._history.shift()
        } else {
          this._historyIndex++
        }
      }

      this.undo = function () {
        if (this._historyIndex > 0) {
          this._historyIndex--
          this.loadFromJSON(this._history[this._historyIndex], () => {
            this.renderAll()
          })
        }
      }

      this.redo = function () {
        if (this._historyIndex < this._history.length - 1) {
          this._historyIndex++
          this.loadFromJSON(this._history[this._historyIndex], () => {
            this.renderAll()
          })
        }
      }

      this.canUndo = function () {
        return this._historyIndex > 0
      }

      this.canRedo = function () {
        return this._historyIndex < this._history.length - 1
      }

      // Salvar estado inicial
      this.saveState()
    },
  },

  // Mixin para funcionalidades de grid
  GridMixin: {
    initGrid(this: fabric.Canvas, options: { size?: number; color?: string } = {}) {
      const { size = 20, color = "#e0e0e0" } = options

      this.showGrid = function () {
        const gridGroup = new fabric.Group([], {
          selectable: false,
          evented: false,
          excludeFromExport: true,
        })

        // Linhas verticais
        for (let i = 0; i <= this.width! / size; i++) {
          const line = new fabric.Line([i * size, 0, i * size, this.height!], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
          })
          gridGroup.addWithUpdate(line)
        }

        // Linhas horizontais
        for (let i = 0; i <= this.height! / size; i++) {
          const line = new fabric.Line([0, i * size, this.width!, i * size], {
            stroke: color,
            strokeWidth: 1,
            selectable: false,
            evented: false,
          })
          gridGroup.addWithUpdate(line)
        }

        this.add(gridGroup)
        this.sendToBack(gridGroup)
        this._grid = gridGroup
      }

      this.hideGrid = function () {
        if (this._grid) {
          this.remove(this._grid)
          this._grid = null
        }
      }

      this.toggleGrid = function () {
        if (this._grid) {
          this.hideGrid()
        } else {
          this.showGrid()
        }
      }
    },
  },

  // Mixin para snap to grid
  SnapMixin: {
    initSnap(this: fabric.Canvas, gridSize = 20) {
      this._snapEnabled = false
      this._gridSize = gridSize

      this.enableSnap = function () {
        this._snapEnabled = true
      }

      this.disableSnap = function () {
        this._snapEnabled = false
      }

      this.on("object:moving", (e) => {
        if (!this._snapEnabled || !e.target) return

        const obj = e.target
        const snap = this._gridSize

        obj.set({
          left: Math.round(obj.left! / snap) * snap,
          top: Math.round(obj.top! / snap) * snap,
        })
      })
    },
  },
}

/**
 * Aplicar mixins a uma instância de canvas
 */
export function applyMixins(canvas: fabric.Canvas, mixins: string[] = ["HistoryMixin"]) {
  mixins.forEach((mixinName) => {
    const mixin = FabricMixins[mixinName as keyof typeof FabricMixins]
    if (mixin) {
      Object.keys(mixin).forEach((key) => {
        if (key.startsWith("init")) {
          // Chamar métodos de inicialização
          ;(mixin as any)[key].call(canvas)
        } else {
          // Adicionar métodos ao canvas
          ;(canvas as any)[key] = (mixin as any)[key]
        }
      })
    }
  })
}

// Declarações de tipos para TypeScript
declare module "fabric" {
  namespace fabric {
    interface Canvas {
      zoomToCenter?(zoomLevel: number): void
      smoothZoom?(targetZoom: number, duration?: number): void
      disposeResize?(): void

      // History mixin
      _history?: string[]
      _historyIndex?: number
      _maxHistorySize?: number
      saveState?(): void
      undo?(): void
      redo?(): void
      canUndo?(): boolean
      canRedo?(): boolean

      // Grid mixin
      _grid?: fabric.Group
      showGrid?(): void
      hideGrid?(): void
      toggleGrid?(): void

      // Snap mixin
      _snapEnabled?: boolean
      _gridSize?: number
      enableSnap?(): void
      disableSnap?(): void
    }

    interface Object {
      id?: string
    }
  }
}
