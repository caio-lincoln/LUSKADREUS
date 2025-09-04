"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings, Zap, Target, Monitor, Gauge, Crosshair, Cpu, Activity } from "lucide-react"

interface PrecisionCanvasControlsProps {
  onPrecisionChange?: (level: "high" | "ultra" | "maximum") => void
  onPerformanceModeChange?: (mode: "quality" | "balanced" | "performance") => void
  onCursorSyncToggle?: (enabled: boolean) => void
  onRecalibrate?: () => void
  performanceMetrics?: {
    averageFPS: number
    averageFrameTime: number
    droppedFrames: number
    droppedFrameRate: number
    totalFrames: number
    performanceMode: string
  }
  canvasInfo?: {
    precision: string
    zoom: number
    isCalibrated: boolean
    hasDrawing: boolean
    pathCount: number
    devicePixelRatio: number
    resolutionMultiplier: number
    targetFPS: number
    smoothingLevel: number
  }
}

export function PrecisionCanvasControls({
  onPrecisionChange,
  onPerformanceModeChange,
  onCursorSyncToggle,
  onRecalibrate,
  performanceMetrics,
  canvasInfo,
}: PrecisionCanvasControlsProps) {
  const [precisionLevel, setPrecisionLevel] = useState<"high" | "ultra" | "maximum">("ultra")
  const [performanceMode, setPerformanceMode] = useState<"quality" | "balanced" | "performance">("balanced")
  const [cursorSyncEnabled, setCursorSyncEnabled] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handlePrecisionChange = (level: "high" | "ultra" | "maximum") => {
    setPrecisionLevel(level)
    onPrecisionChange?.(level)
  }

  const handlePerformanceModeChange = (mode: "quality" | "balanced" | "performance") => {
    setPerformanceMode(mode)
    onPerformanceModeChange?.(mode)
  }

  const handleCursorSyncToggle = (enabled: boolean) => {
    setCursorSyncEnabled(enabled)
    onCursorSyncToggle?.(enabled)
  }

  const getPrecisionColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-blue-500"
      case "ultra":
        return "bg-purple-500"
      case "maximum":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPerformanceColor = (fps: number) => {
    if (fps >= 60) return "text-green-500"
    if (fps >= 30) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5" />
          Controles de Precisão
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Nível de Precisão */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Nível de Precisão</label>
            <Badge className={getPrecisionColor(precisionLevel)}>{precisionLevel.toUpperCase()}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["high", "ultra", "maximum"] as const).map((level) => (
              <Button
                key={level}
                variant={precisionLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => handlePrecisionChange(level)}
                className="text-xs"
              >
                {level === "high" && "Alto"}
                {level === "ultra" && "Ultra"}
                {level === "maximum" && "Máximo"}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Modo de Performance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Modo de Performance</label>
            <Badge variant="outline">
              {performanceMode === "quality" && "Qualidade"}
              {performanceMode === "balanced" && "Balanceado"}
              {performanceMode === "performance" && "Performance"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["quality", "balanced", "performance"] as const).map((mode) => (
              <Button
                key={mode}
                variant={performanceMode === mode ? "default" : "outline"}
                size="sm"
                onClick={() => handlePerformanceModeChange(mode)}
                className="text-xs"
              >
                {mode === "quality" && <Monitor className="h-3 w-3" />}
                {mode === "balanced" && <Gauge className="h-3 w-3" />}
                {mode === "performance" && <Zap className="h-3 w-3" />}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Sincronização de Cursor */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4" />
            <label className="text-sm font-medium">Sincronização de Cursor</label>
          </div>
          <Switch checked={cursorSyncEnabled} onCheckedChange={handleCursorSyncToggle} />
        </div>

        {/* Métricas de Performance */}
        {performanceMetrics && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Performance</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>FPS:</span>
                    <span className={getPerformanceColor(performanceMetrics.averageFPS)}>
                      {performanceMetrics.averageFPS}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frame Time:</span>
                    <span>{performanceMetrics.averageFrameTime}ms</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Frames Perdidos:</span>
                    <span>{performanceMetrics.droppedFrames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Perda:</span>
                    <span>{performanceMetrics.droppedFrameRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Informações do Canvas */}
        {canvasInfo && (
          <>
            <Separator />
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                {showAdvanced ? "Ocultar" : "Mostrar"} Informações Avançadas
              </Button>

              {showAdvanced && (
                <div className="space-y-2 text-xs bg-muted/50 p-3 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Zoom: {Math.round(canvasInfo.zoom * 100)}%</div>
                    <div>Caminhos: {canvasInfo.pathCount}</div>
                    <div>DPR: {canvasInfo.devicePixelRatio}</div>
                    <div>Resolução: {canvasInfo.resolutionMultiplier}x</div>
                    <div>Target FPS: {canvasInfo.targetFPS}</div>
                    <div>Suavização: {canvasInfo.smoothingLevel}</div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <div
                      className={`w-2 h-2 rounded-full ${canvasInfo.isCalibrated ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span>Calibrado: {canvasInfo.isCalibrated ? "Sim" : "Não"}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Botão de Recalibração */}
        <Button variant="outline" size="sm" onClick={onRecalibrate} className="w-full">
          <Target className="h-4 w-4 mr-2" />
          Recalibrar Sistema
        </Button>

        {/* Otimização Automática */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // Detectar dispositivo e otimizar automaticamente
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            const isLowEnd = navigator.hardwareConcurrency <= 4

            if (isMobile || isLowEnd) {
              handlePerformanceModeChange("performance")
              handleCursorSyncToggle(false)
              handlePrecisionChange("high")
            } else {
              handlePerformanceModeChange("quality")
              handleCursorSyncToggle(true)
              handlePrecisionChange("maximum")
            }
          }}
          className="w-full"
        >
          <Cpu className="h-4 w-4 mr-2" />
          Otimização Automática
        </Button>
      </CardContent>
    </Card>
  )
}
