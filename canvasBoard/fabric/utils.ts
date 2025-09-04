// Utilitários para o canvas

export class CanvasUtils {
  public static dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(",")
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png"
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    return new Blob([u8arr], { type: mime })
  }

  public static downloadImage(dataURL: string, filename = "drawing.png") {
    const link = document.createElement("a")
    link.download = filename
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  public static resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    const imageData = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height)

    canvas.width = width
    canvas.height = height

    if (imageData) {
      canvas.getContext("2d")?.putImageData(imageData, 0, 0)
    }
  }

  public static getCanvasCenter(canvas: HTMLCanvasElement): { x: number; y: number } {
    return {
      x: canvas.width / 2,
      y: canvas.height / 2,
    }
  }
}
