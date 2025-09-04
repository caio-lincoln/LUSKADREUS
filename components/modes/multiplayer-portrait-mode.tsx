"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Send, Crown, Clock } from "lucide-react"
import { CanvasBoardWithControls } from "@/canvasBoard/board/CanvasBoardWithControls"

interface Player {
  id: string
  name: string
  isHost: boolean
  isReady: boolean
}

interface ChatMessage {
  id: string
  player: string
  message: string
  timestamp: Date
}

export function MultiplayerPortraitMode() {
  const [gamePhase, setGamePhase] = useState<"lobby" | "playing" | "results">("lobby")
  const [roomCode, setRoomCode] = useState("ABCD1234")
  const [chatMessage, setChatMessage] = useState("")
  const [currentDescription, setCurrentDescription] = useState("")

  const [players] = useState<Player[]>([
    { id: "1", name: "Você", isHost: true, isReady: true },
    { id: "2", name: "Artista123", isHost: false, isReady: true },
    { id: "3", name: "Desenhista", isHost: false, isReady: false },
  ])

  const [chatMessages] = useState<ChatMessage[]>([
    { id: "1", player: "Artista123", message: "Pronto para começar!", timestamp: new Date() },
    { id: "2", player: "Desenhista", message: "Só um minuto...", timestamp: new Date() },
  ])

  const [round, setRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [isTimeRunning, setIsTimeRunning] = useState(false)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (gamePhase === "playing" && isTimeRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      clearInterval(intervalId)
      // Handle round end or game end logic here
      if (round < 3) {
        setRound(round + 1)
        setTimeLeft(300)
        setIsTimeRunning(true)
        setCurrentDescription("Nova descrição para a rodada " + (round + 1))
      } else {
        setGamePhase("results")
      }
    }

    return () => clearInterval(intervalId)
  }, [gamePhase, isTimeRunning, timeLeft, round])

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const startGame = () => {
    setGamePhase("playing")
    setCurrentDescription("Personagem com cabelos longos e ondulados...")
    setIsTimeRunning(true)
  }

  const sendMessage = () => {
    if (chatMessage.trim()) {
      // Implementar envio de mensagem
      setChatMessage("")
    }
  }

  if (gamePhase === "lobby") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Retrato Falado</h1>
          <p className="text-muted-foreground">Modo multiplayer - desenhe baseado em descrições parciais</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sala */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sala: {roomCode}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Jogadores ({players.length}/8)</h3>
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {player.isHost && <Crown className="h-4 w-4 text-yellow-500" />}
                      <span>{player.name}</span>
                    </div>
                    <Badge variant={player.isReady ? "default" : "secondary"}>
                      {player.isReady ? "Pronto" : "Aguardando"}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button onClick={startGame} className="w-full" disabled={players.some((p) => !p.isReady)}>
                Iniciar Jogo
              </Button>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle>Chat da Sala</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-48 w-full border rounded p-2">
                <div className="space-y-2">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-medium text-blue-600">{msg.player}:</span>
                      <span className="ml-2">{msg.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (gamePhase === "playing") {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Retrato Falado - Em Jogo</h1>
          <div className="flex items-center justify-center gap-4">
            <Badge variant={timeLeft <= 60 ? "destructive" : "default"} className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </Badge>
            <Badge variant="secondary">Rodada {round}/3</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Descrição */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Descrição do Bot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-lg">{currentDescription}</p>
              </div>

              {/* Área de Desenho */}
              <div className="canvas-fade-in">
                <CanvasBoardWithControls
                  width={800}
                  height={400}
                  title="Retrato Falado - Desenhe aqui"
                  showControls={true}
                  onSave={(imageData) => {
                    console.log("Desenho do multiplayer salvo:", imageData)
                  }}
                  onClear={() => {
                    console.log("Canvas do multiplayer limpo")
                  }}
                  onDrawingChange={(hasDrawing) => {
                    console.log("Estado do desenho multiplayer:", hasDrawing)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Chat e Jogadores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Chat & Jogadores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                {players.map((player) => (
                  <div key={player.id} className="text-sm p-1 bg-gray-50 rounded">
                    {player.name}
                  </div>
                ))}
              </div>

              <ScrollArea className="h-32 w-full border rounded p-2">
                <div className="space-y-1">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-xs">
                      <span className="font-medium">{msg.player}:</span>
                      <span className="ml-1">{msg.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-1">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Chat..."
                  className="text-sm"
                  size={1}
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
