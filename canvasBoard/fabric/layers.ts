// Sistema de camadas avançado
export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  blendMode: string
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  order: number
}

export class LayerManager {
  private layers: Map<string, Layer> = new Map()
  private activeLayerId: string | null = null
  private mainCanvas: HTMLCanvasElement
  private mainCtx: CanvasRenderingContext2D
  private layerCounter = 0

  constructor(mainCanvas: HTMLCanvasElement) {
    this.mainCanvas = mainCanvas
    const ctx = mainCanvas.getContext("2d")
    if (!ctx) throw new Error("Contexto 2D não disponível")
    this.mainCtx = ctx

    // Criar camada inicial
    this.createLayer("Camada 1")
  }

  public createLayer(name?: string): string {
    const id = `layer_${++this.layerCounter}`
    const layerName = name || `Camada ${this.layerCounter}`

    const canvas = document.createElement("canvas")
    canvas.width = this.mainCanvas.width
    canvas.height = this.mainCanvas.height

    const ctx = canvas.getContext("2d")!

    const layer: Layer = {
      id,
      name: layerName,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "source-over",
      canvas,
      ctx,
      order: this.layers.size,
    }

    this.layers.set(id, layer)
    this.activeLayerId = id
    this.renderLayers()

    return id
  }

  public deleteLayer(id: string): boolean {
    if (this.layers.size <= 1) {
      throw new Error("Não é possível excluir a última camada")
    }

    const deleted = this.layers.delete(id)
    if (deleted && this.activeLayerId === id) {
      // Selecionar próxima camada disponível
      const remainingLayers = Array.from(this.layers.keys())
      this.activeLayerId = remainingLayers[0] || null
    }

    this.renderLayers()
    return deleted
  }

  public duplicateLayer(id: string): string | null {
    const layer = this.layers.get(id)
    if (!layer) return null

    const newId = this.createLayer(`${layer.name} Cópia`)
    const newLayer = this.layers.get(newId)!

    // Copiar conteúdo
    newLayer.ctx.drawImage(layer.canvas, 0, 0)
    newLayer.opacity = layer.opacity
    newLayer.blendMode = layer.blendMode

    this.renderLayers()
    return newId
  }

  public setLayerProperty(id: string, property: keyof Layer, value: any): boolean {
    const layer = this.layers.get(id)
    if (!layer) return false
    ;(layer as any)[property] = value
    this.renderLayers()
    return true
  }

  public moveLayer(id: string, newOrder: number): boolean {
    const layer = this.layers.get(id)
    if (!layer) return false

    layer.order = newOrder
    this.reorderLayers()
    this.renderLayers()
    return true
  }

  public mergeDown(id: string): boolean {
    const layers = this.getLayersSorted()
    const currentIndex = layers.findIndex((l) => l.id === id)

    if (currentIndex <= 0) return false

    const currentLayer = layers[currentIndex]
    const belowLayer = layers[currentIndex - 1]

    // Mesclar camada atual na camada abaixo
    belowLayer.ctx.globalAlpha = currentLayer.opacity
    belowLayer.ctx.globalCompositeOperation = currentLayer.blendMode as GlobalCompositeOperation
    belowLayer.ctx.drawImage(currentLayer.canvas, 0, 0)

    // Restaurar configurações
    belowLayer.ctx.globalAlpha = 1
    belowLayer.ctx.globalCompositeOperation = "source-over"

    // Remover camada atual
    this.deleteLayer(id)
    return true
  }

  public flattenLayers(): void {
    const sortedLayers = this.getLayersSorted()
    const baseLayer = sortedLayers[0]

    // Renderizar todas as camadas na primeira
    for (let i = 1; i < sortedLayers.length; i++) {
      const layer = sortedLayers[i]
      if (layer.visible) {
        baseLayer.ctx.globalAlpha = layer.opacity
        baseLayer.ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation
        baseLayer.ctx.drawImage(layer.canvas, 0, 0)
      }
    }

    // Remover outras camadas
    for (let i = 1; i < sortedLayers.length; i++) {
      this.layers.delete(sortedLayers[i].id)
    }

    // Restaurar configurações da camada base
    baseLayer.ctx.globalAlpha = 1
    baseLayer.ctx.globalCompositeOperation = "source-over"
    baseLayer.name = "Camada Mesclada"

    this.activeLayerId = baseLayer.id
    this.renderLayers()
  }

  private reorderLayers(): void {
    const layers = Array.from(this.layers.values()).sort((a, b) => a.order - b.order)
    layers.forEach((layer, index) => {
      layer.order = index
    })
  }

  private getLayersSorted(): Layer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.order - b.order)
  }

  private renderLayers(): void {
    // Limpar canvas principal
    this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height)

    // Renderizar camadas em ordem
    const sortedLayers = this.getLayersSorted()
    for (const layer of sortedLayers) {
      if (layer.visible) {
        this.mainCtx.globalAlpha = layer.opacity
        this.mainCtx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation
        this.mainCtx.drawImage(layer.canvas, 0, 0)
      }
    }

    // Restaurar configurações
    this.mainCtx.globalAlpha = 1
    this.mainCtx.globalCompositeOperation = "source-over"
  }

  public getActiveLayer(): Layer | null {
    return this.activeLayerId ? this.layers.get(this.activeLayerId) || null : null
  }

  public setActiveLayer(id: string): boolean {
    if (this.layers.has(id)) {
      this.activeLayerId = id
      return true
    }
    return false
  }

  public getAllLayers(): Layer[] {
    return this.getLayersSorted()
  }

  public resizeLayers(width: number, height: number): void {
    for (const layer of this.layers.values()) {
      const imageData = layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height)
      layer.canvas.width = width
      layer.canvas.height = height
      layer.ctx.putImageData(imageData, 0, 0)
    }
    this.renderLayers()
  }
}
