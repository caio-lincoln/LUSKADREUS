"use client"
import { Button } from "@/components/ui/button"
import { Palette, X } from "lucide-react"
import { CanvasBoardWithControls } from "@/canvasBoard/board/CanvasBoardWithControls"
import { useEffect } from "react"

interface CanvasBoardToggleProps {
  active: boolean
  onToggle: (active: boolean) => void
  width?: number
  height?: number
  title?: string
  fullscreen?: boolean
}

export function CanvasBoardToggle({
  active,
  onToggle,
  width = 800,
  height = 400,
  title = "Área de Desenho",
  fullscreen = false,
}: CanvasBoardToggleProps) {
  useEffect(() => {
    if (active && fullscreen) {
      // Pequeno delay para garantir que o canvas esteja renderizado
      const timer = setTimeout(() => {
        // Trigger optimal view through a custom event or ref
        const canvas = document.querySelector("canvas")
        if (canvas) {
          // Dispatch custom event to trigger optimal view
          canvas.dispatchEvent(new CustomEvent("resetOptimalView"))
        }
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [active, fullscreen])

  const handleToggle = () => {
    onToggle(!active)
  }

  const handleClose = () => {
    onToggle(false)
  }

  const handleFinish = () => {
    console.log("🎨 Desenho finalizado!")
    onToggle(false)
  }

  if (!active) {
    return (
      <Button onClick={handleToggle} variant="outline" className="w-full">
        <Palette className="h-4 w-4 mr-2" />
        Abrir Quadro de Desenho
      </Button>
    )
  }

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {/* Header with close button */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button onClick={handleClose} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="pt-16 h-full">
          <CanvasBoardWithControls
            onSave={(imageData) => {
              console.log("Desenho salvo:", imageData)
            }}
            onFinish={handleFinish}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={handleClose} variant="outline" className="flex-1">
          <X className="h-4 w-4 mr-2" />
          Fechar Quadro
        </Button>
      </div>

      <div style={{ width, height }}>
        <CanvasBoardWithControls
          onSave={(imageData) => {
            console.log("Desenho salvo:", imageData)
          }}
          onFinish={handleFinish}
        />
      </div>
    </div>
  )
}
