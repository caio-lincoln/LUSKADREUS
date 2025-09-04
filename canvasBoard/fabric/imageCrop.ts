import { fabric } from "./fabricImports"
import type { PixelCrop } from "react-image-crop"
import { v4 as uuidv4 } from "uuid"

export interface ImageCropOptions {
  aspect?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  keepSelection?: boolean
  disabled?: boolean
  locked?: boolean
}

/**
 * Classe para gerenciar recorte de imagens no canvas
 */
export class ImageCropManager {
  private canvas: fabric.Canvas
  private cropOverlay?: fabric.Rect
  private isActive = false
  private currentImage?: fabric.Image
  private cropOptions: ImageCropOptions

  constructor(canvas: fabric.Canvas, options: ImageCropOptions = {}) {
    this.canvas = canvas
    this.cropOptions = {
      aspect: undefined,
      minWidth: 50,
      minHeight: 50,
      keepSelection: true,
      disabled: false,
      locked: false,
      ...options,
    }
  }

  /**
   * Ativa o modo de recorte para uma imagem
   */
  async activateCrop(image: fabric.Image): Promise<void> {
    if (this.cropOptions.disabled) return

    this.currentImage = image
    this.isActive = true

    // Desabilitar seleção de outros objetos
    this.canvas.selection = false
    this.canvas.forEachObject((obj) => {
      if (obj !== image) {
        obj.selectable = false
      }
    })

    // Criar overlay de recorte
    this.createCropOverlay(image)

    console.log("✂️ Modo de recorte ativado para imagem:", image.id)
  }

  /**
   * Desativa o modo de recorte
   */
  deactivateCrop(): void {
    this.isActive = false
    this.currentImage = undefined

    // Remover overlay
    if (this.cropOverlay) {
      this.canvas.remove(this.cropOverlay)
      this.cropOverlay = undefined
    }

    // Reabilitar seleção
    this.canvas.selection = true
    this.canvas.forEachObject((obj) => {
      obj.selectable = true
    })

    this.canvas.renderAll()
    console.log("✂️ Modo de recorte desativado")
  }

  /**
   * Aplica o recorte à imagem atual
   */
  async applyCrop(): Promise<fabric.Image | null> {
    if (!this.isActive || !this.currentImage || !this.cropOverlay) {
      return null
    }

    try {
      const image = this.currentImage
      const overlay = this.cropOverlay

      // Calcular área de recorte relativa à imagem
      const imageLeft = image.left! - (image.width! * image.scaleX!) / 2
      const imageTop = image.top! - (image.height! * image.scaleY!) / 2

      const cropLeft = (overlay.left! - imageLeft) / image.scaleX!
      const cropTop = (overlay.top! - imageTop) / image.scaleY!
      const cropWidth = overlay.width! / image.scaleX!
      const cropHeight = overlay.height! / image.scaleY!

      // Criar nova imagem recortada
      const croppedImage = await this.createCroppedImage(image, cropLeft, cropTop, cropWidth, cropHeight)

      if (croppedImage) {
        // Posicionar a nova imagem no lugar da área de recorte
        croppedImage.set({
          left: overlay.left! + overlay.width! / 2,
          top: overlay.top! + overlay.height! / 2,
          id: uuidv4(),
        })

        // Remover imagem original e adicionar recortada
        this.canvas.remove(image)
        this.canvas.add(croppedImage)

        this.deactivateCrop()
        this.canvas.renderAll()

        console.log("✂️ Recorte aplicado com sucesso")
        return croppedImage
      }
    } catch (error) {
      console.error("❌ Erro ao aplicar recorte:", error)
    }

    return null
  }

  /**
   * Cria overlay visual para o recorte
   */
  private createCropOverlay(image: fabric.Image): void {
    const imageLeft = image.left! - (image.width! * image.scaleX!) / 2
    const imageTop = image.top! - (image.height! * image.scaleY!) / 2
    const imageWidth = image.width! * image.scaleX!
    const imageHeight = image.height! * image.scaleY!

    // Tamanho inicial do recorte (50% da imagem)
    const cropWidth = imageWidth * 0.5
    const cropHeight = this.cropOptions.aspect ? cropWidth / this.cropOptions.aspect : imageHeight * 0.5

    this.cropOverlay = new fabric.Rect({
      left: imageLeft + (imageWidth - cropWidth) / 2,
      top: imageTop + (imageHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
      fill: "transparent",
      stroke: "#65CC8A",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      cornerStyle: "circle",
      cornerColor: "#65CC8A",
      borderColor: "#65CC8A",
      transparentCorners: false,
    })

    // Restringir movimento dentro da imagem
    this.cropOverlay.on("moving", (e) => {
      this.constrainCropToImage(e.target as fabric.Rect, image)
    })

    this.cropOverlay.on("scaling", (e) => {
      this.constrainCropToImage(e.target as fabric.Rect, image)
      this.maintainAspectRatio(e.target as fabric.Rect)
    })

    this.canvas.add(this.cropOverlay)
    this.canvas.setActiveObject(this.cropOverlay)
    this.canvas.renderAll()
  }

  /**
   * Restringe o overlay de recorte dentro dos limites da imagem
   */
  private constrainCropToImage(cropRect: fabric.Rect, image: fabric.Image): void {
    const imageLeft = image.left! - (image.width! * image.scaleX!) / 2
    const imageTop = image.top! - (image.height! * image.scaleY!) / 2
    const imageRight = imageLeft + image.width! * image.scaleX!
    const imageBottom = imageTop + image.height! * image.scaleY!

    const cropLeft = cropRect.left!
    const cropTop = cropRect.top!
    const cropRight = cropLeft + cropRect.width! * cropRect.scaleX!
    const cropBottom = cropTop + cropRect.height! * cropRect.scaleY!

    // Ajustar posição se necessário
    let newLeft = cropLeft
    let newTop = cropTop

    if (cropLeft < imageLeft) newLeft = imageLeft
    if (cropTop < imageTop) newTop = imageTop
    if (cropRight > imageRight) newLeft = imageRight - cropRect.width! * cropRect.scaleX!
    if (cropBottom > imageBottom) newTop = imageBottom - cropRect.height! * cropRect.scaleY!

    cropRect.set({
      left: newLeft,
      top: newTop,
    })
  }

  /**
   * Mantém a proporção do recorte se especificada
   */
  private maintainAspectRatio(cropRect: fabric.Rect): void {
    if (!this.cropOptions.aspect) return

    const currentWidth = cropRect.width! * cropRect.scaleX!
    const newHeight = currentWidth / this.cropOptions.aspect

    cropRect.set({
      height: newHeight / cropRect.scaleY!,
      scaleY: cropRect.scaleX!,
    })
  }

  /**
   * Cria uma nova imagem recortada
   */
  private async createCroppedImage(
    originalImage: fabric.Image,
    cropX: number,
    cropY: number,
    cropWidth: number,
    cropHeight: number,
  ): Promise<fabric.Image | null> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      canvas.width = cropWidth
      canvas.height = cropHeight

      const img = originalImage.getElement() as HTMLImageElement

      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

      const dataURL = canvas.toDataURL("image/png")

      fabric.Image.fromURL(
        dataURL,
        (fabricImage) => {
          resolve(fabricImage)
        },
        {
          crossOrigin: "anonymous",
        },
      )
    })
  }

  /**
   * Atualiza as opções de recorte
   */
  updateOptions(options: Partial<ImageCropOptions>): void {
    this.cropOptions = { ...this.cropOptions, ...options }
  }

  /**
   * Verifica se o modo de recorte está ativo
   */
  isActiveCrop(): boolean {
    return this.isActive
  }

  /**
   * Obtém a área de recorte atual
   */
  getCurrentCrop(): PixelCrop | null {
    if (!this.cropOverlay || !this.currentImage) return null

    const image = this.currentImage
    const overlay = this.cropOverlay

    const imageLeft = image.left! - (image.width! * image.scaleX!) / 2
    const imageTop = image.top! - (image.height! * image.scaleY!) / 2

    return {
      x: (overlay.left! - imageLeft) / image.scaleX!,
      y: (overlay.top! - imageTop) / image.scaleY!,
      width: overlay.width! / image.scaleX!,
      height: overlay.height! / image.scaleY!,
      unit: "px",
    }
  }
}

/**
 * Utilitários para trabalhar com imagens
 */
export class ImageUtils {
  /**
   * Carrega uma imagem no canvas
   */
  static async loadImageToCanvas(
    canvas: fabric.Canvas,
    file: File,
    options: {
      maxWidth?: number
      maxHeight?: number
      centerImage?: boolean
    } = {},
  ): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const dataURL = e.target?.result as string

        fabric.Image.fromURL(
          dataURL,
          (img) => {
            // Redimensionar se necessário
            if (options.maxWidth || options.maxHeight) {
              const scale = Math.min(
                options.maxWidth ? options.maxWidth / img.width! : 1,
                options.maxHeight ? options.maxHeight / img.height! : 1,
                1,
              )

              img.scale(scale)
            }

            // Centralizar se solicitado
            if (options.centerImage) {
              img.set({
                left: canvas.width! / 2,
                top: canvas.height! / 2,
                originX: "center",
                originY: "center",
              })
            }

            img.set("id", uuidv4())
            canvas.add(img)
            canvas.renderAll()

            resolve(img)
          },
          {
            crossOrigin: "anonymous",
          },
        )
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Aplica filtros a uma imagem
   */
  static applyImageFilter(
    image: fabric.Image,
    filterType: "grayscale" | "sepia" | "brightness" | "contrast" | "blur",
    value?: number,
  ): void {
    let filter: fabric.IBaseFilter

    switch (filterType) {
      case "grayscale":
        filter = new fabric.Image.filters.Grayscale()
        break
      case "sepia":
        filter = new fabric.Image.filters.Sepia()
        break
      case "brightness":
        filter = new fabric.Image.filters.Brightness({ brightness: value || 0.1 })
        break
      case "contrast":
        filter = new fabric.Image.filters.Contrast({ contrast: value || 0.1 })
        break
      case "blur":
        filter = new fabric.Image.filters.Blur({ blur: value || 0.1 })
        break
      default:
        return
    }

    image.filters = image.filters || []
    image.filters.push(filter)
    image.applyFilters()
  }

  /**
   * Remove todos os filtros de uma imagem
   */
  static clearImageFilters(image: fabric.Image): void {
    image.filters = []
    image.applyFilters()
  }
}
