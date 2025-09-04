// Sistema de exportação/importação avançado
export interface ExportOptions {
  format: "png" | "jpg" | "svg" | "json" | "pdf"
  quality?: number
  width?: number
  height?: number
  backgroundColor?: string
  includeMetadata?: boolean
}

export interface CanvasMetadata {
  version: string
  timestamp: number
  author?: string
  title?: string
  description?: string
  tags?: string[]
}

export class ExportManager {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Contexto 2D não disponível")
    this.ctx = ctx
  }

  public async exportCanvas(options: ExportOptions, metadata?: CanvasMetadata): Promise<string | Blob> {
    switch (options.format) {
      case "png":
        return this.exportPNG(options)
      case "jpg":
        return this.exportJPG(options)
      case "svg":
        return this.exportSVG(options, metadata)
      case "json":
        return this.exportJSON(metadata)
      case "pdf":
        return this.exportPDF(options, metadata)
      default:
        throw new Error(`Formato não suportado: ${options.format}`)
    }
  }

  private exportPNG(options: ExportOptions): string {
    const canvas = this.prepareCanvas(options)
    return canvas.toDataURL("image/png")
  }

  private exportJPG(options: ExportOptions): string {
    const canvas = this.prepareCanvas(options)
    const quality = options.quality || 0.9
    return canvas.toDataURL("image/jpeg", quality)
  }

  private exportSVG(options: ExportOptions, metadata?: CanvasMetadata): string {
    const width = options.width || this.canvas.width
    const height = options.height || this.canvas.height

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`

    // Adicionar metadata
    if (metadata) {
      svg += `<metadata>`
      svg += `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">`
      svg += `<rdf:Description rdf:about="">`
      if (metadata.title) svg += `<dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">${metadata.title}</dc:title>`
      if (metadata.description)
        svg += `<dc:description xmlns:dc="http://purl.org/dc/elements/1.1/">${metadata.description}</dc:description>`
      if (metadata.author)
        svg += `<dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${metadata.author}</dc:creator>`
      svg += `</rdf:Description>`
      svg += `</rdf:RDF>`
      svg += `</metadata>`
    }

    // Background
    if (options.backgroundColor) {
      svg += `<rect width="100%" height="100%" fill="${options.backgroundColor}"/>`
    }

    // Converter canvas para imagem dentro do SVG
    const dataURL = this.canvas.toDataURL("image/png")
    svg += `<image href="${dataURL}" width="${width}" height="${height}"/>`

    svg += `</svg>`
    return svg
  }

  private exportJSON(metadata?: CanvasMetadata): string {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)

    const exportData = {
      version: "1.0",
      metadata: metadata || {},
      canvas: {
        width: this.canvas.width,
        height: this.canvas.height,
        imageData: Array.from(imageData.data),
      },
      timestamp: Date.now(),
    }

    return JSON.stringify(exportData, null, 2)
  }

  private async exportPDF(options: ExportOptions, metadata?: CanvasMetadata): Promise<Blob> {
    // Implementação básica - em produção usar biblioteca como jsPDF
    const dataURL = this.exportPNG(options)

    // Simular criação de PDF
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${options.width || this.canvas.width} ${options.height || this.canvas.height}]
>>
endobj

xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
${Date.now()}
%%EOF`

    return new Blob([pdfContent], { type: "application/pdf" })
  }

  private prepareCanvas(options: ExportOptions): HTMLCanvasElement {
    const exportCanvas = document.createElement("canvas")
    const exportCtx = exportCanvas.getContext("2d")!

    exportCanvas.width = options.width || this.canvas.width
    exportCanvas.height = options.height || this.canvas.height

    // Background
    if (options.backgroundColor) {
      exportCtx.fillStyle = options.backgroundColor
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
    }

    // Desenhar canvas original
    exportCtx.drawImage(this.canvas, 0, 0, exportCanvas.width, exportCanvas.height)

    return exportCanvas
  }

  public async importFromJSON(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData)

      if (data.canvas && data.canvas.imageData) {
        const imageData = new ImageData(
          new Uint8ClampedArray(data.canvas.imageData),
          data.canvas.width,
          data.canvas.height,
        )

        this.canvas.width = data.canvas.width
        this.canvas.height = data.canvas.height
        this.ctx.putImageData(imageData, 0, 0)
      }
    } catch (error) {
      throw new Error("Erro ao importar JSON: " + error)
    }
  }

  public async importFromImage(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.canvas.width = img.width
        this.canvas.height = img.height
        this.ctx.drawImage(img, 0, 0)
        resolve()
      }
      img.onerror = reject

      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  public downloadFile(data: string | Blob, filename: string) {
    const url = typeof data === "string" ? data : URL.createObjectURL(data)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (typeof data !== "string") {
      URL.revokeObjectURL(url)
    }
  }
}
