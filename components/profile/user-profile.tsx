"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Mail,
  Calendar,
  Settings,
  Shield,
  Download,
  Trash2,
  Edit,
  Camera,
  Chrome,
  MessageCircle,
} from "lucide-react"

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
  bio: string
  joinDate: Date
  provider: "google" | "discord"
  isPublicProfile: boolean
  allowComments: boolean
  emailNotifications: boolean
}

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState<UserData>({
    id: "user_123",
    name: "João Silva",
    email: "joao.silva@gmail.com",
    avatar: "/placeholder.svg?height=100&width=100",
    bio: "Artista digital apaixonado por desenho e ilustração. Sempre buscando aprender novas técnicas e estilos.",
    joinDate: new Date("2024-01-01"),
    provider: "google",
    isPublicProfile: true,
    allowComments: true,
    emailNotifications: true,
  })

  const [formData, setFormData] = useState({
    name: userData.name,
    bio: userData.bio,
    isPublicProfile: userData.isPublicProfile,
    allowComments: userData.allowComments,
    emailNotifications: userData.emailNotifications,
  })

  const handleSave = () => {
    setUserData({ ...userData, ...formData })
    setIsEditing(false)
    console.log("Perfil atualizado:", formData)
  }

  const handleCancel = () => {
    setFormData({
      name: userData.name,
      bio: userData.bio,
      isPublicProfile: userData.isPublicProfile,
      allowComments: userData.allowComments,
      emailNotifications: userData.emailNotifications,
    })
    setIsEditing(false)
  }

  const handleAvatarChange = () => {
    // Implementar mudança de avatar
    console.log("Mudança de avatar")
  }

  const handleDeleteAccount = () => {
    // Implementar exclusão de conta
    console.log("Exclusão de conta")
  }

  const handleExportData = () => {
    // Implementar exportação de dados
    console.log("Exportação de dados")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="privacy">Privacidade</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                    <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 p-0"
                      onClick={handleAvatarChange}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{userData.name}</h2>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {userData.provider === "google" ? (
                        <Chrome className="h-3 w-3" />
                      ) : (
                        <MessageCircle className="h-3 w-3" />
                      )}
                      {userData.provider === "google" ? "Google" : "Discord"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {userData.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Membro desde {userData.joinDate.toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={userData.email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email vinculado à sua conta {userData.provider === "google" ? "Google" : "Discord"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="public-profile">Perfil Público</Label>
                  <p className="text-sm text-muted-foreground">Permitir que outros usuários vejam seu perfil</p>
                </div>
                <Switch
                  id="public-profile"
                  checked={formData.isPublicProfile}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublicProfile: checked })}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-comments">Permitir Comentários</Label>
                  <p className="text-sm text-muted-foreground">Permitir comentários em seus desenhos públicos</p>
                </div>
                <Switch
                  id="allow-comments"
                  checked={formData.allowComments}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowComments: checked })}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações sobre atividades em seus desenhos
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidade e Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Exportar Dados</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Baixe uma cópia de todos os seus dados da plataforma
                  </p>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dados
                  </Button>
                </div>

                <div className="p-4 border border-red-200 rounded-lg">
                  <h3 className="font-semibold mb-2 text-red-600">Zona de Perigo</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Excluir sua conta permanentemente. Esta ação não pode ser desfeita.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Conta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
