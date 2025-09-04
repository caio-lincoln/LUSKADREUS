"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  X,
  Palette,
  Brush,
  Eraser,
  Undo,
  Redo,
  Download,
  Trash2,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Layers,
  Type,
  Circle,
  Square,
  Triangle,
  Minus,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PaintBoard } from "../fabric/paintBoard"
import { useCanvasStore, useToolsStore, useHistoryStore } from "../store"

interface CanvasBoardFullscreenProps {
  onClose: () => void
  initialWidth?: number
  initialHeight?: number
  onSave?: (imageData: string) => void
}

export const CanvasBoardFullscreen: React.FC<CanvasBoardFullscreenProps> = ({
  onClose,
  initialWidth = 1200,
  initialHeight = 800,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paintBoardRef = useRef<PaintBoard | null>(null)
  const [showToolbar, setShowToolbar] = useState(true)
  const [showColorPanel, setShowColorPanel] = useState(false)
  const [showGridPanel, setShowGridPanel] = useState(false)
  const [showLayersPanel, setShowLayersPanel] = useState(false)

  // Zustand stores
  const { canvasSize, zoom, setCanvasSize, setZoom, isDrawing, setIsDrawing } = useCanvasStore()

  const {
    currentTool,
    brushSize,
    brushColor,
    brushOpacity,
    setCurrentTool,
    setBrushSize,
    setBrushColor,
    setBrushOpacity,
  } = useToolsStore()

  const { canUndo, canRedo } = useHistoryStore()

  // Grid and snap settings
  const [gridEnabled, setGridEnabled] = useState(false)
  const [gridSize, setGridSize] = useState(20)
  const [snapEnabled, setSnapEnabled] = useState(false)

  // Color presets
  const colorPresets = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#000080",
    "#008000",
  ]

  // Tools configuration
  const tools = [
    { id: "brush", icon: Brush, label: "Pincel" },
    { id: "eraser", icon: Eraser, label: "Borracha" },
    { id: "line", icon: Minus, label: "Linha" },
    { id: "rectangle", icon: Square, label: "Retângulo" },
    { id: "circle", icon: Circle, label: "Círculo" },
    { id: "triangle", icon: Triangle, label: "Triângulo" },
    { id: "text", icon: Type, label: "Texto" },
  ]

  useEffect(() => {
    if (canvasRef.current && !paintBoardRef.current) {
      paintBoardRef.current = new PaintBoard(canvasRef.current, {
        width: initialWidth,
        height: initialHeight,
        onSave,
        onDrawingChange: setIsDrawing,
      })
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              paintBoardRef.current?.redo()
            } else {
              paintBoardRef.current?.undo()
            }
            break
          case "s":
            e.preventDefault()
            handleSave()
            break
          case "Escape":
            onClose()
            break
        }
      }

      // Tool shortcuts
      switch (e.key) {
        case "b":
          setCurrentTool("brush")
          break
        case "e":
          setCurrentTool("eraser")
          break
        case "g":
          setGridEnabled(!gridEnabled)
          break
        case "t":
          setShowToolbar(!showToolbar)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (paintBoardRef.current) {
        paintBoardRef.current.dispose()
      }
    }
  }, [])

  const handleSave = () => {
    if (paintBoardRef.current) {
      const imageData = paintBoardRef.current.save()
      onSave?.(imageData)
    }
  }

  const handleClear = () => {
    paintBoardRef.current?.clear()
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5)
    setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1)
    setZoom(newZoom)
  }

  const handleZoomReset = () => {
    setZoom(1)
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Top Toolbar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-10 transition-transform duration-300",
          showToolbar ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="bg-white/95 backdrop-blur-sm border-b shadow-sm">
          <div className="flex items-center justify-between px-4 py-2">
            {/* Left: Tools */}
            <div className="flex items-center gap-2">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={currentTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentTool(tool.id)}
                  className="h-8 w-8 p-0"
                  title={`${tool.label} (${tool.id === "brush" ? "B" : tool.id === "eraser" ? "E" : ""})`}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              ))}

              <Separator orientation="vertical" className="h-6" />

              {/* History */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => paintBoardRef.current?.undo()}
                disabled={!canUndo}
                className="h-8 w-8 p-0"
                title="Desfazer (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => paintBoardRef.current?.redo()}
                disabled={!canRedo}
                className="h-8 w-8 p-0"
                title="Refazer (Ctrl+Shift+Z)"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            {/* Center: Canvas Info */}
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                {canvasSize.width} × {canvasSize.height}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {Math.round(zoom * 100)}%
              </Badge>
              {isDrawing && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  Desenhando
                </Badge>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColorPanel(!showColorPanel)}
                className="h-8 w-8 p-0"
                title="Cores"
              >
                <Palette className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGridPanel(!showGridPanel)}
                className="h-8 w-8 p-0"
                title="Grid (G)"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLayersPanel(!showLayersPanel)}
                className="h-8 w-8 p-0"
                title="Camadas"
              >
                <Layers className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6" />

              <Button variant="ghost" size="sm" onClick={handleSave} className="h-8 w-8 p-0" title="Salvar (Ctrl+S)">
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Limpar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" title="Fechar (Esc)">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panels */}
      {/* Color Panel */}
      {showColorPanel && (
        <Card className="absolute top-16 left-4 z-10 w-64 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Cores</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowColorPanel(false)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Current Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor Atual</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2 border-gray-300" style={{ backgroundColor: brushColor }} />
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-full h-8 rounded border"
                />
              </div>
            </div>

            {/* Color Presets */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Predefinidas</label>
              <div className="grid grid-cols-5 gap-1">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded border-2 transition-all",
                      brushColor === color ? "border-blue-500 scale-110" : "border-gray-300 hover:scale-105",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setBrushColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Brush Settings */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tamanho: {brushSize}px</label>
                <Slider
                  value={[brushSize]}
                  onValueChange={(value) => setBrushSize(value[0])}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Opacidade: {Math.round(brushOpacity * 100)}%</label>
                <Slider
                  value={[brushOpacity * 100]}
                  onValueChange={(value) => setBrushOpacity(value[0] / 100)}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Panel */}
      {showGridPanel && (
        <Card className="absolute top-16 left-4 z-10 w-64 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Grid & Snap</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowGridPanel(false)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mostrar Grid</label>
                <Switch checked={gridEnabled} onCheckedChange={setGridEnabled} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tamanho do Grid: {gridSize}px</label>
                <Slider
                  value={[gridSize]}
                  onValueChange={(value) => setGridSize(value[0])}
                  max={100}
                  min={5}
                  step={5}
                  className="w-full"
                  disabled={!gridEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Snap to Grid</label>
                <Switch checked={snapEnabled} onCheckedChange={setSnapEnabled} disabled={!gridEnabled} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layers Panel */}
      {showLayersPanel && (
        <Card className="absolute top-16 right-4 z-10 w-64 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Camadas</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLayersPanel(false)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                <span className="text-sm font-medium">Camada 1</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <span className="text-sm text-gray-600">Fundo</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-4 pt-16">
        <div className="relative">
          {/* Grid overlay */}
          {gridEnabled && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: `${gridSize}px ${gridSize}px`,
              }}
            />
          )}

          <canvas
            ref={canvasRef}
            width={initialWidth}
            height={initialHeight}
            className="border border-gray-300 bg-white rounded-lg shadow-lg"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center",
            }}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-2 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0" title="Diminuir Zoom">
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomReset}
              className="h-8 px-3 text-xs"
              title="Resetar Zoom"
            >
              {Math.round(zoom * 100)}%
            </Button>

            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0" title="Aumentar Zoom">
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowToolbar(!showToolbar)}
              className="h-8 w-8 p-0"
              title="Toggle Toolbar (T)"
            >
              {showToolbar ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar toggle hint */}
      {!showToolbar && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
          <Badge variant="secondary" className="text-xs">
            Pressione T para mostrar ferramentas
          </Badge>
        </div>
      )}
    </div>
  )
}
