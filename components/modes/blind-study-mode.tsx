"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, CheckCircle, ArrowRight, Clock, Pause } from "lucide-react"
import { CanvasBoardToggle } from "@/components/canvas/canvas-board-toggle"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

export function BlindStudyMode() {
  const [phase, setPhase] = useState<"viewing" | "drawing" | "comparing">("viewing")
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedTime, setSelectedTime] = useState("30")
  const [customTime, setCustomTime] = useState("")
  const [canvasBoardActive, setCanvasBoardActive] = useState(false)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timeTotal, setTimeTotal] = useState(30)
  const [customTimeError, setCustomTimeError] = useState<string | null>(null)

  const currentImage = "/placeholder.svg?height=400&width=400"

  const timeOptions = [
    { value: "15", label: "15 segundos" },
    { value: "30", label: "30 segundos" },
    { value: "45", label: "45 segundos" },
    { value: "60", label: "1 minuto" },
    { value: "90", label: "1m 30s" },
    { value: "120", label: "2 minutos" },
    { value: "180", label: "3 minutos" },
    { value: "300", label: "5 minutos" },
    { value: "600", label: "10 minutos" },
    { value: "custom", label: "Personalizado" },
  ]

  const { toast } = useToast()

  // Função para reproduzir som de notificação com fallback
  const playNotificationSound = () => {
    try {
      // Usar um beep gerado por API Web Audio como fallback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = "sine"
      oscillator.frequency.value = 800 // frequência em Hz
      gainNode.gain.value = 0.1 // volume baixo

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
      }, 200)

      console.log("Som de notificação reproduzido via Web Audio API")
    } catch (error) {
      console.error("Não foi possível reproduzir o som de notificação:", error)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setTimeLeft(0)
            setPhase("drawing")
            setIsTimerActive(false)

            // Reproduzir som de notificação
            playNotificationSound()

            toast({
              title: "Tempo esgotado!",
              description: "Comece a desenhar.",
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (!isTimerActive) {
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [isTimerActive, timeLeft, toast])

  const startViewing = () => {
    let duration = Number.parseInt(selectedTime)
    if (selectedTime === "custom" && customTime) {
      duration = Number.parseInt(customTime)
    }

    setPhase("viewing")
    setTimeLeft(duration)
    setTimeTotal(duration)
    setIsTimerActive(true)
    setCanvasBoardActive(false)
  }

  const cancelTimer = () => {
    setIsTimerActive(false)
    setTimeLeft(Number.parseInt(selectedTime))
  }

  const finishDrawing = () => {
    setPhase("comparing")
  }

  const nextImage = () => {
    setPhase("viewing")
    let duration = Number.parseInt(selectedTime)
    if (selectedTime === "custom" && customTime) {
      duration = Number.parseInt(customTime)
    }
    setTimeLeft(duration)
    setTimeTotal(duration)
    setIsTimerActive(false)
    setCanvasBoardActive(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`
  }

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomTime(value)

    if (value) {
      const parsedValue = Number.parseInt(value)
      if (parsedValue < 5 || parsedValue > 1800) {
        setCustomTimeError("O tempo deve estar entre 5 segundos e 30 minutos.")
      } else {
        setCustomTimeError(null)
      }
    } else {
      setCustomTimeError("Por favor, insira um valor.")
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Estudo Cego</h1>
        <p className="text-muted-foreground">Memorize a imagem e depois desenhe sem olhar a referência</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {phase === "viewing" ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              Controles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge
                variant={phase === "viewing" ? "default" : phase === "drawing" ? "secondary" : "destructive"}
                className="w-full justify-center"
              >
                {phase === "viewing" && "Visualizando"}
                {phase === "drawing" && "Desenhando"}
                {phase === "comparing" && "Comparando"}
              </Badge>

              {phase === "viewing" && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{formatTime(timeLeft)}</div>
                  <p className="text-sm text-muted-foreground">Tempo restante</p>
                  <Progress value={((timeTotal - timeLeft) / timeTotal) * 100} className="h-1 mt-2" />
                </div>
              )}
            </div>

            {/* Configuração de Tempo */}
            {phase === "viewing" && !isTimerActive && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tempo de Visualização
                  </Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTime === "custom" && (
                  <div className="space-y-2">
                    <Label>Tempo Personalizado (segundos)</Label>
                    <Input
                      type="number"
                      value={customTime}
                      onChange={handleCustomTimeChange}
                      placeholder="Ex: 45"
                      min="5"
                      max="1800"
                    />
                    {customTimeError && <p className="text-xs text-red-500">{customTimeError}</p>}
                    <p className="text-xs text-muted-foreground">Entre 5 segundos e 30 minutos</p>
                  </div>
                )}
              </div>
            )}

            {phase === "viewing" && (
              <>
                {!isTimerActive ? (
                  <Button
                    onClick={startViewing}
                    className="w-full"
                    disabled={
                      selectedTime === "custom" &&
                      (customTimeError !== null || !customTime || Number.parseInt(customTime) < 5)
                    }
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Iniciar Estudo
                  </Button>
                ) : (
                  <Button onClick={cancelTimer} className="w-full" variant="destructive">
                    <Pause className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </>
            )}

            {phase === "drawing" && (
              <>
                <CanvasBoardToggle
                  active={canvasBoardActive}
                  onToggle={setCanvasBoardActive}
                  width={1200}
                  height={800}
                />
                <Button onClick={finishDrawing} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Já Terminei
                </Button>
              </>
            )}

            {phase === "comparing" && (
              <Button onClick={nextImage} className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Próxima Imagem
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Imagem */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {phase === "viewing" && "Memorize esta imagem"}
              {phase === "drawing" && "Desenhe de memória"}
              {phase === "comparing" && "Compare com o original"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              {phase === "viewing" || phase === "comparing" ? (
                <img
                  src={currentImage || "/placeholder.svg"}
                  alt="Imagem de referência"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center space-y-2">
                  <EyeOff className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="text-muted-foreground">Imagem oculta - desenhe de memória</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {canvasBoardActive && phase === "drawing" && (
        <div className="canvas-fade-in">
          <CanvasBoardToggle
            active={canvasBoardActive}
            onToggle={setCanvasBoardActive}
            width={1200}
            height={800}
            title="Desenho - Estudo Cego"
          />
        </div>
      )}
    </div>
  )
}
