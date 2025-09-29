"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit3, 
  Save, 
  X, 
  Settings, 
  Eye, 
  MessageSquare, 
  Bell, 
  Download, 
  Trash2,
  Camera,
  Palette,
  Heart,
  Users,
  TrendingUp
} from "lucide-react"
import { authService, AuthUser } from "@/components/auth/auth-service"
import { supabase } from "@/lib/supabase-client"

interface UserData {
  id: string
  name: string
  email: string
  avatar_url: string | null
  provider: string
  created_at: string
  updated_at: string
  is_admin: boolean
  bio?: string
  public_profile: boolean
  allow_comments: boolean
  email_notifications: boolean
}

interface UserStats {
  totalDrawings: number
  totalViews: number
  totalLikes: number
  totalComments: number
  followers: number
  following: number
}

export function UserProfile() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    totalDrawings: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    followers: 0,
    following: 0
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    public_profile: true,
    allow_comments: true,
    email_notifications: true
  })

  // Carregar dados do usuário
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      const currentUser = authService.getCurrentUser()
      
      if (!currentUser) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        })
        return
      }

      // Buscar dados completos do usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (userError) {
        console.error('Erro ao carregar dados do usuário:', userError)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do usuário",
          variant: "destructive"
        })
        return
      }

      setUserData(user)
      setFormData({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        public_profile: user.public_profile ?? true,
        allow_comments: user.allow_comments ?? true,
        email_notifications: user.email_notifications ?? true
      })

      // Carregar estatísticas do usuário
      await loadUserStats(currentUser.id)

    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil do usuário",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      // Buscar estatísticas dos desenhos
      const { data: drawings, error: drawingsError } = await supabase
        .from('drawings')
        .select('id, views_count, likes_count')
        .eq('author_id', userId)

      if (drawingsError) {
        console.error('Erro ao carregar desenhos:', drawingsError)
        return
      }

      // Calcular estatísticas
      const totalDrawings = drawings?.length || 0
      const totalViews = drawings?.reduce((sum, drawing) => sum + (drawing.views_count || 0), 0) || 0
      const totalLikes = drawings?.reduce((sum, drawing) => sum + (drawing.likes_count || 0), 0) || 0

      // Buscar total de comentários
      const { count: totalComments } = await supabase
        .from('drawing_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Buscar seguidores
      const { count: followers } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      // Buscar seguindo
      const { count: following } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      setUserStats({
        totalDrawings,
        totalViews,
        totalLikes,
        totalComments: totalComments || 0,
        followers: followers || 0,
        following: following || 0
      })

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const currentUser = authService.getCurrentUser()
      
      if (!currentUser || !userData) {
        return
      }

      // Atualizar dados no Supabase
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          bio: formData.bio,
          public_profile: formData.public_profile,
          allow_comments: formData.allow_comments,
          email_notifications: formData.email_notifications,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)

      if (error) {
        console.error('Erro ao salvar:', error)
        toast({
          title: "Erro",
          description: "Erro ao salvar alterações",
          variant: "destructive"
        })
        return
      }

      // Atualizar dados locais
      setUserData(prev => prev ? {
        ...prev,
        name: formData.name,
        bio: formData.bio,
        public_profile: formData.public_profile,
        allow_comments: formData.allow_comments,
        email_notifications: formData.email_notifications,
        updated_at: new Date().toISOString()
      } : null)

      // Atualizar localStorage se necessário
      if (currentUser.name !== formData.name) {
        const updatedUser = { ...currentUser, name: formData.name }
        localStorage.setItem("auth_user", JSON.stringify(updatedUser))
      }

      setIsEditing(false)
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!"
      })

    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar perfil",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (!userData) return
    
    setFormData({
      name: userData.name || "",
      email: userData.email || "",
      bio: userData.bio || "",
      public_profile: userData.public_profile ?? true,
      allow_comments: userData.allow_comments ?? true,
      email_notifications: userData.email_notifications ?? true
    })
    setIsEditing(false)
  }

  const handleExportData = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      if (!currentUser) return

      // Buscar todos os dados do usuário
      const { data: drawings } = await supabase
        .from('drawings')
        .select('*')
        .eq('author_id', currentUser.id)

      const { data: comments } = await supabase
        .from('drawing_comments')
        .select('*')
        .eq('user_id', currentUser.id)

      const exportData = {
        user: userData,
        drawings: drawings || [],
        comments: comments || [],
        stats: userStats,
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `luskadreus-data-${currentUser.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "Dados exportados com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar dados",
        variant: "destructive"
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const currentUser = authService.getCurrentUser()
      if (!currentUser) return

      // Marcar conta como inativa (soft delete)
      const { error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)

      if (error) {
        console.error('Erro ao deletar conta:', error)
        toast({
          title: "Erro",
          description: "Erro ao deletar conta",
          variant: "destructive"
        })
        return
      }

      // Fazer logout
      await authService.logout()
      
      toast({
        title: "Conta deletada",
        description: "Sua conta foi desativada com sucesso"
      })

      // Redirecionar para login
      window.location.href = '/'

    } catch (error) {
      console.error('Erro ao deletar conta:', error)
      toast({
        title: "Erro",
        description: "Erro ao deletar conta",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Erro ao carregar dados do usuário</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="privacy">Privacidade</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Header do Perfil */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userData.name}`} alt={userData.name} />
                    <AvatarFallback className="text-lg">
                      {userData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold">{userData.name}</h1>
                      {userData.is_admin && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {userData.email}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Membro desde {formatDate(userData.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSaving}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={formData.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Conte um pouco sobre você..."
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {userData.bio && (
                    <div>
                      <h3 className="font-medium mb-2">Bio</h3>
                      <p className="text-muted-foreground">{userData.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Palette className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold">{userStats.totalDrawings}</div>
                  <div className="text-sm text-muted-foreground">Desenhos</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Eye className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold">{userStats.totalViews}</div>
                  <div className="text-sm text-muted-foreground">Visualizações</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold">{userStats.totalLikes}</div>
                  <div className="text-sm text-muted-foreground">Curtidas</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold">{userStats.totalComments}</div>
                  <div className="text-sm text-muted-foreground">Comentários</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold">{userStats.followers}</div>
                  <div className="text-sm text-muted-foreground">Seguidores</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-teal-500" />
                  </div>
                  <div className="text-2xl font-bold">{userStats.following}</div>
                  <div className="text-sm text-muted-foreground">Seguindo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Gerencie suas preferências de perfil e interações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Perfil Público</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que outros usuários vejam seu perfil
                  </p>
                </div>
                <Switch
                  checked={formData.public_profile}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, public_profile: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Permitir Comentários</Label>
                  <p className="text-sm text-muted-foreground">
                    Outros usuários podem comentar em seus desenhos
                  </p>
                </div>
                <Switch
                  checked={formData.allow_comments}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, allow_comments: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações sobre atividades em sua conta
                  </p>
                </div>
                <Switch
                  checked={formData.email_notifications}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>
              {(formData.public_profile !== userData.public_profile || 
                formData.allow_comments !== userData.allow_comments || 
                formData.email_notifications !== userData.email_notifications) && (
                <div className="pt-4">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacidade e Dados</CardTitle>
              <CardDescription>
                Gerencie seus dados pessoais e configurações de privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">Exportar Dados</h4>
                    <p className="text-sm text-muted-foreground">
                      Baixe uma cópia de todos os seus dados
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                  <div className="space-y-1">
                    <h4 className="font-medium text-destructive">Deletar Conta</h4>
                    <p className="text-sm text-muted-foreground">
                      Desativar permanentemente sua conta
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Sua conta será desativada permanentemente
                          e todos os seus dados serão removidos dos nossos servidores.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Deletar Conta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
