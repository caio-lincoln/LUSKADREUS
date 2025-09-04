import { fabric } from "./fabricImports"
import { v4 as uuidv4 } from "uuid"
import _ from "lodash"
import { initHighQualityFabricCanvas, HighResolutionExporter, applyMixins } from "./fabricUtils"
import { BrushFactory } from "./customBrushes"
import { ImageCropManager, ImageUtils, type ImageCropOptions } from "./imageCrop"

export interface FabricPaintBoardConfig {
  width: number
  height: number
  onSave?: (imageData: string) => void
  onClear?: () => void
  onDrawingChange?: (hasDrawing: boolean) => void
  disabled?: boolean
  enableZoom?: boolean
  enableGrid?: boolean
  enableSnap?: boolean
  backgroundColor?: string
  imageCropOptions?: ImageCropOptions
}

/**
 * Implementação avançada do PaintBoard usando Fabric.js
 * com todas as características de alta qualidade solicitadas
 */
export class FabricPaintBoard {
  private canvas: fabric.Canvas
  private config: FabricPaintBoardConfig
  private hasDrawing = false
  private isDrawing = false

  // Configurações de desenho
  private brushSize = 5
  private brushColor = "#000000"
  private brushOpacity = 1
  private currentTool = "brush"
  private currentBrushType = "pencil"

  // Managers especializados
  private imageCropManager: ImageCropManager

  // Estado interno
  private _disposed = false

  constructor(canvasElement: HTMLCanvasElement, config: FabricPaintBoardConfig) {
    this.config = config

    // Inicializar canvas com configurações de alta qualidade
    this.canvas = initHighQualityFabricCanvas(canvasElement, {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor || "#ffffff",
      enableRetinaScaling: true,
      preserveObjectStacking: true,
      selectionColor: "rgba(101, 204, 138, 0.3)",
      borderColor: "#65CC8A",
      cornerColor: "#65CC8A",
      cornerStyle: "circle",
      borderDashArray: [3, 3],
      transparentCorners: false,
    })

    // Aplicar mixins para funcionalidades avançadas
    applyMixins(this.canvas, ["HistoryMixin", "GridMixin", "SnapMixin"])

    // Inicializar managers
    this.imageCropManager = new ImageCropManager(this.canvas, config.imageCropOptions || {})

    this.init()
  }

  private init() {
    // Configurar eventos do canvas
    this.setupCanvasEvents()

    // Configurar ferramentas iniciais
    this.setupInitialTools()

    // Configurar funcionalidades opcionais
    if (this.config.enableGrid) {
      this.canvas.showGrid?.()
    }

    if (this.config.enableSnap) {
      this.canvas.enableSnap?.()
    }

    // Salvar estado inicial
    this.canvas.saveState?.()

    // Configurar modo de desenho inicial
    this.setBrushMode()

    console.log("🎨 FabricPaintBoard inicializado com alta qualidade:", {
      width: this.config.width,
      height: this.config.height,
      retinaScaling: true,
      devicePixelRatio: window.devicePixelRatio || 1,
      mixins: ["History", "Grid", "Snap"],
      tools: ["brush", "eraser", "shapes", "text", "image"],
    })
  }

  private setupCanvasEvents() {
    // Eventos de desenho
    this.canvas.on("path:created", (e) => {
      const path = e.path
      if (path) {
        path.set("id", uuidv4())
        this.setHasDrawing(true)
        this.canvas.saveState?.()
        console.log("✏️ Novo path criado:", path.id)
      }
    })

    // Eventos de objetos
    this.canvas.on("object:added", (e) => {
      if (e.target && !e.target.id) {
        e.target.set("id", uuidv4())
      }
      this.setHasDrawing(this.canvas.getObjects().length > 0)
    })

    this.canvas.on("object:removed", () => {
      this.setHasDrawing(this.canvas.getObjects().length > 0)
    })

    // Eventos de seleção para melhor UX
    this.canvas.on("selection:created", (e) => {
      console.log("🎯 Seleção criada:", e.selected?.length, "objetos")
    })

    this.canvas.on("selection:updated", (e) => {
      console.log("🎯 Seleção atualizada:", e.selected?.length, "objetos")
    })

    // Eventos de modificação
    this.canvas.on("object:modified", (e) => {
      this.canvas.saveState?.()
      console.log("✏️ Objeto modificado:", e.target?.id)
    })

    // Eventos de zoom para feedback visual
    this.canvas.on("mouse:wheel", () => {
      const zoom = this.canvas.getZoom()
      console.log("🔍 Zoom alterado:", `${Math.round(zoom * 100)}%`)
    })

    // Throttle para eventos de mouse move
    const throttledMouseMove = _.throttle((e: fabric.IEvent) => {
      // Lógica adicional para mouse move se necessário
    }, 16) // 60fps

    this.canvas.on("mouse:move", throttledMouseMove)
  }

  private setupInitialTools() {
    // Configurar pincel inicial
    this.canvas.freeDrawingBrush = BrushFactory.createBrush(this.currentBrushType as any, this.canvas, {
      width: this.brushSize,
      color: this.brushColor,
    })

    // Configurar opacidade global
    this.canvas.freeDrawingBrush.color = this.brushColor
    this.canvas.freeDrawingBrush.width = this.brushSize
  }

  private setHasDrawing(hasDrawing: boolean) {
    this.hasDrawing = hasDrawing
    if (this.config.onDrawingChange) {
      this.config.onDrawingChange(hasDrawing)
    }
  }

  // Métodos públicos de controle

  public updateConfig(newConfig: Partial<FabricPaintBoardConfig>) {
    this.config = { ...this.config, ...newConfig }

    if (newConfig.width || newConfig.height) {
      this.canvas.setDimensions({
        width: this.config.width,
        height: this.config.height,
      })
    }

    if (newConfig.disabled !== undefined) {
      this.setDisabled(newConfig.disabled)
    }

    if (newConfig.backgroundColor) {
      this.canvas.setBackgroundColor(newConfig.backgroundColor, () => {
        this.canvas.renderAll()
      })
    }

    if (newConfig.enableGrid !== undefined) {
      if (newConfig.enableGrid) {
        this.canvas.showGrid?.()
      } else {
        this.canvas.hideGrid?.()
      }
    }

    if (newConfig.enableSnap !== undefined) {
      if (newConfig.enableSnap) {
        this.canvas.enableSnap?.()
      } else {
        this.canvas.disableSnap?.()
      }
    }
  }

  private setDisabled(disabled: boolean) {
    if (disabled) {
      this.canvas.isDrawingMode = false
      this.canvas.selection = false
      this.canvas.forEachObject((obj) => {
        obj.selectable = false
        obj.evented = false
      })
    } else {
      this.canvas.selection = true
      this.canvas.forEachObject((obj) => {
        obj.selectable = true
        obj.evented = true
      })

      // Restaurar modo de desenho se era a ferramenta ativa
      if (this.currentTool === "brush") {
        this.canvas.isDrawingMode = true
      }
    }
  }

  // Métodos de ferramentas

  public setBrushMode() {
    this.currentTool = "brush"
    this.canvas.isDrawingMode = true
    this.canvas.selection = false

    // Configurar pincel
    this.canvas.freeDrawingBrush = BrushFactory.createBrush(this.currentBrushType as any, this.canvas, {
      width: this.brushSize,
      color: this.brushColor,
    })

    console.log("🖌️ Modo pincel ativado:", this.currentBrushType)
  }

  public setEraserMode() {
    this.currentTool = "eraser"
    this.canvas.isDrawingMode = true
    this.canvas.selection = false

    // Configurar borracha
    this.canvas.freeDrawingBrush = new fabric.EraserBrush(this.canvas)
    this.canvas.freeDrawingBrush.width = this.brushSize

    console.log("🧽 Modo borracha ativado")
  }

  public setSelectionMode() {
    this.currentTool = "selection"
    this.canvas.isDrawingMode = false
    this.canvas.selection = true

    console.log("👆 Modo seleção ativado")
  }

  public setTool(tool: string) {
    switch (tool) {
      case "brush":
        this.setBrushMode()
        break
      case "eraser":
        this.setEraserMode()
        break
      case "selection":
        this.setSelectionMode()
        break
      case "line":
        this.setShapeMode("line")
        break
      case "rectangle":
        this.setShapeMode("rectangle")
        break
      case "circle":
        this.setShapeMode("circle")
        break
      case "text":
        this.setTextMode()
        break
      default:
        this.setBrushMode()
    }
  }

  private setShapeMode(shape: "line" | "rectangle" | "circle") {
    this.currentTool = shape
    this.canvas.isDrawingMode = false
    this.canvas.selection = false

    // Configurar eventos para desenhar formas
    this.setupShapeDrawing(shape)

    console.log(`📐 Modo ${shape} ativado`)
  }

  private setupShapeDrawing(shape: "line" | "rectangle" | "circle") {
    let isDown = false
    let origX = 0
    let origY = 0
    let currentShape: fabric.Object | null = null

    const mouseDown = (o: fabric.IEvent) => {
      if (!o.pointer) return

      isDown = true
      const pointer = this.canvas.getPointer(o.e)
      origX = pointer.x
      origY = pointer.y

      // Criar forma baseada no tipo
      switch (shape) {
        case "line":
          currentShape = new fabric.Line([origX, origY, origX, origY], {
            stroke: this.brushColor,
            strokeWidth: this.brushSize,
            selectable: false,
            evented: false,
          })
          break

        case "rectangle":
          currentShape = new fabric.Rect({
            left: origX,
            top: origY,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: this.brushColor,
            strokeWidth: this.brushSize,
            selectable: false,
            evented: false,
          })
          break

        case "circle":
          currentShape = new fabric.Circle({
            left: origX,
            top: origY,
            radius: 0,
            fill: "transparent",
            stroke: this.brushColor,
            strokeWidth: this.brushSize,
            selectable: false,
            evented: false,
          })
          break
      }

      if (currentShape) {
        this.canvas.add(currentShape)
      }
    }

    const mouseMove = (o: fabric.IEvent) => {
      if (!isDown || !currentShape || !o.pointer) return

      const pointer = this.canvas.getPointer(o.e)

      switch (shape) {
        case "line":
          ;(currentShape as fabric.Line).set({
            x2: pointer.x,
            y2: pointer.y,
          })
          break

        case "rectangle":
          const width = pointer.x - origX
          const height = pointer.y - origY
          ;(currentShape as fabric.Rect).set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? origX : pointer.x,
            top: height > 0 ? origY : pointer.y,
          })
          break

        case "circle":
          const radius = Math.sqrt(Math.pow(pointer.x - origX, 2) + Math.pow(pointer.y - origY, 2)) / 2
          ;(currentShape as fabric.Circle).set({
            radius: radius,
            left: origX - radius,
            top: origY - radius,
          })
          break
      }

      this.canvas.renderAll()
    }

    const mouseUp = () => {
      if (!isDown || !currentShape) return

      isDown = false

      // Finalizar forma
      currentShape.set({
        selectable: true,
        evented: true,
        id: uuidv4(),
      })

      this.canvas.saveState?.()
      this.setHasDrawing(true)
      currentShape = null

      console.log(`📐 ${shape} criado`)
    }

    // Remover eventos anteriores
    this.canvas.off("mouse:down")
    this.canvas.off("mouse:move")
    this.canvas.off("mouse:up")

    // Adicionar novos eventos
    this.canvas.on("mouse:down", mouseDown)
    this.canvas.on("mouse:move", mouseMove)
    this.canvas.on("mouse:up", mouseUp)
  }

  private setTextMode() {
    this.currentTool = "text"
    this.canvas.isDrawingMode = false
    this.canvas.selection = false

    // Configurar evento para adicionar texto
    const addText = (o: fabric.IEvent) => {
      if (!o.pointer) return

      const pointer = this.canvas.getPointer(o.e)
      const text = new fabric.IText("Digite aqui...", {
        left: pointer.x,
        top: pointer.y,
        fontFamily: "Arial",
        fontSize: this.brushSize * 4,
        fill: this.brushColor,
        id: uuidv4(),
      })

      this.canvas.add(text)
      this.canvas.setActiveObject(text)
      text.enterEditing()

      this.canvas.saveState?.()
      this.setHasDrawing(true)

      console.log("📝 Texto adicionado")
    }

    this.canvas.off("mouse:down")
    this.canvas.on("mouse:down", addText)
  }

  // Métodos de configuração de pincel

  public setBrushSize(size: number) {
    this.brushSize = Math.max(1, Math.min(100, size))

    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = this.brushSize
    }
  }

  public setBrushColor(color: string) {
    this.brushColor = color

    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = color
    }
  }

  public setBrushOpacity(opacity: number) {
    this.brushOpacity = Math.max(0, Math.min(1, opacity))

    // Aplicar opacidade ao pincel atual
    if (this.canvas.freeDrawingBrush) {
      const color = this.brushColor
      const rgba = this.hexToRgba(color, this.brushOpacity)
      this.canvas.freeDrawingBrush.color = rgba
    }
  }

  public setBrushType(type: "pencil" | "shadow" | "spray" | "pattern" | "calligraphy") {
    this.currentBrushType = type

    if (this.currentTool === "brush") {
      this.canvas.freeDrawingBrush = BrushFactory.createBrush(type, this.canvas, {
        width: this.brushSize,
        color: this.brushColor,
      })
    }

    console.log("🖌️ Tipo de pincel alterado:", type)
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Métodos de histórico

  public undo() {
    this.canvas.undo?.()
  }

  public redo() {
    this.canvas.redo?.()
  }

  public canUndo(): boolean {
    return this.canvas.canUndo?.() || false
  }

  public canRedo(): boolean {
    return this.canvas.canRedo?.() || false
  }

  // Métodos de zoom

  public zoomIn() {
    const currentZoom = this.canvas.getZoom()
    const newZoom = Math.min(currentZoom * 1.25, 5)
    this.canvas.zoomToCenter?.(newZoom)
  }

  public zoomOut() {
    const currentZoom = this.canvas.getZoom()
    const newZoom = Math.max(currentZoom * 0.8, 0.1)
    this.canvas.zoomToCenter?.(newZoom)
  }

  public resetZoom() {
    this.canvas.zoomToCenter?.(1)
  }

  public getZoom(): number {
    return this.canvas.getZoom()
  }

  public getZoomPercentage(): number {
    return Math.round(this.canvas.getZoom() * 100)
  }

  // Métodos de grid e snap

  public toggleGrid() {
    this.canvas.toggleGrid?.()
  }

  public toggleSnap() {
    if (this.canvas._snapEnabled) {
      this.canvas.disableSnap?.()
    } else {
      this.canvas.enableSnap?.()
    }
  }

  // Métodos de imagem

  public async loadImage(file: File): Promise<fabric.Image> {
    const image = await ImageUtils.loadImageToCanvas(this.canvas, file, {
      maxWidth: this.config.width * 0.8,
      maxHeight: this.config.height * 0.8,
      centerImage: true,
    })

    this.canvas.saveState?.()
    this.setHasDrawing(true)

    console.log("🖼️ Imagem carregada:", image.id)
    return image
  }

  public activateImageCrop(image: fabric.Image) {
    this.imageCropManager.activateCrop(image)
  }

  public async applyCrop(): Promise<fabric.Image | null> {
    const result = await this.imageCropManager.applyCrop()
    if (result) {
      this.canvas.saveState?.()
    }
    return result
  }

  public deactivateCrop() {
    this.imageCropManager.deactivateCrop()
  }

  // Métodos de exportação e salvamento

  public save(): string {
    const imageData = HighResolutionExporter.exportCanvas(this.canvas, {
      format: "png",
      quality: 1,
      multiplier: window.devicePixelRatio || 1,
    })

    if (this.config.onSave) {
      this.config.onSave(imageData)
    }

    return imageData
  }

  public download(filename?: string, format: "png" | "jpeg" | "svg" = "png") {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
    const name = filename || `fabric_drawing_${timestamp}`

    HighResolutionExporter.downloadCanvas(this.canvas, name, {
      format,
      quality: 0.9,
      multiplier: window.devicePixelRatio || 1,
    })
  }

  public exportAsJSON(): string {
    return JSON.stringify(this.canvas.toJSON(["id"]))
  }

  public async importFromJSON(jsonData: string): Promise<void> {
    return new Promise((resolve) => {
      this.canvas.loadFromJSON(jsonData, () => {
        this.canvas.renderAll()
        this.canvas.saveState?.()
        this.setHasDrawing(this.canvas.getObjects().length > 0)
        resolve()
      })
    })
  }

  // Métodos de limpeza

  public clear() {
    this.canvas.clear()
    this.canvas.setBackgroundColor(this.config.backgroundColor || "#ffffff", () => {
      this.canvas.renderAll()
    })

    this.setHasDrawing(false)
    this.canvas.saveState?.()

    if (this.config.onClear) {
      this.config.onClear()
    }

    console.log("🧹 Canvas limpo")
  }

  public deleteSelected() {
    const activeObjects = this.canvas.getActiveObjects()
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => {
        this.canvas.remove(obj)
      })
      this.canvas.discardActiveObject()
      this.canvas.saveState?.()
      this.setHasDrawing(this.canvas.getObjects().length > 0)

      console.log("🗑️ Objetos selecionados removidos:", activeObjects.length)
    }
  }

  // Métodos de seleção e manipulação

  public selectAll() {
    const allObjects = this.canvas.getObjects()
    if (allObjects.length > 0) {
      const selection = new fabric.ActiveSelection(allObjects, {
        canvas: this.canvas,
      })
      this.canvas.setActiveObject(selection)
      this.canvas.renderAll()

      console.log("🎯 Todos os objetos selecionados:", allObjects.length)
    }
  }

  public deselectAll() {
    this.canvas.discardActiveObject()
    this.canvas.renderAll()

    console.log("🎯 Seleção removida")
  }

  public duplicateSelected() {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: cloned.left! + 10,
          top: cloned.top! + 10,
          id: uuidv4(),
        })

        if (cloned.type === "activeSelection") {
          // Duplicar seleção múltipla
          ;(cloned as fabric.ActiveSelection).canvas = this.canvas
          ;(cloned as fabric.ActiveSelection).forEachObject((obj) => {
            obj.set("id", uuidv4())
            this.canvas.add(obj)
          })
        } else {
          this.canvas.add(cloned)
        }

        this.canvas.setActiveObject(cloned)
        this.canvas.saveState?.()
        this.setHasDrawing(true)
        this.canvas.renderAll()

        console.log("📋 Objeto duplicado:", cloned.id)
      })
    }
  }

  // Métodos de camadas

  public bringToFront() {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      this.canvas.bringToFront(activeObject)
      this.canvas.saveState?.()
      console.log("⬆️ Objeto movido para frente:", activeObject.id)
    }
  }

  public sendToBack() {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      this.canvas.sendToBack(activeObject)
      this.canvas.saveState?.()
      console.log("⬇️ Objeto movido para trás:", activeObject.id)
    }
  }

  public bringForward() {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      this.canvas.bringForward(activeObject)
      this.canvas.saveState?.()
      console.log("↗️ Objeto movido uma camada para frente:", activeObject.id)
    }
  }

  public sendBackward() {
    const activeObject = this.canvas.getActiveObject()
    if (activeObject) {
      this.canvas.sendBackward(activeObject)
      this.canvas.saveState?.()
      console.log("↙️ Objeto movido uma camada para trás:", activeObject.id)
    }
  }

  // Getters

  public getCurrentTool(): string {
    return this.currentTool
  }

  public getBrushSize(): number {
    return this.brushSize
  }

  public getBrushColor(): string {
    return this.brushColor
  }

  public getBrushOpacity(): number {
    return this.brushOpacity
  }

  public getCurrentBrushType(): string {
    return this.currentBrushType
  }

  public getCanvas(): fabric.Canvas {
    return this.canvas
  }

  public getImageCropManager(): ImageCropManager {
    return this.imageCropManager
  }

  public hasContent(): boolean {
    return this.hasDrawing
  }

  public getObjectCount(): number {
    return this.canvas.getObjects().length
  }

  public getSelectedObjects(): fabric.Object[] {
    return this.canvas.getActiveObjects()
  }

  // Métodos de limpeza e dispose

  public dispose() {
    if (this._disposed) return

    // Limpar eventos
    this.canvas.off()

    // Limpar managers
    this.imageCropManager.deactivateCrop()

    // Limpar canvas
    this.canvas.clear()

    // Limpar redimensionamento responsivo
    this.canvas.disposeResize?.()

    // Marcar como disposed
    this._disposed = true

    console.log("🧹 FabricPaintBoard disposed")
  }

  // Métodos de debug e informações

  public getCanvasInfo() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      zoom: this.canvas.getZoom(),
      objectCount: this.canvas.getObjects().length,
      hasDrawing: this.hasDrawing,
      currentTool: this.currentTool,
      brushType: this.currentBrushType,
      brushSize: this.brushSize,
      brushColor: this.brushColor,
      brushOpacity: this.brushOpacity,
      devicePixelRatio: window.devicePixelRatio || 1,
      isDrawingMode: this.canvas.isDrawingMode,
      selection: this.canvas.selection,
    }
  }

  public logCanvasState() {
    console.table(this.getCanvasInfo())
  }
}
