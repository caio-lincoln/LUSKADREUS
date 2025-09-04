"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  ImageIcon,
  FileText,
  Users,
  BarChart3,
  Settings,
  Database,
  Shield,
  Eye,
  Trash2,
  Edit,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Filter,
  Search,
  RefreshCw,
  HardDrive,
  Zap,
  Monitor,
  ScrollText,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  provider: "google" | "discord"
  joinDate: Date
  lastActive: Date
  drawingsCount: number
  isActive: boolean
  isBanned: boolean
}

interface Drawing {
  id: string
  title: string
  author: string
  mode: string
  createdAt: Date
  isPublic: boolean
  likes: number
  comments: number
  isReported: boolean
}

interface GalleryImage {
  id: string
  filename: string
  category: string
  description: string
  uploadDate: Date
  size: string
  dimensions: string
  isActive: boolean
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalDrawings: number
  publicDrawings: number
  totalLikes: number
  totalComments: number
  reportedContent: number
  systemUptime: string
}

export function EnhancedAdminDashboard() {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [imageDescription, setImageDescription] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [imageFilter, setImageFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)

  // Mock data
  const [systemStats] = useState<SystemStats>({
    totalUsers: 1247,
    activeUsers: 89,
    totalDrawings: 3456,
    publicDrawings: 2134,
    totalLikes: 12890,
    totalComments: 4567,
    reportedContent: 12,
    systemUptime: "99.9%",
  })

  const [galleryImages] = useState<GalleryImage[]>([
    {
      id: "1",
      filename: "paisagem_montanha_001.jpg",
      category: "sketch-by-image",
      description: "Paisagem montanhosa com lago ao pôr do sol",
      uploadDate: new Date("2024-01-20"),
      size: "2.4 MB",
      dimensions: "1920x1080",
      isActive: true,
    },
    {
      id: "2",
      filename: "retrato_pessoa_002.jpg",
      category: "blind-study",
      description: "Retrato de pessoa jovem sorrindo",
      uploadDate: new Date("2024-01-19"),
      size: "1.8 MB",
      dimensions: "1080x1080",
      isActive: true,
    },
    {
      id: "3",
      filename: "natureza_flores_003.jpg",
      category: "sketch-by-description",
      description: "Campo de flores coloridas na primavera",
      uploadDate: new Date("2024-01-18"),
      size: "3.1 MB",
      dimensions: "1920x1280",
      isActive: false,
    },
  ])

  const [users] = useState<User[]>([
    {
      id: "1",
      name: "João Silva",
      email: "joao@gmail.com",
      provider: "google",
      joinDate: new Date("2024-01-15"),
      lastActive: new Date("2024-01-20"),
      drawingsCount: 24,
      isActive: true,
      isBanned: false,
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@discord.com",
      provider: "discord",
      joinDate: new Date("2024-01-10"),
      lastActive: new Date("2024-01-19"),
      drawingsCount: 18,
      isActive: true,
      isBanned: false,
    },
  ])

  const [drawings] = useState<Drawing[]>([
    {
      id: "1",
      title: "Paisagem Montanhosa",
      author: "João Silva",
      mode: "sketch-by-image",
      createdAt: new Date("2024-01-20"),
      isPublic: true,
      likes: 45,
      comments: 8,
      isReported: false,
    },
    {
      id: "2",
      title: "Retrato Abstrato",
      author: "Maria Santos",
      mode: "sketch-by-description",
      createdAt: new Date("2024-01-19"),
      isPublic: true,
      likes: 32,
      comments: 5,
      isReported: true,
    },
  ])

  const imageFilters = [
    { value: "all", label: "Todas as Categorias" },
    { value: "sketch-by-image", label: "Esboço por Imagem" },
    { value: "blind-study", label: "Estudo Cego" },
    { value: "sketch-by-description", label: "Esboço por Descrição" },
  ]

  const handleBanUser = (userId: string) => {
    console.log("Banir usuário:", userId)
  }

  const handleDeleteDrawing = (drawingId: string) => {
    console.log("Excluir desenho:", drawingId)
  }

  const handleResolveReport = (drawingId: string) => {
    console.log("Resolver denúncia:", drawingId)
  }

  const handleSystemAction = async (action: string) => {
    setIsProcessing(true)
    setProcessProgress(0)

    // Simular progresso
    const interval = setInterval(() => {
      setProcessProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          console.log(`✅ ${action} concluído!`)
          return 100
        }
        return prev + 10
      })
    }, 200)

    console.log(`🔄 Iniciando ${action}...`)
  }

  const filteredImages = galleryImages.filter((image) => {
    const matchesFilter = imageFilter === "all" || imageFilter === "" || image.category === imageFilter
    const matchesSearch =
      searchTerm === "" ||
      image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Painel Administrativo Avançado</h1>
        <p className="text-muted-foreground">Gerencie conteúdo, usuários e configurações da plataforma</p>
      </div>

      {/* Estatísticas do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Usuários Totais</p>
                <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{systemStats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Desenhos Totais</p>
                <p className="text-2xl font-bold">{systemStats.totalDrawings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Conteúdo Reportado</p>
                <p className="text-2xl font-bold">{systemStats.reportedContent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="gallery">Galeria</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="moderation">Moderação</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload de Imagens com Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Upload de Imagens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sketch-by-image">Esboço por Imagem</SelectItem>
                      <SelectItem value="blind-study">Estudo Cego</SelectItem>
                      <SelectItem value="sketch-by-description">Esboço por Descrição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image-filter">Filtro de Imagem</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Aplicar filtro automático" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem filtro</SelectItem>
                      <SelectItem value="blur">Desfoque</SelectItem>
                      <SelectItem value="grayscale">Preto e branco</SelectItem>
                      <SelectItem value="sepia">Sépia</SelectItem>
                      <SelectItem value="contrast">Alto contraste</SelectItem>
                      <SelectItem value="outline">Apenas contornos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image-upload">Arquivo de Imagem</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">Clique para fazer upload ou arraste a imagem aqui</p>
                    <Input type="file" accept="image/*" className="mt-4" />
                  </div>
                </div>

                <Button className="w-full">Fazer Upload</Button>
              </CardContent>
            </Card>

            {/* Gerenciar Descrições */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Gerenciar Descrições
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-select">Selecionar Imagem</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma imagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {galleryImages.map((image) => (
                        <SelectItem key={image.id} value={image.id}>
                          {image.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Digite uma descrição detalhada da imagem..."
                    rows={4}
                  />
                </div>

                <Button className="w-full">Salvar Descrição</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Galeria de Imagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros e Busca */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={imageFilter} onValueChange={setImageFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageFilters.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de Imagens */}
              <div className="space-y-2">
                {filteredImages.map((image) => (
                  <div key={image.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{image.filename}</h4>
                        <p className="text-sm text-muted-foreground">{image.description}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{image.category}</Badge>
                          <Badge variant={image.isActive ? "default" : "secondary"}>
                            {image.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{image.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedImage(image)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.email} • {user.drawingsCount} desenhos
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={user.provider === "google" ? "default" : "secondary"}>
                          {user.provider === "google" ? "Google" : "Discord"}
                        </Badge>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        {user.isBanned && <Badge variant="destructive">Banido</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBanUser(user.id)}
                        className={user.isBanned ? "text-green-600" : "text-red-600"}
                      >
                        {user.isBanned ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Moderação de Conteúdo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-medium">Conteúdo Reportado</h3>
                {drawings
                  .filter((d) => d.isReported)
                  .map((drawing) => (
                    <div
                      key={drawing.id}
                      className="flex items-center justify-between p-3 border border-red-200 rounded"
                    >
                      <div>
                        <h4 className="font-medium">{drawing.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          por {drawing.author} • Reportado por conteúdo inadequado
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleResolveReport(drawing.id)}>
                          Aprovar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteDrawing(drawing.id)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estatísticas de Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Desenhos Públicos</span>
                    <span>{systemStats.publicDrawings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Likes</span>
                    <span>{systemStats.totalLikes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Comentários</span>
                    <span>{systemStats.totalComments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime do Sistema</span>
                    <span>{systemStats.systemUptime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Modo Mais Popular</h4>
                    <p className="text-sm text-muted-foreground">Esboço por Imagem (45%)</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Horário de Pico</h4>
                    <p className="text-sm text-muted-foreground">20:00 - 22:00</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Crescimento Mensal</h4>
                    <p className="text-sm text-muted-foreground">+12% novos usuários</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sistema e Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProcessing && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Processando...</span>
                  </div>
                  <Progress value={processProgress} className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleSystemAction("Backup do Banco")} disabled={isProcessing}>
                  <HardDrive className="h-4 w-4 mr-2" />
                  Backup do Banco
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSystemAction("Limpeza de Cache")}
                  disabled={isProcessing}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSystemAction("Relatório de Sistema")}
                  disabled={isProcessing}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Relatório de Sistema
                </Button>
                <Button variant="outline" onClick={() => handleSystemAction("Logs do Sistema")} disabled={isProcessing}>
                  <ScrollText className="h-4 w-4 mr-2" />
                  Logs do Sistema
                </Button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Status do Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">CPU:</span>
                    <span className="ml-2 font-medium">23%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Memória:</span>
                    <span className="ml-2 font-medium">67%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Disco:</span>
                    <span className="ml-2 font-medium">45%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="ml-2 font-medium">15d 4h</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Registro de Novos Usuários</Label>
                    <p className="text-sm text-muted-foreground">Permitir novos registros na plataforma</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Moderação Automática</Label>
                    <p className="text-sm text-muted-foreground">Ativar filtros automáticos de conteúdo</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo Manutenção</Label>
                    <p className="text-sm text-muted-foreground">Colocar a plataforma em modo manutenção</p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label>Limite de Desenhos por Usuário</Label>
                  <Select defaultValue="unlimited">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 desenhos</SelectItem>
                      <SelectItem value="50">50 desenhos</SelectItem>
                      <SelectItem value="100">100 desenhos</SelectItem>
                      <SelectItem value="unlimited">Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Imagem */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Imagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Nome:</strong> {selectedImage.filename}
                </div>
                <div>
                  <strong>Categoria:</strong> {selectedImage.category}
                </div>
                <div>
                  <strong>Tamanho:</strong> {selectedImage.size}
                </div>
                <div>
                  <strong>Dimensões:</strong> {selectedImage.dimensions}
                </div>
                <div>
                  <strong>Upload:</strong> {selectedImage.uploadDate.toLocaleDateString()}
                </div>
                <div>
                  <strong>Status:</strong> {selectedImage.isActive ? "Ativo" : "Inativo"}
                </div>
              </div>
              <div>
                <strong>Descrição:</strong>
                <p className="text-sm text-muted-foreground mt-1">{selectedImage.description}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modais existentes... */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Nome:</strong> {selectedUser.name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedUser.email}
                </div>
                <div>
                  <strong>Provedor:</strong> {selectedUser.provider}
                </div>
                <div>
                  <strong>Membro desde:</strong> {selectedUser.joinDate.toLocaleDateString()}
                </div>
                <div>
                  <strong>Última atividade:</strong> {selectedUser.lastActive.toLocaleDateString()}
                </div>
                <div>
                  <strong>Desenhos:</strong> {selectedUser.drawingsCount}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant={selectedUser.isBanned ? "default" : "destructive"}
                  onClick={() => handleBanUser(selectedUser.id)}
                >
                  {selectedUser.isBanned ? "Desbanir" : "Banir"} Usuário
                </Button>
                <Button variant="outline">Ver Desenhos</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedDrawing && (
        <Dialog open={!!selectedDrawing} onOpenChange={() => setSelectedDrawing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Desenho</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Título:</strong> {selectedDrawing.title}
                </div>
                <div>
                  <strong>Autor:</strong> {selectedDrawing.author}
                </div>
                <div>
                  <strong>Modo:</strong> {selectedDrawing.mode}
                </div>
                <div>
                  <strong>Criado em:</strong> {selectedDrawing.createdAt.toLocaleDateString()}
                </div>
                <div>
                  <strong>Visibilidade:</strong> {selectedDrawing.isPublic ? "Público" : "Privado"}
                </div>
                <div>
                  <strong>Likes:</strong> {selectedDrawing.likes}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="destructive" onClick={() => handleDeleteDrawing(selectedDrawing.id)}>
                  Excluir Desenho
                </Button>
                <Button variant="outline">Baixar Imagem</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
