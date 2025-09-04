"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, RefreshCw, Timer, Pause, Play } from "lucide-react"
import { CanvasBoardToggle } from "@/components/canvas/canvas-board-toggle"

export function SketchByDescriptionMode() {
  const [canvasBoardActive, setCanvasBoardActive] = useState(false)
  const [currentDescription, setCurrentDescription] = useState(
    "Uma paisagem montanhosa ao pôr do sol, com um lago cristalino refletindo as cores alaranjadas do céu. Algumas árvores de pinheiro se destacam na silhueta contra o horizonte.",
  )

  const [timerDuration, setTimerDuration] = useState<number | null>(null) // null for no timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (isRunning && timeLeft !== null && timeLeft > 0) {
      const intervalId = setInterval(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)

      return () => clearInterval(intervalId)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      alert("Tempo esgotado!")
    }
  }, [isRunning, timeLeft])

  const startTimer = () => {
    if (timerDuration) {
      setTimeLeft(timerDuration * 60)
      setIsRunning(true)
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    if (timerDuration) {
      setTimeLeft(timerDuration * 60)
    } else {
      setTimeLeft(null)
    }
  }

  const loadNewDescription = () => {
    // Implementar carregamento de nova descrição
    const descriptions = [
      "Um gato dormindo em uma poltrona vintage, com raios de sol entrando pela janela.",
      "Uma cidade futurista com arranha-céus de vidro e carros voadores.",
      "Um jardim japonês com ponte de madeira sobre um riacho e flores de cerejeira.",
    ]
    const randomIndex = Math.floor(Math.random() * descriptions.length)
    setCurrentDescription(descriptions[randomIndex])
    resetTimer()
  }

  const setTimer = (minutes: number | null) => {
    setTimerDuration(minutes)
    setTimeLeft(minutes ? minutes * 60 : null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Esboço por Descrição</h1>
        <p className="text-muted-foreground">Crie desenhos baseados em descrições textuais detalhadas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Descrição */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Descrição
              </CardTitle>
              <Button onClick={loadNewDescription} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Nova Descrição
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-lg leading-relaxed">{currentDescription}</p>
            </div>
          </CardContent>
        </Card>

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle>Controles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">
                Modo Descrição
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Timer (minutos)
              </label>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setTimer(5)} disabled={isRunning}>
                  5
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTimer(10)} disabled={isRunning}>
                  10
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTimer(15)} disabled={isRunning}>
                  15
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTimer(20)} disabled={isRunning}>
                  20
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTimer(null)} disabled={isRunning}>
                  Livre
                </Button>
              </div>
            </div>

            {timerDuration !== null && (
              <div className="flex items-center space-x-2">
                {isRunning ? (
                  <Button variant="outline" className="w-full" onClick={pauseTimer}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={startTimer} disabled={!timerDuration}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar
                  </Button>
                )}
                {timeLeft !== null && (
                  <div className="text-sm text-muted-foreground">
                    <Timer className="h-4 w-4 inline-block mr-1" />
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                  </div>
                )}
              </div>
            )}

            <CanvasBoardToggle active={canvasBoardActive} onToggle={setCanvasBoardActive} />

            <Button variant="outline" className="w-full">
              Salvar Desenho
            </Button>
          </CardContent>
        </Card>
      </div>

      {canvasBoardActive && (
        <div className="canvas-fade-in">
          <CanvasBoardToggle
            active={canvasBoardActive}
            onToggle={setCanvasBoardActive}
            width={800}
            height={500}
            title="Desenho - Esboço por Descrição"
          />
        </div>
      )}
    </div>
  )
}
