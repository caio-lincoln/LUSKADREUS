"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { CanvasBoard } from "./index"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  Brush,
  Eraser,
  RotateCcw,
  RotateCw,
  X,
  CheckCircle,
  Minus,
  Plus,
  ZoomIn,
  ZoomOut,
  TimerResetIcon as Reset,
  Clock,
  Monitor,
} from "lucide-react"
import type { NativeCanvasBoard } from "../fabric/nativeCanvas"

interface CanvasBoardWithControlsProps {
  onSave?: (imageData: string) => void
  onFinish?: () => void
  className?: string
}

export const CanvasBoardWithControls: React.FC<CanvasBoardWithControlsProps> = ({
  onSave,
  onFinish,
  className = "",
}) => {
  const [paintBoard, setPaintBoard] = useState<NativeCanvasBoard | null>(null)
  const [currentTool, setCurrentTool] = useState<"brush" | "eraser">("brush")
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState("#000000")
  const [brushOpacity, setBrushOpacity] = useState(100)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Aplicar visualização ideal quando o canvas for criado
  useEffect(() => {
    if (paintBoard) {
      // Aguardar um pouco para garantir que o canvas está totalmente renderizado
      const timer = setTimeout(() => {
        paintBoard.resetToOptimalView()
        console.log("🎯 Visualização ideal aplicada automaticamente")
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [paintBoard])

  // Atualizar informações do canvas
  const updateCanvasInfo = useCallback(() => {
    if (paintBoard) {
      setZoomLevel(paintBoard.getZoomPercentage())
      setCanUndo(paintBoard.canUndo())
      setCanRedo(paintBoard.canRedo())
      setElapsedTime(paintBoard.getElapsedTime())
    }
  }, [paintBoard])

  // Atualizar informações periodicamente
  useEffect(() => {
    const interval = setInterval(updateCanvasInfo, 1000)
    return () => clearInterval(interval)
  }, [updateCanvasInfo])

  // Handlers de ferramentas
  const handleToolChange = useCallback(
    (tool: "brush" | "eraser") => {
      setCurrentTool(tool)
      if (paintBoard) {
        paintBoard.setTool(tool)
        console.log("🔧 Ferramenta alterada para:", tool)
      }
    },
    [paintBoard],
  )

  const handleBrushSizeChange = useCallback(
    (size: number[]) => {
      const newSize = size[0]
      setBrushSize(newSize)
      if (paintBoard) {
        paintBoard.setBrushSize(newSize)
        console.log("📏 Tamanho do pincel:", newSize)
      }
    },
    [paintBoard],
  )

  const handleColorChange = useCallback(
    (color: string) => {
      setBrushColor(color)
      if (paintBoard) {
        paintBoard.setBrushColor(color)
        // Forçar a mudança para o modo pincel quando a cor é alterada
        setCurrentTool("brush")
        paintBoard.setTool("brush")
        console.log("🎨 Cor alterada para:", color)
      }
    },
    [paintBoard],
  )

  const handleOpacityChange = useCallback(
    (opacity: number[]) => {
      const newOpacity = opacity[0]
      setBrushOpacity(newOpacity)
      if (paintBoard) {
        paintBoard.setBrushOpacity(newOpacity / 100)
        console.log("💧 Opacidade:", newOpacity)
      }
    },
    [paintBoard],
  )

  // Handlers de ações
  const handleFinishDrawing = useCallback(() => {
    if (paintBoard && hasDrawing) {
      const imageData = paintBoard.save()
      if (onSave) {
        onSave(imageData)
      }
    }
    if (onFinish) {
      onFinish()
    }
  }, [paintBoard, hasDrawing, onSave, onFinish])

  const handleUndo = useCallback(() => {
    if (paintBoard) {
      paintBoard.undo()
      updateCanvasInfo()
    }
  }, [paintBoard, updateCanvasInfo])

  const handleRedo = useCallback(() => {
    if (paintBoard) {
      paintBoard.redo()
      updateCanvasInfo()
    }
  }, [paintBoard, updateCanvasInfo])

  const handleClear = useCallback(() => {
    if (paintBoard) {
      paintBoard.clear()
      updateCanvasInfo()
    }
  }, [paintBoard, updateCanvasInfo])

  const adjustBrushSize = useCallback(
    (delta: number) => {
      const newSize = Math.max(1, Math.min(100, brushSize + delta))
      setBrushSize(newSize)
      if (paintBoard) {
        paintBoard.setBrushSize(newSize)
      }
    },
    [brushSize, paintBoard],
  )

  const handleZoom = useCallback(
    (action: "in" | "out" | "reset") => {
      if (!paintBoard) return

      switch (action) {
        case "in":
          paintBoard.zoomIn()
          break
        case "out":
          paintBoard.zoomOut()
          break
        case "reset":
          paintBoard.resetToOptimalView()
          break
      }

      updateCanvasInfo()
    },
    [paintBoard, updateCanvasInfo],
  )

  // Formatação do tempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              handleRedo()
            } else {
              handleUndo()
            }
            break
          case "y":
            e.preventDefault()
            handleRedo()
            break
          case "=":
          case "+":
            e.preventDefault()
            handleZoom("in")
            break
          case "-":
            e.preventDefault()
            handleZoom("out")
            break
          case "0":
            e.preventDefault()
            handleZoom("reset")
            break
        }
      } else {
        switch (e.key.toLowerCase()) {
          case "b":
            handleToolChange("brush")
            break
          case "e":
            handleToolChange("eraser")
            break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleToolChange, handleUndo, handleRedo, handleZoom])

  return (
    <div className={`fixed inset-0 bg-gray-50 z-50 flex flex-col ${className}`}>
      {/* Barra de ferramentas superior - Responsiva */}
      <div className="bg-white border-b shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
          {/* Ferramentas principais - Layout responsivo */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 overflow-x-auto">
            {/* Seleção de ferramenta */}
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant={currentTool === "brush" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange("brush")}
                className="h-8 sm:h-10 px-2 sm:px-4 transition-all text-xs sm:text-sm"
              >
                <Brush className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Pincel</span>
              </Button>
              <Button
                variant={currentTool === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange("eraser")}
                className="h-8 sm:h-10 px-2 sm:px-4 transition-all text-xs sm:text-sm"
              >
                <Eraser className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Borracha</span>
              </Button>
            </div>

            {/* Separador - Oculto em mobile */}
            <div className="hidden sm:block h-8 w-px bg-gray-200" />

            {/* Controles de pincel - Compactos em mobile */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Tamanho */}
              <div className="flex items-center gap-1 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustBrushSize(-2)}
                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                  disabled={brushSize <= 1}
                >
                  <Minus className="w-2 h-2 sm:w-3 sm:h-3" />
                </Button>

                <div className="w-12 sm:w-20">
                  <Slider
                    value={[brushSize]}
                    onValueChange={handleBrushSizeChange}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustBrushSize(2)}
                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                  disabled={brushSize >= 100}
                >
                  <Plus className="w-2 h-2 sm:w-3 sm:h-3" />
                </Button>

                <Badge variant="secondary" className="min-w-[35px] sm:min-w-[45px] text-center font-mono text-xs">
                  {brushSize}px
                </Badge>
              </div>

              {/* Opacidade - Oculta em mobile pequeno */}
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-gray-600 min-w-[60px]">Opacidade:</span>
                <div className="w-16">
                  <Slider
                    value={[brushOpacity]}
                    onValueChange={handleOpacityChange}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <Badge variant="outline" className="min-w-[40px] text-center font-mono text-xs">
                  {brushOpacity}%
                </Badge>
              </div>
            </div>

            {/* Separador */}
            <div className="hidden sm:block h-8 w-px bg-gray-200" />

            {/* Seletor de cor */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
                style={{ backgroundColor: brushColor }}
                title={`Cor atual: ${brushColor}`}
              />
              <ColorPicker color={brushColor} onChange={handleColorChange} />
            </div>

            {/* Separador */}
            <div className="hidden sm:block h-8 w-px bg-gray-200" />

            {/* Controles de histórico */}
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo}
                className="h-8 sm:h-10 px-2 sm:px-3 transition-all"
                title="Desfazer (Ctrl+Z)"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo}
                className="h-8 sm:h-10 px-2 sm:px-3 transition-all"
                title="Refazer (Ctrl+Y)"
              >
                <RotateCw className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {/* Separador */}
            <div className="hidden lg:block h-8 w-px bg-gray-200" />

            {/* Controles de zoom - Compactos em mobile */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom("out")}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-2 h-2 sm:w-3 sm:h-3" />
              </Button>

              <Badge variant="outline" className="min-w-[45px] sm:min-w-[60px] text-center font-mono text-xs">
                {zoomLevel}%
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom("reset")}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                title="Visualização Ideal"
              >
                <Reset className="w-2 h-2 sm:w-3 sm:h-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => paintBoard?.zoomToFit()}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                title="Ajustar à Tela"
              >
                <Monitor className="w-2 h-2 sm:w-3 sm:h-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom("in")}
                className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-2 h-2 sm:w-3 sm:h-3" />
              </Button>
            </div>

            {/* Limpar - Oculto em mobile pequeno */}
            {/* <div className="hidden md:block">
              <div className="h-8 w-px bg-gray-200 mr-2" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="h-8 sm:h-10 px-2 sm:px-3 transition-all text-red-600 hover:text-red-700 text-xs sm:text-sm"
                title="Limpar Tudo"
              >
                Limpar
              </Button>
            </div> */}
          </div>

          {/* Ações principais - Sempre visíveis */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Limpar - Movido para ficar junto com os outros botões de ação */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-8 sm:h-10 px-2 sm:px-3 transition-all text-red-600 hover:text-red-700 text-xs sm:text-sm"
              title="Limpar Tudo"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onFinish}
              className="h-8 sm:h-10 px-2 sm:px-4 transition-all text-xs sm:text-sm"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cancelar</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleFinishDrawing}
              disabled={!hasDrawing}
              className="h-8 sm:h-10 px-2 sm:px-4 bg-green-600 hover:bg-green-700 transition-all text-xs sm:text-sm"
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Finalizar</span>
              <span className="sm:hidden">OK</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Área do canvas - Ocupa todo espaço restante */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative canvas-fullscreen">
        <CanvasBoard
          onSave={onSave}
          onDrawingChange={setHasDrawing}
          onPaintBoardRef={setPaintBoard}
          backgroundColor="#ffffff"
          enableZoom={true}
          className="w-full h-full"
        />

        {/* Timer - Posição responsiva */}
        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/70 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-mono flex items-center gap-1 sm:gap-2 pointer-events-none">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{formatTime(elapsedTime)}</span>
        </div>

        {/* Controles de zoom mobile - Flutuantes */}
        <div className="sm:hidden absolute bottom-16 right-2 flex flex-col gap-1 pointer-events-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom("in")}
            className="h-10 w-10 p-0 bg-white/90 backdrop-blur-sm"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom("out")}
            className="h-10 w-10 p-0 bg-white/90 backdrop-blur-sm"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom("reset")}
            className="h-10 w-10 p-0 bg-white/90 backdrop-blur-sm"
            title="Visualização Ideal"
          >
            <Reset className="w-4 h-4" />
          </Button>
        </div>

        {/* Controles mobile adicionais */}
        {/* <div className="md:hidden absolute bottom-2 left-2 flex gap-1 pointer-events-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="h-8 px-3 bg-white/90 backdrop-blur-sm text-red-600 hover:text-red-700 text-xs"
            title="Limpar Tudo"
          >
            Limpar
          </Button>
        </div> */}
      </div>

      {/* Indicadores de status - Posição responsiva */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex flex-col gap-1 sm:gap-2 pointer-events-none">
        {hasDrawing && (
          <Badge variant="default" className="bg-blue-600 text-white text-xs">
            ✏️ Desenho ativo
          </Badge>
        )}
        {currentTool === "eraser" && (
          <Badge variant="destructive" className="text-xs">
            🧹 Borracha
          </Badge>
        )}
      </div>

      {/* Atalhos de teclado - Ocultos em mobile */}
      <div className="hidden lg:block absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/90 rounded-lg px-3 py-2 shadow-sm pointer-events-none">
        <div className="font-medium mb-1">Atalhos:</div>
        <div>Ctrl+Z: Desfazer • Ctrl+Y: Refazer • B: Pincel • E: Borracha</div>
        <div>Ctrl++: Zoom In • Ctrl+-: Zoom Out • Ctrl+0: Visualização Ideal</div>
      </div>
    </div>
  )
}
