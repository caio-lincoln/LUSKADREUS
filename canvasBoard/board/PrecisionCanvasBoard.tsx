"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { PrecisionCanvasBoard } from "../fabric/precisionCanvas"
import { EnhancedNativeCanvasBoard } from "../fabric/enhancedNativeCanvas"
import { PrecisionCanvasControls } from "@/components/canvas/precision-canvas-controls"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ColorPicker } from "@/components/ui/color-picker"
import { Slider } from "@/components/ui/slider"
import { Brush, Eraser, Undo, Redo, Download, Trash2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

interface PrecisionCanvasBoardProps {
  width?: number
  height?: number
  onSave?: (imageData: string) => void
  onClear?: () => void
  onDrawingChange?: (hasDrawing: boolean) => void
  disabled?: boolean
  className?: string
}

export function PrecisionCanvasBoardComponent({
  width = 800,
  height = 600,
  onSave,
  onClear,
  onDrawingChange,
  disabled = false,
  className = "",
}: PrecisionCanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasBoardRef = useRef<PrecisionCanvasBoard | EnhancedNativeCanvasBoard | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Estados do canvas
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentTool, setCurrentTool] = useState("brush")
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState("#000000")
  const [brushOpacity, setBrushOpacity] = useState(1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [hasDrawing, setHasDrawing] = useState(false)

  // Estados de precisão e performance
  const [canvasType, setCanvasType] = useState<"precision" | "enhanced">("precision")
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  const [canvasInfo, setCanvasInfo] = useState<any>(null)

  // Inicializar canvas
  useEffect(() => {
    if (!canvasRef.current || isInitialized) return

    const canvas = canvasRef.current

    try {
      // Escolher implementação baseada nas capacidades do dispositivo
      const useEnhanced = window.devicePixelRatio > 1 && navigator.hardwareConcurrency > 4

      if (useEnhanced && canvasType === "enhanced") {
        canvasBoardRef.current = new EnhancedNativeCanvasBoard(canvas, {
          backgroundColor: "#ffffff",
          enableRetinaScaling: true,
          cursorSync: true,
          highPrecisionMode: true,
          adaptiveSmoothing: true,
          performanceMode: "balanced",
          onSave,
          onClear,
          onDrawingChange: (drawing) => {
            setHasDrawing(drawing)
            onDrawingChange?.(drawing)
          },
        })
      } else {
        canvasBoardRef.current = new PrecisionCanvasBoard(canvas, {
          backgroundColor: "#ffffff",
          enableRetinaScaling: true,
          cursorPrecision: "ultra",
          smoothingLevel: 0.1,
          predictionEnabled: true,
          onSave,
          onClear,
          onDrawingChange: (drawing) => {
            setHasDrawing(drawing)
            onDrawingChange?.(drawing)
          },
        })
      }

      setIsInitialized(true)
      updateCanvasInfo()

      console.log("🎨 Precision Canvas Board inicializado:", {
        type: canvasType,
        enhanced: useEnhanced,
        width,
        height,
      })
    } catch (error) {
      console.error("Erro ao inicializar canvas:", error)
    }
  }, [canvasRef.current, canvasType, width, height, onSave, onClear, onDrawingChange])

  // Atualizar informações do canvas periodicamente
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      updateCanvasInfo()
      updatePerformanceMetrics()
    }, 1000)

    return () => clearInterval(interval)
  }, [isInitialized])

  const updateCanvasInfo = useCallback(() => {
    if (!canvasBoardRef.current) return

    const info = canvasBoardRef.current.getCanvasInfo?.() || {}
    setCanvasInfo(info)

    // Atualizar estados de undo/redo
    if (canvasBoardRef.current.canUndo) {
      setCanUndo(canvasBoardRef.current.canUndo())
    }
    if (canvasBoardRef.current.canRedo) {
      setCanRedo(canvasBoardRef.current.canRedo())
    }
  }, [])

  const updatePerformanceMetrics = useCallback(() => {
    if (!canvasBoardRef.current) return

    // Só funciona com Enhanced Canvas
    if ("getPerformanceMetrics" in canvasBoardRef.current) {
      const metrics = canvasBoardRef.current.getPerformanceMetrics()
      setPerformanceMetrics(metrics)
    }
  }, [])

  // Handlers de ferramentas
  const handleToolChange = useCallback((tool: string) => {
    if (!canvasBoardRef.current) return

    setCurrentTool(tool)
    canvasBoardRef.current.setTool(tool)
  }, [])

  const handleBrushSizeChange = useCallback((size: number[]) => {
    if (!canvasBoardRef.current) return

    const newSize = size[0]
    setBrushSize(newSize)
    canvasBoardRef.current.setBrushSize(newSize)
  }, [])

  const handleBrushColorChange = useCallback((color: string) => {
    if (!canvasBoardRef.current) return

    setBrushColor(color)
    canvasBoardRef.current.setBrushColor(color)
  }, [])

  const handleBrushOpacityChange = useCallback((opacity: number[]) => {
    if (!canvasBoardRef.current) return

    const newOpacity = opacity[0]
    setBrushOpacity(newOpacity)
    canvasBoardRef.current.setBrushOpacity(newOpacity)
  }, [])

  // Handlers de ações
  const handleUndo = useCallback(() => {
    if (!canvasBoardRef.current) return
    canvasBoardRef.current.undo()
    updateCanvasInfo()
  }, [updateCanvasInfo])

  const handleRedo = useCallback(() => {
    if (!canvasBoardRef.current) return
    canvasBoardRef.current.redo()
    updateCanvasInfo()
  }, [updateCanvasInfo])

  const handleClear = useCallback(() => {
    if (!canvasBoardRef.current) return
    canvasBoardRef.current.clear()
    updateCanvasInfo()
  }, [updateCanvasInfo])

  const handleSave = useCallback(() => {
    if (!canvasBoardRef.current) return
    const imageData = canvasBoardRef.current.save()

    // Download automático
    const link = document.createElement("a")
    link.download = `precision-drawing-${Date.now()}.png`
    link.href = imageData
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const handleZoomIn = useCallback(() => {
    if (!canvasBoardRef.current) return
    canvasBoardRef.current.zoomIn()
    updateCanvasInfo()
  }, [updateCanvasInfo])

  const handleZoomOut = useCallback(() => {
    if (!canvasBoardRef.current) return
    canvasBoardRef.current.zoomOut()
    updateCanvasInfo()
  }, [updateCanvasInfo])

  const handleResetZoom = useCallback(() => {
    if (!canvasBoardRef.current) return
    canvasBoardRef.current.resetZoom()
    updateCanvasInfo()
  }, [updateCanvasInfo])

  // Handlers de precisão
  const handlePrecisionChange = useCallback((level: "high" | "ultra" | "maximum") => {
    if (!canvasBoardRef.current) return

    if ("setPrecisionLevel" in canvasBoardRef.current) {
      canvasBoardRef.current.setPrecisionLevel(level)
    }
  }, [])

  const handlePerformanceModeChange = useCallback((mode: "quality" | "balanced" | "performance") => {
    if (!canvasBoardRef.current) return

    if ("setPerformanceMode" in canvasBoardRef.current) {
      canvasBoardRef.current.setPerformanceMode(mode)
    }
  }, [])

  const handleCursorSyncToggle = useCallback((enabled: boolean) => {
    if (!canvasBoardRef.current) return

    if ("toggleCursorSync" in canvasBoardRef.current) {
      canvasBoardRef.current.toggleCursorSync(enabled)
    }
  }, [])

  const handleRecalibrate = useCallback(() => {
    if (!canvasBoardRef.current) return

    if ("recalibrate" in canvasBoardRef.current) {
      canvasBoardRef.current.recalibrate()
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (canvasBoardRef.current) {
        canvasBoardRef.current.dispose()
      }
    }
  }, [])

  return (
    <div className={`flex gap-4 p-4 ${className}`}>
      {/* Canvas Principal */}
      <div className="flex-1">
        <Card className="p-4">
          {/* Toolbar Principal */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Ferramentas */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={currentTool === "brush" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToolChange("brush")}
                disabled={disabled}
              >
                <Brush className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool === "eraser" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToolChange("eraser")}
                disabled={disabled}
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={handleUndo} disabled={disabled || !canUndo}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRedo} disabled={disabled || !canRedo}>
                <Redo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear} disabled={disabled}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={disabled}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={disabled}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetZoom} disabled={disabled}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Salvar */}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={disabled || !hasDrawing}>
              <Download className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </div>

          {/* Controles de Pincel */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {/* Cor */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Cor:</label>
              <ColorPicker value={brushColor} onChange={handleBrushColorChange} disabled={disabled} />
            </div>

            {/* Tamanho */}
            <div className="flex items-center gap-2 min-w-[120px]">
              <label className="text-sm font-medium">Tamanho:</label>
              <Slider
                value={[brushSize]}
                onValueChange={handleBrushSizeChange}
                min={1}
                max={50}
                step={1}
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">{brushSize}</span>
            </div>

            {/* Opacidade */}
            <div className="flex items-center gap-2 min-w-[120px]">
              <label className="text-sm font-medium">Opacidade:</label>
              <Slider
                value={[brushOpacity]}
                onValueChange={handleBrushOpacityChange}
                min={0.1}
                max={1}
                step={0.1}
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">{Math.round(brushOpacity * 100)}%</span>
            </div>
          </div>

          {/* Canvas Container */}
          <div ref={containerRef} className="border rounded-lg overflow-hidden bg-white" style={{ width, height }}>
            <canvas
              ref={canvasRef}
              className="block cursor-crosshair"
              style={{
                width: "100%",
                height: "100%",
                touchAction: "none",
              }}
            />
          </div>

          {/* Status */}
          {canvasInfo && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-4">
              <span>Zoom: {Math.round((canvasInfo.zoom || 1) * 100)}%</span>
              <span>Precisão: {canvasInfo.precision || "N/A"}</span>
              {performanceMetrics && <span>FPS: {performanceMetrics.averageFPS}</span>}
            </div>
          )}
        </Card>
      </div>

      {/* Painel de Controles de Precisão */}
      <div className="w-80">
        <PrecisionCanvasControls
          onPrecisionChange={handlePrecisionChange}
          onPerformanceModeChange={handlePerformanceModeChange}
          onCursorSyncToggle={handleCursorSyncToggle}
          onRecalibrate={handleRecalibrate}
          performanceMetrics={performanceMetrics}
          canvasInfo={canvasInfo}
        />
      </div>
    </div>
  )
}

export default PrecisionCanvasBoardComponent
