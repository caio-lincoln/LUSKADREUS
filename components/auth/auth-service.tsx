"use client"

// Serviço de autenticação simulado
export interface AuthUser {
  id: string
  name: string
  email: string
  avatar: string
  provider: "google" | "discord"
}

class AuthService {
  private currentUser: AuthUser | null = null

  // Simular login com Google
  async loginWithGoogle(): Promise<AuthUser> {
    // Em produção, usar a API do Google OAuth
    const user: AuthUser = {
      id: "google_123",
      name: "João Silva",
      email: "joao.silva@gmail.com",
      avatar: "/placeholder.svg?height=100&width=100",
      provider: "google",
    }

    this.currentUser = user
    localStorage.setItem("auth_user", JSON.stringify(user))
    return user
  }

  // Simular login com Discord
  async loginWithDiscord(): Promise<AuthUser> {
    // Em produção, usar a API do Discord OAuth
    const user: AuthUser = {
      id: "discord_456",
      name: "Maria Santos",
      email: "maria.santos@discord.com",
      avatar: "/placeholder.svg?height=100&width=100",
      provider: "discord",
    }

    this.currentUser = user
    localStorage.setItem("auth_user", JSON.stringify(user))
    return user
  }

  // Logout
  async logout(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem("auth_user")
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    if (this.currentUser) return true

    const stored = localStorage.getItem("auth_user")
    if (stored) {
      this.currentUser = JSON.parse(stored)
      return true
    }

    return false
  }

  // Obter usuário atual
  getCurrentUser(): AuthUser | null {
    if (this.currentUser) return this.currentUser

    const stored = localStorage.getItem("auth_user")
    if (stored) {
      this.currentUser = JSON.parse(stored)
      return this.currentUser
    }

    return null
  }

  // Verificar se é admin
  isAdmin(): boolean {
    const user = this.getCurrentUser()
    // Em produção, verificar permissões no backend
    return user?.email === "admin@artsketch.com" || user?.id === "admin_123"
  }
}

export const authService = new AuthService()
