"use client"

import { useState, useEffect } from "react"
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
import { supabase } from "@/lib/supabase-client"
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
  provider: "google" | "email"
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
  imageUrl?: string
  thumbnailUrl?: string
  authorName?: string
  position?: number
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

export default function EnhancedAdminDashboard() {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("")
  const [selectedImageFilter, setSelectedImageFilter] = useState("all")
  const [imageDescription, setImageDescription] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [imageFilter, setImageFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Estados para upload em lotes
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchResults, setBatchResults] = useState<any[]>([])

  // Dados reais do sistema - removendo dados mockados
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDrawings: 0,
    publicDrawings: 0,
    totalLikes: 0,
    totalComments: 0,
    reportedContent: 0,
    systemUptime: "0%",
  })

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [drawings, setDrawings] = useState<Drawing[]>([])

  // Carregar dados reais do Supabase
  useEffect(() => {
    loadSystemData()
    // Também carregar imagens da galeria diretamente
    loadGalleryImages()
  }, [])

  const loadSystemData = async () => {
    try {
      setIsProcessing(true)
      setProcessProgress(0)

      // Carregar estatísticas do sistema
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, created_at, last_active_at')

      if (usersError) throw usersError

      const { data: drawingsData, error: drawingsError } = await supabase
        .from('drawings')
        .select('id, is_public, likes_count, comments_count, created_at')

      if (drawingsError) throw drawingsError

      // Calcular estatísticas
      const totalUsers = usersData?.length || 0
      const activeUsers = usersData?.filter(user => {
        const lastActive = new Date(user.last_active_at || user.created_at)
        const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceActive <= 30
      }).length || 0

      const totalDrawings = drawingsData?.length || 0
      const publicDrawings = drawingsData?.filter(d => d.is_public).length || 0
      const totalLikes = drawingsData?.reduce((sum, d) => sum + (d.likes_count || 0), 0) || 0
      const totalComments = drawingsData?.reduce((sum, d) => sum + (d.comments_count || 0), 0) || 0

      setSystemStats({
        totalUsers,
        activeUsers,
        totalDrawings,
        publicDrawings,
        totalLikes,
        totalComments,
        reportedContent: 0, // Implementar quando houver sistema de reports
        systemUptime: "99.9%", // Valor fixo por enquanto
      })

      setProcessProgress(50)

      // Carregar usuários
      const { data: fullUsersData, error: fullUsersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (fullUsersError) throw fullUsersError

      const formattedUsers: User[] = fullUsersData?.map(user => ({
        id: user.id,
        name: user.name || 'Usuário',
        email: user.email,
        provider: user.provider || 'email',
        joinDate: new Date(user.created_at),
        lastActive: new Date(user.last_active_at || user.created_at),
        drawingsCount: drawingsData?.filter(d => d.author_id === user.id).length || 0,
        isActive: true,
        isBanned: user.is_banned || false,
      })) || []

      setUsers(formattedUsers)
      setProcessProgress(75)

      // Carregar desenhos
      const { data: fullDrawingsData, error: fullDrawingsError } = await supabase
        .from('drawings')
        .select(`
          *,
          users!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fullDrawingsError) throw fullDrawingsError

      const formattedDrawings: Drawing[] = fullDrawingsData?.map(drawing => ({
        id: drawing.id,
        title: drawing.title || 'Desenho sem título',
        author: drawing.users?.name || 'Usuário desconhecido',
        mode: drawing.mode || 'sketch-by-image',
        createdAt: new Date(drawing.created_at),
        isPublic: drawing.is_public || false,
        likes: drawing.likes_count || 0,
        comments: drawing.comments_count || 0,
        isReported: false, // Implementar quando houver sistema de reports
      })) || []

      setDrawings(formattedDrawings)
      setProcessProgress(90)

      // Carregar imagens da galeria
      await loadGalleryImages()

      setProcessProgress(100)

      console.log("Dados do sistema carregados com sucesso!")
    } catch (error) {
      console.error("Erro ao carregar dados do sistema:", error)
    } finally {
      setIsProcessing(false)
      setProcessProgress(0)
    }
  }

  const loadGalleryImages = async () => {
    try {
      console.log('🔍 [FRONTEND] Iniciando carregamento de imagens da galeria')
      
      // Obter token de sessão
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 [FRONTEND] Sessão obtida:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id
      })
      
      if (!session?.access_token) {
        console.error('❌ [FRONTEND] Sem token de acesso')
        return
      }

      console.log('🔍 [FRONTEND] Fazendo requisição GET para /api/upload')
      const response = await fetch('/api/upload', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      console.log('🔍 [FRONTEND] Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('🔍 [FRONTEND] Resultado da API:', result)
        
        if (result.success) {
          console.log('✅ [FRONTEND] Imagens carregadas com sucesso:', {
            count: result.data?.length || 0,
            images: result.data
          })
          setGalleryImages(result.data)
        } else {
          console.error('❌ [FRONTEND] API retornou erro:', result.error)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ [FRONTEND] Erro na requisição:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao carregar imagens da galeria:', error)
    }
  }

  const handleImageUpload = async () => {
    console.log('🚀 [FRONTEND] Iniciando processo de upload')
    console.log('🚀 [FRONTEND] Estado inicial:', {
      hasFile: !!uploadFile,
      fileName: uploadFile?.name,
      fileSize: uploadFile?.size,
      fileType: uploadFile?.type,
      selectedCategory,
      descriptionLength: imageDescription?.length || 0
    })

    if (!uploadFile || !selectedCategory) {
      console.error('❌ [FRONTEND] Validação inicial falhou:', {
        hasFile: !!uploadFile,
        hasCategory: !!selectedCategory
      })
      alert('Por favor, selecione um arquivo e uma categoria')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      console.log('📋 [FRONTEND] Obtendo sessão do Supabase')
      // Obter token de sessão
      const { data: { session } } = await supabase.auth.getSession()
      console.log('📋 [FRONTEND] Sessão obtida:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id
      })

      if (!session?.access_token) {
        console.error('❌ [FRONTEND] Erro: sem token de acesso')
        alert('Erro: sem token de acesso')
        return
      }

      console.log('📋 [FRONTEND] Preparando FormData')
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('category', selectedCategory)
      formData.append('description', imageDescription)

      console.log('📋 [FRONTEND] FormData preparado:', {
        fileAppended: formData.has('file'),
        categoryAppended: formData.has('category'),
        descriptionAppended: formData.has('description'),
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          valueType: typeof value,
          isFile: value instanceof File,
          fileName: value instanceof File ? value.name : undefined
        }))
      })

      console.log('📋 [FRONTEND] Fazendo requisição para /api/upload')
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      console.log('📋 [FRONTEND] Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        console.log('✅ [FRONTEND] Resposta OK, processando JSON')
        const result = await response.json()
        console.log('✅ [FRONTEND] Resultado do upload:', result)

        if (result.success) {
          console.log('✅ [FRONTEND] Upload bem-sucedido, recarregando galeria')
          // Recarregar imagens da galeria
          await loadGalleryImages()
          
          // Limpar formulário
          setUploadFile(null)
          setSelectedCategory('')
          setImageDescription('')
          
          // Reset file input
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
          if (fileInput) fileInput.value = ''
          
          console.log('✅ [FRONTEND] Formulário limpo')
          alert('Imagem enviada com sucesso!')
        } else {
          console.error('❌ [FRONTEND] Upload falhou:', result.error)
          alert('Erro no upload: ' + result.error)
        }
      } else {
        console.error('❌ [FRONTEND] Resposta não OK')
        const error = await response.json()
        console.error('❌ [FRONTEND] Erro da API:', error)
        alert('Erro no upload: ' + error.error)
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Erro no catch:', error)
      console.error('❌ [FRONTEND] Stack trace:', error instanceof Error ? error.stack : 'N/A')
      alert('Erro no upload da imagem')
    } finally {
      console.log('🏁 [FRONTEND] Finalizando upload')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleBatchUpload = async () => {
    console.log('🚀 [FRONTEND] Iniciando upload em lote')
    console.log('🚀 [FRONTEND] Estado inicial do lote:', {
      hasFiles: !!batchFiles,
      fileCount: batchFiles?.length || 0,
      selectedCategory,
      descriptionLength: imageDescription?.length || 0
    })

    if (!batchFiles || batchFiles.length === 0) {
      console.error('❌ [FRONTEND] Nenhum arquivo selecionado para lote')
      alert('Por favor, selecione pelo menos uma imagem')
      return
    }

    if (batchFiles.length > 50) {
      console.error('❌ [FRONTEND] Muitos arquivos para lote:', batchFiles.length)
      alert('Máximo de 50 imagens por lote')
      return
    }

    if (!selectedCategory) {
      console.error('❌ [FRONTEND] Categoria não selecionada para lote')
      alert('Por favor, selecione uma categoria')
      return
    }

    setIsBatchUploading(true)
    setBatchProgress(0)
    setBatchResults([])

    try {
      console.log('📋 [FRONTEND] Obtendo sessão para upload em lote')
      // Obter token de sessão
      const { data: { session } } = await supabase.auth.getSession()
      console.log('📋 [FRONTEND] Sessão do lote obtida:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token
      })

      if (!session?.access_token) {
        console.error('❌ [FRONTEND] Erro: sem token de acesso para lote')
        alert('Erro: sem token de acesso')
        return
      }

      console.log('📋 [FRONTEND] Preparando FormData para lote')
      const formData = new FormData()
      
      // Adicionar todos os arquivos
      Array.from(batchFiles).forEach((file, index) => {
        console.log(`📋 [FRONTEND] Adicionando arquivo ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type
        })
        formData.append(`files`, file)
      })
      
      formData.append('category', selectedCategory)
      formData.append('description', imageDescription || 'Upload em lote pelo admin')

      console.log('📋 [FRONTEND] Fazendo requisição para /api/upload/batch')
      const response = await fetch('/api/upload/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      console.log('📋 [FRONTEND] Resposta do lote recebida:', {
        status: response.status,
        ok: response.ok
      })

      if (response.ok) {
        console.log('✅ [FRONTEND] Resposta do lote OK')
        const result = await response.json()
        console.log('✅ [FRONTEND] Resultado do lote:', result)

        if (result.success) {
          setBatchResults(result.data.results)
          
          // Recarregar imagens da galeria
          await loadGalleryImages()
          
          // Limpar formulário
          setBatchFiles(null)
          setSelectedCategory('')
          setImageDescription('')
          
          // Reset file input
          const fileInput = document.querySelector('input[type="file"][multiple]') as HTMLInputElement
          if (fileInput) fileInput.value = ''
          
          console.log('✅ [FRONTEND] Upload em lote concluído:', {
            successCount: result.data.successCount,
            totalFiles: result.data.totalFiles
          })
          alert(`Upload em lote concluído! ${result.data.successCount} de ${result.data.totalFiles} imagens enviadas com sucesso.`)
          
          if (result.data.errors && result.data.errors.length > 0) {
            console.error('❌ [FRONTEND] Erros no upload em lote:', result.data.errors)
          }
        } else {
          console.error('❌ [FRONTEND] Upload em lote falhou:', result.error)
          alert('Erro no upload em lote: ' + result.error)
        }
      } else {
        console.error('❌ [FRONTEND] Resposta do lote não OK')
        const error = await response.json()
        console.error('❌ [FRONTEND] Erro da API do lote:', error)
        alert('Erro no upload em lote: ' + error.error)
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Erro no catch do lote:', error)
      console.error('❌ [FRONTEND] Stack trace do lote:', error instanceof Error ? error.stack : 'N/A')
      alert('Erro no upload em lote das imagens')
    } finally {
      console.log('🏁 [FRONTEND] Finalizando upload em lote')
      setIsBatchUploading(false)
      setBatchProgress(0)
    }
  }

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

  // Debug: Log do estado das imagens
  console.log('🖼️ Estado atual das imagens:', {
    galleryImagesCount: galleryImages.length,
    galleryImages: galleryImages,
    selectedImageFilter,
    searchTerm
  })

  const filteredImages = galleryImages.filter((image) => {
    const matchesFilter = selectedImageFilter === "all" || selectedImageFilter === "" || image.category === selectedImageFilter
    const matchesSearch =
      searchTerm === "" ||
      image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  console.log('🔍 Imagens filtradas:', {
    filteredImagesCount: filteredImages.length,
    filteredImages: filteredImages
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
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
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
                    <p className="text-muted-foreground">
                      {uploadFile ? uploadFile.name : 'Clique para fazer upload ou arraste a imagem aqui'}
                    </p>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="mt-4" 
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      disabled={isUploading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição da Imagem</Label>
                  <Textarea
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Digite uma descrição para a imagem..."
                    rows={3}
                    disabled={isUploading}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleImageUpload}
                  disabled={isUploading || !uploadFile || !selectedCategory}
                >
                  {isUploading ? 'Enviando...' : 'Fazer Upload'}
                </Button>
              </CardContent>
            </Card>

            {/* Upload de Imagem Individual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload de Imagem Individual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isUploading}>
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
                  <Label htmlFor="file">Arquivo</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="mt-4" 
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      disabled={isUploading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição da Imagem</Label>
                  <Textarea
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Digite uma descrição para a imagem..."
                    rows={3}
                    disabled={isUploading}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleImageUpload}
                  disabled={isUploading || !uploadFile || !selectedCategory}
                >
                  {isUploading ? 'Enviando...' : 'Fazer Upload'}
                </Button>
              </CardContent>
            </Card>

            {/* Upload em Lote */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload em Lote (Máximo 50 imagens)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-category">Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isBatchUploading}>
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
                  <Label htmlFor="batch-files">Arquivos (Máximo 50)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      className="mt-4" 
                      onChange={(e) => setBatchFiles(Array.from(e.target.files || []))}
                      disabled={isBatchUploading}
                    />
                  </div>
                  {batchFiles && batchFiles.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {batchFiles.length} arquivo(s) selecionado(s)
                      {batchFiles.length > 50 && (
                        <span className="text-red-500 ml-2">
                          (Máximo 50 arquivos permitidos)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-description">Descrição Geral</Label>
                  <Textarea
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Digite uma descrição geral para o lote de imagens..."
                    rows={3}
                    disabled={isBatchUploading}
                  />
                </div>

                {isBatchUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Enviando lote de imagens...</span>
                    </div>
                    <Progress value={batchProgress} className="w-full" />
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={handleBatchUpload}
                  disabled={isBatchUploading || !batchFiles || batchFiles.length === 0 || batchFiles.length > 50 || !selectedCategory}
                >
                  {isBatchUploading ? 'Enviando Lote...' : `Fazer Upload em Lote (${batchFiles?.length || 0} arquivos)`}
                </Button>

                {/* Resultados do Upload em Lote */}
                {batchResults && batchResults.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Resultados do Upload em Lote:</h4>
                    <div className="space-y-1 text-sm">
                      {batchResults.map((result, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{result.fileName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                <Select value={selectedImageFilter} onValueChange={setSelectedImageFilter}>
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
                {filteredImages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma imagem encontrada</p>
                  </div>
                ) : (
                  filteredImages.map((image) => (
                    <div key={image.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                          {image.thumbnailUrl ? (
                            <img 
                              src={image.thumbnailUrl} 
                              alt={image.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          )}
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
                            <span className="text-xs text-muted-foreground">
                              {image.uploadDate ? new Date(image.uploadDate).toLocaleDateString('pt-BR') : 'N/A'}
                            </span>
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
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{selectedImage?.filename}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {selectedImage?.imageUrl && (
                                <div className="flex justify-center">
                                  <img 
                                    src={selectedImage.imageUrl} 
                                    alt={selectedImage.filename}
                                    className="max-w-full max-h-96 object-contain"
                                  />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium mb-2">Descrição:</h4>
                                <p className="text-sm text-muted-foreground">{selectedImage?.description || 'Sem descrição'}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Categoria:</strong> {selectedImage?.category}
                                </div>
                                <div>
                                  <strong>Tamanho:</strong> {selectedImage?.size}
                                </div>
                                <div>
                                  <strong>Data de Upload:</strong> {selectedImage?.uploadDate ? new Date(selectedImage.uploadDate).toLocaleDateString('pt-BR') : 'N/A'}
                                </div>
                                <div>
                                  <strong>Autor:</strong> {selectedImage?.authorName || 'Admin'}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
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
                          {user.provider === "google" ? "Google" : "E-mail"}
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
