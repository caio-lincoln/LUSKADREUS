"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Timer, Play, Square, Plus, Eye } from "lucide-react"
import { CanvasBoardToggle } from "@/components/canvas/canvas-board-toggle"
import { Progress } from "@/components/ui/progress"

const filters = [
  { value: "real", label: "Real" },
  { value: "3d", label: "3D" },
  { value: "anime", label: "Anime" },
  { value: "random", label: "Aleatório" },
]

const defaultTimeOptions = [
  { value: "5", label: "5 minutos" },
  { value: "10", label: "10 minutos" },
  { value: "15", label: "15 minutos" },
]

export function SketchByImageMode() {
  const [selectedFilter, setSelectedFilter] = useState("real")
  const [selectedTime, setSelectedTime] = useState("10")
  const [customTimeOptions, setCustomTimeOptions] = useState<Array<{ value: string; label: string }>>([])
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [canvasBoardActive, setCanvasBoardActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10 * 60) // Time in seconds
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false)
  const [newCustomTime, setNewCustomTime] = useState("")
  const [customTimeUnit, setCustomTimeUnit] = useState<"minutes" | "seconds">("minutes")
  const [timeTotal, setTimeTotal] = useState(10 * 60)

  const currentImage = "/placeholder.svg?height=400&width=400"

  // Combine default and custom time options
  const allTimeOptions = [...defaultTimeOptions, ...customTimeOptions]

  useEffect(() => {
    setTimeLeft(Number.parseInt(selectedTime) * 60)
    setTimeTotal(Number.parseInt(selectedTime) * 60)
    setTimerFinished(false)
  }, [selectedTime])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (timerRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setTimerRunning(false)
      setTimerFinished(true)
      // Optionally play a sound or show a notification
      alert("Tempo esgotado!")
    }

    return () => clearInterval(intervalId)
  }, [timerRunning, timeLeft])

  const toggleTimer = () => {
    if (!timerRunning) {
      setTimerRunning(true)
      setTimerFinished(false)
    } else {
      setTimerRunning(false)
    }
  }

  const resetTimer = () => {
    setTimerRunning(false)
    setTimeLeft(Number.parseInt(selectedTime) * 60)
    setTimerFinished(false)
  }

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const addCustomTime = () => {
    const timeValue = Number.parseInt(newCustomTime)
    if (timeValue > 0) {
      const timeInMinutes = customTimeUnit === "minutes" ? timeValue : Math.ceil(timeValue / 60)
      const timeInSeconds = customTimeUnit === "minutes" ? timeValue * 60 : timeValue

      const label =
        customTimeUnit === "minutes"
          ? `${timeValue} ${timeValue === 1 ? "minuto" : "minutos"}`
          : `${timeValue} ${timeValue === 1 ? "segundo" : "segundos"}`

      const newOption = {
        value: timeInMinutes.toString(),
        label: label,
      }

      // Check if this time option already exists
      const exists = allTimeOptions.some((option) => option.value === newOption.value)
      if (!exists) {
        setCustomTimeOptions((prev) => [...prev, newOption])
        setSelectedTime(newOption.value)
        resetTimer()
      }

      setNewCustomTime("")
      setIsMoreOptionsOpen(false)
    }
  }

  const removeCustomTime = (valueToRemove: string) => {
    setCustomTimeOptions((prev) => prev.filter((option) => option.value !== valueToRemove))
    // If the removed time was selected, switch to default
    if (selectedTime === valueToRemove) {
      setSelectedTime("10")
      resetTimer()
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Esboço por Imagem</h1>
        <p className="text-muted-foreground">Desenhe baseado na imagem exibida</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Controles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge
                variant={timerRunning ? "default" : timerFinished ? "destructive" : "secondary"}
                className="w-full justify-center"
              >
                {timerRunning ? "Desenhando" : timerFinished ? "Tempo Esgotado" : "Pronto para Iniciar"}
              </Badge>

              {timerRunning && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{formatTime(timeLeft)}</div>
                  <p className="text-sm text-muted-foreground">Tempo restante</p>
                  <Progress value={((timeTotal - timeLeft) / timeTotal) * 100} className="h-1 mt-2" />
                </div>
              )}
            </div>

            {/* Configuração de Filtro */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filtro da Imagem</Label>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Configuração de Tempo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Tempo de Desenho
              </Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultTimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                  {customTimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedTime === "custom" && (
              <div className="space-y-2">
                <Label>Tempo Personalizado</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newCustomTime}
                    onChange={(e) => setNewCustomTime(e.target.value)}
                    placeholder="Ex: 20"
                    min="1"
                    max={customTimeUnit === "minutes" ? "120" : "7200"}
                  />
                  <Select
                    value={customTimeUnit}
                    onValueChange={(value: "minutes" | "seconds") => setCustomTimeUnit(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutos</SelectItem>
                      <SelectItem value="seconds">Segundos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={addCustomTime}
                  disabled={!newCustomTime || Number.parseInt(newCustomTime) <= 0}
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            )}

            {!timerRunning ? (
              <Button onClick={toggleTimer} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Iniciar Desenho
              </Button>
            ) : (
              <Button onClick={toggleTimer} className="w-full" variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Parar Timer
              </Button>
            )}

            {!canvasBoardActive && <CanvasBoardToggle active={canvasBoardActive} onToggle={setCanvasBoardActive} />}
          </CardContent>
        </Card>

        {/* Imagem */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Imagem de Referência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <img
                src={currentImage || "/placeholder.svg"}
                alt="Imagem de referência"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {canvasBoardActive && (
        <div className="canvas-fade-in">
          <CanvasBoardToggle
            active={canvasBoardActive}
            onToggle={setCanvasBoardActive}
            width={1806}
            height={725}
            title="Desenho - Esboço por Imagem"
          />

          {/* Timer overlay in canvas */}
          {timerRunning && (
            <div className="absolute bottom-4 right-4 z-10">
              <Badge variant="default" className="text-lg px-4 py-2 shadow-lg">
                {formatTime(timeLeft)}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
