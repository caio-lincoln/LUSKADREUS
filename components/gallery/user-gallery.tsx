"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { GalleryService } from "@/lib/gallery-service"
import { Drawing } from "@/lib/supabase-client"
import { authService } from "@/components/auth/auth-service"
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
  Loader2,
  RefreshCw,
} from "lucide-react"

// Interface Drawing agora vem do supabase-client

export function UserGallery() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMode, setFilterMode] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Carregar dados reais do Supabase
  useEffect(() => {
    const user = authService.getCurrentUser()
    setCurrentUser(user)
    if (user) {
      loadDrawings()
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadDrawings()
    }
  }, [searchTerm, filterMode, sortBy])

  const loadDrawings = async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      const data = await GalleryService.getUserDrawings(currentUser.id, {
        searchTerm: searchTerm || undefined,
        filterMode: filterMode === 'all' ? undefined : filterMode,
        sortBy,
        limit: 50
      })
      setDrawings(data)
    } catch (error) {
      console.error('Erro ao carregar desenhos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus desenhos.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshDrawings = async () => {
    setRefreshing(true)
    await loadDrawings()
    setRefreshing(false)
    toast({
      title: "Atualizado",
      description: "Galeria atualizada com sucesso!"
    })
  }

  // Dados já vêm filtrados e ordenados do backend
  const displayDrawings = drawings

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

  const handleDownload = async (drawing: Drawing) => {
    try {
      if (drawing.image_url) {
        const link = document.createElement('a')
        link.href = drawing.image_url
        link.download = `${drawing.title}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "Download iniciado",
          description: `Baixando ${drawing.title}...`
        })
      }
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o desenho.",
        variant: "destructive"
      })
    }
  }

  const handleShare = async (drawing: Drawing) => {
    try {
      if (navigator.share && drawing.is_public) {
        await navigator.share({
          title: drawing.title,
          text: drawing.description || 'Confira este desenho!',
          url: window.location.origin + `/gallery/${drawing.id}`
        })
      } else {
        // Fallback para copiar URL
        const url = window.location.origin + `/gallery/${drawing.id}`
        await navigator.clipboard.writeText(url)
        toast({
          title: "Link copiado",
          description: "Link do desenho copiado para a área de transferência."
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o desenho.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (drawing: Drawing) => {
    if (!confirm(`Tem certeza que deseja excluir "${drawing.title}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      await GalleryService.deleteDrawing(drawing.id)
      setDrawings(prev => prev.filter(d => d.id !== drawing.id))
      toast({
        title: "Desenho excluído",
        description: `"${drawing.title}" foi excluído com sucesso.`
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o desenho.",
        variant: "destructive"
      })
    }
  }

  const toggleFavorite = async (drawing: Drawing) => {
    if (!currentUser) return

    try {
      const isFavorite = await GalleryService.toggleFavorite(currentUser.id, drawing.id)
      setDrawings(prev => prev.map(d => 
        d.id === drawing.id ? { ...d, is_favorite: isFavorite } : d
      ))
      
      toast({
        title: isFavorite ? "Adicionado aos favoritos" : "Removido dos favoritos",
        description: `"${drawing.title}" ${isFavorite ? 'foi adicionado aos' : 'foi removido dos'} seus favoritos.`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos.",
        variant: "destructive"
      })
    }
  }

  const toggleVisibility = async (drawing: Drawing) => {
    try {
      const newVisibility = !drawing.is_public
      await GalleryService.updateDrawingVisibility(drawing.id, newVisibility)
      setDrawings(prev => prev.map(d => 
        d.id === drawing.id ? { ...d, is_public: newVisibility } : d
      ))
      
      toast({
        title: "Visibilidade atualizada",
        description: `"${drawing.title}" agora está ${newVisibility ? 'público' : 'privado'}.`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a visibilidade.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Desenhos</h1>
          <p className="text-muted-foreground">
            {loading ? "Carregando..." : `${drawings.length} desenho${drawings.length !== 1 ? 's' : ''} encontrado${drawings.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshDrawings}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
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
                  <SelectValue placeholder="Filtrar por modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os modos</SelectItem>
                  <SelectItem value="sketch-by-image">Esboço por Imagem</SelectItem>
                  <SelectItem value="sketch-by-description">Esboço por Descrição</SelectItem>
                  <SelectItem value="blind-study">Estudo Cego</SelectItem>
                  <SelectItem value="multiplayer-portrait">Retrato Falado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                  <SelectItem value="popular">Mais populares</SelectItem>
                  <SelectItem value="title">Título A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando seus desenhos...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && drawings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum desenho encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterMode !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Você ainda não criou nenhum desenho. Comece agora!'}
            </p>
            {(!searchTerm && filterMode === 'all') && (
              <Button onClick={() => window.location.href = '/dashboard'}>
                <Palette className="h-4 w-4 mr-2" />
                Criar Primeiro Desenho
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid de Desenhos */}
      {!loading && drawings.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayDrawings.map((drawing) => (
            <Card key={drawing.id} className="group hover:shadow-lg transition-shadow">
              <div className="relative aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={drawing.thumbnail_url || '/placeholder.svg?height=200&width=200'}
                  alt={drawing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder.svg?height=200&width=200'
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge className={`${getModeColor(drawing.mode)} text-white`}>
                    {getModeLabel(drawing.mode)}
                  </Badge>
                  {!drawing.is_public && (
                    <Badge variant="secondary">
                      <Eye className="h-3 w-3 mr-1" />
                      Privado
                    </Badge>
                  )}
                </div>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {drawing.tags?.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-white/90">
                      {tag}
                    </Badge>
                  ))}
                  {(drawing.tags?.length || 0) > 2 && (
                    <Badge variant="outline" className="text-xs bg-white/90">
                      +{(drawing.tags?.length || 0) - 2}
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg truncate">{drawing.title}</h3>
                    {drawing.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{drawing.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {drawing.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {drawing.comments_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {drawing.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(drawing.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(drawing)}
                      className={drawing.is_favorite ? "text-yellow-500" : ""}
                    >
                      <Star className={`h-4 w-4 ${drawing.is_favorite ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleVisibility(drawing)}
                      title={drawing.is_public ? "Tornar privado" : "Tornar público"}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleShare(drawing)}
                      disabled={!drawing.is_public}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(drawing)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(drawing)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedDrawing(drawing)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedDrawing && (
        <Dialog open={!!selectedDrawing} onOpenChange={() => setSelectedDrawing(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedDrawing.title}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedDrawing.thumbnail_url || "/placeholder.svg"}
                  alt={selectedDrawing.title}
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder.svg?height=400&width=400'
                  }}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Modo:</span>
                      <Badge className={getModeColor(selectedDrawing.mode)}>
                        {getModeLabel(selectedDrawing.mode)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Criado em:</span>
                      <span>{new Date(selectedDrawing.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atualizado em:</span>
                      <span>{new Date(selectedDrawing.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Visibilidade:</span>
                      <Badge variant={selectedDrawing.is_public ? "default" : "secondary"}>
                        {selectedDrawing.is_public ? "Público" : "Privado"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Likes:</span>
                      <span>{selectedDrawing.likes_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comentários:</span>
                      <span>{selectedDrawing.comments_count}</span>
                    </div>
                  </div>
                </div>

                {selectedDrawing.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Descrição</h4>
                    <p className="text-sm text-muted-foreground">{selectedDrawing.description}</p>
                  </div>
                )}

                {selectedDrawing.tags && selectedDrawing.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedDrawing.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleDownload(selectedDrawing)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={() => handleShare(selectedDrawing)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
