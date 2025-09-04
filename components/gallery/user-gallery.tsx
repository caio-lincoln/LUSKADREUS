"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Share2,
  Trash2,
  Eye,
  Calendar,
  Palette,
  Star,
  Heart,
  MessageSquare,
} from "lucide-react"

interface Drawing {
  id: string
  title: string
  thumbnail: string
  mode: string
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  likes: number
  comments: number
  isFavorite: boolean
  tags: string[]
  description?: string
}

export function UserGallery() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMode, setFilterMode] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)

  // Mock data - em produção viria da API
  const [drawings] = useState<Drawing[]>([
    {
      id: "1",
      title: "Paisagem Montanhosa",
      thumbnail: "/placeholder.svg?height=200&width=200",
      mode: "sketch-by-image",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      isPublic: true,
      likes: 24,
      comments: 5,
      isFavorite: true,
      tags: ["paisagem", "montanha", "natureza"],
      description: "Desenho baseado em uma foto de montanhas ao pôr do sol",
    },
    {
      id: "2",
      title: "Retrato Abstrato",
      thumbnail: "/placeholder.svg?height=200&width=200",
      mode: "sketch-by-description",
      createdAt: new Date("2024-01-14"),
      updatedAt: new Date("2024-01-14"),
      isPublic: false,
      likes: 12,
      comments: 2,
      isFavorite: false,
      tags: ["retrato", "abstrato", "pessoas"],
      description: "Retrato criado a partir de descrição textual",
    },
    {
      id: "3",
      title: "Estudo de Anatomia",
      thumbnail: "/placeholder.svg?height=200&width=200",
      mode: "blind-study",
      createdAt: new Date("2024-01-13"),
      updatedAt: new Date("2024-01-13"),
      isPublic: true,
      likes: 8,
      comments: 1,
      isFavorite: true,
      tags: ["anatomia", "estudo", "corpo"],
      description: "Estudo cego de anatomia humana",
    },
    {
      id: "4",
      title: "Colaboração Multiplayer",
      thumbnail: "/placeholder.svg?height=200&width=200",
      mode: "multiplayer-portrait",
      createdAt: new Date("2024-01-12"),
      updatedAt: new Date("2024-01-12"),
      isPublic: true,
      likes: 35,
      comments: 8,
      isFavorite: false,
      tags: ["multiplayer", "colaboração", "retrato"],
      description: "Desenho criado em sessão multiplayer",
    },
  ])

  const filteredDrawings = drawings.filter((drawing) => {
    const matchesSearch =
      drawing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drawing.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterMode === "all" || drawing.mode === filterMode
    return matchesSearch && matchesFilter
  })

  const sortedDrawings = [...filteredDrawings].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime()
      case "popular":
        return b.likes - a.likes
      case "title":
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const getModeLabel = (mode: string) => {
    const modes = {
      "sketch-by-image": "Esboço por Imagem",
      "sketch-by-description": "Esboço por Descrição",
      "blind-study": "Estudo Cego",
      "multiplayer-portrait": "Retrato Falado",
    }
    return modes[mode as keyof typeof modes] || mode
  }

  const getModeColor = (mode: string) => {
    const colors = {
      "sketch-by-image": "bg-blue-500",
      "sketch-by-description": "bg-green-500",
      "blind-study": "bg-purple-500",
      "multiplayer-portrait": "bg-orange-500",
    }
    return colors[mode as keyof typeof colors] || "bg-gray-500"
  }

  const handleDownload = (drawing: Drawing) => {
    // Implementar download
    console.log("Download:", drawing.title)
  }

  const handleShare = (drawing: Drawing) => {
    // Implementar compartilhamento
    console.log("Share:", drawing.title)
  }

  const handleDelete = (drawing: Drawing) => {
    // Implementar exclusão
    console.log("Delete:", drawing.title)
  }

  const toggleFavorite = (drawing: Drawing) => {
    // Implementar toggle favorito
    console.log("Toggle favorite:", drawing.title)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Desenhos</h1>
          <p className="text-muted-foreground">Gerencie sua coleção de desenhos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Modos</SelectItem>
                  <SelectItem value="sketch-by-image">Esboço por Imagem</SelectItem>
                  <SelectItem value="sketch-by-description">Esboço por Descrição</SelectItem>
                  <SelectItem value="blind-study">Estudo Cego</SelectItem>
                  <SelectItem value="multiplayer-portrait">Retrato Falado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais Recentes</SelectItem>
                  <SelectItem value="oldest">Mais Antigos</SelectItem>
                  <SelectItem value="popular">Mais Populares</SelectItem>
                  <SelectItem value="title">Por Título</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Desenhos</p>
                <p className="text-2xl font-bold">{drawings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Likes</p>
                <p className="text-2xl font-bold">{drawings.reduce((sum, d) => sum + d.likes, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Favoritos</p>
                <p className="text-2xl font-bold">{drawings.filter((d) => d.isFavorite).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Públicos</p>
                <p className="text-2xl font-bold">{drawings.filter((d) => d.isPublic).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Desenhos */}
      <div className="space-y-4">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedDrawings.map((drawing) => (
              <Card key={drawing.id} className="group hover:shadow-lg transition-all duration-200">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={drawing.thumbnail || "/placeholder.svg"}
                      alt={drawing.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className={`${getModeColor(drawing.mode)} text-white text-xs`}>
                        {getModeLabel(drawing.mode)}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(drawing)}
                        className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                      >
                        <Star className={`h-4 w-4 ${drawing.isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
                      </Button>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedDrawing(drawing)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{drawing.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {drawing.createdAt.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {drawing.likes}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(drawing)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleShare(drawing)} className="h-8 w-8 p-0">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(drawing)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge variant={drawing.isPublic ? "default" : "secondary"} className="text-xs">
                        {drawing.isPublic ? "Público" : "Privado"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedDrawings.map((drawing) => (
              <Card key={drawing.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={drawing.thumbnail || "/placeholder.svg"}
                      alt={drawing.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{drawing.title}</h3>
                        <Badge className={`${getModeColor(drawing.mode)} text-white text-xs`}>
                          {getModeLabel(drawing.mode)}
                        </Badge>
                        {drawing.isFavorite && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {drawing.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {drawing.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {drawing.comments}
                        </div>
                        <Badge variant={drawing.isPublic ? "default" : "secondary"} className="text-xs">
                          {drawing.isPublic ? "Público" : "Privado"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDrawing(drawing)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(drawing)} className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleShare(drawing)} className="h-8 w-8 p-0">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(drawing)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedDrawing && (
        <Dialog open={!!selectedDrawing} onOpenChange={() => setSelectedDrawing(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedDrawing.title}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedDrawing.thumbnail || "/placeholder.svg"}
                  alt={selectedDrawing.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Modo:</span>
                      <Badge className={`${getModeColor(selectedDrawing.mode)} text-white`}>
                        {getModeLabel(selectedDrawing.mode)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Criado em:</span>
                      <span>{selectedDrawing.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atualizado em:</span>
                      <span>{selectedDrawing.updatedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Visibilidade:</span>
                      <Badge variant={selectedDrawing.isPublic ? "default" : "secondary"}>
                        {selectedDrawing.isPublic ? "Público" : "Privado"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Likes:</span>
                      <span>{selectedDrawing.likes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comentários:</span>
                      <span>{selectedDrawing.comments}</span>
                    </div>
                  </div>
                </div>

                {selectedDrawing.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Descrição</h4>
                    <p className="text-sm text-muted-foreground">{selectedDrawing.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedDrawing.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleDownload(selectedDrawing)} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={() => handleShare(selectedDrawing)} variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {sortedDrawings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum desenho encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterMode !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro desenho!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
