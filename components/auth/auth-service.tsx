"use client"

import { supabase } from "@/lib/supabase-client"

// Serviço de autenticação com email/senha
export interface AuthUser {
  id: string
  name: string
  email: string
  avatar: string
  provider: "email"
}

class AuthService {
  private currentUser: AuthUser | null = null

  // Login com email e senha
  async loginWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      // Tentar autenticação com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Erro de autenticação Supabase:', error)
        // Fallback para credenciais de teste se Supabase falhar
        return this.loginWithTestCredentials(email, password)
      }

      if (data.user) {
        // Buscar dados do usuário na tabela public.users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userError || !userData) {
          console.error('Erro ao buscar dados do usuário:', userError)
          // Fallback para credenciais de teste
          return this.loginWithTestCredentials(email, password)
        }

        const user: AuthUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar_url || "/placeholder-user.jpg",
          provider: "email",
        }

        this.currentUser = user
        localStorage.setItem("auth_user", JSON.stringify(user))
        localStorage.setItem("is_admin", userData.is_admin?.toString() || "false")
        
        return user
      }
    } catch (error) {
      console.error('Erro na autenticação:', error)
    }

    // Fallback para credenciais de teste
    return this.loginWithTestCredentials(email, password)
  }

  // Método de fallback para credenciais de teste
  private async loginWithTestCredentials(email: string, password: string): Promise<AuthUser> {
    // Credenciais de teste
    const validCredentials = [
      { email: "admin@luskadreus.com", password: "admin123", name: "Administrador", isAdmin: true, id: "550e8400-e29b-41d4-a716-446655440000" },
      { email: "user@luskadreus.com", password: "user123", name: "Usuário Teste", isAdmin: false, id: "550e8400-e29b-41d4-a716-446655440001" },
      { email: "joao@email.com", password: "123456", name: "João Silva", isAdmin: false, id: "550e8400-e29b-41d4-a716-446655440002" },
      { email: "caiolncoln@teste.com", password: "teste12345", name: "Caio Lincoln", isAdmin: false, id: "76ff64c1-11c7-4773-806b-c49cabe86be9" },
    ]

    const credential = validCredentials.find(
      cred => cred.email === email && cred.password === password
    )

    if (!credential) {
      throw new Error("Credenciais inválidas")
    }

    const user: AuthUser = {
      id: credential.id,
      name: credential.name,
      email: credential.email,
      avatar: "/placeholder-user.jpg",
      provider: "email",
    }

    this.currentUser = user
    localStorage.setItem("auth_user", JSON.stringify(user))
    localStorage.setItem("is_admin", credential.isAdmin.toString())
    
    return user
  }

  // Logout
  async logout(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem("auth_user")
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    if (typeof window === "undefined") {
      return false
    }
    
    try {
      const stored = localStorage.getItem("auth_user")
      return !!stored
    } catch {
      return false
    }
  }

  // Obter usuário atual
  getCurrentUser(): AuthUser | null {
    if (this.currentUser) {
      return this.currentUser
    }

    if (typeof window === "undefined") {
      return null
    }

    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        this.currentUser = JSON.parse(stored)
        return this.currentUser
      }
    } catch {
      return null
    }
    return null
  }

  // Verificar se é admin
  isAdmin(): boolean {
    if (typeof window === "undefined") {
      return false
    }
    
    try {
      const isAdminStored = localStorage.getItem("is_admin")
      return isAdminStored === "true"
    } catch {
      return false
    }
  }
}

export const authService = new AuthService()
