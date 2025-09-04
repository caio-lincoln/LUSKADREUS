"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { NativeCanvasBoard } from "../fabric/nativeCanvas"
import { Badge } from "@/components/ui/badge"

export interface BoardProps {
  backgroundColor?: string
  onSave?: (data: string) => void
  onClear?: () => void
  onDrawingChange?: (isDrawing: boolean) => void
  disabled?: boolean
  enableZoom?: boolean
  onPaintBoardRef?: (paintBoard: NativeCanvasBoard) => void
}

const CanvasBoard: React.FC<BoardProps> = ({
  backgroundColor,
  onSave,
  onClear,
  onDrawingChange,
  disabled,
  enableZoom,
  onPaintBoardRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paintBoardRef = useRef<NativeCanvasBoard | null>(null)
  const [canvasInfo, setCanvasInfo] = useState<any>(null)

  useEffect(() => {
    if (canvasRef.current && !paintBoardRef.current) {
      const paintBoard = new NativeCanvasBoard(canvasRef.current, {
        backgroundColor,
        onSave,
        onClear,
        onDrawingChange,
        disabled,
        enableZoom,
      })

      // Otimizar automaticamente para o dispositivo
      paintBoard.optimizeForDevice()

      paintBoardRef.current = paintBoard

      // Atualizar informações do canvas
      const updateCanvasInfo = () => {
        setCanvasInfo(paintBoard.getCanvasInfo())
      }

      updateCanvasInfo()
      const interval = setInterval(updateCanvasInfo, 1000)

      if (onPaintBoardRef) {
        onPaintBoardRef(paintBoard)
      }

      return () => {
        clearInterval(interval)
        paintBoard.dispose()
        paintBoardRef.current = null
      }
    }
  }, [backgroundColor, onSave, onClear, onDrawingChange, disabled, enableZoom, onPaintBoardRef])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} />

      {/* Badge com informações do canvas */}
      {canvasInfo && (
        <div className="absolute bottom-4 left-4 z-10">
          <Badge variant="secondary" className="text-xs px-2 py-1 bg-black/70 text-white">
            {Math.round(canvasInfo.scale * 100)}% • {canvasInfo.canvasSize.width}×{canvasInfo.canvasSize.height}
          </Badge>
        </div>
      )}
    </div>
  )
}

export { CanvasBoard }
export default CanvasBoard
